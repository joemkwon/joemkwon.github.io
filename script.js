// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });
});

// Timeline traveling light effect
const timeline = document.querySelector('.timeline');
if (timeline) {
    const glow = document.createElement('div');
    glow.className = 'timeline-glow';
    timeline.appendChild(glow);

    const updateGlow = () => {
        const rect = timeline.getBoundingClientRect();
        const timelineTop = rect.top;
        const timelineHeight = rect.height;
        const viewportCenter = window.innerHeight * 0.4;

        // Calculate position relative to timeline
        let glowPos = viewportCenter - timelineTop;
        glowPos = Math.max(8, Math.min(timelineHeight - 24, glowPos));

        glow.style.top = glowPos + 'px';

        // Fade based on whether timeline is in view
        if (timelineTop < window.innerHeight && timelineTop + timelineHeight > 0) {
            glow.style.opacity = '0.9';
        } else {
            glow.style.opacity = '0';
        }
    };

    window.addEventListener('scroll', updateGlow, { passive: true });
    updateGlow();
}

// Bio length toggle
const bioToggles = document.querySelectorAll('.bio-toggle');
const bioContents = document.querySelectorAll('.bio-content');

bioToggles.forEach(toggle => {
    toggle.addEventListener('click', () => {
        const level = toggle.dataset.level;

        // Update active states
        bioToggles.forEach(t => t.classList.remove('active'));
        toggle.classList.add('active');

        // Show/hide content
        bioContents.forEach(content => {
            if (content.dataset.level === level) {
                content.style.display = 'block';
            } else {
                content.style.display = 'none';
            }
        });
    });
});

// Work view toggle
const workToggles = document.querySelectorAll('.work-toggle');
const projectLists = document.querySelectorAll('.project-list[data-view]');

workToggles.forEach(toggle => {
    toggle.addEventListener('click', () => {
        const view = toggle.dataset.view;

        // Update active states
        workToggles.forEach(t => t.classList.remove('active'));
        toggle.classList.add('active');

        // Show/hide lists
        projectLists.forEach(list => {
            if (list.dataset.view === view) {
                list.style.display = 'block';
            } else {
                list.style.display = 'none';
            }
        });
    });
});

// Cursor glow effect
const cursorGlow = document.querySelector('.cursor-glow');
let mouseX = window.innerWidth / 2;
let mouseY = window.innerHeight / 2;
let glowX = mouseX, glowY = mouseY;

document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    cursorGlow.classList.add('active');
});

document.addEventListener('mouseleave', () => {
    cursorGlow.classList.remove('active');
});

function animateGlow() {
    const speed = 0.08;
    glowX += (mouseX - glowX) * speed;
    glowY += (mouseY - glowY) * speed;
    cursorGlow.style.left = glowX + 'px';
    cursorGlow.style.top = glowY + 'px';
    requestAnimationFrame(animateGlow);
}
animateGlow();

// ========================================
// Background Animation System
// ========================================

const canvas = document.getElementById('flow-field');
const ctx = canvas.getContext('2d');

let width, height;
let time = 0;
let animationId = null;
let currentMode = 'ocean';

// Colophon descriptions for each mode
const colophonTexts = {
    ocean: `My favorite color is the blue you see when you're on a boat and the
seafloor drops away into nothing, that moment where the water goes from
turquoise to something almost black and you realize there's a mile of
water beneath you and it's beautiful and terrifying.
Gerstner waves and perspective fade. Caustics from light bending through
surfaces that will never quite repeat.`,

    fractal: `A Julia set, which means you pick a complex number c and then for
each pixel you keep doing z² + c over and over to see if it flies off
to infinity or stays bounded, coloring by how quickly it escapes. The
wild thing is the boundary between "escapes" and "stays forever" turns
out to have infinite detail no matter how far you zoom in.`,

    flow: `Particles following a vector field built from layered Perlin noise
and the curl trick keeps everything divergence-free so the streams swirl
around without bunching up or thinning out, same math behind weather
systems and ocean currents but smaller and prettier and you can watch
it happen in real time.`,

    constellation: `Points drifting around and gently pulling toward each other, and
when two get close enough a line appears between them. No grand logic
to it, just proximity, but somehow it ends up looking like neurons
firing or friends clustering at a party or the way ideas connect when
you're not forcing it. Connections fade when things drift apart.`,

    lorenz: `Ed Lorenz stumbled onto this in 1963 while modeling weather on an
early computer and found that the equations are totally deterministic,
no randomness at all, yet tiny differences in where you start lead to
wildly different paths which is basically why weather forecasts become
useless after about a week no matter how good our models get.`,

    voronoi: `Each point owns all the space closer to it than to any other point
which forms these cells, and the triangles are what you get when you
connect neighbors. Shows up everywhere once you start looking for it:
soap bubbles, giraffe spots, cracked mud, cell walls, the way galaxies
cluster across the universe.`,

    lissajous: `Two waves at right angles with different frequencies and the ratio
between them determines what shape you get, so 3:4 gives you one kind
of loop and 5:7 gives you another and engineers used to watch these on
oscilloscopes to check if frequencies matched up before we had better
ways to measure things.`
};

// ========================================
// Color Palettes (subtle, tasteful) - cycles through all
// ========================================

const COLOR_PALETTES = [
    { name: 'abyss',   primary: [90, 130, 170], accent: [70, 110, 160] },   // deep ocean blue
    { name: 'deep',    primary: [80, 120, 155], accent: [60, 100, 145] },   // darker blue
    { name: 'storm',   primary: [110, 140, 175], accent: [90, 125, 165] },  // steel blue
    { name: 'dusk',    primary: [130, 145, 175], accent: [115, 130, 165] }, // blue-grey
    { name: 'mist',    primary: [140, 155, 170], accent: [125, 145, 165] }, // fog
    { name: 'slate',   primary: [130, 140, 155], accent: [115, 130, 150] }, // cool grey
    { name: 'twilight',primary: [120, 135, 165], accent: [100, 120, 155] }, // evening blue
    { name: 'ink',     primary: [100, 125, 160], accent: [80, 110, 150] },  // dark ink
];

let colorTime = Math.random() * 1000; // Random starting point
const COLOR_CYCLE_SPEED = 0.0008; // Slow but noticeable transition

function selectRandomPalette() {
    colorTime = Math.random() * 1000; // Randomize starting color position
}

function getCurrentColors() {
    // Slowly cycle through all palettes
    const t = colorTime * COLOR_CYCLE_SPEED;
    const paletteIndex = t % COLOR_PALETTES.length;
    const currentIdx = Math.floor(paletteIndex);
    const nextIdx = (currentIdx + 1) % COLOR_PALETTES.length;
    const blend = paletteIndex - currentIdx; // 0 to 1

    const current = COLOR_PALETTES[currentIdx];
    const next = COLOR_PALETTES[nextIdx];

    // Lerp between palettes
    const primary = [
        current.primary[0] + (next.primary[0] - current.primary[0]) * blend,
        current.primary[1] + (next.primary[1] - current.primary[1]) * blend,
        current.primary[2] + (next.primary[2] - current.primary[2]) * blend,
    ];
    const accent = [
        current.accent[0] + (next.accent[0] - current.accent[0]) * blend,
        current.accent[1] + (next.accent[1] - current.accent[1]) * blend,
        current.accent[2] + (next.accent[2] - current.accent[2]) * blend,
    ];

    return { primary, accent };
}

function getColor(alpha, useAccent = false, variation = 0) {
    const colors = getCurrentColors();
    const base = useAccent ? colors.accent : colors.primary;
    const r = Math.min(255, Math.max(0, base[0] + variation));
    const g = Math.min(255, Math.max(0, base[1] + variation * 0.8));
    const b = Math.min(255, Math.max(0, base[2] + variation * 0.5));
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// ========================================
// Shared Utilities
// ========================================

class Noise {
    constructor(seed = Math.random() * 10000) {
        this.seed = seed;
        this.perm = new Uint8Array(512);
        const p = new Uint8Array(256);
        for (let i = 0; i < 256; i++) p[i] = i;

        let s = seed;
        for (let i = 255; i > 0; i--) {
            s = (s * 16807) % 2147483647;
            const j = s % (i + 1);
            [p[i], p[j]] = [p[j], p[i]];
        }
        for (let i = 0; i < 512; i++) this.perm[i] = p[i & 255];
    }

    fade(t) { return t * t * t * (t * (t * 6 - 15) + 10); }
    lerp(a, b, t) { return a + t * (b - a); }

    grad(hash, x, y) {
        const h = hash & 7;
        const u = h < 4 ? x : y;
        const v = h < 4 ? y : x;
        return ((h & 1) ? -u : u) + ((h & 2) ? -v : v);
    }

    noise2d(x, y) {
        const X = Math.floor(x) & 255;
        const Y = Math.floor(y) & 255;
        x -= Math.floor(x);
        y -= Math.floor(y);
        const u = this.fade(x);
        const v = this.fade(y);
        const A = this.perm[X] + Y;
        const B = this.perm[X + 1] + Y;
        return this.lerp(
            this.lerp(this.grad(this.perm[A], x, y), this.grad(this.perm[B], x - 1, y), u),
            this.lerp(this.grad(this.perm[A + 1], x, y - 1), this.grad(this.perm[B + 1], x - 1, y - 1), u),
            v
        );
    }

    fbm(x, y, octaves = 4) {
        let value = 0;
        let amplitude = 1;
        let frequency = 1;
        let maxValue = 0;

        for (let i = 0; i < octaves; i++) {
            value += amplitude * this.noise2d(x * frequency, y * frequency);
            maxValue += amplitude;
            amplitude *= 0.5;
            frequency *= 2;
        }

        return value / maxValue;
    }
}

let noise = new Noise();

// ========================================
// MODE 1: Curl Noise Flow Field
// ========================================

let flowParticles = [];
let trailCanvas, trailCtx;

function curlNoise(x, y, t) {
    const eps = 0.0001;
    const scale = 0.003;

    const n1 = noise.fbm(x * scale, y * scale + t, 3);
    const n2 = noise.fbm(x * scale, y * scale - eps + t, 3);
    const n3 = noise.fbm(x * scale + eps, y * scale + t, 3);
    const n4 = noise.fbm(x * scale - eps, y * scale + t, 3);

    const dx = (n3 - n4) / (2 * eps);
    const dy = (n1 - n2) / (2 * eps);

    return { x: dy * 0.8, y: -dx * 0.8 };
}

class FlowParticle {
    constructor() {
        this.reset(true);
    }

    reset(initial = false) {
        if (initial || Math.random() < 0.3) {
            this.x = Math.random() * width;
            this.y = Math.random() * height;
        } else {
            const edge = Math.floor(Math.random() * 4);
            switch(edge) {
                case 0: this.x = 0; this.y = Math.random() * height; break;
                case 1: this.x = width; this.y = Math.random() * height; break;
                case 2: this.x = Math.random() * width; this.y = 0; break;
                case 3: this.x = Math.random() * width; this.y = height; break;
            }
        }
        this.prevX = this.x;
        this.prevY = this.y;
        this.speed = 0.4 + Math.random() * 0.6;
        this.life = 300 + Math.random() * 400;
        this.maxLife = this.life;
        this.hue = Math.random() * 20 - 10;
    }

    update(t) {
        this.prevX = this.x;
        this.prevY = this.y;

        const curl = curlNoise(this.x, this.y, t);

        const dx = mouseX - this.x;
        const dy = mouseY - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const influence = Math.max(0, 1 - dist / 250) * 0.15;

        this.x += (curl.x + dx * influence / dist * 0.5) * this.speed;
        this.y += (curl.y + dy * influence / dist * 0.5) * this.speed;
        this.life--;

        if (this.x < -50 || this.x > width + 50 ||
            this.y < -50 || this.y > height + 50 ||
            this.life <= 0) {
            this.reset();
        }
    }

    draw(ctx) {
        const lifeRatio = this.life / this.maxLife;
        const alpha = Math.sin(lifeRatio * Math.PI) * 0.9;

        ctx.strokeStyle = getColor(alpha, false, this.hue);
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(this.prevX, this.prevY);
        ctx.lineTo(this.x, this.y);
        ctx.stroke();
    }
}

function initFlow() {
    // New noise seed each time for variation
    noise = new Noise(Math.random() * 10000);

    trailCanvas = document.createElement('canvas');
    trailCanvas.width = width;
    trailCanvas.height = height;
    trailCtx = trailCanvas.getContext('2d');
    trailCtx.fillStyle = `rgb(8, 13, 18)`;
    trailCtx.fillRect(0, 0, width, height);

    const particleCount = Math.min(200, Math.floor((width * height) / 12000));
    flowParticles = [];
    for (let i = 0; i < particleCount; i++) {
        flowParticles.push(new FlowParticle());
    }
}

function animateFlow() {
    const t = time * 0.00008;

    trailCtx.fillStyle = 'rgba(8, 13, 18, 0.012)';
    trailCtx.fillRect(0, 0, width, height);

    flowParticles.forEach(p => {
        p.update(t);
        p.draw(trailCtx);
    });

    ctx.drawImage(trailCanvas, 0, 0);
}

// ========================================
// MODE 2: Constellation
// ========================================

let stars = [];
const CONNECTION_DISTANCE = 120;

class Star {
    constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = 0;
        this.vy = 0;
        this.radius = Math.random() * 2 + 1;
        this.twinkle = Math.random() * Math.PI * 2;
        this.twinkleSpeed = 0.015 + Math.random() * 0.015;
        // Each star has its own very gentle drift pattern
        this.driftPhase = Math.random() * Math.PI * 2;
        this.driftSpeed = 0.0005 + Math.random() * 0.0005;
    }

    update(allStars) {
        // Tiny random drift
        this.driftPhase += this.driftSpeed;
        const driftX = Math.sin(this.driftPhase) * 0.003;
        const driftY = Math.cos(this.driftPhase * 0.7) * 0.003;
        this.vx += driftX;
        this.vy += driftY;

        // Gentle gravitational attraction to nearby stars
        for (const other of allStars) {
            if (other === this) continue;
            const dx = other.x - this.x;
            const dy = other.y - this.y;
            const distSq = dx * dx + dy * dy;
            const dist = Math.sqrt(distSq);

            // Stronger repulsion when too close (prevents clumping)
            if (dist < 60 && dist > 0) {
                const repel = 0.00015 * (60 - dist) / 60;
                this.vx -= (dx / dist) * repel;
                this.vy -= (dy / dist) * repel;
            }
            // Much gentler attraction at medium range
            else if (dist < 150) {
                const force = 0.000002 / (distSq / 10000 + 1);
                this.vx += dx * force;
                this.vy += dy * force;
            }
        }

        this.x += this.vx;
        this.y += this.vy;
        this.twinkle += this.twinkleSpeed;

        // Mouse repulsion - gentle
        const dx = this.x - mouseX;
        const dy = this.y - mouseY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 100 && dist > 0) {
            const force = (100 - dist) / 100 * 0.1;
            this.vx += (dx / dist) * force * 0.01;
            this.vy += (dy / dist) * force * 0.01;
        }

        // Strong damping for stability
        this.vx *= 0.992;
        this.vy *= 0.992;

        // Wrap around
        if (this.x < 0) this.x = width;
        if (this.x > width) this.x = 0;
        if (this.y < 0) this.y = height;
        if (this.y > height) this.y = 0;
    }

    draw(ctx) {
        const alpha = 0.8 + Math.sin(this.twinkle) * 0.2;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * 1.3, 0, Math.PI * 2);
        ctx.fillStyle = getColor(alpha, true);
        ctx.fill();
    }
}

function initConstellation() {
    const count = Math.min(120, Math.floor((width * height) / 12000));
    stars = [];
    for (let i = 0; i < count; i++) {
        stars.push(new Star());
    }
}

function animateConstellation() {
    ctx.fillStyle = 'rgb(8, 13, 18)';
    ctx.fillRect(0, 0, width, height);

    // Draw connections
    for (let i = 0; i < stars.length; i++) {
        for (let j = i + 1; j < stars.length; j++) {
            const dx = stars[i].x - stars[j].x;
            const dy = stars[i].y - stars[j].y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < CONNECTION_DISTANCE) {
                const alpha = (1 - dist / CONNECTION_DISTANCE) * 0.65;
                ctx.beginPath();
                ctx.moveTo(stars[i].x, stars[i].y);
                ctx.lineTo(stars[j].x, stars[j].y);
                ctx.strokeStyle = getColor(alpha);
                ctx.lineWidth = 1.1;
                ctx.stroke();
            }
        }
    }

    // Update and draw stars
    stars.forEach(star => {
        star.update(stars);
        star.draw(ctx);
    });
}

// ========================================
// MODE 3: Lorenz Attractor
// ========================================

let lorenzPoints = [];
let lorenzTrailCanvas, lorenzTrailCtx;
const LORENZ_TRAILS = 8;
let lorenzSeed = Math.random() * 1000; // Random seed for variation

class LorenzTrail {
    constructor(offset, seed) {
        // Use seed for reproducible but varied randomness
        const rand = () => {
            seed = (seed * 9301 + 49297) % 233280;
            return seed / 233280;
        };

        // More significant parameter variation for distinct behaviors
        this.sigma = 9 + rand() * 4;           // 9-13 (classic is 10)
        this.rho = 24 + rand() * 10;           // 24-34 (classic is 28)
        this.beta = 2 + rand() * 1.5;          // 2-3.5 (classic is 8/3 ≈ 2.67)
        this.dt = 0.002 + rand() * 0.002;      // Varied speeds

        // Wider spread of starting positions
        const startAngle = rand() * Math.PI * 2;
        const startRadius = 0.5 + rand() * 2;
        this.x = Math.cos(startAngle) * startRadius + (rand() - 0.5) * 5;
        this.y = Math.sin(startAngle) * startRadius + (rand() - 0.5) * 5;
        this.z = 15 + rand() * 20;

        this.points = [];
        this.maxPoints = 1200;
        this.hueOffset = (rand() - 0.5) * 25;
    }

    update() {
        const dx = this.sigma * (this.y - this.x);
        const dy = this.x * (this.rho - this.z) - this.y;
        const dz = this.x * this.y - this.beta * this.z;

        this.x += dx * this.dt;
        this.y += dy * this.dt;
        this.z += dz * this.dt;

        // Project to 2D with slow rotation
        const angle = time * 0.00015;
        const scale = Math.min(width, height) / 40; // Larger scale
        const screenX = width / 2 + (this.x * Math.cos(angle) - this.y * Math.sin(angle)) * scale;
        const screenY = height / 2 + (this.z - 25) * scale * 0.85;

        this.points.push({ x: screenX, y: screenY, z: this.z });
        if (this.points.length > this.maxPoints) {
            this.points.shift();
        }
    }

    draw(ctx) {
        if (this.points.length < 2) return;

        for (let i = 1; i < this.points.length; i++) {
            const alpha = (i / this.points.length) * 0.14;

            ctx.beginPath();
            ctx.moveTo(this.points[i - 1].x, this.points[i - 1].y);
            ctx.lineTo(this.points[i].x, this.points[i].y);
            ctx.strokeStyle = getColor(alpha, i % 2 === 0, this.hueOffset);
            ctx.lineWidth = 0.8;
            ctx.stroke();
        }
    }
}

function initLorenz() {
    // New random seed each time for variation
    lorenzSeed = Math.random() * 1000;

    lorenzPoints = [];
    for (let i = 0; i < LORENZ_TRAILS; i++) {
        lorenzPoints.push(new LorenzTrail(i, lorenzSeed + i * 100));
    }

    lorenzTrailCanvas = document.createElement('canvas');
    lorenzTrailCanvas.width = width;
    lorenzTrailCanvas.height = height;
    lorenzTrailCtx = lorenzTrailCanvas.getContext('2d');
    lorenzTrailCtx.fillStyle = 'rgb(8, 13, 18)';
    lorenzTrailCtx.fillRect(0, 0, width, height);
}

function animateLorenz() {
    lorenzTrailCtx.fillStyle = 'rgba(8, 13, 18, 0.025)';
    lorenzTrailCtx.fillRect(0, 0, width, height);

    lorenzPoints.forEach(trail => {
        trail.update();
        trail.draw(lorenzTrailCtx);
    });

    ctx.drawImage(lorenzTrailCanvas, 0, 0);
}

// ========================================
// MODE 4: Voronoi / Delaunay Mesh
// ========================================

let voronoiPoints = [];

class VoronoiPoint {
    constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * 0.25;
        this.vy = (Math.random() - 0.5) * 0.25;
        this.phase = Math.random() * Math.PI * 2;
        this.phaseSpeed = 0.005 + Math.random() * 0.006;
    }

    update() {
        this.phase += this.phaseSpeed;

        // Very gentle wandering
        this.vx += Math.sin(this.phase) * 0.003;
        this.vy += Math.cos(this.phase * 0.7) * 0.003;

        // Strong damping for slow, peaceful movement
        this.vx *= 0.985;
        this.vy *= 0.985;

        this.x += this.vx;
        this.y += this.vy;

        // Gentle mouse influence
        const dx = mouseX - this.x;
        const dy = mouseY - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 150 && dist > 0) {
            const force = (150 - dist) / 150;
            this.x -= (dx / dist) * force * 0.5;
            this.y -= (dy / dist) * force * 0.5;
        }

        // Bounce off edges with padding
        const pad = 50;
        if (this.x < pad) { this.x = pad; this.vx *= -0.3; }
        if (this.x > width - pad) { this.x = width - pad; this.vx *= -0.3; }
        if (this.y < pad) { this.y = pad; this.vy *= -0.3; }
        if (this.y > height - pad) { this.y = height - pad; this.vy *= -0.3; }
    }
}

// Correct Delaunay triangulation using Bowyer-Watson
function computeDelaunay(points) {
    if (points.length < 3) return [];

    // Create super triangle that encompasses all points
    const minX = Math.min(...points.map(p => p.x)) - 100;
    const maxX = Math.max(...points.map(p => p.x)) + 100;
    const minY = Math.min(...points.map(p => p.y)) - 100;
    const maxY = Math.max(...points.map(p => p.y)) + 100;

    const dx = maxX - minX;
    const dy = maxY - minY;
    const deltaMax = Math.max(dx, dy) * 2;

    const p1 = { x: minX - deltaMax, y: minY - 1, _super: true };
    const p2 = { x: minX + dx / 2, y: maxY + deltaMax, _super: true };
    const p3 = { x: maxX + deltaMax, y: minY - 1, _super: true };

    let triangles = [{ a: p1, b: p2, c: p3 }];

    // Add each point
    for (const point of points) {
        const badTriangles = [];

        // Find triangles whose circumcircle contains the point
        for (const tri of triangles) {
            if (inCircumcircle(point, tri)) {
                badTriangles.push(tri);
            }
        }

        // Find boundary polygon
        const edges = [];
        for (const tri of badTriangles) {
            const triEdges = [
                { a: tri.a, b: tri.b },
                { a: tri.b, b: tri.c },
                { a: tri.c, b: tri.a }
            ];
            for (const edge of triEdges) {
                // Check if edge is shared with another bad triangle
                let shared = false;
                for (const other of badTriangles) {
                    if (other === tri) continue;
                    if (hasEdge(other, edge)) {
                        shared = true;
                        break;
                    }
                }
                if (!shared) edges.push(edge);
            }
        }

        // Remove bad triangles
        triangles = triangles.filter(t => !badTriangles.includes(t));

        // Create new triangles
        for (const edge of edges) {
            triangles.push({ a: edge.a, b: edge.b, c: point });
        }
    }

    // Remove triangles that share vertices with super triangle
    return triangles.filter(tri =>
        !tri.a._super && !tri.b._super && !tri.c._super
    );
}

function inCircumcircle(point, tri) {
    const ax = tri.a.x - point.x;
    const ay = tri.a.y - point.y;
    const bx = tri.b.x - point.x;
    const by = tri.b.y - point.y;
    const cx = tri.c.x - point.x;
    const cy = tri.c.y - point.y;

    const ap = ax * ax + ay * ay;
    const bp = bx * bx + by * by;
    const cp = cx * cx + cy * cy;

    const det = ax * (by * cp - bp * cy) -
                ay * (bx * cp - bp * cx) +
                ap * (bx * cy - by * cx);

    // Check orientation
    const orient = (tri.b.x - tri.a.x) * (tri.c.y - tri.a.y) -
                   (tri.b.y - tri.a.y) * (tri.c.x - tri.a.x);

    return orient > 0 ? det > 0 : det < 0;
}

function hasEdge(tri, edge) {
    const vertices = [tri.a, tri.b, tri.c];
    let hasA = false, hasB = false;
    for (const v of vertices) {
        if (v === edge.a) hasA = true;
        if (v === edge.b) hasB = true;
    }
    return hasA && hasB;
}

function initVoronoi() {
    const count = Math.min(60, Math.floor((width * height) / 25000));
    voronoiPoints = [];
    for (let i = 0; i < count; i++) {
        voronoiPoints.push(new VoronoiPoint());
    }
}

function animateVoronoi() {
    ctx.fillStyle = 'rgb(8, 13, 18)';
    ctx.fillRect(0, 0, width, height);

    voronoiPoints.forEach(p => p.update());

    const triangles = computeDelaunay(voronoiPoints);

    // Draw triangle edges
    ctx.strokeStyle = getColor(0.55);
    ctx.lineWidth = 0.7;

    for (const tri of triangles) {
        ctx.beginPath();
        ctx.moveTo(tri.a.x, tri.a.y);
        ctx.lineTo(tri.b.x, tri.b.y);
        ctx.lineTo(tri.c.x, tri.c.y);
        ctx.closePath();
        ctx.stroke();
    }

    // Draw points
    for (const p of voronoiPoints) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = getColor(0.85, true);
        ctx.fill();
    }
}

// ========================================
// MODE 5: Lissajous Curves
// ========================================

let lissajousCurves = [];
let lissajousTrailCanvas, lissajousTrailCtx;

// Interesting frequency ratios that create nice patterns
const FREQ_RATIOS = [
    [3, 4], [4, 5], [5, 6], [3, 5], [4, 7], [5, 8], [2, 3], [3, 7], [5, 7], [6, 7],
    [7, 9], [5, 9], [7, 8], [8, 9], [2, 5], [3, 8], [4, 9], [7, 11], [9, 11]
];

class LissajousCurve {
    constructor(freqA, freqB, phase, amplitude, hueShift, useAccent, speed, phaseShift) {
        this.freqA = freqA;
        this.freqB = freqB;
        this.phase = phase;
        this.phaseShift = phaseShift;       // Slowly evolving phase
        this.amplitude = amplitude;
        this.hueShift = hueShift;
        this.useAccent = useAccent;
        this.speed = speed;                  // Individual speed
        this.t = Math.random() * Math.PI * 2;
        this.points = [];
        this.maxPoints = 1000;
        // Offset from center for more variety
        this.offsetX = (Math.random() - 0.5) * width * 0.1;
        this.offsetY = (Math.random() - 0.5) * height * 0.1;
    }

    update() {
        this.t += this.speed;
        this.phase += this.phaseShift;  // Slowly evolving shape

        const centerX = width / 2 + this.offsetX;
        const centerY = height / 2 + this.offsetY;
        const scale = Math.min(width, height) * 0.42 * this.amplitude;

        // Subtle mouse influence to phase
        const mouseInfluence = (mouseX / width - 0.5) * 0.3;

        const x = centerX + Math.sin(this.freqA * this.t + this.phase + mouseInfluence) * scale;
        const y = centerY + Math.sin(this.freqB * this.t) * scale;

        this.points.push({ x, y });
        if (this.points.length > this.maxPoints) {
            this.points.shift();
        }
    }

    draw(ctx) {
        if (this.points.length < 2) return;

        for (let i = 1; i < this.points.length; i++) {
            const alpha = (i / this.points.length) * 0.12;

            ctx.beginPath();
            ctx.moveTo(this.points[i - 1].x, this.points[i - 1].y);
            ctx.lineTo(this.points[i].x, this.points[i].y);
            ctx.strokeStyle = getColor(alpha, this.useAccent, this.hueShift);
            ctx.lineWidth = 0.8;
            ctx.stroke();
        }
    }
}

function initLissajous() {
    // Randomly select frequency ratios each time
    const shuffled = [...FREQ_RATIOS].sort(() => Math.random() - 0.5);
    const numCurves = 3 + Math.floor(Math.random() * 3); // 3-5 curves

    lissajousCurves = [];
    for (let i = 0; i < numCurves; i++) {
        const [freqA, freqB] = shuffled[i];
        const phase = Math.random() * Math.PI * 2;
        const amplitude = 0.5 + Math.random() * 0.45;
        const hueShift = (Math.random() - 0.5) * 30;
        const useAccent = Math.random() > 0.5;
        const speed = 0.004 + Math.random() * 0.004;     // Varied speeds
        const phaseShift = (Math.random() - 0.5) * 0.0003; // Slow evolution
        lissajousCurves.push(new LissajousCurve(freqA, freqB, phase, amplitude, hueShift, useAccent, speed, phaseShift));
    }

    lissajousTrailCanvas = document.createElement('canvas');
    lissajousTrailCanvas.width = width;
    lissajousTrailCanvas.height = height;
    lissajousTrailCtx = lissajousTrailCanvas.getContext('2d');
    lissajousTrailCtx.fillStyle = 'rgb(8, 13, 18)';
    lissajousTrailCtx.fillRect(0, 0, width, height);
}

function animateLissajous() {
    lissajousTrailCtx.fillStyle = 'rgba(8, 13, 18, 0.02)';
    lissajousTrailCtx.fillRect(0, 0, width, height);

    lissajousCurves.forEach(curve => {
        curve.update();
        curve.draw(lissajousTrailCtx);
    });

    ctx.drawImage(lissajousTrailCanvas, 0, 0);
}

// ========================================
// MODE 6: Ocean Currents
// ========================================

let oceanLayers = [];
let oceanTime = 0;

class OceanLayer {
    constructor(depth, index, total) {
        this.depth = depth;
        this.index = index;

        const phi = 1.618033988749;

        this.frequency = 0.0006 + ((index * phi) % 1) * 0.001;
        this.phaseOffset = ((index * phi) % 1) * Math.PI * 2;
        this.speed = 0.035 + (1 - depth) * 0.035;
        this.amplitude = 100 + (1 - depth) * 140;
        this.yOffset = ((index * phi * 500) % 1000);
        this.alpha = 0.035 + (1 - depth) * 0.03;

        this.risePhase = ((index * phi * 3) % 1) * Math.PI * 2;
        this.riseSpeed = 0.01 + ((index * phi * 2) % 1) * 0.01;
        this.riseAmount = 40 + Math.random() * 30;

        // Gerstner steepness for horizontal bunching at crests
        this.steepness = 0.35 + Math.random() * 0.2;
    }
}

function initOcean() {
    oceanLayers = [];
    const numLayers = 7;
    for (let i = 0; i < numLayers; i++) {
        oceanLayers.push(new OceanLayer(i / (numLayers - 1), i, numLayers));
    }
    oceanTime = Math.random() * 1000;
}

function animateOcean() {
    ctx.fillStyle = 'rgba(8, 13, 18, 0.05)';
    ctx.fillRect(0, 0, width, height);

    oceanTime += 0.028;
    colorTime++;

    const colors = getCurrentColors();

    for (const layer of oceanLayers) {
        const numStrokes = Math.floor(height / 20);

        for (let i = 0; i < numStrokes; i++) {
            const baseY = (i / numStrokes) * height + layer.yOffset;
            const y = ((baseY % (height + 100)) - 50);

            // Perspective: screenT = 0 at top (far), 1 at bottom (near)
            const screenT = Math.max(0, Math.min(1, y / height));

            // Non-linear curve: top stays distant, middle has more life, bottom is full
            const easedT = screenT < 0.3
                ? screenT * 0.5  // Top 30%: very subtle (0 to 0.15)
                : 0.15 + (screenT - 0.3) * 1.21;  // Rest: ramps up faster (0.15 to 1.0)

            const persAmp = 0.12 + easedT * 0.88;
            const persAlpha = 0.3 + easedT * 0.7;
            const persSpeed = 0.6 + easedT * 0.4;

            ctx.beginPath();

            const rise = Math.sin(oceanTime * layer.riseSpeed + layer.risePhase + i * 0.12) * layer.riseAmount * persAmp;

            let isFirst = true;
            for (let x = -10; x <= width + 20; x += 7) {
                const spatialMod = 0.75 + 0.25 * Math.sin(x * 0.0006 + oceanTime * 0.005) * Math.sin((y + i * 40) * 0.0006 + oceanTime * 0.003);
                const amp = layer.amplitude * spatialMod * persAmp;

                // Main phase
                const phase = x * layer.frequency + oceanTime * layer.speed * persSpeed + layer.phaseOffset;

                // Gerstner horizontal displacement - bunches points at crests, stronger near viewer
                const hDisp = Math.cos(phase) * amp * layer.steepness * (0.15 + screenT * 0.25);

                // Vertical waves
                const wave1 = Math.sin(phase) * amp;
                const wave2 = Math.sin(phase * 2.2 + layer.phaseOffset * 0.8) * amp * 0.28;
                const wave3 = Math.sin(phase * 0.5) * amp * 0.4;
                const drift = Math.sin(x * 0.0004 + oceanTime * 0.012 + i * 0.3) * 70 * persAmp;

                const finalX = x + hDisp;
                const finalY = y + wave1 + wave2 + wave3 + drift + rise;

                if (isFirst) {
                    ctx.moveTo(finalX, finalY);
                    isFirst = false;
                } else {
                    ctx.lineTo(finalX, finalY);
                }
            }

            // Perspective color: hazier at top (far), clearer at bottom (near)
            const persColor = 0.4 + screenT * 0.6;
            const r = colors.primary[0] * persColor;
            const g = colors.primary[1] * persColor;
            const b = colors.primary[2] * (persColor * 0.95 + 0.05);

            ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${layer.alpha * persAlpha})`;
            ctx.lineWidth = 0.4 + screenT * 1.3;
            ctx.stroke();
        }
    }

    // Subtle caustics
    const numCaustics = 10;
    for (let i = 0; i < numCaustics; i++) {
        const cx = (Math.sin(oceanTime * 0.05 + i * 2.3) * 0.5 + 0.5) * width;
        const cy = (Math.cos(oceanTime * 0.035 + i * 1.8) * 0.5 + 0.5) * height;
        const radius = 70 + Math.sin(oceanTime * 0.08 + i) * 30;

        const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
        gradient.addColorStop(0, `rgba(${colors.accent[0]}, ${colors.accent[1]}, ${colors.accent[2]}, 0.018)`);
        gradient.addColorStop(1, 'transparent');

        ctx.fillStyle = gradient;
        ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);
    }
}

// ========================================
// MODE 7: Fractal (Julia Set)
// ========================================

let fractalImageData;
let fractalC = { re: -0.7, im: 0.27015 };
let fractalTime = 0;
let fractalCanvas, fractalCtx;

// Beautiful c values for Julia sets
const JULIA_PRESETS = [
    { re: -0.7, im: 0.27015 },
    { re: -0.8, im: 0.156 },
    { re: -0.4, im: 0.6 },
    { re: 0.285, im: 0.01 },
    { re: -0.835, im: -0.2321 },
    { re: -0.70176, im: -0.3842 },
    { re: 0.355, im: 0.355 },
    { re: -0.54, im: 0.54 },
];

function initFractal() {
    // Pick a random preset and add slight variation
    const preset = JULIA_PRESETS[Math.floor(Math.random() * JULIA_PRESETS.length)];
    fractalC = {
        re: preset.re + (Math.random() - 0.5) * 0.05,
        im: preset.im + (Math.random() - 0.5) * 0.05
    };
    fractalTime = Math.random() * 1000;

    fractalCanvas = document.createElement('canvas');
    fractalCanvas.width = Math.floor(width / 2); // Higher res for less grain
    fractalCanvas.height = Math.floor(height / 2);
    fractalCtx = fractalCanvas.getContext('2d');
    fractalImageData = fractalCtx.createImageData(fractalCanvas.width, fractalCanvas.height);
}

function animateFractal() {
    fractalTime += 0.006; // Faster morphing

    // Gentler c value drift - stays closer to stable regions
    const drift = 0.045;
    const cRe = fractalC.re + Math.sin(fractalTime * 0.5) * drift + Math.sin(fractalTime * 0.19) * drift * 0.25;
    const cIm = fractalC.im + Math.cos(fractalTime * 0.4) * drift + Math.cos(fractalTime * 0.14) * drift * 0.25;

    const w = fractalCanvas.width;
    const h = fractalCanvas.height;
    const data = fractalImageData.data;

    // Zoom and pan with slight mouse influence
    const mouseInfluenceX = (mouseX / width - 0.5) * 0.15;
    const mouseInfluenceY = (mouseY / height - 0.5) * 0.15;
    const zoom = 1.3;
    const panX = mouseInfluenceX;
    const panY = mouseInfluenceY;

    const maxIter = 60;

    // Get current cycling colors
    const colors = getCurrentColors();
    const primary = colors.primary;
    const accent = colors.accent;

    for (let py = 0; py < h; py++) {
        for (let px = 0; px < w; px++) {
            // Map pixel to complex plane
            let zRe = (px - w / 2) / (w / 4) / zoom + panX;
            let zIm = (py - h / 2) / (h / 4) / zoom + panY;

            let iter = 0;
            while (zRe * zRe + zIm * zIm < 4 && iter < maxIter) {
                const tmp = zRe * zRe - zIm * zIm + cRe;
                zIm = 2 * zRe * zIm + cIm;
                zRe = tmp;
                iter++;
            }

            const idx = (py * w + px) * 4;

            if (iter === maxIter) {
                // Inside the set - dark
                data[idx] = 8;
                data[idx + 1] = 13;
                data[idx + 2] = 18;
            } else {
                // Outside - color based on escape time
                const t = iter / maxIter;

                // Subtle intensity curve
                const intensity = Math.pow(t, 0.6) * 0.35;
                const useAccent = iter % 5 < 2;
                const col = useAccent ? accent : primary;

                const r = Math.floor(8 + (col[0] - 8) * intensity);
                const g = Math.floor(13 + (col[1] - 13) * intensity);
                const b = Math.floor(18 + (col[2] - 18) * intensity);

                data[idx] = Math.min(255, r);
                data[idx + 1] = Math.min(255, g);
                data[idx + 2] = Math.min(255, b);
            }
            data[idx + 3] = 255;
        }
    }

    fractalCtx.putImageData(fractalImageData, 0, 0);

    // Draw scaled up to main canvas with smoothing
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(fractalCanvas, 0, 0, width, height);
}

// ========================================
// Mode Switching
// ========================================

const modes = {
    ocean: { init: initOcean, animate: animateOcean },
    fractal: { init: initFractal, animate: animateFractal },
    flow: { init: initFlow, animate: animateFlow },
    constellation: { init: initConstellation, animate: animateConstellation },
    lorenz: { init: initLorenz, animate: animateLorenz },
    voronoi: { init: initVoronoi, animate: animateVoronoi },
    lissajous: { init: initLissajous, animate: animateLissajous }
};

function switchMode(mode) {
    if (!modes[mode]) return;

    currentMode = mode;
    time = 0;

    // Select new random color palette
    selectRandomPalette();

    // Clear canvas
    ctx.fillStyle = 'rgb(8, 13, 18)';
    ctx.fillRect(0, 0, width, height);

    // Initialize new mode
    modes[mode].init();

    // Update colophon
    const colophon = document.querySelector('.colophon');
    if (colophon) {
        colophon.textContent = colophonTexts[mode];
    }

    // Update toggle buttons
    document.querySelectorAll('.bg-toggle').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.mode === mode);
    });
}

function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;

    // Reinitialize current mode
    if (modes[currentMode]) {
        modes[currentMode].init();
    }
}

function animate() {
    if (modes[currentMode]) {
        modes[currentMode].animate();
    }
    time++;
    colorTime++; // Advance color cycling
    animationId = requestAnimationFrame(animate);
}

// Initialize
selectRandomPalette(); // Random color on first load
resize();
window.addEventListener('resize', resize);
animate();

// Set up toggle buttons
document.querySelectorAll('.bg-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
        switchMode(btn.dataset.mode);
    });
});

// Subtle parallax on hero glow
const heroGlow = document.querySelector('.hero-glow');
if (heroGlow) {
    document.addEventListener('mousemove', (e) => {
        const x = (e.clientX / window.innerWidth - 0.5) * 20;
        const y = (e.clientY / window.innerHeight - 0.5) * 20;
        heroGlow.style.transform = `translate(${x * 0.5}px, ${y * 0.5}px)`;
    });
}

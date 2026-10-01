class Particle {
    constructor(x, y, vx = 0, vy = 0) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.ax = 0;
        this.ay = 0;
        this.mass = Math.random() * 2 + 0.5;
        this.radius = this.mass * 1.5;
        this.life = 255;
        this.maxLife = 255;
        this.color = this.randomColor();
        this.trail = [];
        this.maxTrailLength = 10;
    }

    randomColor() {
        const colors = [
            '#00ff88',
            '#00ffcc',
            '#00ffff',
            '#ff00ff',
            '#ffff00',
            '#ff0088',
            '#88ff00',
            '#00ff00'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    update(gravity, speed) {
        this.vx += this.ax * speed;
        this.vy += this.ay * speed;
        this.vx *= 0.99;
        this.vy *= 0.99;

        this.x += this.vx * speed;
        this.y += this.vy * speed;

        this.life = Math.max(0, this.life - 0.5);

        this.ax = 0;
        this.ay = 0;
        if (gravity > 0) {
            this.ay += gravity * 0.1;
        }
    }

    applyForce(fx, fy, mode = 'attract') {
        const factor = mode === 'attract' ? 1 : -1;
        this.ax += (fx / this.mass) * factor;
        this.ay += (fy / this.mass) * factor;
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.life / this.maxLife;

        // Draw trail
        if (this.trail.length > 1) {
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(this.trail[0].x, this.trail[0].y);
            for (let i = 1; i < this.trail.length; i++) {
                ctx.lineTo(this.trail[i].x, this.trail[i].y);
            }
            ctx.stroke();
        }

        // Draw particle
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // Draw glow
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 0.5;
        ctx.globalAlpha = (this.life / this.maxLife) * 0.5;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * 2, 0, Math.PI * 2);
        ctx.stroke();

        ctx.restore();
    }

    updateTrail() {
        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > this.maxTrailLength) {
            this.trail.shift();
        }
    }

    isAlive() {
        return this.life > 0;
    }
}

class Universe {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;
        this.particles = [];
        this.gravity = 1;
        this.speed = 1;
        this.mode = 'attract';
        this.paused = false;
        this.frameCount = 0;
        this.lastFpsTime = Date.now();
        this.fps = 0;
        this.attractors = [];
        this.repellers = [];

        this.setupEventListeners();
    }

    setupEventListeners() {
        this.canvas.addEventListener('click', (e) => this.spawnParticles(e.clientX, e.clientY, 15));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.spawnParticles(e.clientX, e.clientY, 10, -1);
        });

        document.getElementById('pauseBtn').addEventListener('click', () => this.togglePause());
        document.getElementById('clearBtn').addEventListener('click', () => this.clear());
        document.getElementById('explodeBtn').addEventListener('click', () => this.explode());

        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.setMode(e.target.dataset.mode, e.target));
        });

        document.getElementById('gravitySlider').addEventListener('input', (e) => {
            this.gravity = parseFloat(e.target.value);
            document.getElementById('gravityValue').textContent = this.gravity.toFixed(1);
        });

        document.getElementById('speedSlider').addEventListener('input', (e) => {
            this.speed = parseFloat(e.target.value);
            document.getElementById('speedValue').textContent = this.speed.toFixed(1);
        });
    }

    handleMouseMove(e) {
        if (this.mode === 'orbit' && e.buttons > 0) {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            this.attractors = [{ x, y, strength: 0.5 }];
        }
    }

    spawnParticles(clientX, clientY, count, direction = 1) {
        const rect = this.canvas.getBoundingClientRect();
        const x = clientX - rect.left;
        const y = clientY - rect.top;

        for (let i = 0; i < count; i++) {
            const angle = (Math.random() * Math.PI * 2);
            const speed = Math.random() * 5 + 2;
            const vx = Math.cos(angle) * speed * direction;
            const vy = Math.sin(angle) * speed * direction;

            const particle = new Particle(x, y, vx, vy);
            this.particles.push(particle);
        }
    }

    setMode(mode, btn) {
        this.mode = mode;
        document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.attractors = [];
        this.repellers = [];
    }

    togglePause() {
        this.paused = !this.paused;
        document.getElementById('pauseBtn').textContent = this.paused ? '▶ Resume' : '⏸ Pause';
    }

    clear() {
        this.particles = [];
    }

    explode() {
        const centerX = this.width / 2;
        const centerY = this.height / 2;
        for (let i = 0; i < 100; i++) {
            const angle = (Math.random() * Math.PI * 2);
            const speed = Math.random() * 8 + 3;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
            const particle = new Particle(centerX, centerY, vx, vy);
            this.particles.push(particle);
        }
    }

    update() {
        if (this.paused) return;

        for (let i = 0; i < this.particles.length; i++) {
            const p1 = this.particles[i];

            // Apply gravity
            p1.update(this.gravity, this.speed);

            // Bounce off walls
            if (p1.x - p1.radius < 0 || p1.x + p1.radius > this.width) {
                p1.vx *= -0.8;
                p1.x = Math.max(p1.radius, Math.min(this.width - p1.radius, p1.x));
            }
            if (p1.y - p1.radius < 0 || p1.y + p1.radius > this.height) {
                p1.vy *= -0.8;
                p1.y = Math.max(p1.radius, Math.min(this.height - p1.radius, p1.y));
            }

            // Apply forces based on mode
            if (this.mode === 'attract' || this.mode === 'repel' || this.mode === 'orbit') {
                for (let j = i + 1; j < this.particles.length; j++) {
                    const p2 = this.particles[j];
                    const dx = p2.x - p1.x;
                    const dy = p2.y - p1.y;
                    const distSq = dx * dx + dy * dy;
                    const minDist = Math.max(distSq, 100);

                    if (this.mode === 'attract') {
                        const force = (p1.mass * p2.mass) / minDist * 0.01;
                        p1.applyForce(dx * force, dy * force, 'attract');
                        p2.applyForce(-dx * force, -dy * force, 'attract');
                    } else if (this.mode === 'repel') {
                        const force = (p1.mass * p2.mass) / minDist * 0.01;
                        p1.applyForce(-dx * force, -dy * force, 'repel');
                        p2.applyForce(dx * force, dy * force, 'repel');
                    } else if (this.mode === 'orbit') {
                        const force = (p1.mass * p2.mass) / minDist * 0.005;
                        p1.applyForce(dy * force, -dx * force, 'attract');
                        p2.applyForce(-dy * force, dx * force, 'attract');
                    }
                }
            } else if (this.mode === 'chaos') {
                // Random chaotic behavior
                p1.ax += (Math.random() - 0.5) * 0.5;
                p1.ay += (Math.random() - 0.5) * 0.5;
            }

            p1.updateTrail();
        }

        // Remove dead particles
        this.particles = this.particles.filter(p => p.isAlive());
    }

    draw() {
        // Clear canvas with fade effect
        this.ctx.fillStyle = 'rgba(10, 14, 39, 0.1)';
        this.ctx.fillRect(0, 0, this.width, this.height);

        // Draw particles
        for (const particle of this.particles) {
            particle.draw(this.ctx);
        }
    }

    updateStats() {
        this.frameCount++;
        const now = Date.now();
        if (now - this.lastFpsTime >= 1000) {
            this.fps = this.frameCount;
            this.frameCount = 0;
            this.lastFpsTime = now;
        }

        document.getElementById('particleCount').textContent = this.particles.length;
        document.getElementById('fps').textContent = this.fps;

        let totalEnergy = 0;
        for (const p of this.particles) {
            totalEnergy += Math.sqrt(p.vx * p.vx + p.vy * p.vy) * p.mass;
        }
        document.getElementById('energy').textContent = Math.floor(totalEnergy);
    }

    animate() {
        this.update();
        this.draw();
        this.updateStats();
        requestAnimationFrame(() => this.animate());
    }
}

// Initialize
window.addEventListener('load', () => {
    const canvas = document.getElementById('canvas');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const universe = new Universe(canvas);
    universe.animate();

    // Spawn initial particles
    for (let i = 0; i < 30; i++) {
        universe.spawnParticles(
            Math.random() * canvas.width,
            Math.random() * canvas.height,
            3
        );
    }

    // Handle resize
    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        universe.width = canvas.width;
        universe.height = canvas.height;
    });
});

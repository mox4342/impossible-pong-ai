// VISUAL EFFECTS SYSTEM - Particles, Screen Effects, Animations

class EffectsSystem {
    constructor() {
        this.particles = [];
        this.screenShake = 0;
        this.screenShakeIntensity = 0;
        this.chromaticAberration = 0;
        this.zoneEffect = 0;
        this.zoneTimer = 0;
        this.dangerPulse = 0;
        this.edgePulse = 0;
        this.trailPositions = [];
        this.maxTrailLength = 15;
    }

    createParticle(x, y, options = {}) {
        // Limit maximum particles for performance
        const maxParticles = window.GAME_CONFIG?.PERFORMANCE_MODE?.maxParticles || 30;
        if (this.particles.length >= maxParticles) {
            this.particles.shift(); // Remove oldest particle
        }
        
        const defaults = {
            vx: (Math.random() - 0.5) * 4,
            vy: (Math.random() - 0.5) * 4,
            size: Math.random() * 3 + 1,
            color: '#ffffff',
            life: 30,
            gravity: 0,
            fade: true,
            glow: false
        };
        
        this.particles.push({
            x,
            y,
            ...defaults,
            ...options
        });
    }

    paddleHitEffect(x, y, intensity = 1) {
        const particleCount = window.GAME_CONFIG?.PERFORMANCE_MODE?.particlesPerHit || 3;
        
        for (let i = 0; i < particleCount; i++) {
            this.createParticle(x, y, {
                vx: (Math.random() - 0.5) * 6 * intensity,
                vy: (Math.random() - 0.5) * 6 * intensity,
                color: `hsl(${Math.random() * 60 + 180}, 100%, 70%)`,
                life: 20 + Math.random() * 20,
                glow: true
            });
        }
        
        // Small screen shake
        this.addScreenShake(2 * intensity, 5);
    }

    scoreEffect(x, y, isPlayer) {
        const color = isPlayer ? '#00ff00' : '#ff3333';
        const particleCount = window.GAME_CONFIG?.PERFORMANCE_MODE?.particlesPerScore || 10;
        
        for (let i = 0; i < particleCount; i++) {
            const angle = (Math.PI * 2 * i) / particleCount;
            this.createParticle(x, y, {
                vx: Math.cos(angle) * 5,
                vy: Math.sin(angle) * 5,
                color: color,
                life: 40,
                size: 4,
                gravity: 0.1,
                glow: true
            });
        }
        
        // Medium screen shake
        this.addScreenShake(5, 10);
    }

    closeSaveEffect(x, y) {
        // Blue particle trail for close saves
        for (let i = 0; i < 10; i++) {
            this.createParticle(x, y, {
                vx: Math.random() * 2 - 1,
                vy: -Math.random() * 3,
                color: '#00aaff',
                life: 30,
                size: 3,
                glow: true
            });
        }
    }

    zoneActivateEffect() {
        this.zoneEffect = 1;
        this.zoneTimer = 180; // 3 seconds at 60fps
        
        // Create zone particles around screen edges
        for (let i = 0; i < 20; i++) {
            const side = Math.floor(Math.random() * 4);
            let x, y;
            
            switch(side) {
                case 0: // top
                    x = Math.random() * 800;
                    y = 0;
                    break;
                case 1: // right
                    x = 800;
                    y = Math.random() * 400;
                    break;
                case 2: // bottom
                    x = Math.random() * 800;
                    y = 400;
                    break;
                case 3: // left
                    x = 0;
                    y = Math.random() * 400;
                    break;
            }
            
            this.createParticle(x, y, {
                vx: (Math.random() - 0.5) * 2,
                vy: (Math.random() - 0.5) * 2,
                color: '#ffffff',
                life: 60,
                size: 2,
                fade: true,
                glow: true
            });
        }
    }

    updateBallTrail(x, y, speed) {
        this.trailPositions.push({ x, y, intensity: Math.min(1, speed / 15) });
        
        // Limit trail length based on speed
        const dynamicLength = Math.min(this.maxTrailLength, 5 + speed);
        while (this.trailPositions.length > dynamicLength) {
            this.trailPositions.shift();
        }
    }

    addScreenShake(intensity, duration) {
        if (!window.GAME_CONFIG?.PERFORMANCE_MODE?.screenShake) return;
        this.screenShake = Math.max(this.screenShake, duration);
        this.screenShakeIntensity = Math.min(this.screenShakeIntensity, intensity * 0.5); // Reduced intensity
    }

    updateParticles() {
        this.particles = this.particles.filter(particle => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.vy += particle.gravity;
            particle.life--;
            
            if (particle.fade) {
                particle.alpha = particle.life / 30;
            }
            
            return particle.life > 0;
        });
    }

    updateEffects() {
        this.updateParticles();
        
        // Update screen shake
        if (this.screenShake > 0) {
            this.screenShake--;
            if (this.screenShake === 0) {
                this.screenShakeIntensity = 0;
            }
        }
        
        // Update zone effect
        if (this.zoneTimer > 0) {
            this.zoneTimer--;
            if (this.zoneTimer === 0) {
                this.zoneEffect = 0;
            }
        }
        
        // Update danger pulse
        this.dangerPulse = (this.dangerPulse + 0.1) % (Math.PI * 2);
        
        // Update edge pulse
        this.edgePulse = (this.edgePulse + 0.05) % (Math.PI * 2);
    }

    applyScreenShake(ctx) {
        if (this.screenShake > 0) {
            const shakeX = (Math.random() - 0.5) * this.screenShakeIntensity;
            const shakeY = (Math.random() - 0.5) * this.screenShakeIntensity;
            ctx.save();
            ctx.translate(shakeX, shakeY);
        }
    }

    resetScreenShake(ctx) {
        if (this.screenShake > 0) {
            ctx.restore();
        }
    }

    drawParticles(ctx) {
        this.particles.forEach(particle => {
            ctx.save();
            
            if (particle.alpha !== undefined) {
                ctx.globalAlpha = particle.alpha;
            }
            
            if (particle.glow) {
                ctx.shadowBlur = 10;
                ctx.shadowColor = particle.color;
            }
            
            ctx.fillStyle = particle.color;
            ctx.fillRect(
                particle.x - particle.size / 2,
                particle.y - particle.size / 2,
                particle.size,
                particle.size
            );
            
            ctx.restore();
        });
    }

    drawBallTrail(ctx) {
        const BALL_SIZE = window.GAME_CONFIG ? window.GAME_CONFIG.BALL_SIZE : 10;
        this.trailPositions.forEach((pos, index) => {
            const alpha = (index / this.trailPositions.length) * 0.5 * pos.intensity;
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            
            const size = BALL_SIZE * (index / this.trailPositions.length);
            ctx.fillRect(
                pos.x + (BALL_SIZE - size) / 2,
                pos.y + (BALL_SIZE - size) / 2,
                size,
                size
            );
        });
    }

    drawZoneEffect(ctx) {
        if (this.zoneEffect > 0) {
            const canvas = document.getElementById('gameCanvas');
            if (!canvas) return;
            
            // Vignette effect
            const gradient = ctx.createRadialGradient(
                canvas.width / 2, canvas.height / 2, 0,
                canvas.width / 2, canvas.height / 2, canvas.width / 2
            );
            
            gradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
            gradient.addColorStop(0.7, 'rgba(255, 255, 255, 0)');
            gradient.addColorStop(1, `rgba(100, 200, 255, ${this.zoneEffect * 0.2})`);
            
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Zone text
            if (this.zoneTimer > 150) {
                ctx.fillStyle = `rgba(255, 255, 255, ${(this.zoneTimer - 150) / 30})`;
                ctx.font = 'bold 24px Courier New';
                ctx.textAlign = 'center';
                ctx.fillText('ZONE ACTIVATED', canvas.width / 2, 140);
            }
        }
    }

    drawDangerZone(ctx, isDanger) {
        if (isDanger) {
            const pulseAlpha = (Math.sin(this.dangerPulse) + 1) / 4;
            ctx.fillStyle = `rgba(255, 0, 0, ${pulseAlpha})`;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Edge pulse effect
            const edgeAlpha = (Math.sin(this.edgePulse) + 1) / 2;
            ctx.strokeStyle = `rgba(255, 0, 0, ${edgeAlpha})`;
            ctx.lineWidth = 3;
            ctx.strokeRect(2, 2, canvas.width - 4, canvas.height - 4);
        }
    }

    drawChromaticAberration(ctx, intensity) {
        if (intensity > 0) {
            const canvas = document.getElementById('gameCanvas');
            if (!canvas) return;
            
            ctx.globalCompositeOperation = 'screen';
            ctx.globalAlpha = intensity * 0.3;
            
            // Red channel offset
            ctx.fillStyle = 'red';
            ctx.fillRect(-2, 0, canvas.width, canvas.height);
            
            // Blue channel offset
            ctx.fillStyle = 'blue';
            ctx.fillRect(2, 0, canvas.width, canvas.height);
            
            ctx.globalCompositeOperation = 'source-over';
            ctx.globalAlpha = 1;
        }
    }

    drawPaddleGlow(ctx, x, y, width, height, isApproaching, isPlayer = false) {
        if (isApproaching) {
            ctx.save();
            ctx.shadowBlur = 20;
            ctx.shadowColor = isPlayer ? '#00ff00' : '#ff0000';
            ctx.fillStyle = isPlayer ? 'rgba(0, 255, 0, 0.3)' : 'rgba(255, 0, 0, 0.3)';
            ctx.fillRect(x - 5, y - 5, width + 10, height + 10);
            ctx.restore();
        }
    }

    gameOverEffect(playerWon) {
        const canvas = document.getElementById('gameCanvas');
        const x = canvas ? canvas.width / 2 : 400;
        const y = canvas ? canvas.height / 2 : 200;
        
        if (playerWon) {
            // Celebration explosion
            for (let i = 0; i < 100; i++) {
                const angle = (Math.PI * 2 * i) / 100;
                const speed = Math.random() * 10 + 5;
                this.createParticle(x, y, {
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    color: `hsl(${Math.random() * 360}, 100%, 50%)`,
                    life: 60 + Math.random() * 60,
                    size: Math.random() * 5 + 2,
                    gravity: 0.1,
                    glow: true
                });
            }
            this.addScreenShake(10, 20);
        } else {
            // Defeat particles
            for (let i = 0; i < 30; i++) {
                this.createParticle(x + (Math.random() - 0.5) * 200, y, {
                    vx: (Math.random() - 0.5) * 2,
                    vy: Math.random() * 2 + 1,
                    color: '#666666',
                    life: 60,
                    size: 3,
                    gravity: 0.2
                });
            }
            this.addScreenShake(3, 10);
        }
    }

    reset() {
        this.particles = [];
        this.screenShake = 0;
        this.screenShakeIntensity = 0;
        this.zoneEffect = 0;
        this.zoneTimer = 0;
        this.trailPositions = [];
    }
}

const effects = new EffectsSystem();
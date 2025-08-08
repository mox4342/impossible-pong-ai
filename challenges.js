// DAILY CHALLENGES SYSTEM

class ChallengesSystem {
    constructor() {
        this.currentChallenge = null;
        this.challengeActive = false;
        this.challengeCompleted = false;
        this.lastChallengeDate = null;
        
        this.challenges = {
            monday: {
                name: "Mega Monday",
                desc: "AI is 20% faster",
                xpBonus: 1.5,
                apply: (game) => {
                    impossibleAI.speedMultiplier = 1.2;
                }
            },
            tuesday: {
                name: "Tricky Tuesday",
                desc: "Ball curves randomly",
                xpBonus: 1.5,
                apply: (game) => {
                    // Add random curve to ball
                    if (Math.random() < 0.1) {
                        game.ball.speedY += (Math.random() - 0.5) * 2;
                    }
                }
            },
            wednesday: {
                name: "Wacky Wednesday",
                desc: "Paddle sizes change",
                xpBonus: 2.0,
                apply: (game) => {
                    // Randomly change paddle sizes
                    if (Math.random() < 0.01) {
                        const paddleHeight = window.GAME_CONFIG ? window.GAME_CONFIG.PADDLE_HEIGHT : 80;
                        game.player.paddleHeight = paddleHeight + (Math.random() - 0.5) * 40;
                        game.ai.paddleHeight = paddleHeight + (Math.random() - 0.5) * 40;
                    }
                }
            },
            thursday: {
                name: "Turbo Thursday",
                desc: "Everything is 50% faster",
                xpBonus: 2.0,
                apply: (game) => {
                    game.ball.speedX *= 1.5;
                    game.ball.speedY *= 1.5;
                }
            },
            friday: {
                name: "Fair Friday",
                desc: "AI makes more mistakes",
                xpBonus: 0.8,
                apply: (game) => {
                    impossibleAI.errorMargin = 30;
                    aiPersonality.hiddenHandicap = 0.15;
                }
            },
            saturday: {
                name: "Survival Saturday",
                desc: "First to 10 wins",
                xpBonus: 1.2,
                apply: (game) => {
                    // This is handled in game logic
                    return { winningScore: 10 };
                }
            },
            sunday: {
                name: "Chill Sunday",
                desc: "AI is 10% slower",
                xpBonus: 0.5,
                apply: (game) => {
                    impossibleAI.speedMultiplier = 0.9;
                    aiPersonality.hiddenHandicap = 0.1;
                }
            }
        };
        
        this.specialEvents = {
            april_fools: {
                name: "April Fools!",
                desc: "Controls are reversed",
                date: "04-01",
                xpBonus: 3.0,
                apply: (game) => {
                    // Reverse controls handled in input
                    return { reverseControls: true };
                }
            },
            friday_13: {
                name: "Friday the 13th",
                desc: "Spooky mode - limited visibility",
                xpBonus: 2.5,
                apply: (game) => {
                    return { spookyMode: true };
                }
            },
            new_year: {
                name: "New Year Special",
                desc: "Fireworks on every point!",
                date: "01-01",
                xpBonus: 2.0,
                apply: (game) => {
                    return { fireworks: true };
                }
            }
        };
        
        this.loadChallenge();
    }

    getCurrentChallenge() {
        const today = new Date();
        const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const dayName = dayNames[today.getDay()];
        const dateStr = `${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        
        // Check for special events first
        for (const [key, event] of Object.entries(this.specialEvents)) {
            if (event.date === dateStr) {
                return { ...event, special: true };
            }
            
            // Friday the 13th check
            if (key === 'friday_13' && today.getDate() === 13 && today.getDay() === 5) {
                return { ...event, special: true };
            }
        }
        
        // Return daily challenge
        return this.challenges[dayName] || null;
    }

    loadChallenge() {
        const today = new Date().toDateString();
        const saved = localStorage.getItem('impossiblePongDailyChallenge');
        
        if (saved) {
            const data = JSON.parse(saved);
            if (data.date === today) {
                this.challengeCompleted = data.completed;
                this.challengeActive = data.active;
            }
        }
        
        if (this.lastChallengeDate !== today) {
            this.lastChallengeDate = today;
            this.challengeCompleted = false;
            this.challengeActive = false;
            this.currentChallenge = this.getCurrentChallenge();
        }
    }

    activateChallenge(game) {
        if (!this.currentChallenge || this.challengeActive) return;
        
        this.challengeActive = true;
        
        if (this.currentChallenge.apply) {
            const modifications = this.currentChallenge.apply(game);
            if (modifications) {
                Object.assign(game, modifications);
            }
        }
        
        this.saveChallenge();
    }

    completeChallenge() {
        if (!this.challengeActive || this.challengeCompleted) return;
        
        this.challengeCompleted = true;
        
        // Award bonus XP
        const bonusXP = Math.floor(500 * this.currentChallenge.xpBonus);
        progression.addXP(bonusXP, `${this.currentChallenge.name} Complete!`);
        
        this.saveChallenge();
    }

    saveChallenge() {
        localStorage.setItem('impossiblePongDailyChallenge', JSON.stringify({
            date: new Date().toDateString(),
            completed: this.challengeCompleted,
            active: this.challengeActive
        }));
    }

    drawChallengeInfo(ctx) {
        if (!this.currentChallenge) return;
        
        const y = 10;
        const x = canvas.width / 2;
        
        // Challenge banner
        ctx.fillStyle = this.currentChallenge.special ? 
            'rgba(255, 215, 0, 0.9)' : 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(x - 150, y, 300, 40);
        
        // Border
        ctx.strokeStyle = this.currentChallenge.special ? '#FFD700' : '#00ffaa';
        ctx.lineWidth = 2;
        ctx.strokeRect(x - 150, y, 300, 40);
        
        // Challenge text
        ctx.fillStyle = this.currentChallenge.special ? '#FFD700' : '#00ffaa';
        ctx.font = 'bold 14px Courier New';
        ctx.textAlign = 'center';
        ctx.fillText(this.currentChallenge.name, x, y + 18);
        
        ctx.fillStyle = 'white';
        ctx.font = '11px Courier New';
        ctx.fillText(this.currentChallenge.desc, x, y + 32);
        
        // XP bonus indicator
        ctx.fillStyle = '#00ff00';
        ctx.font = '10px Courier New';
        ctx.textAlign = 'right';
        ctx.fillText(`${this.currentChallenge.xpBonus}x XP`, x + 140, y + 32);
        
        // Completion status
        if (this.challengeCompleted) {
            ctx.fillStyle = '#00ff00';
            ctx.font = 'bold 12px Courier New';
            ctx.textAlign = 'left';
            ctx.fillText('✓', x - 140, y + 25);
        } else if (this.challengeActive) {
            ctx.fillStyle = '#ffaa00';
            ctx.font = '10px Courier New';
            ctx.textAlign = 'left';
            ctx.fillText('Active', x - 140, y + 25);
        }
    }

    applySpecialEffects(ctx, game) {
        if (!this.currentChallenge || !this.challengeActive) return;
        
        // Spooky mode - darkness effect
        if (game.spookyMode) {
            const gradient = ctx.createRadialGradient(
                game.ball.x + BALL_SIZE / 2,
                game.ball.y + BALL_SIZE / 2,
                50,
                game.ball.x + BALL_SIZE / 2,
                game.ball.y + BALL_SIZE / 2,
                200
            );
            
            gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
            gradient.addColorStop(1, 'rgba(0, 0, 0, 0.8)');
            
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        
        // Fireworks effect
        if (game.fireworks && Math.random() < 0.02) {
            const x = Math.random() * canvas.width;
            const y = Math.random() * canvas.height / 2;
            
            for (let i = 0; i < 20; i++) {
                const angle = (Math.PI * 2 * i) / 20;
                effects.createParticle(x, y, {
                    vx: Math.cos(angle) * 3,
                    vy: Math.sin(angle) * 3,
                    color: `hsl(${Math.random() * 360}, 100%, 50%)`,
                    life: 30,
                    glow: true
                });
            }
        }
    }

    getXPMultiplier() {
        if (!this.challengeActive || !this.currentChallenge) return 1;
        return this.currentChallenge.xpBonus;
    }
}

const challenges = new ChallengesSystem();
// ENHANCED AUDIO SYSTEM - Contextual sounds, dynamic pitch, satisfaction feedback

class EnhancedAudioManager {
    constructor() {
        this.isMuted = false;
        this.audioContext = null;
        this.sounds = {};
        this.rallyPitch = 400;
        this.heartbeatInterval = null;
        this.initAudio();
    }

    initAudio() {
        try {
            window.AudioContext = window.AudioContext || window.webkitAudioContext;
            this.audioContext = new AudioContext();
            this.createSounds();
        } catch (e) {
            console.log('Web Audio API not supported');
        }
    }

    createSounds() {
        // Basic sounds
        this.sounds.paddle = (rallyCount = 0) => this.createDynamicPaddleHit(rallyCount);
        this.sounds.wall = this.createTone(300, 0.05, 'square');
        this.sounds.score = this.createScoreSound();
        this.sounds.lose = this.createLoseSound();
        this.sounds.gameOver = this.createGameOverSound();
        this.sounds.almostWin = this.createAlmostWinSound();
        
        // New sounds
        this.sounds.achievement = this.createAchievementSound();
        this.sounds.levelUp = this.createLevelUpSound();
        this.sounds.xpGain = this.createXPGainSound();
        this.sounds.zoneActivate = this.createZoneSound();
        this.sounds.powerUp = this.createPowerUpSound();
        this.sounds.countdown = this.createCountdownSound();
        this.sounds.heartbeat = this.createHeartbeatSound();
        this.sounds.woosh = this.createWooshSound();
        this.sounds.impact = this.createImpactSound();
    }

    createDynamicPaddleHit(rallyCount) {
        return () => {
            if (this.isMuted || !this.audioContext) return;
            
            // Pitch increases with rally count
            const basePitch = 400;
            const pitch = basePitch + (rallyCount * 50);
            const maxPitch = 1200;
            const finalPitch = Math.min(pitch, maxPitch);
            
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.value = finalPitch;
            oscillator.type = 'square';
            
            gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.05);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + 0.05);
        };
    }

    createTone(frequency, duration, type = 'sine', slide = false) {
        return () => {
            if (this.isMuted || !this.audioContext) return;
            
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.value = frequency;
            oscillator.type = type;
            
            if (slide) {
                oscillator.frequency.exponentialRampToValueAtTime(
                    frequency * 0.5,
                    this.audioContext.currentTime + duration
                );
            }
            
            gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + duration);
        };
    }

    createScoreSound() {
        return () => {
            if (this.isMuted || !this.audioContext) return;
            
            // Victory arpeggio
            const notes = [523, 659, 784];
            notes.forEach((freq, i) => {
                setTimeout(() => {
                    const oscillator = this.audioContext.createOscillator();
                    const gainNode = this.audioContext.createGain();
                    
                    oscillator.connect(gainNode);
                    gainNode.connect(this.audioContext.destination);
                    
                    oscillator.frequency.value = freq;
                    oscillator.type = 'sine';
                    
                    gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);
                    
                    oscillator.start(this.audioContext.currentTime);
                    oscillator.stop(this.audioContext.currentTime + 0.2);
                }, i * 50);
            });
        };
    }

    createLoseSound() {
        return () => {
            if (this.isMuted || !this.audioContext) return;
            
            // Defeat arpeggio (descending)
            const notes = [392, 349, 294];
            notes.forEach((freq, i) => {
                setTimeout(() => {
                    const oscillator = this.audioContext.createOscillator();
                    const gainNode = this.audioContext.createGain();
                    
                    oscillator.connect(gainNode);
                    gainNode.connect(this.audioContext.destination);
                    
                    oscillator.frequency.value = freq;
                    oscillator.type = 'sawtooth';
                    
                    gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.15);
                    
                    oscillator.start(this.audioContext.currentTime);
                    oscillator.stop(this.audioContext.currentTime + 0.15);
                }, i * 50);
            });
        };
    }

    createAchievementSound() {
        return () => {
            if (this.isMuted || !this.audioContext) return;
            
            // Satisfying ding sound
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(1600, this.audioContext.currentTime + 0.1);
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.4, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + 0.3);
        };
    }

    createLevelUpSound() {
        return () => {
            if (this.isMuted || !this.audioContext) return;
            
            // Triumphant fanfare
            const notes = [523, 659, 784, 1047, 784, 1047];
            notes.forEach((freq, i) => {
                setTimeout(() => {
                    const oscillator = this.audioContext.createOscillator();
                    const gainNode = this.audioContext.createGain();
                    
                    oscillator.connect(gainNode);
                    gainNode.connect(this.audioContext.destination);
                    
                    oscillator.frequency.value = freq;
                    oscillator.type = 'sine';
                    
                    gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);
                    
                    oscillator.start(this.audioContext.currentTime);
                    oscillator.stop(this.audioContext.currentTime + 0.2);
                }, i * 80);
            });
        };
    }

    createXPGainSound() {
        return () => {
            if (this.isMuted || !this.audioContext) return;
            
            // Quick ascending blip
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.setValueAtTime(600, this.audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(1200, this.audioContext.currentTime + 0.05);
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.05);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + 0.05);
        };
    }

    createZoneSound() {
        return () => {
            if (this.isMuted || !this.audioContext) return;
            
            // Ethereal zone activation
            const oscillator = this.audioContext.createOscillator();
            const oscillator2 = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            oscillator2.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.value = 440;
            oscillator2.frequency.value = 554;
            oscillator.type = 'sine';
            oscillator2.type = 'sine';
            
            gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.2, this.audioContext.currentTime + 0.1);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator2.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + 0.5);
            oscillator2.stop(this.audioContext.currentTime + 0.5);
        };
    }

    createHeartbeatSound() {
        return () => {
            if (this.isMuted || !this.audioContext) return;
            
            const beat = () => {
                const oscillator = this.audioContext.createOscillator();
                const gainNode = this.audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(this.audioContext.destination);
                
                oscillator.frequency.value = 60;
                oscillator.type = 'sine';
                
                gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
                
                oscillator.start(this.audioContext.currentTime);
                oscillator.stop(this.audioContext.currentTime + 0.1);
            };
            
            beat();
            setTimeout(beat, 100);
        };
    }

    createPowerUpSound() {
        return () => {
            if (this.isMuted || !this.audioContext) return;
            
            // Magical power-up sound
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.setValueAtTime(400, this.audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(800, this.audioContext.currentTime + 0.1);
            oscillator.frequency.exponentialRampToValueAtTime(1600, this.audioContext.currentTime + 0.2);
            oscillator.type = 'triangle';
            
            gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + 0.3);
        };
    }

    createCountdownSound() {
        return () => {
            if (this.isMuted || !this.audioContext) return;
            
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.value = 800;
            oscillator.type = 'square';
            
            gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + 0.1);
        };
    }

    createWooshSound() {
        return () => {
            if (this.isMuted || !this.audioContext) return;
            
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            const filter = this.audioContext.createBiquadFilter();
            
            oscillator.connect(filter);
            filter.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.type = 'sawtooth';
            oscillator.frequency.value = 100;
            
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(100, this.audioContext.currentTime);
            filter.frequency.exponentialRampToValueAtTime(2000, this.audioContext.currentTime + 0.1);
            
            gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + 0.1);
        };
    }

    createImpactSound() {
        return () => {
            if (this.isMuted || !this.audioContext) return;
            
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.value = 50;
            oscillator.type = 'sawtooth';
            
            gainNode.gain.setValueAtTime(0.4, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.05);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + 0.05);
        };
    }

    createGameOverSound() {
        return (playerWon) => {
            if (this.isMuted || !this.audioContext) return;
            
            if (playerWon) {
                // Victory fanfare
                this.sounds.levelUp();
            } else {
                // Sad trombone
                const notes = [200, 190, 180, 170];
                notes.forEach((freq, i) => {
                    setTimeout(() => {
                        const oscillator = this.audioContext.createOscillator();
                        const gainNode = this.audioContext.createGain();
                        
                        oscillator.connect(gainNode);
                        gainNode.connect(this.audioContext.destination);
                        
                        oscillator.frequency.value = freq;
                        oscillator.type = 'sawtooth';
                        
                        gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
                        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
                        
                        oscillator.start(this.audioContext.currentTime);
                        oscillator.stop(this.audioContext.currentTime + 0.3);
                    }, i * 150);
                });
            }
        };
    }

    createAlmostWinSound() {
        return () => {
            if (this.isMuted || !this.audioContext) return;
            
            // Tense buildup sound
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            const lfo = this.audioContext.createOscillator();
            const lfoGain = this.audioContext.createGain();
            
            lfo.connect(lfoGain);
            lfoGain.connect(oscillator.frequency);
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.value = 440;
            oscillator.type = 'sine';
            
            lfo.frequency.value = 10;
            lfo.type = 'sine';
            lfoGain.gain.value = 50;
            
            gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 1);
            
            lfo.start(this.audioContext.currentTime);
            oscillator.start(this.audioContext.currentTime);
            lfo.stop(this.audioContext.currentTime + 1);
            oscillator.stop(this.audioContext.currentTime + 1);
        };
    }

    playDynamicPaddleHit(rallyCount) {
        if (this.isMuted || !this.audioContext) return;
        
        const basePitch = 400;
        const pitch = basePitch + (rallyCount * 50);
        const maxPitch = 1200;
        const finalPitch = Math.min(pitch, maxPitch);
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.value = finalPitch;
        oscillator.type = 'square';
        
        gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.05);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.05);
    }

    startHeartbeat() {
        if (this.heartbeatInterval) return;
        
        this.heartbeatInterval = setInterval(() => {
            this.sounds.heartbeat();
        }, 800);
    }

    stopHeartbeat() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
    }

    play(soundName, ...args) {
        if (this.sounds[soundName]) {
            if (typeof this.sounds[soundName] === 'function') {
                this.sounds[soundName](...args);
            } else {
                this.sounds[soundName]();
            }
        }
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        if (this.isMuted) {
            this.stopHeartbeat();
        }
        return this.isMuted;
    }
}

const enhancedAudio = new EnhancedAudioManager();
const audioManager = enhancedAudio; // Compatibility alias
class AudioManager {
    constructor() {
        this.isMuted = false;
        this.audioContext = null;
        this.sounds = {};
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
        this.sounds.paddle = this.createTone(400, 0.05, 'square');
        this.sounds.wall = this.createTone(300, 0.05, 'square');
        this.sounds.score = this.createTone(200, 0.2, 'sine', true);
        this.sounds.gameOver = this.createVictorySound();
        this.sounds.powerUp = this.createTone(600, 0.1, 'sine', true);
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

    createVictorySound() {
        return () => {
            if (this.isMuted || !this.audioContext) return;
            
            const notes = [523, 659, 784, 1047];
            notes.forEach((freq, i) => {
                setTimeout(() => {
                    const oscillator = this.audioContext.createOscillator();
                    const gainNode = this.audioContext.createGain();
                    
                    oscillator.connect(gainNode);
                    gainNode.connect(this.audioContext.destination);
                    
                    oscillator.frequency.value = freq;
                    oscillator.type = 'sine';
                    
                    gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
                    
                    oscillator.start(this.audioContext.currentTime);
                    oscillator.stop(this.audioContext.currentTime + 0.3);
                }, i * 100);
            });
        };
    }

    play(soundName) {
        if (this.sounds[soundName]) {
            this.sounds[soundName]();
        }
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        return this.isMuted;
    }

    setVolume(value) {
        if (this.audioContext) {
            this.audioContext.destination.volume = value;
        }
    }
}

const audioManager = new AudioManager();
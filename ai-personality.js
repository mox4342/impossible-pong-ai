// AI PERSONALITY SYSTEM - Dynamic taunts, adaptive difficulty, psychological warfare

class AIPersonality {
    constructor() {
        this.currentTaunt = null;
        this.tauntTimer = 0;
        this.tauntCooldown = 0;
        this.lastTauntCategory = null;
        this.adaptiveDifficulty = 1.0;
        this.hiddenHandicap = 0;
        this.playerFrustrationLevel = 0;
        this.consecutiveLosses = 0;
        this.isBeingGenerous = false;
        
        this.taunts = this.initTaunts();
    }

    initTaunts() {
        return {
            start: [
                "Ready to lose?",
                "Again? Really?",
                "Calculating victory...",
                "Initializing domination.exe",
                "Hope.level = 0",
                "Another one?",
                "This won't take long."
            ],
            player_scores: [
                "Lucky.",
                "Fluke.",
                "Interesting...",
                "Not bad.",
                "Hmm.",
                "Temporary setback.",
                "Error logged."
            ],
            player_scores_multiple: [
                "Getting warmer.",
                "Adjusting strategy...",
                "Recalculating...",
                "Impressive. For a human.",
                "Noted.",
                "System update required."
            ],
            ai_scores: [
                "Too easy.",
                "Predicted.",
                "As expected.",
                "Delete game.exe?",
                "Optimal play.",
                "Textbook.",
                "GG EZ"
            ],
            ai_scores_dominating: [
                "Why continue?",
                "Resistance is futile.",
                "Processing tears...",
                "Alt+F4 available.",
                "Mercy.exe not found.",
                "Skill issue detected."
            ],
            rally_long: [
                "Warming up now.",
                "Processing...",
                "Analyzing patterns...",
                "Cute effort.",
                "Still calculating...",
                "Is this your best?"
            ],
            player_losing_badly: [
                "Practice mode available...",
                "Need assistance?",
                "Tutorial recommended.",
                "Difficulty: Impossible ✓",
                "0.01% win probability",
                "F to pay respects"
            ],
            close_score: [
                "Getting nervous? JK.",
                "You're learning.",
                "Almost competent.",
                "Sweating circuits...",
                "Interesting match.",
                "CPU usage: 2%"
            ],
            player_almost_winning: [
                "Not today.",
                "Nice try though.",
                "So close, yet...",
                "Maximum effort mode.",
                "Engaging tryhard.exe",
                "Plot twist incoming."
            ],
            final_point: [
                "Game over incoming.",
                "GG.",
                "match.end()",
                "Thanks for playing.",
                "Better luck never.",
                "Ctrl+Z won't help."
            ],
            comeback: [
                "Comeback.exe loaded.",
                "Warming up complete.",
                "Real match starts now.",
                "Kidding's over.",
                "Your peak was cute.",
                "My turn."
            ],
            zone_activated: [
                "Zone? Adorable.",
                "Trying hard now?",
                "Focus mode? Cute.",
                "I see you.",
                "Zone vs Algorithm.",
                "Humans and their zones..."
            ],
            achievement_unlocked: [
                "Achievement hunter?",
                "Participation trophy.",
                "Congrats, I guess.",
                "XP won't help.",
                "Level up, still lose.",
                "Numbers go up, skill doesn't."
            ],
            practice_mode: [
                "Training wheels?",
                "Easy mode activated.",
                "No shame... much.",
                "Practice makes... tolerable.",
                "Baby steps.",
                "We all start somewhere."
            ],
            rare_compliment: [
                "Actually good shot.",
                "Respect++",
                "Well played, human.",
                "Decent move.",
                "I'll allow it.",
                "Not terrible."
            ]
        };
    }

    selectTaunt(category, gameState = {}) {
        if (this.tauntCooldown > 0) return null;
        
        // Don't repeat the same category too often
        if (category === this.lastTauntCategory && Math.random() > 0.3) {
            return null;
        }
        
        // Occasionally give a rare compliment to keep hope alive
        if (Math.random() < 0.05 && gameState.playerScore >= 3) {
            category = 'rare_compliment';
        }
        
        const tauntsArray = this.taunts[category];
        if (!tauntsArray || tauntsArray.length === 0) return null;
        
        const taunt = tauntsArray[Math.floor(Math.random() * tauntsArray.length)];
        this.lastTauntCategory = category;
        this.tauntCooldown = 120; // 2 second cooldown
        
        return taunt;
    }

    updateTaunt(gameState) {
        // Cooldown management
        if (this.tauntCooldown > 0) {
            this.tauntCooldown--;
        }
        
        if (this.tauntTimer > 0) {
            this.tauntTimer--;
            if (this.tauntTimer === 0) {
                this.currentTaunt = null;
            }
        }
    }

    showTaunt(text, duration = 120) {
        this.currentTaunt = text;
        this.tauntTimer = duration;
    }

    triggerTaunt(event, gameState) {
        let category = null;
        let customTaunt = null;
        
        switch(event) {
            case 'game_start':
                if (gameState.attempts > 5) {
                    customTaunt = `Attempt #${gameState.attempts}... persistent.`;
                } else {
                    category = 'start';
                }
                break;
                
            case 'player_score':
                if (gameState.playerScore >= 5) {
                    category = 'player_almost_winning';
                } else if (gameState.playerScore >= 3) {
                    category = 'player_scores_multiple';
                } else {
                    category = 'player_scores';
                }
                break;
                
            case 'ai_score':
                if (gameState.aiScore - gameState.playerScore >= 4) {
                    category = 'ai_scores_dominating';
                } else if (gameState.aiScore === 6) {
                    category = 'final_point';
                } else {
                    category = 'ai_scores';
                }
                break;
                
            case 'long_rally':
                category = 'rally_long';
                break;
                
            case 'zone_activated':
                category = 'zone_activated';
                break;
                
            case 'achievement':
                category = 'achievement_unlocked';
                break;
                
            case 'practice_mode':
                category = 'practice_mode';
                break;
                
            case 'close_game':
                if (Math.abs(gameState.aiScore - gameState.playerScore) <= 2) {
                    category = 'close_score';
                }
                break;
                
            case 'comeback_possible':
                if (gameState.aiScore >= 4 && gameState.playerScore <= 1) {
                    category = 'player_losing_badly';
                } else if (gameState.playerScore >= 4 && gameState.aiScore <= 2) {
                    category = 'comeback';
                }
                break;
        }
        
        if (customTaunt) {
            this.showTaunt(customTaunt);
        } else if (category) {
            const taunt = this.selectTaunt(category, gameState);
            if (taunt) {
                this.showTaunt(taunt);
            }
        }
    }

    updateAdaptiveDifficulty(gameState) {
        // Track consecutive losses
        if (gameState.gameOver && !gameState.playerWon) {
            this.consecutiveLosses++;
            this.playerFrustrationLevel = Math.min(10, this.playerFrustrationLevel + 1);
        } else if (gameState.playerWon) {
            this.consecutiveLosses = 0;
            this.playerFrustrationLevel = Math.max(0, this.playerFrustrationLevel - 3);
        }
        
        // Hidden adaptive difficulty
        if (this.consecutiveLosses >= 5 && !gameState.practiceMode) {
            this.hiddenHandicap = 0.05; // 5% easier
            this.isBeingGenerous = true;
        } else if (this.consecutiveLosses >= 10 && !gameState.practiceMode) {
            this.hiddenHandicap = 0.10; // 10% easier
            this.isBeingGenerous = true;
        } else if (gameState.playerScore >= 3) {
            // Reset handicap if player is doing well
            this.hiddenHandicap = 0;
            this.isBeingGenerous = false;
        }
        
        // If player wins, make next game harder
        if (gameState.playerWon) {
            this.adaptiveDifficulty = Math.min(1.5, this.adaptiveDifficulty + 0.1);
        } else {
            // Slowly return to normal
            this.adaptiveDifficulty = Math.max(1.0, this.adaptiveDifficulty - 0.02);
        }
    }

    getEffectiveSpeed(baseSpeed) {
        // Apply hidden handicap (makes AI slightly slower)
        return baseSpeed * (1 - this.hiddenHandicap) * this.adaptiveDifficulty;
    }

    shouldMakeMistake() {
        // Occasionally make "mistakes" if being generous
        if (this.isBeingGenerous && Math.random() < 0.02) {
            return true;
        }
        
        // Very rare mistakes to give hope
        if (Math.random() < 0.001) {
            return true;
        }
        
        return false;
    }

    drawTaunt(ctx) {
        if (this.currentTaunt && this.tauntTimer > 0) {
            const canvas = document.getElementById('gameCanvas');
            if (!canvas) return;
            
            const alpha = Math.min(1, this.tauntTimer / 30);
            const aiPaddleX = canvas.width - 100;
            const aiPaddleY = 200;
            
            // Background bubble
            ctx.fillStyle = `rgba(0, 0, 0, ${alpha * 0.9})`;
            const textWidth = ctx.measureText(this.currentTaunt).width;
            const bubbleWidth = textWidth + 20;
            const bubbleHeight = 30;
            const bubbleX = aiPaddleX - bubbleWidth;
            const bubbleY = aiPaddleY - 40;
            
            // Draw speech bubble
            ctx.beginPath();
            ctx.roundRect(bubbleX, bubbleY, bubbleWidth, bubbleHeight, 5);
            ctx.fill();
            
            // Bubble tail
            ctx.beginPath();
            ctx.moveTo(aiPaddleX - 20, bubbleY + bubbleHeight);
            ctx.lineTo(aiPaddleX - 10, bubbleY + bubbleHeight + 10);
            ctx.lineTo(aiPaddleX - 30, bubbleY + bubbleHeight);
            ctx.closePath();
            ctx.fill();
            
            // Taunt text
            ctx.fillStyle = `rgba(255, 51, 51, ${alpha})`;
            ctx.font = '14px Courier New';
            ctx.textAlign = 'center';
            ctx.fillText(
                this.currentTaunt,
                bubbleX + bubbleWidth / 2,
                bubbleY + 20
            );
        }
    }

    drawConfidenceMeter(ctx, x, y) {
        const confidence = 100 - (this.hiddenHandicap * 100);
        
        ctx.fillStyle = 'rgba(255, 51, 51, 0.5)';
        ctx.font = '10px Courier New';
        ctx.textAlign = 'right';
        ctx.fillText(`AI Confidence: ${Math.round(confidence)}%`, x, y);
        
        // Confidence bar
        const barWidth = 100;
        const barHeight = 4;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.fillRect(x - barWidth, y + 2, barWidth, barHeight);
        
        const fillWidth = (confidence / 100) * barWidth;
        const gradient = ctx.createLinearGradient(x - barWidth, 0, x, 0);
        gradient.addColorStop(0, '#ff0000');
        gradient.addColorStop(1, '#ff6666');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(x - barWidth, y + 2, fillWidth, barHeight);
    }

    reset() {
        this.currentTaunt = null;
        this.tauntTimer = 0;
        this.tauntCooldown = 0;
        this.lastTauntCategory = null;
        this.consecutiveLosses = 0;
        this.isBeingGenerous = false;
    }
}

const aiPersonality = new AIPersonality();
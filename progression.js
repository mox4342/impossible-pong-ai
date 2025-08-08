// PROGRESSION SYSTEM - XP, Levels, Achievements, Stats

class ProgressionSystem {
    constructor() {
        // XP system removed - pure skill-based now
        // this.xp = 0;
        // this.level = 1;
        // this.xpToNext = 100;
        // this.totalXP = 0;
        this.floatingTexts = [];
        this.achievements = {};
        this.unlockedAchievements = [];
        this.achievementQueue = [];
        this.stats = this.initStats();
        this.lastGameStats = null;
        this.sessionStartTime = Date.now();
        this.loadProgress();
    }

    initStats() {
        return {
            // Lifetime
            totalGames: 0,
            totalWins: 0,
            totalPoints: 0,
            totalSurvivalTime: 0,
            bestScore: 0,
            longestRally: 0,
            longestSurvival: 0,
            totalRallies: 0,
            closeGames: 0,
            
            // Session
            sessionGames: 0,
            sessionStreak: 0,
            sessionBest: 0,
            sessionStarted: Date.now(),
            
            // Daily
            dailyGames: 0,
            dailyPoints: 0,
            dailyBest: 0,
            dailyDate: new Date().toDateString(),
            
            // Tracking
            currentStreak: 0,
            maxStreak: 0,
            averageSurvival: 0,
            attempts: 0
        };
    }

    defineAchievements() {
        return {
            first_blood: { 
                name: "First Blood!", 
                desc: "Score your first point", 
                // xp: 100,
                condition: () => this.stats.totalPoints >= 1
            },
            survivor_30: { 
                name: "Survivor", 
                desc: "Last 30 seconds", 
                // xp: 150,
                condition: (survivalTime) => survivalTime >= 30
            },
            survivor_60: { 
                name: "Iron Will", 
                desc: "Last 60 seconds", 
                // xp: 300,
                condition: (survivalTime) => survivalTime >= 60
            },
            survivor_120: { 
                name: "Unbreakable", 
                desc: "Last 2 minutes", 
                // xp: 500,
                condition: (survivalTime) => survivalTime >= 120
            },
            rally_5: { 
                name: "Rally Rookie", 
                desc: "5 hit rally", 
                // xp: 50,
                condition: (rally) => rally >= 5
            },
            rally_10: { 
                name: "Rally Master", 
                desc: "10 hit rally", 
                // xp: 200,
                condition: (rally) => rally >= 10
            },
            rally_15: { 
                name: "Rally Legend", 
                desc: "15 hit rally", 
                // xp: 500,
                condition: (rally) => rally >= 15
            },
            so_close: { 
                name: "So Close!", 
                desc: "Lose 5-7 or 6-7", 
                // xp: 150,
                condition: (playerScore, aiScore) => 
                    (playerScore === 5 && aiScore === 7) || 
                    (playerScore === 6 && aiScore === 7)
            },
            persistence_10: { 
                name: "Persistent", 
                desc: "Play 10 games", 
                xp: 200,
                condition: () => this.stats.totalGames >= 10
            },
            persistence_25: { 
                name: "Determined", 
                desc: "Play 25 games", 
                xp: 500,
                condition: () => this.stats.totalGames >= 25
            },
            persistence_50: { 
                name: "Dedicated", 
                desc: "Play 50 games", 
                xp: 1000,
                condition: () => this.stats.totalGames >= 50
            },
            persistence_100: { 
                name: "Obsessed", 
                desc: "Play 100 games", 
                xp: 2000,
                condition: () => this.stats.totalGames >= 100
            },
            score_3: { 
                name: "Getting There", 
                desc: "Score 3 points in a game", 
                xp: 100,
                condition: (score) => score >= 3
            },
            score_5: { 
                name: "Halfway!", 
                desc: "Score 5 points in a game", 
                xp: 300,
                condition: (score) => score >= 5
            },
            score_6: { 
                name: "Almost!", 
                desc: "Score 6 points in a game", 
                xp: 500,
                condition: (score) => score >= 6
            },
            win: { 
                name: "IMPOSSIBLE!", 
                desc: "Beat the AI", 
                xp: 10000,
                condition: (playerScore, aiScore) => playerScore === 7 && aiScore < 7
            },
            streak_3: {
                name: "On Fire",
                desc: "Score 3 points in a row",
                xp: 150,
                condition: (streak) => streak >= 3
            },
            streak_5: {
                name: "Unstoppable",
                desc: "Score 5 points in a row",
                xp: 300,
                condition: (streak) => streak >= 5
            },
            zone_master: {
                name: "In The Zone",
                desc: "Stay in the zone for 30 seconds",
                xp: 200,
                condition: (zoneTime) => zoneTime >= 30
            },
            speed_demon: {
                name: "Speed Demon",
                desc: "Return a ball at max speed",
                xp: 100,
                condition: (ballSpeed) => ballSpeed >= 15
            }
        };
    }

    getXPRewards() {
        return {
            perRally: 10,
            perPoint: 50,
            survival30s: 100,
            survival60s: 200,
            survival120s: 500,
            closeGame: 150,
            winGame: 1000,
            perfectPoint: 25, // No rally before scoring
            longRally: 75, // 10+ rally
            epicRally: 150, // 15+ rally
            comeback: 200, // Score when down by 4+
            zoneBonus: 5 // Per second in the zone
        };
    }

    calculateLevelXP(level) {
        // Progressive XP requirements: 100, 250, 500, 1000, 1500, 2500...
        if (level === 1) return 100;
        if (level === 2) return 250;
        if (level === 3) return 500;
        return Math.floor(500 * Math.pow(1.5, level - 3));
    }

    // XP system removed - pure skill-based now
    addXP(amount, reason = "") {
        return; // Disabled XP system
    }

    // Level up disabled
    onLevelUp() {
        return; // Disabled level system
    }

    checkAchievements(gameData) {
        this.achievements = this.defineAchievements();
        
        for (const [key, achievement] of Object.entries(this.achievements)) {
            if (!this.unlockedAchievements.includes(key)) {
                let unlocked = false;
                
                // Check various conditions based on achievement type
                if (key.includes('rally')) {
                    unlocked = achievement.condition(gameData.longestRally || 0);
                } else if (key.includes('survivor')) {
                    unlocked = achievement.condition(gameData.survivalTime || 0);
                } else if (key.includes('score') && !key.includes('close')) {
                    unlocked = achievement.condition(gameData.playerScore || 0);
                } else if (key === 'so_close') {
                    unlocked = achievement.condition(gameData.playerScore, gameData.aiScore);
                } else if (key === 'win') {
                    unlocked = achievement.condition(gameData.playerScore, gameData.aiScore);
                } else if (key.includes('streak')) {
                    unlocked = achievement.condition(gameData.maxStreak || 0);
                } else if (key.includes('zone')) {
                    unlocked = achievement.condition(gameData.zoneTime || 0);
                } else if (key === 'speed_demon') {
                    unlocked = achievement.condition(gameData.maxBallSpeed || 0);
                } else {
                    unlocked = achievement.condition();
                }
                
                if (unlocked) {
                    this.unlockAchievement(key, achievement);
                }
            }
        }
    }

    unlockAchievement(key, achievement) {
        this.unlockedAchievements.push(key);
        this.achievementQueue.push({
            ...achievement,
            key: key,
            displayTime: 180,
            slideIn: 30
        });
        
        // XP system removed - achievements are their own reward
        // this.addXP(achievement.xp, achievement.name);
        audioManager.play('achievement');
        this.saveProgress();
    }

    updateStats(gameData) {
        const today = new Date().toDateString();
        
        // Reset daily stats if new day
        if (this.stats.dailyDate !== today) {
            this.stats.dailyGames = 0;
            this.stats.dailyPoints = 0;
            this.stats.dailyBest = 0;
            this.stats.dailyDate = today;
        }
        
        // Update lifetime stats
        this.stats.totalGames++;
        this.stats.totalPoints += gameData.playerScore;
        this.stats.totalSurvivalTime += gameData.survivalTime;
        this.stats.totalRallies += gameData.rallies || 0;
        
        if (gameData.playerScore > this.stats.bestScore) {
            this.stats.bestScore = gameData.playerScore;
        }
        
        if (gameData.longestRally > this.stats.longestRally) {
            this.stats.longestRally = gameData.longestRally;
        }
        
        if (gameData.survivalTime > this.stats.longestSurvival) {
            this.stats.longestSurvival = gameData.survivalTime;
        }
        
        // Update session stats
        this.stats.sessionGames++;
        if (gameData.playerScore > this.stats.sessionBest) {
            this.stats.sessionBest = gameData.playerScore;
        }
        
        // Update daily stats
        this.stats.dailyGames++;
        this.stats.dailyPoints += gameData.playerScore;
        if (gameData.playerScore > this.stats.dailyBest) {
            this.stats.dailyBest = gameData.playerScore;
        }
        
        // Track close games
        if ((gameData.playerScore === 5 && gameData.aiScore === 7) || 
            (gameData.playerScore === 6 && gameData.aiScore === 7)) {
            this.stats.closeGames++;
        }
        
        // Update average survival
        this.stats.averageSurvival = Math.round(
            this.stats.totalSurvivalTime / this.stats.totalGames
        );
        
        // Track win
        if (gameData.playerWon) {
            this.stats.totalWins++;
        }
        
        // Store last game for comparison
        this.lastGameStats = gameData;
        
        this.saveProgress();
    }

    getImprovementIndicators(currentGame) {
        const indicators = [];
        
        if (!this.lastGameStats) return indicators;
        
        if (currentGame.survivalTime > this.lastGameStats.survivalTime) {
            const diff = currentGame.survivalTime - this.lastGameStats.survivalTime;
            indicators.push(`↑ Lasted ${diff} seconds longer!`);
        }
        
        if (currentGame.longestRally > this.lastGameStats.longestRally) {
            indicators.push(`↑ New best rally: ${currentGame.longestRally} hits!`);
        }
        
        if (currentGame.playerScore > this.lastGameStats.playerScore) {
            indicators.push(`↑ Scored ${currentGame.playerScore - this.lastGameStats.playerScore} more points!`);
        }
        
        if (currentGame.accuracy > this.lastGameStats.accuracy) {
            indicators.push(`↑ Better accuracy: ${currentGame.accuracy}%!`);
        }
        
        return indicators;
    }

    // Floating texts disabled
    updateFloatingTexts() {
        return; // Disabled floating texts
    }

    // XP bar removed for cleaner UI
    drawProgressBar(ctx) {
        return; // Disabled XP bar
    }

    // Floating XP texts removed  
    drawFloatingTexts(ctx) {
        return; // Disabled floating XP texts
    }

    drawAchievementPopups(ctx) {
        const canvas = document.getElementById('gameCanvas');
        if (!canvas) return;
        
        let yOffset = 100;
        
        this.achievementQueue = this.achievementQueue.filter(achievement => {
            achievement.displayTime--;
            
            if (achievement.displayTime > 0) {
                const slideProgress = Math.min(1, (180 - achievement.displayTime) / 30);
                const x = canvas.width - 200 * slideProgress;
                
                // Draw achievement card
                ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
                ctx.fillRect(x, yOffset, 190, 60);
                
                // Gold border
                ctx.strokeStyle = '#FFD700';
                ctx.lineWidth = 2;
                ctx.strokeRect(x, yOffset, 190, 60);
                
                // Achievement text
                ctx.fillStyle = '#FFD700';
                ctx.font = 'bold 14px Courier New';
                ctx.textAlign = 'left';
                ctx.fillText(achievement.name, x + 10, yOffset + 20);
                
                ctx.fillStyle = 'white';
                ctx.font = '11px Courier New';
                ctx.fillText(achievement.desc, x + 10, yOffset + 35);
                
                ctx.fillStyle = '#00ff00';
                ctx.fillText(`+${achievement.xp} XP`, x + 10, yOffset + 50);
                
                yOffset += 70;
                return true;
            }
            return false;
        });
    }

    drawSessionStats(ctx) {
        const sessionTime = Math.floor((Date.now() - this.sessionStartTime) / 1000 / 60);
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.font = '10px Courier New';
        ctx.textAlign = 'left';
        
        const stats = [
            `Session: ${sessionTime}min`,
            `Games: ${this.stats.sessionGames}`,
            `Best: ${this.stats.sessionBest} pts`,
            `Avg Survival: ${this.stats.averageSurvival}s`
        ];
        
        stats.forEach((stat, i) => {
            ctx.fillText(stat, 10, 70 + i * 12);
        });
    }

    saveProgress() {
        const saveData = {
            xp: this.xp,
            level: this.level,
            totalXP: this.totalXP,
            xpToNext: this.xpToNext,
            unlockedAchievements: this.unlockedAchievements,
            stats: this.stats
        };
        
        localStorage.setItem('impossiblePongProgression', JSON.stringify(saveData));
    }

    loadProgress() {
        const saved = localStorage.getItem('impossiblePongProgression');
        if (saved) {
            const data = JSON.parse(saved);
            this.xp = data.xp || 0;
            this.level = data.level || 1;
            this.totalXP = data.totalXP || 0;
            this.xpToNext = data.xpToNext || 100;
            this.unlockedAchievements = data.unlockedAchievements || [];
            this.stats = { ...this.stats, ...data.stats };
        }
        
        this.achievements = this.defineAchievements();
    }

    reset() {
        if (confirm('Reset all progress? This cannot be undone!')) {
            localStorage.removeItem('impossiblePongProgression');
            this.xp = 0;
            this.level = 1;
            this.totalXP = 0;
            this.xpToNext = 100;
            this.unlockedAchievements = [];
            this.stats = this.initStats();
            this.lastGameStats = null;
        }
    }
}

const progression = new ProgressionSystem();
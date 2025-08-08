// DEVELOPMENT BRANCH - ENHANCED WITH ADDICTIVE FEATURES

// Global game configuration - accessible to all modules
window.GAME_CONFIG = {
    PADDLE_WIDTH: 10,
    PADDLE_HEIGHT: 80,
    BALL_SIZE: 10,
    PADDLE_SPEED: 5,
    INITIAL_BALL_SPEED: 5,
    BALL_SPEED_INCREMENT: 0.5,
    WINNING_SCORE: 7
};

// Local references for easier access
const PADDLE_WIDTH = window.GAME_CONFIG.PADDLE_WIDTH;
const PADDLE_HEIGHT = window.GAME_CONFIG.PADDLE_HEIGHT;
const BALL_SIZE = window.GAME_CONFIG.BALL_SIZE;
const PADDLE_SPEED = window.GAME_CONFIG.PADDLE_SPEED;
const INITIAL_BALL_SPEED = window.GAME_CONFIG.INITIAL_BALL_SPEED;
const BALL_SPEED_INCREMENT = window.GAME_CONFIG.BALL_SPEED_INCREMENT;
let WINNING_SCORE = window.GAME_CONFIG.WINNING_SCORE;

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const game = {
    state: 'ready',
    isPlaying: false,
    isGameOver: false,
    showSettings: false,
    showStats: false,
    winner: null,
    practiceMode: false,
    attempts: 0,
    
    player: {
        y: canvas.height / 2 - PADDLE_HEIGHT / 2,
        score: 0,
        up: false,
        down: false,
        paddleHeight: PADDLE_HEIGHT,
        accuracy: 100,
        hits: 0,
        misses: 0,
        scoreStreak: 0,
        maxStreak: 0
    },
    
    ai: {
        y: canvas.height / 2 - PADDLE_HEIGHT / 2,
        score: 0,
        paddleHeight: PADDLE_HEIGHT,
        name: "IMPOSSIBLE AI"
    },
    
    ball: {
        x: canvas.width / 2,
        y: canvas.height / 2,
        speedX: -INITIAL_BALL_SPEED,
        speedY: INITIAL_BALL_SPEED,
        baseSpeed: INITIAL_BALL_SPEED,
        maxSpeedReached: INITIAL_BALL_SPEED
    },
    
    stats: {
        rallyLength: 0,
        longestRally: 0,
        survivalTime: 0,
        startTime: null,
        zoneTime: 0,
        inZone: false,
        zoneStartTime: null
    }
};

// Initialize all systems
function initGame() {
    // Apply daily challenge if available
    challenges.loadChallenge();
    if (challenges.currentChallenge) {
        challenges.activateChallenge(game);
        if (challenges.currentChallenge.name === "Survival Saturday") {
            WINNING_SCORE = 10;
        }
    }
    
    // Reset effects
    effects.reset();
    aiPersonality.reset();
    
    game.attempts++;
}

function resetBall(towardPlayer = false) {
    game.ball.x = canvas.width / 2;
    game.ball.y = canvas.height / 2;
    
    const speedMultiplier = 1 + (game.ai.score + game.player.score) * 0.1;
    game.ball.baseSpeed = INITIAL_BALL_SPEED * speedMultiplier;
    
    const direction = towardPlayer ? -1 : 1;
    game.ball.speedX = game.ball.baseSpeed * direction;
    game.ball.speedY = (Math.random() - 0.5) * game.ball.baseSpeed * 2;
    
    game.stats.rallyLength = 0;
    
    if (game.ball.baseSpeed > game.ball.maxSpeedReached) {
        game.ball.maxSpeedReached = game.ball.baseSpeed;
        if (game.ball.baseSpeed > INITIAL_BALL_SPEED * 2) {
            effects.dangerZone = true;
        }
    }
}

function updatePlayer() {
    const speed = PADDLE_SPEED;
    
    // Check for reversed controls (April Fools challenge)
    let upKey = game.player.up;
    let downKey = game.player.down;
    if (game.reverseControls) {
        [upKey, downKey] = [downKey, upKey];
    }
    
    if (upKey && game.player.y > 0) {
        game.player.y -= speed;
    }
    if (downKey && game.player.y < canvas.height - game.player.paddleHeight) {
        game.player.y += speed;
    }
    
    // Check if player is in position for incoming ball
    const ballApproaching = game.ball.speedX < 0 && game.ball.x < canvas.width / 2;
    if (ballApproaching) {
        const paddleCenter = game.player.y + game.player.paddleHeight / 2;
        const ballCenter = game.ball.y + BALL_SIZE / 2;
        const inRange = Math.abs(paddleCenter - ballCenter) < game.player.paddleHeight / 2 + 10;
        
        if (inRange) {
            effects.playerFlash = 10;
        }
    }
}

function updateAI() {
    // Apply AI personality adjustments
    const effectiveSpeed = aiPersonality.getEffectiveSpeed(10);
    
    impossibleAI.update(
        game.ai,
        game.ball,
        canvas,
        game.ai.paddleHeight,
        game.player.score,
        game.ai.score,
        game.stats.rallyLength
    );
    
    // Check if AI should make a mistake
    if (aiPersonality.shouldMakeMistake()) {
        game.ai.y += (Math.random() - 0.5) * 20;
    }
}

function checkBallCollision() {
    // Wall collision
    if (game.ball.y <= 0 || game.ball.y >= canvas.height - BALL_SIZE) {
        game.ball.speedY = -game.ball.speedY;
        enhancedAudio.play('wall');
    }
    
    const ballLeft = game.ball.x;
    const ballRight = game.ball.x + BALL_SIZE;
    const ballTop = game.ball.y;
    const ballBottom = game.ball.y + BALL_SIZE;
    
    // Player paddle collision
    const playerRight = 20 + PADDLE_WIDTH;
    const playerTop = game.player.y;
    const playerBottom = game.player.y + game.player.paddleHeight;
    
    if (ballLeft <= playerRight && ballLeft >= 20 &&
        ballBottom >= playerTop && ballTop <= playerBottom &&
        game.ball.speedX < 0) {
        
        const hitPos = (game.ball.y + BALL_SIZE/2 - game.player.y - game.player.paddleHeight/2) / (game.player.paddleHeight/2);
        game.ball.speedY = hitPos * 6;
        
        game.ball.baseSpeed += BALL_SPEED_INCREMENT;
        game.ball.speedX = Math.abs(game.ball.speedX) + BALL_SPEED_INCREMENT;
        
        // Update stats
        game.player.hits++;
        game.stats.rallyLength++;
        if (game.stats.rallyLength > game.stats.longestRally) {
            game.stats.longestRally = game.stats.rallyLength;
        }
        
        // Play dynamic paddle hit sound
        enhancedAudio.playDynamicPaddleHit(game.stats.rallyLength);
        
        // Visual effects
        effects.paddleHitEffect(ballLeft, game.ball.y + BALL_SIZE/2, game.stats.rallyLength / 10);
        
        // Check for zone activation
        if (game.stats.rallyLength >= 3 || game.stats.survivalTime >= 20) {
            if (!game.stats.inZone) {
                game.stats.inZone = true;
                game.stats.zoneStartTime = Date.now();
                effects.zoneActivateEffect();
                enhancedAudio.play('zoneActivate');
                aiPersonality.triggerTaunt('zone_activated', game);
            }
        }
        
        // Award XP for rally
        const xpMultiplier = challenges.getXPMultiplier();
        progression.addXP(Math.floor(10 * xpMultiplier), "Rally!");
        
        updateAccuracy();
    }
    
    // AI paddle collision
    const aiLeft = canvas.width - 20 - PADDLE_WIDTH;
    const aiTop = game.ai.y;
    const aiBottom = game.ai.y + game.ai.paddleHeight;
    
    if (ballRight >= aiLeft && ballRight <= aiLeft + PADDLE_WIDTH &&
        ballBottom >= aiTop && ballTop <= aiBottom &&
        game.ball.speedX > 0) {
        
        const returnAngle = impossibleAI.getReturnAngle(game.ai.y, game.ball.y, game.ai.paddleHeight);
        game.ball.speedY = returnAngle * game.ball.baseSpeed;
        
        game.ball.baseSpeed += BALL_SPEED_INCREMENT * 0.5;
        game.ball.speedX = -(Math.abs(game.ball.speedX) + BALL_SPEED_INCREMENT * 0.5);
        
        game.stats.rallyLength++;
        enhancedAudio.playDynamicPaddleHit(game.stats.rallyLength);
        effects.paddleHitEffect(ballRight, game.ball.y + BALL_SIZE/2, 0.5);
        
        // Long rally taunt
        if (game.stats.rallyLength >= 10) {
            aiPersonality.triggerTaunt('long_rally', game);
        }
    }
    
    // Score detection
    if (game.ball.x < 0) {
        // AI scores
        game.ai.score++;
        game.player.misses++;
        game.player.scoreStreak = 0;
        updateAccuracy();
        
        // Effects
        effects.scoreEffect(50, game.ball.y, false);
        enhancedAudio.play('lose');
        
        // AI taunt
        aiPersonality.triggerTaunt('ai_score', game);
        
        if (game.ai.score >= WINNING_SCORE) {
            gameOver(false);
        } else {
            resetBall(true);
        }
        
        // Update zone
        if (game.stats.inZone) {
            game.stats.inZone = false;
            const zoneTime = (Date.now() - game.stats.zoneStartTime) / 1000;
            game.stats.zoneTime += zoneTime;
        }
    }
    
    if (game.ball.x > canvas.width) {
        // Player scores
        game.player.score++;
        game.player.scoreStreak++;
        if (game.player.scoreStreak > game.player.maxStreak) {
            game.player.maxStreak = game.player.scoreStreak;
        }
        
        // Effects
        effects.scoreEffect(canvas.width - 50, game.ball.y, true);
        enhancedAudio.play('score');
        
        // XP rewards
        const xpMultiplier = challenges.getXPMultiplier();
        progression.addXP(Math.floor(50 * xpMultiplier), "Point scored!");
        
        // AI adjustments
        impossibleAI.increaseDifficulty();
        aiPersonality.triggerTaunt('player_score', game);
        
        // Check for close to winning
        if (game.player.score >= WINNING_SCORE - 2) {
            enhancedAudio.startHeartbeat();
        }
        
        if (game.player.score >= WINNING_SCORE) {
            gameOver(true);
        } else {
            resetBall(false);
        }
    }
}

function updateAccuracy() {
    if (game.player.hits + game.player.misses > 0) {
        game.player.accuracy = Math.round((game.player.hits / (game.player.hits + game.player.misses)) * 100);
    }
}

function updateBall() {
    if (!game.isPlaying || game.isGameOver) return;
    
    game.ball.x += game.ball.speedX;
    game.ball.y += game.ball.speedY;
    
    // Update ball trail effect
    effects.updateBallTrail(game.ball.x, game.ball.y, Math.abs(game.ball.speedX));
    
    // Apply daily challenge modifications
    if (challenges.currentChallenge && challenges.currentChallenge.apply) {
        challenges.currentChallenge.apply(game);
    }
    
    checkBallCollision();
}

function updateStats() {
    if (game.isPlaying && !game.isGameOver) {
        const currentTime = Date.now();
        if (game.stats.startTime) {
            game.stats.survivalTime = Math.floor((currentTime - game.stats.startTime) / 1000);
            
            // Check survival achievements
            if (game.stats.survivalTime === 30) {
                enhancedAudio.play('achievement');
            }
        }
        
        // Update zone time
        if (game.stats.inZone) {
            const zoneTime = (currentTime - game.stats.zoneStartTime) / 1000;
            if (zoneTime > 0) {
                const xpMultiplier = challenges.getXPMultiplier();
                progression.addXP(Math.floor(5 * xpMultiplier), "Zone bonus");
            }
        }
    }
}

function gameOver(playerWon) {
    game.isGameOver = true;
    game.isPlaying = false;
    game.winner = playerWon ? 'PLAYER' : 'AI';
    
    enhancedAudio.stopHeartbeat();
    
    // Calculate final stats
    const gameData = {
        playerScore: game.player.score,
        aiScore: game.ai.score,
        survivalTime: game.stats.survivalTime,
        longestRally: game.stats.longestRally,
        accuracy: game.player.accuracy,
        maxStreak: game.player.maxStreak,
        zoneTime: game.stats.zoneTime,
        maxBallSpeed: game.ball.maxSpeedReached,
        playerWon: playerWon,
        rallies: game.player.hits
    };
    
    // Update progression
    progression.updateStats(gameData);
    progression.checkAchievements(gameData);
    
    // Award XP based on performance
    const xpMultiplier = challenges.getXPMultiplier();
    if (game.stats.survivalTime >= 30) {
        progression.addXP(Math.floor(100 * xpMultiplier), "Survived 30s!");
    }
    if (game.stats.survivalTime >= 60) {
        progression.addXP(Math.floor(200 * xpMultiplier), "Survived 60s!");
    }
    if ((game.player.score === 5 || game.player.score === 6) && !playerWon) {
        progression.addXP(Math.floor(150 * xpMultiplier), "So close!");
    }
    if (playerWon) {
        progression.addXP(Math.floor(1000 * xpMultiplier), "VICTORY!");
        if (challenges.challengeActive) {
            challenges.completeChallenge();
        }
    }
    
    // Update AI personality
    aiPersonality.updateAdaptiveDifficulty({
        gameOver: true,
        playerWon: playerWon,
        playerScore: game.player.score,
        practiceMode: game.practiceMode
    });
    
    // Visual effects
    effects.gameOverEffect(playerWon);
    
    if (playerWon) {
        enhancedAudio.play('gameOver', true);
    } else {
        enhancedAudio.play('gameOver', false);
        
        // Check for mercy mode
        if (progression.stats.sessionGames >= 5 && !playerWon && !game.practiceMode) {
            const losses = progression.stats.sessionGames - (progression.stats.totalWins || 0);
            if (losses >= 5 && losses % 5 === 0) {
                setTimeout(() => {
                    aiPersonality.showTaunt("Need a break? Press P for practice mode.");
                }, 2000);
            }
        }
    }
}

function draw() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Apply screen shake if active
    effects.applyScreenShake(ctx);
    
    // Draw background with effects
    drawBackground();
    
    // Draw game elements
    drawCenterLine();
    effects.drawBallTrail(ctx);
    drawPaddles();
    drawBall();
    drawScore();
    
    // Draw UI elements
    if (game.state === 'ready' && !game.isPlaying && !game.isGameOver) {
        drawTitleScreen();
    }
    
    if (game.isGameOver) {
        drawGameOver();
    }
    
    // Draw progression elements
    progression.drawProgressBar(ctx);
    progression.drawFloatingTexts(ctx);
    progression.drawAchievementPopups(ctx);
    progression.drawSessionStats(ctx);
    
    // Draw AI personality elements
    aiPersonality.drawTaunt(ctx);
    aiPersonality.drawConfidenceMeter(ctx, canvas.width - 10, 65);
    
    // Draw challenge info
    challenges.drawChallengeInfo(ctx);
    
    // Draw effects
    effects.drawParticles(ctx);
    effects.drawZoneEffect(ctx);
    effects.drawDangerZone(ctx, effects.dangerZone);
    
    // Apply special challenge effects
    challenges.applySpecialEffects(ctx, game);
    
    // Reset screen shake
    effects.resetScreenShake(ctx);
    
    // Draw stats dashboard if active
    if (game.showStats) {
        drawStatsDashboard();
    }
    
    // Update floating texts
    progression.updateFloatingTexts();
}

function drawBackground() {
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    if (effects.dangerZone) {
        ctx.fillStyle = 'rgba(255, 0, 0, 0.05)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
}

function drawPaddles() {
    // Player paddle with effects
    const playerGlow = effects.playerFlash > 0 || game.stats.inZone;
    effects.drawPaddleGlow(ctx, 20, game.player.y, PADDLE_WIDTH, game.player.paddleHeight, playerGlow, true);
    
    ctx.fillStyle = 'white';
    ctx.fillRect(20, game.player.y, PADDLE_WIDTH, game.player.paddleHeight);
    
    // AI paddle with red glow
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#ff0000';
    ctx.fillStyle = '#ff3333';
    ctx.fillRect(canvas.width - 30, game.ai.y, PADDLE_WIDTH, game.ai.paddleHeight);
    ctx.shadowBlur = 0;
    
    // AI boost indicator
    if (impossibleAI.boostActive) {
        ctx.fillStyle = 'rgba(255, 255, 0, 0.5)';
        ctx.fillRect(canvas.width - 35, game.ai.y - 5, PADDLE_WIDTH + 10, game.ai.paddleHeight + 10);
    }
}

function drawBall() {
    if (effects.dangerZone) {
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#ffff00';
    }
    ctx.fillStyle = 'white';
    ctx.fillRect(game.ball.x, game.ball.y, BALL_SIZE, BALL_SIZE);
    ctx.shadowBlur = 0;
}

function drawCenterLine() {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.setLineDash([5, 15]);
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke();
    ctx.setLineDash([]);
}

function drawScore() {
    // Player score
    ctx.fillStyle = 'white';
    ctx.font = '48px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText(game.player.score, canvas.width / 2 - 100, 60);
    
    // AI score
    ctx.fillStyle = '#ff3333';
    ctx.fillText(game.ai.score, canvas.width / 2 + 100, 60);
    
    // Labels
    ctx.fillStyle = 'white';
    ctx.font = '12px Courier New';
    ctx.fillText('PLAYER', canvas.width / 2 - 100, 80);
    ctx.fillStyle = '#ff3333';
    ctx.fillText('AI', canvas.width / 2 + 100, 80);
    
    // Game info
    ctx.fillStyle = '#666';
    ctx.font = '10px Courier New';
    ctx.textAlign = 'left';
    ctx.fillText(`Rally: ${game.stats.rallyLength}`, 10, 110);
    ctx.fillText(`Survival: ${game.stats.survivalTime}s`, 10, 125);
    
    ctx.textAlign = 'right';
    ctx.fillText(`Accuracy: ${game.player.accuracy}%`, canvas.width - 10, 110);
    
    // Practice mode indicator
    if (game.practiceMode) {
        ctx.fillStyle = '#ffff00';
        ctx.font = '16px Courier New';
        ctx.textAlign = 'center';
        ctx.fillText("PRACTICE MODE - Doesn't Count!", canvas.width / 2, canvas.height - 20);
    }
}

function drawTitleScreen() {
    ctx.fillStyle = '#ff3333';
    ctx.font = '48px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText('IMPOSSIBLE PONG AI', canvas.width / 2, 150);
    
    ctx.fillStyle = '#888';
    ctx.font = '20px Courier New';
    ctx.fillText('Can you beat the machine?', canvas.width / 2, 190);
    
    ctx.fillStyle = 'white';
    ctx.font = '24px Courier New';
    ctx.fillText('Press Space to Start', canvas.width / 2, 250);
    
    ctx.font = '14px Courier New';
    ctx.fillStyle = '#666';
    ctx.fillText(`Attempt #${game.attempts}`, canvas.width / 2, 290);
    ctx.fillText(`Career Best: ${progression.stats.bestScore} points`, canvas.width / 2, 310);
    ctx.fillText(`Level ${progression.level} | ${progression.totalXP} Total XP`, canvas.width / 2, 330);
    
    // Show achievements unlocked
    ctx.fillStyle = '#FFD700';
    ctx.font = '12px Courier New';
    ctx.fillText(`${progression.unlockedAchievements.length} Achievements Unlocked`, canvas.width / 2, 350);
}

function drawGameOver() {
    const improvements = progression.getImprovementIndicators({
        survivalTime: game.stats.survivalTime,
        longestRally: game.stats.longestRally,
        playerScore: game.player.score,
        accuracy: game.player.accuracy
    });
    
    if (game.winner === 'PLAYER') {
        ctx.fillStyle = '#00ff00';
        ctx.font = '48px Courier New';
        ctx.textAlign = 'center';
        ctx.fillText('IMPOSSIBLE!', canvas.width / 2, canvas.height / 2 - 50);
        ctx.fillText('You beat the AI!', canvas.width / 2, canvas.height / 2);
    } else {
        ctx.fillStyle = '#ff3333';
        ctx.font = '48px Courier New';
        ctx.textAlign = 'center';
        
        if (game.player.score >= 5) {
            ctx.fillText('SO CLOSE!', canvas.width / 2, canvas.height / 2 - 50);
            effects.addScreenShake(3, 10);
        } else {
            ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 50);
        }
        
        ctx.font = '32px Courier New';
        ctx.fillText('The AI Wins', canvas.width / 2, canvas.height / 2);
    }
    
    // Show improvements
    ctx.fillStyle = '#00ff00';
    ctx.font = '14px Courier New';
    improvements.forEach((improvement, i) => {
        ctx.fillText(improvement, canvas.width / 2, canvas.height / 2 + 40 + i * 20);
    });
    
    // Quick retry prompt
    ctx.fillStyle = 'white';
    ctx.font = 'bold 24px Courier New';
    ctx.fillText('SPACE TO TRY AGAIN', canvas.width / 2, canvas.height / 2 + 100);
    
    // Session stats
    ctx.fillStyle = '#888';
    ctx.font = '12px Courier New';
    ctx.fillText(`Attempt #${game.attempts} | Best: ${progression.stats.sessionBest} points | Survived: ${game.stats.survivalTime}s`, 
        canvas.width / 2, canvas.height / 2 + 130);
}

function drawStatsDashboard() {
    // Overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.95)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 32px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText('STATISTICS', canvas.width / 2, 50);
    
    // Career stats
    const stats = progression.stats;
    const leftX = 150;
    const rightX = canvas.width - 150;
    let y = 100;
    
    ctx.fillStyle = 'white';
    ctx.font = '16px Courier New';
    ctx.textAlign = 'left';
    
    const statLines = [
        ['Total Games:', stats.totalGames],
        ['Total Wins:', stats.totalWins],
        ['Win Rate:', `${stats.totalWins > 0 ? (stats.totalWins / stats.totalGames * 100).toFixed(1) : 0}%`],
        ['Best Score:', stats.bestScore],
        ['Total Points:', stats.totalPoints],
        ['Longest Rally:', stats.longestRally],
        ['Longest Survival:', `${stats.longestSurvival}s`],
        ['Average Survival:', `${stats.averageSurvival}s`],
        ['Close Games:', stats.closeGames],
        ['Level:', progression.level],
        ['Total XP:', progression.totalXP],
        ['Achievements:', `${progression.unlockedAchievements.length}/${Object.keys(progression.defineAchievements()).length}`]
    ];
    
    statLines.forEach(([label, value], i) => {
        const x = i < 6 ? leftX : rightX;
        const adjustedY = y + (i % 6) * 30;
        
        ctx.fillStyle = '#888';
        ctx.fillText(label, x, adjustedY);
        ctx.fillStyle = '#00ff00';
        ctx.fillText(String(value), x + 150, adjustedY);
    });
    
    // Progress bars
    y = 320;
    drawProgressBarCustom(ctx, 'Points to 100', stats.totalPoints, 100, 200, y);
    drawProgressBarCustom(ctx, 'Games to 50', stats.totalGames, 50, 200, y + 40);
    
    ctx.fillStyle = '#666';
    ctx.font = '14px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText('[ESC] Close | [R] Reset Progress', canvas.width / 2, canvas.height - 20);
}

function drawProgressBarCustom(ctx, label, current, max, x, y) {
    const width = 200;
    const height = 20;
    const progress = Math.min(1, current / max);
    
    ctx.fillStyle = '#333';
    ctx.fillRect(x, y, width, height);
    
    ctx.fillStyle = '#00ff00';
    ctx.fillRect(x, y, width * progress, height);
    
    ctx.fillStyle = 'white';
    ctx.font = '12px Courier New';
    ctx.textAlign = 'left';
    ctx.fillText(`${label}: ${current}/${max}`, x, y - 5);
}

function gameLoop() {
    updatePlayer();
    updateAI();
    updateBall();
    updateStats();
    effects.updateEffects();
    aiPersonality.updateTaunt(game);
    draw();
    requestAnimationFrame(gameLoop);
}

function resetGame() {
    game.player.score = 0;
    game.ai.score = 0;
    game.player.y = canvas.height / 2 - PADDLE_HEIGHT / 2;
    game.ai.y = canvas.height / 2 - PADDLE_HEIGHT / 2;
    game.player.hits = 0;
    game.player.misses = 0;
    game.player.accuracy = 100;
    game.player.scoreStreak = 0;
    game.player.maxStreak = 0;
    game.isGameOver = false;
    game.winner = null;
    game.stats.rallyLength = 0;
    game.stats.longestRally = 0;
    game.stats.survivalTime = 0;
    game.stats.startTime = Date.now();
    game.stats.zoneTime = 0;
    game.stats.inZone = false;
    game.ball.maxSpeedReached = INITIAL_BALL_SPEED;
    
    effects.reset();
    impossibleAI.reset();
    aiPersonality.triggerTaunt('game_start', { attempts: game.attempts });
    
    resetBall(true);
}

// Input handling
document.addEventListener('keydown', (e) => {
    switch(e.key) {
        case 'w':
        case 'W':
            game.player.up = true;
            break;
        case 's':
        case 'S':
            game.player.down = true;
            break;
        case ' ':
            e.preventDefault();
            if (game.isGameOver || !game.isPlaying) {
                game.isPlaying = true;
                resetGame();
                initGame();
            } else {
                game.isPlaying = !game.isPlaying;
            }
            break;
        case 'p':
        case 'P':
            if (!game.isPlaying) {
                game.practiceMode = !game.practiceMode;
                impossibleAI.setPracticeMode(game.practiceMode);
                aiPersonality.triggerTaunt('practice_mode', game);
            }
            break;
        case 'm':
        case 'M':
            enhancedAudio.toggleMute();
            break;
        case 'Escape':
            if (game.showStats) {
                game.showStats = false;
            } else if (!game.isPlaying) {
                game.showStats = true;
            }
            break;
        case 'r':
        case 'R':
            if (game.showStats) {
                progression.reset();
            }
            break;
    }
});

document.addEventListener('keyup', (e) => {
    switch(e.key) {
        case 'w':
        case 'W':
            game.player.up = false;
            break;
        case 's':
        case 'S':
            game.player.down = false;
            break;
    }
});

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initGame();
        gameLoop();
    });
} else {
    initGame();
    gameLoop();
}
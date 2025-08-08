// DEVELOPMENT BRANCH - FIXED VERSION WITH PERFORMANCE OPTIMIZATIONS

// Global game configuration - accessible to all modules
window.GAME_CONFIG = {
    PADDLE_WIDTH: 10,
    PADDLE_HEIGHT: 80,
    BALL_SIZE: 10,
    PADDLE_SPEED: 5,  // Reduced from 8
    INITIAL_BALL_SPEED: 3,  // Reduced from 5
    BALL_SPEED_INCREMENT: 0.2,  // Reduced from 0.5
    WINNING_SCORE: 7,
    
    // Performance settings
    PERFORMANCE_MODE: {
        particles: true,
        screenShake: true,
        glowEffects: false,  // Disabled by default for performance
        trails: true,
        maxParticles: 30,  // Reduced from unlimited
        particlesPerHit: 3,  // Reduced from 10-20
        particlesPerScore: 10  // Reduced from 50+
    }
};

// Local references for easier access
const PADDLE_WIDTH = window.GAME_CONFIG.PADDLE_WIDTH;
const PADDLE_HEIGHT = window.GAME_CONFIG.PADDLE_HEIGHT;
const BALL_SIZE = window.GAME_CONFIG.BALL_SIZE;
const PADDLE_SPEED = window.GAME_CONFIG.PADDLE_SPEED;
const INITIAL_BALL_SPEED = window.GAME_CONFIG.INITIAL_BALL_SPEED;
const BALL_SPEED_INCREMENT = window.GAME_CONFIG.BALL_SPEED_INCREMENT;
let WINNING_SCORE = window.GAME_CONFIG.WINNING_SCORE;

// Frame rate limiting
const TARGET_FPS = 60;
const FRAME_DURATION = 1000 / TARGET_FPS;
let lastFrameTime = 0;

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
    if (typeof challenges !== 'undefined') {
        challenges.loadChallenge();
        if (challenges.currentChallenge) {
            // Apply challenge with reduced multipliers
            if (challenges.currentChallenge.name === "Survival Saturday") {
                WINNING_SCORE = 10;
            }
            if (challenges.currentChallenge.name === "Turbo Thursday") {
                // Apply only 20% speed increase instead of 50%
                game.ball.baseSpeed *= 1.2;
            }
        }
    }
    
    // Reset effects with performance limits
    if (typeof effects !== 'undefined') {
        effects.reset();
        effects.maxParticles = window.GAME_CONFIG.PERFORMANCE_MODE.maxParticles;
    }
    
    if (typeof aiPersonality !== 'undefined') {
        aiPersonality.reset();
    }
    
    game.attempts++;
}

function resetBall(towardPlayer = false) {
    game.ball.x = canvas.width / 2;
    game.ball.y = canvas.height / 2;
    
    // More conservative speed increase
    const speedMultiplier = 1 + (game.ai.score + game.player.score) * 0.05; // Reduced from 0.1
    game.ball.baseSpeed = INITIAL_BALL_SPEED * speedMultiplier;
    
    const direction = towardPlayer ? -1 : 1;
    game.ball.speedX = game.ball.baseSpeed * direction;
    game.ball.speedY = (Math.random() - 0.5) * game.ball.baseSpeed * 2;
    
    game.stats.rallyLength = 0;
    
    if (game.ball.baseSpeed > game.ball.maxSpeedReached) {
        game.ball.maxSpeedReached = game.ball.baseSpeed;
        if (game.ball.baseSpeed > INITIAL_BALL_SPEED * 2) {
            if (typeof effects !== 'undefined') {
                effects.dangerZone = true;
            }
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
    if (ballApproaching && typeof effects !== 'undefined') {
        const paddleCenter = game.player.y + game.player.paddleHeight / 2;
        const ballCenter = game.ball.y + BALL_SIZE / 2;
        const inRange = Math.abs(paddleCenter - ballCenter) < game.player.paddleHeight / 2 + 10;
        
        if (inRange) {
            effects.playerFlash = 10;
        }
    }
}

function updateAI() {
    if (typeof impossibleAI === 'undefined' || typeof aiPersonality === 'undefined') return;
    
    // Apply AI personality adjustments with reduced speed
    const effectiveSpeed = aiPersonality.getEffectiveSpeed(6); // Reduced from 10
    
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
        if (typeof enhancedAudio !== 'undefined') {
            enhancedAudio.play('wall');
        }
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
        game.ball.speedY = hitPos * 4; // Reduced from 6
        
        game.ball.baseSpeed += BALL_SPEED_INCREMENT;
        game.ball.speedX = Math.abs(game.ball.speedX) + BALL_SPEED_INCREMENT;
        
        // Update stats
        game.player.hits++;
        game.stats.rallyLength++;
        if (game.stats.rallyLength > game.stats.longestRally) {
            game.stats.longestRally = game.stats.rallyLength;
        }
        
        // Play sound
        if (typeof enhancedAudio !== 'undefined') {
            enhancedAudio.playDynamicPaddleHit(game.stats.rallyLength);
        }
        
        // Reduced particle effects
        if (typeof effects !== 'undefined' && window.GAME_CONFIG.PERFORMANCE_MODE.particles) {
            effects.paddleHitEffect(ballLeft, game.ball.y + BALL_SIZE/2, 0.5); // Reduced intensity
        }
        
        // Check for zone activation
        if (game.stats.rallyLength >= 3 || game.stats.survivalTime >= 20) {
            if (!game.stats.inZone) {
                game.stats.inZone = true;
                game.stats.zoneStartTime = Date.now();
                if (typeof effects !== 'undefined') {
                    effects.zoneActivateEffect();
                }
                if (typeof enhancedAudio !== 'undefined') {
                    enhancedAudio.play('zoneActivate');
                }
            }
        }
        
        // Award XP for rally
        if (typeof progression !== 'undefined' && typeof challenges !== 'undefined') {
            const xpMultiplier = challenges.getXPMultiplier();
            progression.addXP(Math.floor(10 * xpMultiplier), "Rally!");
        }
        
        updateAccuracy();
    }
    
    // AI paddle collision
    const aiLeft = canvas.width - 20 - PADDLE_WIDTH;
    const aiTop = game.ai.y;
    const aiBottom = game.ai.y + game.ai.paddleHeight;
    
    if (ballRight >= aiLeft && ballRight <= aiLeft + PADDLE_WIDTH &&
        ballBottom >= aiTop && ballTop <= aiBottom &&
        game.ball.speedX > 0) {
        
        let returnAngle = 1;
        if (typeof impossibleAI !== 'undefined') {
            returnAngle = impossibleAI.getReturnAngle(game.ai.y, game.ball.y, game.ai.paddleHeight);
        }
        game.ball.speedY = returnAngle * game.ball.baseSpeed;
        
        game.ball.baseSpeed += BALL_SPEED_INCREMENT * 0.5;
        game.ball.speedX = -(Math.abs(game.ball.speedX) + BALL_SPEED_INCREMENT * 0.5);
        
        game.stats.rallyLength++;
        
        if (typeof enhancedAudio !== 'undefined') {
            enhancedAudio.playDynamicPaddleHit(game.stats.rallyLength);
        }
        
        if (typeof effects !== 'undefined' && window.GAME_CONFIG.PERFORMANCE_MODE.particles) {
            effects.paddleHitEffect(ballRight, game.ball.y + BALL_SIZE/2, 0.3); // Reduced
        }
    }
    
    // Score detection
    if (game.ball.x < 0) {
        // AI scores
        game.ai.score++;
        game.player.misses++;
        game.player.scoreStreak = 0;
        updateAccuracy();
        
        // Reduced effects
        if (typeof effects !== 'undefined' && window.GAME_CONFIG.PERFORMANCE_MODE.particles) {
            effects.scoreEffect(50, game.ball.y, false);
        }
        
        if (typeof enhancedAudio !== 'undefined') {
            enhancedAudio.play('lose');
        }
        
        if (game.ai.score >= WINNING_SCORE) {
            gameOver(false);
        } else {
            resetBall(true);
        }
    }
    
    if (game.ball.x > canvas.width) {
        // Player scores
        game.player.score++;
        game.player.scoreStreak++;
        if (game.player.scoreStreak > game.player.maxStreak) {
            game.player.maxStreak = game.player.scoreStreak;
        }
        
        // Reduced effects
        if (typeof effects !== 'undefined' && window.GAME_CONFIG.PERFORMANCE_MODE.particles) {
            effects.scoreEffect(canvas.width - 50, game.ball.y, true);
        }
        
        if (typeof enhancedAudio !== 'undefined') {
            enhancedAudio.play('score');
        }
        
        // XP rewards
        if (typeof progression !== 'undefined' && typeof challenges !== 'undefined') {
            const xpMultiplier = challenges.getXPMultiplier();
            progression.addXP(Math.floor(50 * xpMultiplier), "Point scored!");
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
    
    // Update ball trail effect with performance check
    if (typeof effects !== 'undefined' && window.GAME_CONFIG.PERFORMANCE_MODE.trails) {
        effects.updateBallTrail(game.ball.x, game.ball.y, Math.abs(game.ball.speedX));
    }
    
    checkBallCollision();
}

function updateStats() {
    if (game.isPlaying && !game.isGameOver) {
        const currentTime = Date.now();
        if (game.stats.startTime) {
            game.stats.survivalTime = Math.floor((currentTime - game.stats.startTime) / 1000);
        }
    }
}

function gameOver(playerWon) {
    game.isGameOver = true;
    game.isPlaying = false;
    game.winner = playerWon ? 'PLAYER' : 'AI';
    
    if (typeof enhancedAudio !== 'undefined') {
        enhancedAudio.stopHeartbeat();
    }
    
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
    if (typeof progression !== 'undefined') {
        progression.updateStats(gameData);
        progression.checkAchievements(gameData);
    }
    
    // Reduced visual effects
    if (typeof effects !== 'undefined' && window.GAME_CONFIG.PERFORMANCE_MODE.particles) {
        effects.gameOverEffect(playerWon);
    }
    
    if (typeof enhancedAudio !== 'undefined') {
        enhancedAudio.play('gameOver', playerWon);
    }
}

function draw() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Apply screen shake if active (with performance check)
    if (typeof effects !== 'undefined' && window.GAME_CONFIG.PERFORMANCE_MODE.screenShake) {
        effects.applyScreenShake(ctx);
    }
    
    // Draw background
    drawBackground();
    
    // Draw game elements
    drawCenterLine();
    
    if (typeof effects !== 'undefined' && window.GAME_CONFIG.PERFORMANCE_MODE.trails) {
        effects.drawBallTrail(ctx);
    }
    
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
    
    // Draw progression elements (if available)
    if (typeof progression !== 'undefined') {
        progression.drawProgressBar(ctx);
        progression.drawFloatingTexts(ctx);
        progression.drawAchievementPopups(ctx);
        progression.drawSessionStats(ctx);
    }
    
    // Draw AI personality elements (if available)
    if (typeof aiPersonality !== 'undefined') {
        aiPersonality.drawTaunt(ctx);
        aiPersonality.drawConfidenceMeter(ctx, canvas.width - 10, 65);
    }
    
    // Draw challenge info (if available)
    if (typeof challenges !== 'undefined') {
        challenges.drawChallengeInfo(ctx);
    }
    
    // Draw limited particle effects
    if (typeof effects !== 'undefined' && window.GAME_CONFIG.PERFORMANCE_MODE.particles) {
        effects.drawParticles(ctx);
        
        if (window.GAME_CONFIG.PERFORMANCE_MODE.glowEffects) {
            effects.drawZoneEffect(ctx);
        }
    }
    
    // Reset screen shake
    if (typeof effects !== 'undefined' && window.GAME_CONFIG.PERFORMANCE_MODE.screenShake) {
        effects.resetScreenShake(ctx);
    }
    
    // Update floating texts
    if (typeof progression !== 'undefined') {
        progression.updateFloatingTexts();
    }
}

function drawBackground() {
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    if (typeof effects !== 'undefined' && effects.dangerZone) {
        ctx.fillStyle = 'rgba(255, 0, 0, 0.02)'; // Reduced opacity
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
}

function drawPaddles() {
    // Player paddle
    ctx.fillStyle = 'white';
    ctx.fillRect(20, game.player.y, PADDLE_WIDTH, game.player.paddleHeight);
    
    // AI paddle with red color
    ctx.fillStyle = '#ff3333';
    ctx.fillRect(canvas.width - 30, game.ai.y, PADDLE_WIDTH, game.ai.paddleHeight);
}

function drawBall() {
    ctx.fillStyle = 'white';
    ctx.fillRect(game.ball.x, game.ball.y, BALL_SIZE, BALL_SIZE);
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
        ctx.fillText("PRACTICE MODE", canvas.width / 2, canvas.height - 20);
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
}

function drawGameOver() {
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
        } else {
            ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 50);
        }
        
        ctx.font = '32px Courier New';
        ctx.fillText('The AI Wins', canvas.width / 2, canvas.height / 2);
    }
    
    // Quick retry prompt
    ctx.fillStyle = 'white';
    ctx.font = 'bold 24px Courier New';
    ctx.fillText('SPACE TO TRY AGAIN', canvas.width / 2, canvas.height / 2 + 100);
}

// Frame-limited game loop
function gameLoop(currentTime) {
    if (!currentTime) currentTime = 0;
    const deltaTime = currentTime - lastFrameTime;
    
    if (deltaTime >= FRAME_DURATION) {
        updatePlayer();
        updateAI();
        updateBall();
        updateStats();
        
        if (typeof effects !== 'undefined') {
            effects.updateEffects();
            // Clean up old particles
            if (effects.particles && effects.particles.length > window.GAME_CONFIG.PERFORMANCE_MODE.maxParticles) {
                effects.particles = effects.particles.slice(-window.GAME_CONFIG.PERFORMANCE_MODE.maxParticles);
            }
        }
        
        if (typeof aiPersonality !== 'undefined') {
            aiPersonality.updateTaunt(game);
        }
        
        draw();
        lastFrameTime = currentTime;
    }
    
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
    
    if (typeof effects !== 'undefined') {
        effects.reset();
    }
    
    if (typeof impossibleAI !== 'undefined') {
        impossibleAI.reset();
    }
    
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
                if (typeof impossibleAI !== 'undefined') {
                    impossibleAI.setPracticeMode(game.practiceMode);
                }
            }
            break;
        case 'm':
        case 'M':
            if (typeof enhancedAudio !== 'undefined') {
                enhancedAudio.toggleMute();
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
        requestAnimationFrame(gameLoop);
    });
} else {
    initGame();
    requestAnimationFrame(gameLoop);
}
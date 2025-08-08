// DEVELOPMENT BRANCH - BALANCED VERSION FOR EXPERT-LEVEL PLAY

// Global game configuration - challenging but fair
window.GAME_CONFIG = {
    PADDLE_WIDTH: 10,
    PADDLE_HEIGHT: 80,
    BALL_SIZE: 10,
    PADDLE_SPEED: 10,  // Fast enough for skilled play
    INITIAL_BALL_SPEED: 10,  // Maximum challenge - pure skill required
    BALL_SPEED_INCREMENT: 0.3,  // Gradual speed increase
    MAX_BALL_SPEED: 30,  // Increased cap for extreme gameplay (3x base)
    EXTREME_SPEED_THRESHOLD: 25,  // When to show extreme speed warning
    WINNING_SCORE: 7,
    
    // AI Configuration for expert level
    AI_BASE_SPEED: 10,  // Increased to match ball speed 10
    AI_REACTION_DELAY: 5,  // Pixels before AI reacts
    AI_IMPERFECTION: 0.91,  // 91% accuracy - slightly better to handle speed 10
    
    // Performance settings
    PERFORMANCE_MODE: {
        particles: true,
        screenShake: true,
        glowEffects: false,
        trails: true,
        maxParticles: 30,
        particlesPerHit: 3,
        particlesPerScore: 10
    },
    
    // Ice shot power-up settings
    ICE_SHOT: {
        cooldown: 5000,        // 5 seconds between shots
        freezeDuration: 1500,  // 1.5 seconds freeze
        projectileSpeed: 15,   // Faster than ball
        width: 20,
        height: 6,
        maxCharges: 1          // One shot at a time
    }
};

// Local references
const PADDLE_WIDTH = window.GAME_CONFIG.PADDLE_WIDTH;
const PADDLE_HEIGHT = window.GAME_CONFIG.PADDLE_HEIGHT;
const BALL_SIZE = window.GAME_CONFIG.BALL_SIZE;
const PADDLE_SPEED = window.GAME_CONFIG.PADDLE_SPEED;
const INITIAL_BALL_SPEED = window.GAME_CONFIG.INITIAL_BALL_SPEED;
const BALL_SPEED_INCREMENT = window.GAME_CONFIG.BALL_SPEED_INCREMENT;
const MAX_BALL_SPEED = window.GAME_CONFIG.MAX_BALL_SPEED;
let WINNING_SCORE = window.GAME_CONFIG.WINNING_SCORE;

// AI difficulty variables
let AI_BASE_SPEED = window.GAME_CONFIG.AI_BASE_SPEED;
let AI_REACTION_DELAY = window.GAME_CONFIG.AI_REACTION_DELAY;
let AI_IMPERFECTION = window.GAME_CONFIG.AI_IMPERFECTION;

// Frame rate control
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
    debugMode: false,  // AI debug visualization
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
        maxStreak: 0,
        // Ice shot state
        iceShot: {
            available: true,
            lastUsed: 0,
            projectile: null,
            cooldownRemaining: 0
        },
        frozen: false,
        freezeEnd: 0
    },
    
    ai: {
        y: canvas.height / 2 - PADDLE_HEIGHT / 2,
        score: 0,
        paddleHeight: PADDLE_HEIGHT,
        name: "IMPOSSIBLE AI",
        targetY: canvas.height / 2,
        lastUpdateTime: 0,
        // Debug info
        predictedBallY: canvas.height / 2,
        isTracking: false,
        willMiss: false,
        currentSpeed: AI_BASE_SPEED,
        accuracy: AI_IMPERFECTION * 100,
        // Ice shot state
        iceShot: {
            available: true,
            lastUsed: 0,
            projectile: null,
            cooldownRemaining: 0,
            willUseAt: 0  // AI decides when to use strategically
        },
        frozen: false,
        freezeEnd: 0
    },
    
    ball: {
        x: canvas.width / 2,
        y: canvas.height / 2,
        speedX: -INITIAL_BALL_SPEED,
        speedY: INITIAL_BALL_SPEED * 0.5,
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
    },
    
    // Difficulty progression
    difficulty: {
        speedMultiplier: 1.0,
        baseSpeed: INITIAL_BALL_SPEED,
        rallySpeedIncrease: 0.025, // 2.5% per hit (increased)
        pointSpeedIncrease: 0.08, // 8% per point (more aggressive)
        maxSpeedMultiplier: 3.0,   // Cap at triple speed (was 2.0)
        gameStartTime: Date.now(),
        timeSpeedIncrement: 0.0008, // 0.08% per second (increased)
        // Serve management
        serveSpeed: INITIAL_BALL_SPEED,
        overallGameDifficulty: 1.0,
        lastRallySpeed: 1.0,
        showServeIndicator: false,
        serveIndicatorTime: 0
    }
};

// Initialize game systems
function initGame() {
    // Daily challenges removed for cleaner gameplay
    // Focus on pure skill-based challenge
    
    // Reset effects
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
    
    // Store the speed level reached in the last rally
    game.difficulty.lastRallySpeed = game.difficulty.speedMultiplier;
    
    // Increase overall game difficulty slightly
    game.difficulty.overallGameDifficulty = Math.min(
        game.difficulty.overallGameDifficulty + 0.02, // 2% per point
        1.5 // Cap at 50% overall increase
    );
    
    // Calculate serve speed (half of reached speed, but with minimum)
    const SERVE_SPEED_RATIO = 0.5; // Serve at 50% of reached speed
    const reachedSpeed = game.difficulty.baseSpeed * game.difficulty.lastRallySpeed;
    game.difficulty.serveSpeed = game.difficulty.baseSpeed * game.difficulty.overallGameDifficulty + 
                                  (reachedSpeed - game.difficulty.baseSpeed) * SERVE_SPEED_RATIO;
    
    // Cap serve speed to be manageable
    const MAX_SERVE_SPEED = 15; // Even at extreme game speeds, serve stays reasonable
    game.difficulty.serveSpeed = Math.min(game.difficulty.serveSpeed, MAX_SERVE_SPEED);
    
    // Reset speed multiplier for new rally
    game.difficulty.speedMultiplier = game.difficulty.serveSpeed / game.difficulty.baseSpeed;
    
    // Apply serve speed
    game.ball.baseSpeed = game.difficulty.serveSpeed;
    
    const direction = towardPlayer ? -1 : 1;
    game.ball.speedX = game.ball.baseSpeed * direction;
    game.ball.speedY = (Math.random() - 0.5) * game.ball.baseSpeed * 0.5; // Reduced vertical variation for serves
    
    // Show serve indicator
    game.difficulty.showServeIndicator = true;
    game.difficulty.serveIndicatorTime = 60; // Show for 1 second at 60fps
    
    game.stats.rallyLength = 0;
    
    // Track max speed
    if (game.ball.baseSpeed > game.ball.maxSpeedReached) {
        game.ball.maxSpeedReached = game.ball.baseSpeed;
        if (game.ball.baseSpeed > INITIAL_BALL_SPEED * 1.5) {
            if (typeof effects !== 'undefined') {
                effects.dangerZone = true;
            }
        }
    }
    
    // Adjust AI difficulty based on score difference
    adjustAIDifficulty();
}

function adjustAIDifficulty() {
    const scoreDiff = game.player.score - game.ai.score;
    
    if (scoreDiff > 2) {
        // Player is winning by a lot - make AI better
        AI_IMPERFECTION = Math.max(0.85, window.GAME_CONFIG.AI_IMPERFECTION - 0.05);
        AI_REACTION_DELAY = Math.max(3, window.GAME_CONFIG.AI_REACTION_DELAY - 1);
    } else if (scoreDiff < -2) {
        // AI is winning by a lot - make it slightly easier
        AI_IMPERFECTION = Math.min(0.95, window.GAME_CONFIG.AI_IMPERFECTION + 0.02);
        AI_REACTION_DELAY = Math.min(8, window.GAME_CONFIG.AI_REACTION_DELAY + 1);
    } else {
        // Close game - keep it balanced
        AI_IMPERFECTION = window.GAME_CONFIG.AI_IMPERFECTION;
        AI_REACTION_DELAY = window.GAME_CONFIG.AI_REACTION_DELAY;
    }
}

function updatePlayer() {
    // Check if player is frozen
    const speedMultiplier = game.player.frozen ? 0.1 : 1.0; // 10% speed when frozen
    const speed = PADDLE_SPEED * speedMultiplier;
    
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
    
    // Visual feedback for ball approach
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
    // Custom balanced AI implementation with debug tracking
    // AI adapts to game speed - more aggressive at extreme speeds
    const speedRatio = game.difficulty.speedMultiplier;
    
    if (speedRatio > 2.0) {
        // Extreme speed mode - AI needs to be much faster
        game.ai.currentSpeed = AI_BASE_SPEED + (speedRatio - 1) * 15; // Faster scaling
        AI_REACTION_DELAY = 1; // Minimal delay at extreme speeds
        game.ai.accuracy = 95; // Near perfect at extreme speeds
    } else {
        // Normal speed progression
        const speedBoost = (speedRatio - 1) * 10; // More responsive scaling
        game.ai.currentSpeed = AI_BASE_SPEED + speedBoost;
        AI_REACTION_DELAY = Math.max(2, 5 - speedRatio * 2);
        game.ai.accuracy = Math.min(94, (AI_IMPERFECTION * 100) + speedRatio * 3);
    }
    
    if (game.ball.speedX > 0) {
        // Ball moving toward AI - calculate interception
        game.ai.isTracking = true;
        const timeToReach = (canvas.width - 30 - game.ball.x) / game.ball.speedX;
        let predictedY = game.ball.y + (game.ball.speedY * timeToReach);
        
        // Store raw prediction for debug display
        game.ai.predictedBallY = predictedY;
        
        // Account for wall bounces
        if (predictedY < 0 || predictedY > canvas.height) {
            predictedY = predictedY < 0 ? Math.abs(predictedY) : canvas.height - (predictedY - canvas.height);
        }
        
        // Apply imperfection
        const imperfectY = predictedY * AI_IMPERFECTION + (canvas.height / 2) * (1 - AI_IMPERFECTION);
        
        // Add some randomness for more natural movement
        const randomOffset = (Math.random() - 0.5) * 20;
        predictedY = imperfectY + randomOffset;
        
        game.ai.targetY = predictedY;
        
        // Check if AI will intentionally miss (for debug display)
        game.ai.willMiss = Math.abs(predictedY - game.ai.predictedBallY) > game.ai.paddleHeight / 2;
    } else {
        // Ball moving away - return to center gradually
        game.ai.isTracking = false;
        game.ai.targetY = canvas.height / 2 - game.ai.paddleHeight / 2;
        game.ai.predictedBallY = canvas.height / 2;
        game.ai.willMiss = false;
    }
    
    // Move AI paddle toward target (unless frozen)
    if (!game.ai.frozen) {
        const aiCenter = game.ai.y + game.ai.paddleHeight / 2;
        const diff = game.ai.targetY - aiCenter;
        
        // Apply reaction delay
        if (Math.abs(diff) > AI_REACTION_DELAY) {
            const moveAmount = Math.min(game.ai.currentSpeed, Math.abs(diff));
            
            if (diff > 0) {
                game.ai.y = Math.min(game.ai.y + moveAmount, canvas.height - game.ai.paddleHeight);
            } else {
                game.ai.y = Math.max(game.ai.y - moveAmount, 0);
            }
        }
    } else {
        // Frozen - very slow movement (10% speed)
        const aiCenter = game.ai.y + game.ai.paddleHeight / 2;
        const diff = game.ai.targetY - aiCenter;
        const moveAmount = Math.min(game.ai.currentSpeed * 0.1, Math.abs(diff));
        
        if (Math.abs(diff) > AI_REACTION_DELAY) {
            if (diff > 0) {
                game.ai.y = Math.min(game.ai.y + moveAmount, canvas.height - game.ai.paddleHeight);
            } else {
                game.ai.y = Math.max(game.ai.y - moveAmount, 0);
            }
        }
    }
    
    // Occasional mistakes for realism
    if (Math.random() < 0.02 && !game.ai.frozen) { // 2% chance of mistake (not when frozen)
        game.ai.y += (Math.random() - 0.5) * 30;
        game.ai.y = Math.max(0, Math.min(canvas.height - game.ai.paddleHeight, game.ai.y));
    }
    
    // AI ice shot strategy
    updateAIIceStrategy();
}

// Ice shot functions
function fireIceShot(shooter) {
    const ICE_SHOT = window.GAME_CONFIG.ICE_SHOT;
    
    if (shooter === 'player' && game.player.iceShot.available && !game.player.frozen) {
        game.player.iceShot.projectile = {
            x: 30 + PADDLE_WIDTH,
            y: game.player.y + game.player.paddleHeight / 2,
            speedX: ICE_SHOT.projectileSpeed,
            active: true
        };
        game.player.iceShot.available = false;
        game.player.iceShot.lastUsed = Date.now();
        
        // Play ice shot sound
        if (!game.muted) createIceShotSound();
    } else if (shooter === 'ai' && game.ai.iceShot.available && !game.ai.frozen) {
        game.ai.iceShot.projectile = {
            x: canvas.width - 30 - PADDLE_WIDTH,
            y: game.ai.y + game.ai.paddleHeight / 2,
            speedX: -ICE_SHOT.projectileSpeed,
            active: true
        };
        game.ai.iceShot.available = false;
        game.ai.iceShot.lastUsed = Date.now();
        
        // Play ice shot sound for AI
        if (!game.muted) createIceShotSound();
    }
}

function updateIceShots() {
    const ICE_SHOT = window.GAME_CONFIG.ICE_SHOT;
    
    // Update player's ice shot
    if (game.player.iceShot.projectile && game.player.iceShot.projectile.active) {
        game.player.iceShot.projectile.x += game.player.iceShot.projectile.speedX;
        
        // Check collision with AI paddle
        if (checkIceHit(game.player.iceShot.projectile, game.ai)) {
            freezePaddle('ai');
            game.player.iceShot.projectile.active = false;
            game.player.iceShot.projectile = null;
        }
        
        // Remove if off screen
        if (game.player.iceShot.projectile && game.player.iceShot.projectile.x > canvas.width) {
            game.player.iceShot.projectile.active = false;
            game.player.iceShot.projectile = null;
        }
    }
    
    // Update AI's ice shot
    if (game.ai.iceShot.projectile && game.ai.iceShot.projectile.active) {
        game.ai.iceShot.projectile.x += game.ai.iceShot.projectile.speedX;
        
        // Check collision with player paddle
        if (checkIceHit(game.ai.iceShot.projectile, game.player)) {
            freezePaddle('player');
            game.ai.iceShot.projectile.active = false;
            game.ai.iceShot.projectile = null;
        }
        
        // Remove if off screen
        if (game.ai.iceShot.projectile && game.ai.iceShot.projectile.x < 0) {
            game.ai.iceShot.projectile.active = false;
            game.ai.iceShot.projectile = null;
        }
    }
    
    // Update cooldowns
    updateIceCooldowns();
    
    // Check freeze timers
    updateFreezeStates();
}

function checkIceHit(projectile, paddle) {
    const ICE_SHOT = window.GAME_CONFIG.ICE_SHOT;
    const paddleX = paddle === game.player ? 20 : canvas.width - 30;
    
    return projectile.x >= paddleX - ICE_SHOT.width / 2 &&
           projectile.x <= paddleX + PADDLE_WIDTH + ICE_SHOT.width / 2 &&
           projectile.y >= paddle.y &&
           projectile.y <= paddle.y + paddle.paddleHeight;
}

function freezePaddle(target) {
    const ICE_SHOT = window.GAME_CONFIG.ICE_SHOT;
    
    if (target === 'player') {
        game.player.frozen = true;
        game.player.freezeEnd = Date.now() + ICE_SHOT.freezeDuration;
        
        if (typeof effects !== 'undefined') {
            createFreezeParticles(20, game.player.y + game.player.paddleHeight / 2);
        }
    } else {
        game.ai.frozen = true;
        game.ai.freezeEnd = Date.now() + ICE_SHOT.freezeDuration;
        
        if (typeof effects !== 'undefined') {
            createFreezeParticles(canvas.width - 30, game.ai.y + game.ai.paddleHeight / 2);
        }
    }
    
    // Play freeze sound
    if (!game.muted) createFreezeSound();
}

function updateAIIceStrategy() {
    // AI Ice Shot Strategy - smart usage based on game state
    if (!game.ai.iceShot.available || game.ai.frozen || game.ball.speedX < 0) return;
    
    // Don't shoot if ball is too far
    if (game.ball.x < canvas.width * 0.5) return;
    
    // Calculate strategic value
    const scoreDiff = game.player.score - game.ai.score;
    let shootChance = 0.05; // Base 5% chance per frame
    
    // Increase aggression when losing
    if (scoreDiff > 0) {
        shootChance += scoreDiff * 0.1;
    }
    
    // Shoot when ball is very fast and heading to player
    const ballSpeed = Math.sqrt(game.ball.speedX * game.ball.speedX + game.ball.speedY * game.ball.speedY);
    if (ballSpeed > 20 && game.ball.speedX < 0) {
        shootChance += 0.25;
    }
    
    // Strategic shot during long rallies
    if (game.rally > 8) {
        shootChance += 0.15;
    }
    
    // High chance when player is about to score
    if (game.player.score === WINNING_SCORE - 1) {
        shootChance += 0.3;
    }
    
    // Less likely if AI is winning comfortably
    if (game.ai.score - game.player.score >= 3) {
        shootChance *= 0.3;
    }
    
    // Check if player is out of position
    const playerCenter = game.player.y + game.player.paddleHeight / 2;
    const ballY = game.ball.y;
    if (Math.abs(playerCenter - ballY) > game.player.paddleHeight) {
        shootChance += 0.2;
    }
    
    // Difficulty scaling
    shootChance *= Math.min(2, game.difficulty.speedMultiplier);
    
    // Make the decision
    if (Math.random() < Math.min(shootChance, 0.4)) {
        fireIceShot('ai');
    }
}

function createFreezeParticles(x, y) {
    if (typeof effects === 'undefined') return;
    
    for (let i = 0; i < 10; i++) {
        effects.createParticle(x, y, {
            vx: (Math.random() - 0.5) * 4,
            vy: (Math.random() - 0.5) * 4,
            size: Math.random() * 3 + 2,
            color: '#00ffff',
            life: 40,
            gravity: 0.1,
            fade: true,
            glow: true
        });
    }
}

function updateIceCooldowns() {
    const ICE_SHOT = window.GAME_CONFIG.ICE_SHOT;
    const now = Date.now();
    
    // Player cooldown
    if (!game.player.iceShot.available) {
        const elapsed = now - game.player.iceShot.lastUsed;
        if (elapsed >= ICE_SHOT.cooldown) {
            game.player.iceShot.available = true;
            game.player.iceShot.cooldownRemaining = 0;
        } else {
            game.player.iceShot.cooldownRemaining = ICE_SHOT.cooldown - elapsed;
        }
    }
    
    // AI cooldown
    if (!game.ai.iceShot.available) {
        const elapsed = now - game.ai.iceShot.lastUsed;
        if (elapsed >= ICE_SHOT.cooldown) {
            game.ai.iceShot.available = true;
            game.ai.iceShot.cooldownRemaining = 0;
        } else {
            game.ai.iceShot.cooldownRemaining = ICE_SHOT.cooldown - elapsed;
        }
    }
}

function updateFreezeStates() {
    const now = Date.now();
    
    // Check player freeze
    if (game.player.frozen && now >= game.player.freezeEnd) {
        game.player.frozen = false;
        game.player.freezeEnd = 0;
        // Play thaw sound
        if (!game.muted) createThawSound();
    }
    
    // Check AI freeze
    if (game.ai.frozen && now >= game.ai.freezeEnd) {
        game.ai.frozen = false;
        game.ai.freezeEnd = 0;
        // Play thaw sound
        if (!game.muted) createThawSound();
    }
}

// Ice shot sound effects
function createIceShotSound() {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const currentTime = audioContext.currentTime;
        
        // Whoosh sound for projectile
        const osc = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        const filter = audioContext.createBiquadFilter();
        
        // White noise-like sound using sawtooth
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, currentTime);
        osc.frequency.exponentialRampToValueAtTime(50, currentTime + 0.2);
        
        // Filter for swoosh effect
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(1000, currentTime);
        filter.frequency.exponentialRampToValueAtTime(100, currentTime + 0.2);
        
        // Quick volume envelope
        gainNode.gain.setValueAtTime(0.2, currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, currentTime + 0.2);
        
        // Connect and play
        osc.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        osc.start(currentTime);
        osc.stop(currentTime + 0.2);
    } catch (e) {
        // Silently fail if audio context unavailable
    }
}

function createFreezeSound() {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const freezeDuration = 0.4;
        const currentTime = audioContext.currentTime;
        
        // Create oscillators for ice crystal sound
        const osc1 = audioContext.createOscillator();
        const osc2 = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        // High frequency sweep down (ice forming)
        osc1.frequency.setValueAtTime(2000, currentTime);
        osc1.frequency.exponentialRampToValueAtTime(400, currentTime + freezeDuration);
        osc1.type = 'sine';
        
        // Shimmer effect
        osc2.frequency.setValueAtTime(3000, currentTime);
        osc2.frequency.exponentialRampToValueAtTime(1000, currentTime + freezeDuration);
        osc2.type = 'triangle';
        
        // Volume envelope
        gainNode.gain.setValueAtTime(0, currentTime);
        gainNode.gain.linearRampToValueAtTime(0.3, currentTime + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.01, currentTime + freezeDuration);
        
        // Connect nodes
        osc1.connect(gainNode);
        osc2.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // Play sound
        osc1.start(currentTime);
        osc2.start(currentTime);
        osc1.stop(currentTime + freezeDuration);
        osc2.stop(currentTime + freezeDuration);
    } catch (e) {
        // Silently fail if audio context unavailable
    }
}

function createThawSound() {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const currentTime = audioContext.currentTime;
        
        // Crackling ice sound
        const osc = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        osc.type = 'square';
        osc.frequency.setValueAtTime(100, currentTime);
        osc.frequency.linearRampToValueAtTime(200, currentTime + 0.1);
        
        // Crackling envelope
        gainNode.gain.setValueAtTime(0.1, currentTime);
        gainNode.gain.linearRampToValueAtTime(0, currentTime + 0.1);
        
        osc.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        osc.start(currentTime);
        osc.stop(currentTime + 0.1);
    } catch (e) {
        // Silently fail if audio context unavailable
    }
}

function updateAIIceStrategy() {
    // AI uses ice shot strategically
    if (game.ai.iceShot.available && !game.ai.frozen) {
        const ballSpeed = Math.abs(game.ball.speedX);
        
        // Use when ball is fast and heading toward player
        if (game.ball.speedX < -15 && game.ball.x < canvas.width / 2) {
            // 30% chance to use ice shot in this situation
            if (Math.random() < 0.3) {
                fireIceShot('ai');
                return;
            }
        }
        
        // Or when player is about to win
        if (game.player.score >= WINNING_SCORE - 2 && Math.random() < 0.4) {
            fireIceShot('ai');
            return;
        }
        
        // Or during long rallies
        if (game.stats.rallyLength > 10 && Math.random() < 0.2) {
            fireIceShot('ai');
        }
    }
}

function checkBallCollision() {
    // Wall collision with position correction
    if (game.ball.y <= 0) {
        game.ball.y = 0;
        game.ball.speedY = Math.abs(game.ball.speedY);
        if (typeof enhancedAudio !== 'undefined') {
            enhancedAudio.play('wall');
        }
    } else if (game.ball.y >= canvas.height - BALL_SIZE) {
        game.ball.y = canvas.height - BALL_SIZE;
        game.ball.speedY = -Math.abs(game.ball.speedY);
        if (typeof enhancedAudio !== 'undefined') {
            enhancedAudio.play('wall');
        }
    }
    
    // Generous collision buffer for better edge detection
    const EDGE_BUFFER = 3;
    
    // Get exact ball boundaries
    const ballLeft = game.ball.x;
    const ballRight = game.ball.x + BALL_SIZE;
    const ballTop = game.ball.y;
    const ballBottom = game.ball.y + BALL_SIZE;
    const ballCenterX = game.ball.x + BALL_SIZE / 2;
    const ballCenterY = game.ball.y + BALL_SIZE / 2;
    
    // Player paddle collision with improved edge detection
    const playerLeft = 20 - EDGE_BUFFER;
    const playerRight = 20 + PADDLE_WIDTH + EDGE_BUFFER;
    const playerTop = game.player.y - EDGE_BUFFER;
    const playerBottom = game.player.y + game.player.paddleHeight + EDGE_BUFFER;
    
    // Check complete overlap including edges
    const playerHorizontalOverlap = ballRight >= playerLeft && ballLeft <= playerRight;
    const playerVerticalOverlap = ballBottom >= playerTop && ballTop <= playerBottom;
    
    if (playerHorizontalOverlap && playerVerticalOverlap && game.ball.speedX < 0) {
        
        // Position correction to prevent ball from getting stuck
        game.ball.x = playerRight + 1;
        
        // Calculate return angle based on hit position (improved edge detection)
        const paddleCenter = game.player.y + game.player.paddleHeight / 2;
        const hitPos = (ballCenterY - paddleCenter) / (game.player.paddleHeight / 2);
        // Clamp hitPos to prevent extreme angles
        const clampedHitPos = Math.max(-1, Math.min(1, hitPos));
        game.ball.speedY = clampedHitPos * 6; // Moderate angle changes with edge emphasis
        
        // Smooth transition: accelerate faster if previous rally was fast
        if (game.stats.rallyLength === 0 && game.difficulty.lastRallySpeed > 1.5) {
            // First hit after serve - accelerate faster to get back to intense gameplay
            game.difficulty.speedMultiplier += 0.1;
        }
        
        // Progressive difficulty: increase speed with each rally
        game.difficulty.speedMultiplier = Math.min(
            game.difficulty.speedMultiplier + game.difficulty.rallySpeedIncrease,
            game.difficulty.maxSpeedMultiplier
        );
        
        // Apply new speed with multiplier
        const baseSpeed = game.difficulty.baseSpeed * game.difficulty.speedMultiplier;
        const newSpeed = Math.min(baseSpeed + BALL_SPEED_INCREMENT, MAX_BALL_SPEED);
        game.ball.baseSpeed = newSpeed;
        game.ball.speedX = Math.abs(game.ball.baseSpeed);
        
        // Update stats
        game.player.hits++;
        game.stats.rallyLength++;
        if (game.stats.rallyLength > game.stats.longestRally) {
            game.stats.longestRally = game.stats.rallyLength;
        }
        
        // Effects
        if (typeof enhancedAudio !== 'undefined') {
            enhancedAudio.playDynamicPaddleHit(game.stats.rallyLength);
        }
        
        if (typeof effects !== 'undefined' && window.GAME_CONFIG.PERFORMANCE_MODE.particles) {
            effects.paddleHitEffect(ballLeft, game.ball.y + BALL_SIZE/2, 0.5);
        }
        
        // Zone activation for long rallies
        if (game.stats.rallyLength >= 5) {
            if (!game.stats.inZone) {
                game.stats.inZone = true;
                game.stats.zoneStartTime = Date.now();
                if (typeof effects !== 'undefined') {
                    effects.zoneActivateEffect();
                }
            }
        }
        
        // XP system removed - pure skill-based gameplay
        // if (typeof progression !== 'undefined') {
        //     progression.addXP(10, "Rally!");
        // }
        
        updateAccuracy();
    }
    
    // AI paddle collision with improved edge detection
    const aiLeft = canvas.width - 20 - PADDLE_WIDTH - EDGE_BUFFER;
    const aiRight = canvas.width - 20 + EDGE_BUFFER;
    const aiTop = game.ai.y - EDGE_BUFFER;
    const aiBottom = game.ai.y + game.ai.paddleHeight + EDGE_BUFFER;
    
    // Check complete overlap including edges
    const aiHorizontalOverlap = ballRight >= aiLeft && ballLeft <= aiRight;
    const aiVerticalOverlap = ballBottom >= aiTop && ballTop <= aiBottom;
    
    if (aiHorizontalOverlap && aiVerticalOverlap && game.ball.speedX > 0) {
        
        // Position correction to prevent ball from getting stuck
        game.ball.x = aiLeft - BALL_SIZE - 1;
        
        // AI returns with strategic angles (improved edge detection)
        const aiPaddleCenter = game.ai.y + game.ai.paddleHeight / 2;
        const aiHitPos = (ballCenterY - aiPaddleCenter) / (game.ai.paddleHeight / 2);
        // Clamp hitPos to prevent extreme angles
        const clampedAiHitPos = Math.max(-1, Math.min(1, aiHitPos));
        
        // AI aims for corners when ahead
        let targetAngle = clampedAiHitPos * 5;
        if (game.ai.score > game.player.score) {
            targetAngle = (Math.random() > 0.5 ? 1 : -1) * 6; // Aim for corners
        }
        
        game.ball.speedY = targetAngle;
        
        // Smooth transition for AI hits too
        if (game.stats.rallyLength === 0 && game.difficulty.lastRallySpeed > 1.5) {
            // First hit after serve - accelerate faster
            game.difficulty.speedMultiplier += 0.08;
        }
        
        // Progressive difficulty: increase speed with AI rally too
        game.difficulty.speedMultiplier = Math.min(
            game.difficulty.speedMultiplier + game.difficulty.rallySpeedIncrease * 0.7,
            game.difficulty.maxSpeedMultiplier
        );
        
        // Speed increase
        const baseSpeed = game.difficulty.baseSpeed * game.difficulty.speedMultiplier;
        const newSpeed = Math.min(baseSpeed + BALL_SPEED_INCREMENT * 0.7, MAX_BALL_SPEED);
        game.ball.baseSpeed = newSpeed;
        game.ball.speedX = -Math.abs(game.ball.baseSpeed);
        
        game.stats.rallyLength++;
        
        if (typeof enhancedAudio !== 'undefined') {
            enhancedAudio.playDynamicPaddleHit(game.stats.rallyLength);
        }
        
        if (typeof effects !== 'undefined' && window.GAME_CONFIG.PERFORMANCE_MODE.particles) {
            effects.paddleHitEffect(ballRight, game.ball.y + BALL_SIZE/2, 0.3);
        }
    }
    
    // Score detection
    if (game.ball.x < 0) {
        // AI scores
        game.ai.score++;
        game.player.misses++;
        game.player.scoreStreak = 0;
        updateAccuracy();
        
        if (typeof effects !== 'undefined' && window.GAME_CONFIG.PERFORMANCE_MODE.particles) {
            effects.scoreEffect(50, game.ball.y, false);
        }
        
        if (typeof enhancedAudio !== 'undefined') {
            enhancedAudio.play('lose');
        }
        
        if (typeof aiPersonality !== 'undefined') {
            aiPersonality.triggerTaunt('ai_score', game);
        }
        
        if (game.ai.score >= WINNING_SCORE) {
            gameOver(false);
        } else {
            resetBall(true);
        }
        
        game.stats.inZone = false;
    }
    
    if (game.ball.x > canvas.width) {
        // Player scores
        game.player.score++;
        game.player.scoreStreak++;
        if (game.player.scoreStreak > game.player.maxStreak) {
            game.player.maxStreak = game.player.scoreStreak;
        }
        
        if (typeof effects !== 'undefined' && window.GAME_CONFIG.PERFORMANCE_MODE.particles) {
            effects.scoreEffect(canvas.width - 50, game.ball.y, true);
        }
        
        if (typeof enhancedAudio !== 'undefined') {
            enhancedAudio.play('score');
        }
        
        // XP system removed - pure skill-based gameplay
        // if (typeof progression !== 'undefined') {
        //     progression.addXP(50, "Point scored!");
        // }
        
        if (game.player.score >= WINNING_SCORE - 2) {
            if (typeof enhancedAudio !== 'undefined') {
                enhancedAudio.startHeartbeat();
            }
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
    
    // Cap maximum speed
    if (Math.abs(game.ball.speedX) > MAX_BALL_SPEED) {
        game.ball.speedX = Math.sign(game.ball.speedX) * MAX_BALL_SPEED;
    }
    if (Math.abs(game.ball.speedY) > MAX_BALL_SPEED * 0.7) {
        game.ball.speedY = Math.sign(game.ball.speedY) * MAX_BALL_SPEED * 0.7;
    }
    
    // Store previous position for interpolation
    const prevX = game.ball.x;
    const prevY = game.ball.y;
    
    // Smooth movement with collision detection at high speeds
    const stepSize = PADDLE_WIDTH / 3; // Smaller step size for better accuracy
    const moveX = game.ball.speedX;
    const moveY = game.ball.speedY;
    
    // If moving fast, break into smaller steps for accurate collision detection
    if (Math.abs(moveX) > stepSize) {
        const steps = Math.ceil(Math.abs(moveX) / stepSize);
        const stepX = moveX / steps;
        const stepY = moveY / steps;
        
        for (let i = 0; i < steps; i++) {
            const oldX = game.ball.x;
            game.ball.x += stepX;
            game.ball.y += stepY;
            checkBallCollision();
            
            // If collision occurred (ball position was corrected), stop stepping
            if (Math.abs(game.ball.x - oldX - stepX) > 1) {
                break;
            }
        }
    } else {
        // Normal movement for slower speeds
        game.ball.x += moveX;
        game.ball.y += moveY;
        checkBallCollision();
    }
    
    // Update trail
    if (typeof effects !== 'undefined' && window.GAME_CONFIG.PERFORMANCE_MODE.trails) {
        effects.updateBallTrail(game.ball.x, game.ball.y, Math.abs(game.ball.speedX));
    }
}

function updateStats() {
    if (game.isPlaying && !game.isGameOver) {
        const currentTime = Date.now();
        if (game.stats.startTime) {
            game.stats.survivalTime = Math.floor((currentTime - game.stats.startTime) / 1000);
        }
        
        // Time-based difficulty increase
        const elapsedSeconds = (currentTime - game.difficulty.gameStartTime) / 1000;
        const timeMultiplier = 1 + (elapsedSeconds * game.difficulty.timeSpeedIncrement);
        
        // Combine with existing multiplier (take the higher of the two)
        game.difficulty.speedMultiplier = Math.min(
            Math.max(game.difficulty.speedMultiplier, timeMultiplier),
            game.difficulty.maxSpeedMultiplier
        );
    }
}

function gameOver(playerWon) {
    game.isGameOver = true;
    game.isPlaying = false;
    game.winner = playerWon ? 'PLAYER' : 'AI';
    
    if (typeof enhancedAudio !== 'undefined') {
        enhancedAudio.stopHeartbeat();
    }
    
    // Game stats
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
    
    // Effects
    if (typeof effects !== 'undefined' && window.GAME_CONFIG.PERFORMANCE_MODE.particles) {
        effects.gameOverEffect(playerWon);
    }
    
    if (typeof enhancedAudio !== 'undefined') {
        enhancedAudio.play('gameOver', playerWon);
    }
}

// Drawing functions
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (typeof effects !== 'undefined' && window.GAME_CONFIG.PERFORMANCE_MODE.screenShake) {
        effects.applyScreenShake(ctx);
    }
    
    drawBackground();
    drawCenterLine();
    
    if (typeof effects !== 'undefined' && window.GAME_CONFIG.PERFORMANCE_MODE.trails) {
        effects.drawBallTrail(ctx);
    }
    
    drawPaddles();
    drawBall();
    drawIceShots();
    drawScore();
    drawSpeedIndicator();
    drawIceShotUI();
    
    // Draw debug info if enabled
    if (game.debugMode) {
        drawDebugInfo();
    }
    
    if (game.state === 'ready' && !game.isPlaying && !game.isGameOver) {
        drawTitleScreen();
    }
    
    if (game.isGameOver) {
        drawGameOver();
    }
    
    // Draw UI elements
    if (typeof progression !== 'undefined') {
        progression.drawProgressBar(ctx);
        progression.drawFloatingTexts(ctx);
        progression.drawAchievementPopups(ctx);
        progression.drawSessionStats(ctx);
    }
    
    if (typeof aiPersonality !== 'undefined') {
        aiPersonality.drawTaunt(ctx);
        aiPersonality.drawConfidenceMeter(ctx, canvas.width - 10, 65);
    }
    
    // Challenge system removed for cleaner UI
    
    if (typeof effects !== 'undefined' && window.GAME_CONFIG.PERFORMANCE_MODE.particles) {
        effects.drawParticles(ctx);
        if (window.GAME_CONFIG.PERFORMANCE_MODE.glowEffects) {
            effects.drawZoneEffect(ctx);
        }
    }
    
    if (typeof effects !== 'undefined' && window.GAME_CONFIG.PERFORMANCE_MODE.screenShake) {
        effects.resetScreenShake(ctx);
    }
    
    if (typeof progression !== 'undefined') {
        progression.updateFloatingTexts();
    }
}

function drawBackground() {
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    if (typeof effects !== 'undefined' && effects.dangerZone) {
        ctx.fillStyle = 'rgba(255, 0, 0, 0.03)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
}

function drawPaddles() {
    // Player paddle
    if (game.player.frozen) {
        // Frozen effect
        ctx.fillStyle = 'rgba(150, 200, 255, 0.7)';
        ctx.fillRect(18, game.player.y - 2, PADDLE_WIDTH + 4, game.player.paddleHeight + 4);
        
        // Ice crystals
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        for (let i = 0; i < 3; i++) {
            const x = 20 + Math.random() * PADDLE_WIDTH;
            const y = game.player.y + Math.random() * game.player.paddleHeight;
            ctx.beginPath();
            ctx.moveTo(x - 2, y);
            ctx.lineTo(x + 2, y);
            ctx.moveTo(x, y - 2);
            ctx.lineTo(x, y + 2);
            ctx.stroke();
        }
        
        // Thaw progress bar
        const thawPercent = (game.player.freezeEnd - Date.now()) / window.GAME_CONFIG.ICE_SHOT.freezeDuration;
        if (thawPercent > 0) {
            ctx.fillStyle = '#00ffff';
            ctx.fillRect(20, game.player.y - 8, PADDLE_WIDTH * thawPercent, 3);
        }
    }
    
    ctx.fillStyle = game.player.frozen ? '#aaccff' : 'white';
    ctx.fillRect(20, game.player.y, PADDLE_WIDTH, game.player.paddleHeight);
    
    // AI paddle with debug highlights
    const aiPaddleX = canvas.width - 30;
    
    // Frozen effect for AI
    if (game.ai.frozen) {
        ctx.fillStyle = 'rgba(150, 200, 255, 0.7)';
        ctx.fillRect(aiPaddleX - 2, game.ai.y - 2, PADDLE_WIDTH + 4, game.ai.paddleHeight + 4);
        
        // Ice crystals
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        for (let i = 0; i < 3; i++) {
            const x = aiPaddleX + Math.random() * PADDLE_WIDTH;
            const y = game.ai.y + Math.random() * game.ai.paddleHeight;
            ctx.beginPath();
            ctx.moveTo(x - 2, y);
            ctx.lineTo(x + 2, y);
            ctx.moveTo(x, y - 2);
            ctx.lineTo(x, y + 2);
            ctx.stroke();
        }
        
        // Thaw progress bar
        const thawPercent = (game.ai.freezeEnd - Date.now()) / window.GAME_CONFIG.ICE_SHOT.freezeDuration;
        if (thawPercent > 0) {
            ctx.fillStyle = '#00ffff';
            ctx.fillRect(aiPaddleX, game.ai.y - 8, PADDLE_WIDTH * thawPercent, 3);
        }
    }
    
    // Draw AI paddle (red or frozen blue)
    ctx.fillStyle = game.ai.frozen ? '#ff99aa' : '#ff3333';
    ctx.fillRect(aiPaddleX, game.ai.y, PADDLE_WIDTH, game.ai.paddleHeight);
    
    // Debug mode: Add glow effect when tracking
    if (game.debugMode && game.ai.isTracking) {
        ctx.save();
        ctx.shadowBlur = 10;
        ctx.shadowColor = game.ai.willMiss ? '#ff0000' : '#00ff00';
        ctx.fillStyle = game.ai.willMiss ? 'rgba(255, 0, 0, 0.2)' : 'rgba(0, 255, 0, 0.2)';
        ctx.fillRect(aiPaddleX - 2, game.ai.y - 2, PADDLE_WIDTH + 4, game.ai.paddleHeight + 4);
        ctx.restore();
    }
    
    // AI boost indicator
    if (typeof impossibleAI !== 'undefined' && impossibleAI.boostActive) {
        ctx.fillStyle = 'rgba(255, 255, 0, 0.3)';
        ctx.fillRect(aiPaddleX - 5, game.ai.y - 5, PADDLE_WIDTH + 10, game.ai.paddleHeight + 10);
    }
}

function drawBall() {
    ctx.fillStyle = 'white';
    ctx.fillRect(game.ball.x, game.ball.y, BALL_SIZE, BALL_SIZE);
}

function drawIceShots() {
    const ICE_SHOT = window.GAME_CONFIG.ICE_SHOT;
    
    // Draw player ice projectile
    if (game.player.iceShot.projectile && game.player.iceShot.projectile.active) {
        // Ice blue gradient
        const gradient = ctx.createLinearGradient(
            game.player.iceShot.projectile.x, 
            game.player.iceShot.projectile.y - 3,
            game.player.iceShot.projectile.x + ICE_SHOT.width,
            game.player.iceShot.projectile.y + 3
        );
        gradient.addColorStop(0, '#00ffff');
        gradient.addColorStop(0.5, '#ffffff');
        gradient.addColorStop(1, '#0099ff');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(
            game.player.iceShot.projectile.x,
            game.player.iceShot.projectile.y - ICE_SHOT.height/2,
            ICE_SHOT.width,
            ICE_SHOT.height
        );
        
        // Trail effect
        ctx.fillStyle = 'rgba(0, 200, 255, 0.3)';
        ctx.fillRect(
            game.player.iceShot.projectile.x - 30,
            game.player.iceShot.projectile.y - 2,
            30,
            4
        );
    }
    
    // Draw AI ice projectile
    if (game.ai.iceShot.projectile && game.ai.iceShot.projectile.active) {
        const gradient = ctx.createLinearGradient(
            game.ai.iceShot.projectile.x + ICE_SHOT.width, 
            game.ai.iceShot.projectile.y - 3,
            game.ai.iceShot.projectile.x,
            game.ai.iceShot.projectile.y + 3
        );
        gradient.addColorStop(0, '#00ffff');
        gradient.addColorStop(0.5, '#ffffff');
        gradient.addColorStop(1, '#0099ff');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(
            game.ai.iceShot.projectile.x - ICE_SHOT.width,
            game.ai.iceShot.projectile.y - ICE_SHOT.height/2,
            ICE_SHOT.width,
            ICE_SHOT.height
        );
        
        // Trail effect
        ctx.fillStyle = 'rgba(0, 200, 255, 0.3)';
        ctx.fillRect(
            game.ai.iceShot.projectile.x,
            game.ai.iceShot.projectile.y - 2,
            30,
            4
        );
    }
}

function drawIceShotUI() {
    const ICE_SHOT = window.GAME_CONFIG.ICE_SHOT;
    
    // Player cooldown indicator
    ctx.fillStyle = game.player.iceShot.available ? '#00ffff' : '#444444';
    ctx.font = '12px Courier New';
    ctx.textAlign = 'left';
    ctx.fillText('ICE [E]: ' + (game.player.iceShot.available ? 'READY' : 
        Math.ceil(game.player.iceShot.cooldownRemaining / 1000) + 's'), 
        10, 20);
    
    // Visual charge bar
    if (!game.player.iceShot.available) {
        const chargePercent = 1 - (game.player.iceShot.cooldownRemaining / ICE_SHOT.cooldown);
        ctx.fillStyle = 'rgba(0, 255, 255, 0.3)';
        ctx.fillRect(10, 23, 80 * chargePercent, 3);
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.5)';
        ctx.strokeRect(10, 23, 80, 3);
    }
    
    // AI cooldown indicator (in debug mode)
    if (game.debugMode) {
        ctx.textAlign = 'right';
        ctx.fillStyle = game.ai.iceShot.available ? '#00ffff' : '#444444';
        ctx.fillText('AI ICE: ' + (game.ai.iceShot.available ? 'READY' : 
            Math.ceil(game.ai.iceShot.cooldownRemaining / 1000) + 's'), 
            canvas.width - 10, 20);
    }
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

function drawSpeedIndicator() {
    if (!game.isPlaying) return;
    
    // Draw serve speed indicator if active
    if (game.difficulty.showServeIndicator && game.difficulty.serveIndicatorTime > 0) {
        ctx.save();
        const alpha = Math.min(1, game.difficulty.serveIndicatorTime / 30); // Fade out
        ctx.fillStyle = `rgba(0, 255, 0, ${alpha * 0.8})`;
        ctx.font = '14px Courier New';
        ctx.textAlign = 'center';
        ctx.fillText(`Serve Speed: ${Math.round(game.difficulty.serveSpeed)}`, canvas.width / 2, 50);
        ctx.restore();
        
        game.difficulty.serveIndicatorTime--;
        if (game.difficulty.serveIndicatorTime <= 0) {
            game.difficulty.showServeIndicator = false;
        }
    }
    
    // Calculate speed percentage
    const speedPercent = (game.difficulty.speedMultiplier - 1) * 100;
    const currentSpeed = Math.abs(game.ball.speedX);
    
    // Check for extreme speed
    const isExtremeSpeed = currentSpeed > window.GAME_CONFIG.EXTREME_SPEED_THRESHOLD;
    
    // Draw extreme speed warning
    if (isExtremeSpeed) {
        // Flash red border
        ctx.strokeStyle = `rgba(255, 0, 0, ${0.3 + Math.sin(Date.now() * 0.01) * 0.2})`;
        ctx.lineWidth = 3;
        ctx.strokeRect(5, 5, canvas.width - 10, canvas.height - 10);
        
        // Extreme speed text
        ctx.fillStyle = '#ff0000';
        ctx.font = 'bold 14px Courier New';
        ctx.textAlign = 'center';
        ctx.fillText('⚠️ EXTREME SPEED! ⚠️', canvas.width / 2, 25);
    }
    
    // Position at bottom left
    const indicatorX = 10;
    const indicatorY = canvas.height - 30;
    const barWidth = 150;
    const barHeight = 6;
    
    // Draw background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(indicatorX - 2, indicatorY - 2, barWidth + 4, barHeight + 4);
    
    // Determine color based on speed (updated for 3x max)
    let color;
    if (speedPercent < 50) color = '#00ff00'; // Green - normal
    else if (speedPercent < 100) color = '#ffff00'; // Yellow - fast
    else if (speedPercent < 150) color = '#ff8800'; // Orange - very fast
    else if (speedPercent < 200) color = '#ff0000'; // Red - insane
    else color = '#ff00ff'; // Magenta - EXTREME!
    
    // Draw speed bar
    ctx.fillStyle = color;
    const fillWidth = Math.min((speedPercent / 100) * barWidth, barWidth);
    ctx.fillRect(indicatorX, indicatorY, fillWidth, barHeight);
    
    // Draw border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.strokeRect(indicatorX, indicatorY, barWidth, barHeight);
    
    // Draw text
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = '10px Courier New';
    ctx.textAlign = 'left';
    ctx.fillText(`Speed: ${Math.round(speedPercent)}% faster`, indicatorX, indicatorY - 5);
    
    // Add warning indicators at high speeds (updated thresholds)
    if (speedPercent > 100) {
        ctx.fillStyle = color;
        ctx.font = 'bold 10px Courier New';
        ctx.fillText('⚡', indicatorX + barWidth + 5, indicatorY + barHeight);
    }
    if (speedPercent > 150) {
        ctx.fillText('🔥', indicatorX + barWidth + 15, indicatorY + barHeight);
    }
    if (speedPercent > 200) {
        ctx.fillText('💀', indicatorX + barWidth + 25, indicatorY + barHeight);
    }
}

function drawScore() {
    ctx.fillStyle = 'white';
    ctx.font = '48px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText(game.player.score, canvas.width / 2 - 100, 60);
    
    ctx.fillStyle = '#ff3333';
    ctx.fillText(game.ai.score, canvas.width / 2 + 100, 60);
    
    ctx.fillStyle = 'white';
    ctx.font = '12px Courier New';
    ctx.fillText('PLAYER', canvas.width / 2 - 100, 80);
    ctx.fillStyle = '#ff3333';
    ctx.fillText('AI', canvas.width / 2 + 100, 80);
    
    ctx.fillStyle = '#666';
    ctx.font = '10px Courier New';
    ctx.textAlign = 'left';
    ctx.fillText(`Rally: ${game.stats.rallyLength}`, 10, 110);
    ctx.fillText(`Survival: ${game.stats.survivalTime}s`, 10, 125);
    
    ctx.textAlign = 'right';
    ctx.fillText(`Accuracy: ${game.player.accuracy}%`, canvas.width - 10, 110);
    ctx.fillText(`Speed: ${Math.round(game.ball.baseSpeed)}`, canvas.width - 10, 125);
    
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

function drawDebugInfo() {
    if (!game.isPlaying || !game.debugMode) {
        // Hide panel if not in debug mode
        const debugPanel = document.getElementById('debug-panel');
        if (debugPanel) {
            debugPanel.style.display = 'none';
        }
        return;
    }
    
    // Draw visual indicators on canvas (more prominent in debug mode)
    ctx.save();
    
    // 1. Green horizontal line showing AI's target Y position
    if (game.ai.isTracking) {
        const aiPaddleX = canvas.width - 30;
        const aiPaddleCenter = game.ai.y + game.ai.paddleHeight / 2;
        
        // Target position line (green/red based on prediction)
        ctx.strokeStyle = game.ai.willMiss ? 'rgba(255, 0, 0, 0.6)' : 'rgba(0, 255, 0, 0.6)';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(aiPaddleX - 50, game.ai.targetY);
        ctx.lineTo(aiPaddleX + PADDLE_WIDTH + 20, game.ai.targetY);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // 2. Blue dot showing ball prediction point
        ctx.fillStyle = 'rgba(0, 150, 255, 0.8)';
        ctx.beginPath();
        ctx.arc(aiPaddleX - 15, game.ai.predictedBallY, 4, 0, Math.PI * 2);
        ctx.fill();
        
        // Add small cross for exact prediction
        ctx.strokeStyle = 'rgba(0, 150, 255, 0.5)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(aiPaddleX - 20, game.ai.predictedBallY);
        ctx.lineTo(aiPaddleX - 10, game.ai.predictedBallY);
        ctx.moveTo(aiPaddleX - 15, game.ai.predictedBallY - 5);
        ctx.lineTo(aiPaddleX - 15, game.ai.predictedBallY + 5);
        ctx.stroke();
        
        // 3. Yellow line from paddle center to target (movement direction)
        ctx.strokeStyle = 'rgba(255, 255, 0, 0.4)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(aiPaddleX + PADDLE_WIDTH / 2, aiPaddleCenter);
        ctx.lineTo(aiPaddleX + PADDLE_WIDTH / 2, game.ai.targetY);
        ctx.stroke();
        
        // 4. Reaction zone indicator (subtle yellow box)
        const reactionTop = game.ai.y - AI_REACTION_DELAY;
        const reactionBottom = game.ai.y + game.ai.paddleHeight + AI_REACTION_DELAY;
        ctx.strokeStyle = 'rgba(255, 255, 0, 0.2)';
        ctx.strokeRect(aiPaddleX - 5, reactionTop, PADDLE_WIDTH + 10, reactionBottom - reactionTop);
        
        // 5. Small indicator if AI is "deciding to miss"
        if (game.ai.willMiss) {
            ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
            ctx.fillRect(aiPaddleX - 8, game.ai.y, 3, game.ai.paddleHeight);
            
            // Add "X" mark at miss position
            ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(aiPaddleX - 25, game.ai.predictedBallY - 5);
            ctx.lineTo(aiPaddleX - 15, game.ai.predictedBallY + 5);
            ctx.moveTo(aiPaddleX - 25, game.ai.predictedBallY + 5);
            ctx.lineTo(aiPaddleX - 15, game.ai.predictedBallY - 5);
            ctx.stroke();
        }
    }
    
    ctx.restore();
    
    // Update HTML debug panel (outside game area)
    const debugPanel = document.getElementById('debug-panel');
    if (debugPanel) {
        // Position panel to the right of canvas
        if (!debugPanel.style.position) {
            const canvasRect = canvas.getBoundingClientRect();
            debugPanel.style.position = 'absolute';
            debugPanel.style.left = (canvasRect.right + 20) + 'px';
            debugPanel.style.top = canvasRect.top + 'px';
            debugPanel.style.width = '220px';
            debugPanel.style.backgroundColor = 'rgba(0, 0, 0, 0.85)';
            debugPanel.style.border = '1px solid #00ff00';
            debugPanel.style.padding = '15px';
            debugPanel.style.fontFamily = 'Courier New, monospace';
            debugPanel.style.fontSize = '12px';
            debugPanel.style.color = '#ffffff';
            debugPanel.style.borderRadius = '5px';
        }
        
        debugPanel.style.display = 'block';
        
        // Calculate ball distance to AI paddle
        const ballDistance = Math.abs(canvas.width - 30 - game.ball.x);
        
        debugPanel.innerHTML = `
            <div style="color: #00ff00; font-size: 14px; margin-bottom: 10px; font-weight: bold;">
                🤖 AI DEBUG MODE
            </div>
            <div style="margin-bottom: 5px;">
                <span style="color: #888;">Status:</span> 
                <span style="color: ${game.ai.isTracking ? '#ffaa00' : '#666'};">
                    ${game.ai.isTracking ? 'TRACKING' : 'IDLE'}
                </span>
            </div>
            <div style="margin-bottom: 5px;">
                <span style="color: #888;">Accuracy:</span> 
                <span style="color: #00ff00;">${game.ai.accuracy.toFixed(0)}%</span>
            </div>
            <div style="margin-bottom: 5px;">
                <span style="color: #888;">Speed:</span> 
                <span style="color: #00ff00;">${game.ai.currentSpeed.toFixed(1)}</span>
            </div>
            <div style="margin-bottom: 5px;">
                <span style="color: #888;">Reaction:</span> 
                <span style="color: #00ff00;">${AI_REACTION_DELAY}px delay</span>
            </div>
            <div style="margin-bottom: 5px;">
                <span style="color: #888;">Target Y:</span> 
                <span style="color: #00aaff;">${Math.round(game.ai.targetY)}</span>
            </div>
            <div style="margin-bottom: 5px;">
                <span style="color: #888;">Current Y:</span> 
                <span style="color: #ffffff;">${Math.round(game.ai.y + game.ai.paddleHeight/2)}</span>
            </div>
            <div style="margin-bottom: 5px;">
                <span style="color: #888;">Ball Dist:</span> 
                <span style="color: #ffaa00;">${Math.round(ballDistance)}px</span>
            </div>
            ${game.ai.isTracking ? `
            <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #333;">
                <span style="color: #888;">Prediction:</span> 
                <span style="color: ${game.ai.willMiss ? '#ff6666' : '#66ff66'}; font-weight: bold;">
                    ${game.ai.willMiss ? 'WILL MISS' : 'WILL HIT'}
                </span>
            </div>
            ` : ''}
            <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #333; font-size: 10px; color: #666;">
                <div>Green line = AI target</div>
                <div>Blue dot = Ball prediction</div>
            </div>
        `;
    }
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
            if (typeof effects !== 'undefined') {
                effects.addScreenShake(2, 10);
            }
        } else {
            ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 50);
        }
        
        ctx.font = '32px Courier New';
        ctx.fillText('The AI Wins', canvas.width / 2, canvas.height / 2);
    }
    
    ctx.fillStyle = 'white';
    ctx.font = 'bold 24px Courier New';
    ctx.fillText('SPACE TO TRY AGAIN', canvas.width / 2, canvas.height / 2 + 100);
    
    ctx.fillStyle = '#888';
    ctx.font = '12px Courier New';
    ctx.fillText(`Rally Record: ${game.stats.longestRally} | Survived: ${game.stats.survivalTime}s`, 
        canvas.width / 2, canvas.height / 2 + 130);
}

// Frame-rate limited game loop
function gameLoop(timestamp) {
    if (!timestamp) timestamp = 0;
    const deltaTime = timestamp - lastFrameTime;
    
    if (deltaTime >= FRAME_DURATION) {
        updatePlayer();
        updateAI();
        updateBall();
        updateIceShots();
        updateStats();
        
        if (typeof effects !== 'undefined') {
            effects.updateEffects();
            // Limit particles
            if (effects.particles && effects.particles.length > window.GAME_CONFIG.PERFORMANCE_MODE.maxParticles) {
                effects.particles = effects.particles.slice(-window.GAME_CONFIG.PERFORMANCE_MODE.maxParticles);
            }
        }
        
        if (typeof aiPersonality !== 'undefined') {
            aiPersonality.updateTaunt(game);
        }
        
        draw();
        lastFrameTime = timestamp;
    }
    
    requestAnimationFrame(gameLoop);
}

function resetGame() {
    game.player.score = 0;
    game.ai.score = 0;
    game.player.y = canvas.height / 2 - PADDLE_HEIGHT / 2;
    game.ai.y = canvas.height / 2 - PADDLE_HEIGHT / 2;
    game.ai.targetY = canvas.height / 2;
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
    
    // Reset difficulty progression
    game.difficulty.speedMultiplier = 1.0;
    game.difficulty.gameStartTime = Date.now();
    game.difficulty.overallGameDifficulty = 1.0;
    game.difficulty.serveSpeed = INITIAL_BALL_SPEED;
    game.difficulty.lastRallySpeed = 1.0;
    game.difficulty.showServeIndicator = false;
    
    // Reset AI difficulty
    AI_BASE_SPEED = window.GAME_CONFIG.AI_BASE_SPEED;
    AI_REACTION_DELAY = window.GAME_CONFIG.AI_REACTION_DELAY;
    AI_IMPERFECTION = window.GAME_CONFIG.AI_IMPERFECTION;
    
    if (typeof effects !== 'undefined') {
        effects.reset();
        effects.dangerZone = false;
    }
    
    if (typeof impossibleAI !== 'undefined') {
        impossibleAI.reset();
    }
    
    if (typeof aiPersonality !== 'undefined') {
        aiPersonality.triggerTaunt('game_start', { attempts: game.attempts });
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
                if (game.practiceMode) {
                    AI_IMPERFECTION = 0.95;
                    AI_BASE_SPEED = 7;
                    AI_REACTION_DELAY = 10;
                } else {
                    AI_IMPERFECTION = window.GAME_CONFIG.AI_IMPERFECTION;
                    AI_BASE_SPEED = window.GAME_CONFIG.AI_BASE_SPEED;
                    AI_REACTION_DELAY = window.GAME_CONFIG.AI_REACTION_DELAY;
                }
            }
            break;
        case 'm':
        case 'M':
            if (typeof enhancedAudio !== 'undefined') {
                enhancedAudio.toggleMute();
            }
            break;
        case 'd':
        case 'D':
            game.debugMode = !game.debugMode;
            console.log('AI Debug Mode:', game.debugMode ? 'ON' : 'OFF');
            // Hide debug panel when turning off debug mode
            const debugPanel = document.getElementById('debug-panel');
            if (debugPanel && !game.debugMode) {
                debugPanel.style.display = 'none';
            }
            break;
        case 'e':
        case 'E':
            if (game.isPlaying) {
                fireIceShot('player');
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
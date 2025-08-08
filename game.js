// DEVELOPMENT BRANCH
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const PADDLE_WIDTH = 10;
const PADDLE_HEIGHT = 80;
const BALL_SIZE = 10;
const PADDLE_SPEED = 5;
const INITIAL_BALL_SPEED = 5;
const BALL_SPEED_INCREMENT = 0.5;
const WINNING_SCORE = 7;

const game = {
    state: 'ready',
    isPlaying: false,
    isGameOver: false,
    showSettings: false,
    winner: null,
    practiceMode: false,
    
    player: {
        y: canvas.height / 2 - PADDLE_HEIGHT / 2,
        score: 0,
        up: false,
        down: false,
        paddleHeight: PADDLE_HEIGHT,
        accuracy: 100,
        hits: 0,
        misses: 0
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
        survivalTime: 0,
        startTime: null,
        totalLosses: 0,
        bestScore: 0,
        consecutiveLosses: 0,
        impossibleRating: 0
    },
    
    effects: {
        screenShake: 0,
        dangerZone: false,
        playerFlash: 0,
        celebration: false
    }
};

function loadStats() {
    const saved = localStorage.getItem('impossiblePongStats');
    if (saved) {
        const stats = JSON.parse(saved);
        game.stats.totalLosses = stats.totalLosses || 0;
        game.stats.bestScore = stats.bestScore || 0;
    }
}

function saveStats() {
    localStorage.setItem('impossiblePongStats', JSON.stringify({
        totalLosses: game.stats.totalLosses,
        bestScore: game.stats.bestScore
    }));
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
            game.effects.dangerZone = true;
        }
    }
}

function updatePlayer() {
    const speed = PADDLE_SPEED;
    if (game.player.up && game.player.y > 0) {
        game.player.y -= speed;
    }
    if (game.player.down && game.player.y < canvas.height - game.player.paddleHeight) {
        game.player.y += speed;
    }
    
    const ballApproaching = game.ball.speedX < 0 && game.ball.x < canvas.width / 2;
    if (ballApproaching) {
        const paddleCenter = game.player.y + game.player.paddleHeight / 2;
        const ballCenter = game.ball.y + BALL_SIZE / 2;
        const inRange = Math.abs(paddleCenter - ballCenter) < game.player.paddleHeight / 2 + 10;
        
        if (inRange) {
            game.effects.playerFlash = 10;
        }
    }
}

function updateAI() {
    impossibleAI.update(
        game.ai, 
        game.ball, 
        canvas, 
        game.ai.paddleHeight,
        game.player.score,
        game.ai.score,
        game.stats.rallyLength
    );
}

function checkBallCollision() {
    if (game.ball.y <= 0 || game.ball.y >= canvas.height - BALL_SIZE) {
        game.ball.speedY = -game.ball.speedY;
        audioManager.play('wall');
    }
    
    const ballLeft = game.ball.x;
    const ballRight = game.ball.x + BALL_SIZE;
    const ballTop = game.ball.y;
    const ballBottom = game.ball.y + BALL_SIZE;
    
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
        
        game.player.hits++;
        game.stats.rallyLength++;
        audioManager.play('paddle');
        updateAccuracy();
    }
    
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
        audioManager.play('paddle');
    }
    
    if (game.ball.x < 0) {
        game.ai.score++;
        game.player.misses++;
        updateAccuracy();
        
        if (game.ai.score >= WINNING_SCORE) {
            gameOver(false);
        } else {
            impossibleAI.showTaunt();
            game.effects.screenShake = 20;
            audioManager.play('score');
            resetBall(true);
        }
    }
    
    if (game.ball.x > canvas.width) {
        game.player.score++;
        impossibleAI.increaseDifficulty();
        
        if (game.player.score >= WINNING_SCORE) {
            gameOver(true);
        } else {
            audioManager.play('score');
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
    
    checkBallCollision();
}

function updateStats() {
    if (game.isPlaying && !game.isGameOver) {
        const currentTime = Date.now();
        if (game.stats.startTime) {
            game.stats.survivalTime = Math.floor((currentTime - game.stats.startTime) / 1000);
        }
        
        const maxPossibleScore = WINNING_SCORE - 1;
        const playerProgress = game.player.score / maxPossibleScore;
        const aiProgress = game.ai.score / maxPossibleScore;
        game.stats.impossibleRating = Math.round(playerProgress * 100 / (playerProgress + aiProgress + 0.01));
    }
}

function updateEffects() {
    if (game.effects.screenShake > 0) {
        game.effects.screenShake--;
        canvas.style.transform = `translateX(${Math.random() * 10 - 5}px)`;
        if (game.effects.screenShake === 0) {
            canvas.style.transform = 'translateX(0)';
        }
    }
    
    if (game.effects.playerFlash > 0) {
        game.effects.playerFlash--;
    }
}

function gameOver(playerWon) {
    game.isGameOver = true;
    game.isPlaying = false;
    game.winner = playerWon ? 'PLAYER' : 'AI';
    
    if (playerWon) {
        game.effects.celebration = true;
        audioManager.play('gameOver');
    } else {
        game.stats.totalLosses++;
        game.stats.consecutiveLosses++;
        if (game.stats.consecutiveLosses >= 5 && !game.practiceMode) {
            setTimeout(() => {
                if (confirm("You've lost 5 times in a row. Would you like to try Practice Mode?")) {
                    activatePracticeMode();
                }
            }, 2000);
        }
    }
    
    if (game.player.score > game.stats.bestScore) {
        game.stats.bestScore = game.player.score;
    }
    
    saveStats();
}

function activatePracticeMode() {
    game.practiceMode = true;
    impossibleAI.setPracticeMode(true);
    resetGame();
}

function deactivatePracticeMode() {
    game.practiceMode = false;
    impossibleAI.setPracticeMode(false);
    game.stats.consecutiveLosses = 0;
}

function drawBackground() {
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    if (game.effects.dangerZone) {
        ctx.fillStyle = 'rgba(255, 0, 0, 0.05)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
}

function drawPaddles() {
    if (game.effects.playerFlash > 0) {
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#00ff00';
    }
    ctx.fillStyle = 'white';
    ctx.fillRect(20, game.player.y, PADDLE_WIDTH, game.player.paddleHeight);
    ctx.shadowBlur = 0;
    
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#ff0000';
    ctx.fillStyle = '#ff3333';
    ctx.fillRect(canvas.width - 30, game.ai.y, PADDLE_WIDTH, game.ai.paddleHeight);
    ctx.shadowBlur = 0;
    
    if (impossibleAI.boostActive) {
        ctx.fillStyle = 'rgba(255, 255, 0, 0.5)';
        ctx.fillRect(canvas.width - 35, game.ai.y - 5, PADDLE_WIDTH + 10, game.ai.paddleHeight + 10);
    }
}

function drawBall() {
    if (game.effects.dangerZone) {
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
}

function drawGameInfo() {
    ctx.fillStyle = '#666';
    ctx.font = '12px Courier New';
    ctx.textAlign = 'left';
    
    ctx.fillText(`Best Score: ${game.stats.bestScore}`, 10, 20);
    ctx.fillText(`Rally: ${game.stats.rallyLength}`, 10, 35);
    ctx.fillText(`Survival: ${game.stats.survivalTime}s`, 10, 50);
    
    ctx.textAlign = 'right';
    ctx.fillText(`Accuracy: ${game.player.accuracy}%`, canvas.width - 10, 20);
    ctx.fillText(`AI Confidence: ${impossibleAI.confidence}%`, canvas.width - 10, 35);
    ctx.fillText(`Impossible Rating: ${game.stats.impossibleRating}%`, canvas.width - 10, 50);
    
    if (impossibleAI.perfectModeUnlocked) {
        ctx.fillStyle = '#ff0000';
        ctx.font = '10px Courier New';
        ctx.textAlign = 'center';
        ctx.fillText('PERFECT MODE ACTIVE', canvas.width / 2, 100);
    }
    
    if (game.practiceMode) {
        ctx.fillStyle = '#ffff00';
        ctx.font = '16px Courier New';
        ctx.textAlign = 'center';
        ctx.fillText("PRACTICE MODE - Doesn't Count!", canvas.width / 2, canvas.height - 20);
    }
    
    if (game.effects.dangerZone) {
        ctx.fillStyle = '#ff0000';
        ctx.font = '14px Courier New';
        ctx.textAlign = 'center';
        ctx.fillText('DANGER ZONE', canvas.width / 2, 120);
    }
}

function drawTaunt() {
    if (impossibleAI.currentTaunt && impossibleAI.tauntTimer > 0) {
        const alpha = Math.min(1, impossibleAI.tauntTimer / 30);
        ctx.fillStyle = `rgba(255, 51, 51, ${alpha})`;
        ctx.font = '20px Courier New';
        ctx.textAlign = 'center';
        ctx.fillText(impossibleAI.currentTaunt, canvas.width / 2, canvas.height - 50);
    }
}

function drawTitle() {
    if (!game.isPlaying && !game.isGameOver) {
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
        ctx.fillText(`Total Losses: ${game.stats.totalLosses}`, canvas.width / 2, 300);
        ctx.fillText(`Best Score Ever: ${game.stats.bestScore}`, canvas.width / 2, 320);
    }
}

function drawGameOver() {
    if (game.isGameOver) {
        if (game.winner === 'PLAYER') {
            ctx.fillStyle = '#00ff00';
            ctx.font = '48px Courier New';
            ctx.textAlign = 'center';
            ctx.fillText('IMPOSSIBLE!', canvas.width / 2, canvas.height / 2 - 50);
            ctx.fillText('You beat the AI!', canvas.width / 2, canvas.height / 2);
            
            if (game.effects.celebration) {
                const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff'];
                for (let i = 0; i < 5; i++) {
                    ctx.fillStyle = colors[i];
                    ctx.fillRect(
                        Math.random() * canvas.width,
                        Math.random() * canvas.height,
                        10, 10
                    );
                }
            }
        } else {
            ctx.fillStyle = '#ff3333';
            ctx.font = '48px Courier New';
            ctx.textAlign = 'center';
            ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 50);
            ctx.font = '32px Courier New';
            ctx.fillText('The AI Wins', canvas.width / 2, canvas.height / 2);
        }
        
        ctx.fillStyle = 'white';
        ctx.font = '20px Courier New';
        ctx.fillText('Press Space to Try Again', canvas.width / 2, canvas.height / 2 + 50);
    }
}

function draw() {
    drawBackground();
    drawCenterLine();
    drawPaddles();
    drawBall();
    drawScore();
    drawGameInfo();
    drawTaunt();
    drawTitle();
    drawGameOver();
}

function gameLoop() {
    updatePlayer();
    updateAI();
    updateBall();
    updateStats();
    updateEffects();
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
    game.isGameOver = false;
    game.winner = null;
    game.stats.rallyLength = 0;
    game.stats.survivalTime = 0;
    game.stats.startTime = Date.now();
    game.stats.impossibleRating = 0;
    game.effects.dangerZone = false;
    game.effects.celebration = false;
    game.ball.maxSpeedReached = INITIAL_BALL_SPEED;
    
    impossibleAI.reset();
    resetBall(true);
}

function updateStatsDisplay() {
    const statsDiv = document.getElementById('statsDisplay');
    if (statsDiv) {
        statsDiv.innerHTML = `Losses: ${game.stats.totalLosses} | Best: ${game.stats.bestScore} | ${game.practiceMode ? 'PRACTICE MODE' : ''}`;
    }
}

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
                if (game.practiceMode && game.isGameOver) {
                    deactivatePracticeMode();
                }
                game.isPlaying = true;
                resetGame();
            } else {
                game.isPlaying = !game.isPlaying;
            }
            break;
        case 'p':
        case 'P':
            if (!game.isPlaying) {
                if (game.practiceMode) {
                    deactivatePracticeMode();
                } else {
                    activatePracticeMode();
                }
                updateStatsDisplay();
            }
            break;
        case 'm':
        case 'M':
            audioManager.toggleMute();
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

loadStats();
updateStatsDisplay();
gameLoop();
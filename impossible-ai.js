// AI module - canvas will be passed as parameter

class ImpossibleAI {
    constructor() {
        this.mode = 'impossible';
        this.confidence = 100;
        this.boostAvailable = true;
        this.boostActive = false;
        this.boostTimer = 0;
        this.perfectModeUnlocked = false;
        this.targetY = null;
        this.lastPrediction = 0;
        this.speedMultiplier = 1;
        this.practiceMode = false;
        this.taunts = [
            "Too slow!",
            "Predictable.",
            "Try harder.",
            "Is that all?",
            "Child's play.",
            "Calculating next victory...",
            "Human error detected.",
            "Resistance is futile."
        ];
        this.currentTaunt = null;
        this.tauntTimer = 0;
    }

    setPracticeMode(enabled) {
        this.practiceMode = enabled;
        this.speedMultiplier = enabled ? 0.75 : 1;
    }

    update(paddle, ball, canvasObj, paddleHeight, playerScore, aiScore, rallyLength) {
        const baseSpeed = this.practiceMode ? 6 : 10;
        const reactionSpeed = baseSpeed * this.speedMultiplier;
        
        if (this.perfectModeUnlocked && !this.practiceMode) {
            this.perfectTracking(paddle, ball, canvasObj, paddleHeight, reactionSpeed * 1.5);
        } else {
            this.advancedTracking(paddle, ball, canvasObj, paddleHeight, reactionSpeed);
        }
        
        if (this.boostActive) {
            this.boostTimer--;
            if (this.boostTimer <= 0) {
                this.boostActive = false;
            }
        }
        
        if (rallyLength > 5 && this.boostAvailable && !this.boostActive && Math.random() < 0.3) {
            this.activateBoost();
        }
        
        this.updateConfidence(playerScore, aiScore);
        
        if (this.tauntTimer > 0) {
            this.tauntTimer--;
            if (this.tauntTimer === 0) {
                this.currentTaunt = null;
            }
        }
    }

    perfectTracking(paddle, ball, canvasObj, paddleHeight, speed) {
        const futureBallY = this.predictExactBallPosition(ball, canvasObj.width - 50, canvasObj.height);
        const paddleCenter = paddle.y + paddleHeight / 2;
        const targetCenter = futureBallY;
        
        const diff = targetCenter - paddleCenter;
        const moveSpeed = this.boostActive ? speed * 2 : speed;
        
        if (Math.abs(diff) > 2) {
            if (diff > 0) {
                paddle.y = Math.min(paddle.y + moveSpeed, canvasObj.height - paddleHeight);
            } else {
                paddle.y = Math.max(paddle.y - moveSpeed, 0);
            }
        }
    }

    advancedTracking(paddle, ball, canvasObj, paddleHeight, speed) {
        if (ball.speedX < 0) {
            const centerY = canvasObj.height / 2 - paddleHeight / 2;
            const diff = centerY - paddle.y;
            if (Math.abs(diff) > 5) {
                paddle.y += Math.sign(diff) * Math.min(speed * 0.5, Math.abs(diff));
            }
            return;
        }
        
        const predictedY = this.predictBallPosition(ball, canvas.width - 50, canvas.height);
        const optimalY = this.calculateOptimalPosition(predictedY, paddleHeight, canvas.height);
        
        const paddleCenter = paddle.y + paddleHeight / 2;
        const targetCenter = optimalY + paddleHeight / 2;
        
        const diff = targetCenter - paddleCenter;
        const moveSpeed = this.boostActive ? speed * 2 : speed;
        
        if (Math.abs(diff) > 3) {
            if (diff > 0) {
                paddle.y = Math.min(paddle.y + moveSpeed, canvasObj.height - paddleHeight);
            } else {
                paddle.y = Math.max(paddle.y - moveSpeed, 0);
            }
        }
    }

    predictBallPosition(ball, targetX, canvasHeight) {
        let predictedY = ball.y;
        let yVelocity = ball.speedY;
        const steps = Math.abs(targetX - ball.x) / Math.abs(ball.speedX);
        
        for (let i = 0; i < steps; i++) {
            predictedY += yVelocity;
            if (predictedY <= 0 || predictedY >= canvasHeight - 10) {
                yVelocity = -yVelocity;
                predictedY = Math.max(0, Math.min(canvasHeight - 10, predictedY));
            }
        }
        
        return predictedY;
    }

    predictExactBallPosition(ball, targetX, canvasHeight) {
        let x = ball.x;
        let y = ball.y;
        let vx = ball.speedX;
        let vy = ball.speedY;
        
        while (Math.abs(x - targetX) > 5) {
            x += vx > 0 ? 1 : -1;
            y += vy * (1 / Math.abs(vx));
            
            if (y <= 0 || y >= canvasHeight - 10) {
                vy = -vy;
                y = Math.max(0, Math.min(canvasHeight - 10, y));
            }
        }
        
        return y;
    }

    calculateOptimalPosition(targetY, paddleHeight, canvasHeight) {
        const zones = [0, canvasHeight * 0.25, canvasHeight * 0.75, canvasHeight - paddleHeight];
        let optimalY = targetY - paddleHeight / 2;
        
        if (!this.practiceMode) {
            const cornerBias = Math.random() < 0.6 ? 1 : 0;
            if (cornerBias) {
                if (targetY < canvasHeight / 2) {
                    optimalY = Math.min(optimalY, zones[1]);
                } else {
                    optimalY = Math.max(optimalY, zones[2]);
                }
            }
        }
        
        return Math.max(0, Math.min(canvasHeight - paddleHeight, optimalY));
    }

    activateBoost() {
        this.boostAvailable = false;
        this.boostActive = true;
        this.boostTimer = 30;
        setTimeout(() => {
            this.boostAvailable = true;
        }, 5000);
    }

    updateConfidence(playerScore, aiScore) {
        const scoreDiff = aiScore - playerScore;
        this.confidence = Math.max(0, Math.min(100, 50 + scoreDiff * 10));
        
        if (playerScore >= 3 && !this.perfectModeUnlocked && !this.practiceMode) {
            this.perfectModeUnlocked = true;
            this.showTaunt("PERFECT MODE ACTIVATED");
        }
    }

    showTaunt(customTaunt = null) {
        if (customTaunt) {
            this.currentTaunt = customTaunt;
        } else {
            this.currentTaunt = this.taunts[Math.floor(Math.random() * this.taunts.length)];
        }
        this.tauntTimer = 120;
    }

    getReturnAngle(paddleY, ballY, paddleHeight) {
        const hitPosition = (ballY - paddleY) / paddleHeight;
        
        if (!this.practiceMode) {
            if (hitPosition < 0.3) return -1.5;
            if (hitPosition > 0.7) return 1.5;
        }
        
        return (hitPosition - 0.5) * 3;
    }

    reset() {
        this.boostAvailable = true;
        this.boostActive = false;
        this.boostTimer = 0;
        this.perfectModeUnlocked = false;
        this.targetY = null;
        this.currentTaunt = null;
        this.tauntTimer = 0;
    }

    increaseDifficulty() {
        this.speedMultiplier = Math.min(2, this.speedMultiplier * 1.05);
    }
}

const impossibleAI = new ImpossibleAI();
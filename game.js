// Game states
const GAME_STATES = {
    INTRO_NARRATION: 'intro_narration',
    TITLE_SEQUENCE: 'title_sequence',
    TITLE_SCREEN: 'title_screen',
    PLAYING: 'playing',
    GAME_OVER: 'game_over',
    VICTORY: 'victory'
};

// Level configurations
const LEVEL_CONFIGS = {
    0: { // Level 1
        correctPaths: ['d', 'w', 'a'], // right, straight, left
        shadowGuardPath: 'w', // shadow guard appears on straight path
        attempts: 3
    },
    1: { // Level 2
        correctPaths: ['w', 'a', 'd'], // straight, left, right
        shadowGuardPath: 'd', // shadow guard appears on right path
        attempts: 3
    },
    2: { // Level 3
        correctPaths: ['a', 'w'], // left, straight
        shadowGuardPath: 'a', // shadow guard appears on left path
        attempts: 3
    }
};

let currentState = GAME_STATES.INTRO_NARRATION;
let lightBars = 3;
let currentLevel = 0;
let currentAttempt = 0;
let gameOver = false;
let gameWon = false;
let showShadowGuard = false;
let isTransitioning = false;

// DOM Elements
const narrationContainer = document.getElementById('narration');
const narrationTexts = document.querySelectorAll('.narration-text p');
const titleSequence = document.getElementById('title-sequence');
const titleTexts = document.querySelectorAll('.title-text');
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Audio elements
const footstepSound = document.getElementById('footstep-sound');
const wrongSound = document.getElementById('wrong-sound');
const correctSound = document.getElementById('correct-sound');

// Background images
const backgrounds = {
    start: "assets/startBG.tiff",
    level1: "assets/1.tiff",
    level2: "assets/2.tiff",
    level3: "assets/3.tiff",
    fail: "assets/failbg.tiff"
};

// Portal animation frames
const portalFrames = [
    "assets/portal1.jpeg",
    "assets/portal2.jpeg",
    "assets/portal3.jpeg",
    "assets/portal4.jpeg",
    "assets/portal5.jpeg",
    "assets/portal6.jpeg",
    "assets/portal7.jpeg"
];

// Load images
const bgImage = new Image();
bgImage.src = backgrounds.start;

const portalImg = new Image();
let currentFrame = 0;
let frameCounter = 0;

// Shadow guard image
const shadowGuardImg = new Image();
shadowGuardImg.src = "assets/sg0.tiff";

let currentNarrationIndex = 0;

function advanceNarration() {
    if (currentNarrationIndex < narrationTexts.length) {
        narrationTexts[currentNarrationIndex].classList.remove('current-text');
        currentNarrationIndex++;
        
        if (currentNarrationIndex < narrationTexts.length) {
            narrationTexts[currentNarrationIndex].classList.add('current-text');
        } else {
            narrationContainer.classList.add('fade-out');
            setTimeout(() => {
                narrationContainer.style.display = 'none';
                startTitleSequence();
            }, 1000);
        }
    }
}

function startTitleSequence() {
    currentState = GAME_STATES.TITLE_SEQUENCE;
    titleSequence.style.opacity = '1';
    titleSequence.style.pointerEvents = 'auto';
    
    let currentTitleIndex = 0;
    
    function showNextTitle() {
        if (currentTitleIndex < titleTexts.length) {
            titleTexts[currentTitleIndex].classList.add('visible');
            currentTitleIndex++;
            setTimeout(showNextTitle, 1000);
        } else {
            setTimeout(() => {
                titleSequence.classList.add('fade-out');
                setTimeout(() => {
                    titleSequence.style.display = 'none';
                    canvas.style.display = 'block';
                    currentState = GAME_STATES.TITLE_SCREEN;
                    draw();
                }, 1000);
            }, 2000);
        }
    }
    
    showNextTitle();
}

function handleChoice(direction) {
    if (isTransitioning) return;
    
    isTransitioning = true;
    const currentConfig = LEVEL_CONFIGS[currentLevel];
    
    // Play footstep sound
    footstepSound.currentTime = 0;
    footstepSound.play();
    
    // Change to start background
    bgImage.src = backgrounds.start;
    
    // Check if this is the shadow guard path
    if (direction === currentConfig.shadowGuardPath) {
        lightBars -= 2;
        showShadowGuard = true;
        wrongSound.play();
    }
    
    // Wait for footstep sound to finish
    footstepSound.onended = () => {
        // Return to level background
        bgImage.src = backgrounds[`level${currentLevel + 1}`];
        showShadowGuard = false;
        
        // Check if choice was correct
        if (direction === currentConfig.correctPaths[currentAttempt]) {
            currentAttempt++;
            correctSound.play();
            
            if (currentAttempt >= currentConfig.attempts) {
                // Level complete
                currentLevel++;
                currentAttempt = 0;
                
                if (currentLevel >= 3) {
                    currentState = GAME_STATES.VICTORY;
                }
            }
        } else {
            wrongSound.play();
        }
        
        isTransitioning = false;
    };
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    switch (currentState) {
        case GAME_STATES.TITLE_SCREEN:
            ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
            ctx.fillStyle = "white";
            ctx.font = "24px 'Press Start 2P'";
            ctx.textAlign = "center";
            ctx.fillText("Press any key to start", canvas.width/2, canvas.height - 50);
            break;

        case GAME_STATES.PLAYING:
            ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
            drawHUD();
            
            // Draw choice text
            ctx.fillStyle = "white";
            ctx.font = "20px 'Press Start 2P'";
            ctx.textAlign = "center";
            ctx.fillText("An intersection! I think I will go...", canvas.width/2, canvas.height/2 - 40);
            ctx.fillText("Left (A) / Straight (W) / Right (D)", canvas.width/2, canvas.height/2 + 10);
            
            if (showShadowGuard) {
                ctx.drawImage(shadowGuardImg, canvas.width/2 - 100, canvas.height/2 - 100, 200, 200);
            }
            break;

        case GAME_STATES.GAME_OVER:
            ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
            ctx.fillStyle = "white";
            ctx.font = "40px 'Press Start 2P'";
            ctx.textAlign = "center";
            ctx.fillText("Game Over", canvas.width/2, canvas.height/2);
            break;

        case GAME_STATES.VICTORY:
            ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
            ctx.drawImage(portalImg, canvas.width/2 - 100, canvas.height/2 - 100, 200, 200);
            
            // Animate portal
            frameCounter++;
            if (frameCounter % 8 === 0) {
                currentFrame = (currentFrame + 1) % portalFrames.length;
                portalImg.src = portalFrames[currentFrame];
            }
            break;
    }

    if (currentState !== GAME_STATES.INTRO_NARRATION) {
        requestAnimationFrame(draw);
    }
}

function drawHUD() {
    // Draw light bars (stars) in top right
    const starSize = 30;
    const padding = 10;
    const startX = canvas.width - (starSize * 3 + padding * 2);
    const startY = padding;

    for (let i = 0; i < 3; i++) {
        ctx.fillStyle = i < lightBars ? "yellow" : "gray";
        ctx.beginPath();
        ctx.moveTo(startX + i * (starSize + padding) + starSize/2, startY);
        for (let j = 0; j < 5; j++) {
            const angle = (j * 4 * Math.PI) / 5 - Math.PI / 2;
            const x = startX + i * (starSize + padding) + starSize/2 + Math.cos(angle) * starSize/2;
            const y = startY + starSize/2 + Math.sin(angle) * starSize/2;
            ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
    }
}

// Event listeners
document.addEventListener("keydown", (e) => {
    if (currentState === GAME_STATES.INTRO_NARRATION) {
        if (e.key === 'Enter' || e.key === 'Return') {
            advanceNarration();
        }
        return;
    }

    if (currentState === GAME_STATES.TITLE_SCREEN) {
        currentState = GAME_STATES.PLAYING;
        bgImage.src = backgrounds.level1;
        return;
    }

    if (currentState !== GAME_STATES.PLAYING) return;

    let direction = null;
    if (e.key.toLowerCase() === 'a') direction = 'a';
    if (e.key.toLowerCase() === 'w') direction = 'w';
    if (e.key.toLowerCase() === 'd') direction = 'd';

    if (direction) {
        handleChoice(direction);
    }
});

// Start the game
draw();

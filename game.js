// Game states
const GAME_STATES = {
    INTRO_NARRATION: 'intro_narration',
    TITLE_SCREEN: 'title_screen',
    LORE_SLIDES: 'lore_slides',
    PLAYING: 'playing',
    GAME_OVER: 'game_over',
    VICTORY: 'victory'
};

// Level configurations
const LEVEL_CONFIGS = {
    0: { // Level 1
        correctPaths: ['d', 'w', 'a'], // right, straight, left
        shadowGuardPath: 'w', // shadow guard appears on straight path
        attempts: 3,
        dialogue: "Which way will Luma go? LEFT, RIGHT, or FORWARD?",
        guardImage: 'SG1.png'  // Updated to png
    },
    1: { // Level 2
        correctPaths: ['w', 'a', 'd'], // straight, left, right
        shadowGuardPath: 'd', // shadow guard appears on right path
        attempts: 3,
        dialogue: "Which way will Luma go? LEFT, RIGHT, or FORWARD?",
        guardImage: 'SG2.png'  // Updated to png
    },
    2: { // Level 3
        correctPaths: ['a', 'w'], // left, straight
        shadowGuardPath: 'a', // shadow guard appears on left path
        attempts: 3,
        dialogue: "Which way will Luma go? LEFT, RIGHT, or FORWARD?",
        guardImage: 'SG3.png'  // Updated to png
    }
};

// Expression mapping based on light bars
const EXPRESSION_MAPPING = {
    5: 'happy',
    4: 'worry',
    3: 'worry',
    2: 'unhappy',
    1: 'unhappy',
    0: null
};

let currentState = GAME_STATES.PLAYING;
let lightBars = 5;
let currentLevel = 0;
let currentAttempt = 0;
let gameOver = false;
let gameWon = false;
let showShadowGuard = false;
let isInputLocked = false;
let bgImage = new Image();
let shadowGuardImg = new Image();

// DOM Elements
const narrationContainer = document.getElementById('narration');
const narrationTexts = document.querySelectorAll('.narration-text p');
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const dialogueBox = document.getElementById('dialogue-box');
const dialogueText = document.getElementById('dialogue-text');

// Audio elements
const footstepSound = document.getElementById('footstep-sound');

// Image loading
const imageCache = {};

function loadImage(path) {
    return new Promise((resolve, reject) => {
        if (imageCache[path]) {
            console.debug('Image cache hit:', path);
            resolve(imageCache[path]);
            return;
        }

        const img = new Image();
        img.onload = () => {
            console.debug('Image loaded:', path);
            imageCache[path] = img;
            resolve(img);
        };
        img.onerror = (e) => {
            console.error('Failed to load image:', path);
            // Create a placeholder image (solid color)
            const placeholder = document.createElement('canvas');
            placeholder.width = 800;
            placeholder.height = 600;
            const pctx = placeholder.getContext('2d');
            pctx.fillStyle = '#222';
            pctx.fillRect(0, 0, 800, 600);
            pctx.fillStyle = '#fff';
            pctx.font = '20px sans-serif';
            pctx.fillText('Image not found', 300, 300);
            imageCache[path] = placeholder;
            resolve(placeholder);
        };
        img.src = path;
    });
}

// Game variables
let currentTitleIndex = 0;
let currentPortalFrame = 0;
let portalAnimationTimer;

// Asset paths
const assetPaths = {
    levels: [
        "assets/level 1/1bg.png",
        "assets/level 2/2bg.png",
        "assets/level 3/3bg.png"
    ],
    guards: [
        "assets/shadow guards/SG0.png",
        "assets/shadow guards/SG1.png",
        "assets/shadow guards/SG2.png",
        "assets/shadow guards/SG3.png"
    ],
    portal: [
        "assets/portal/portal1.png",
        "assets/portal/portal2.png",
        "assets/portal/portal3.png",
        "assets/portal/portal4.png",
        "assets/portal/portal5.png",
        "assets/portal/portal6.png",
        "assets/portal/portal7.png"
    ],
    expressions: {
        happy: "assets/emotions/happy.png",
        worry: "assets/emotions/worry.png",
        unhappy: "assets/emotions/unhappy.png"
    },
    fail: "assets/failbg.png"
};

// Preload images
Promise.all([
    ...assetPaths.levels.map(loadImage),
    ...assetPaths.guards.map(loadImage),
    ...assetPaths.portal.map(loadImage),
    loadImage(assetPaths.expressions.happy),
    loadImage(assetPaths.expressions.worry),
    loadImage(assetPaths.expressions.unhappy),
    loadImage(assetPaths.fail)
]).then(() => {
    console.log("All assets loaded");
    initGame();
    updateState(GAME_STATES.INTRO_NARRATION);
}).catch(error => console.error("Error loading assets:", error));

// Game functions
function startGame() {
    // Start with narration
    updateState(GAME_STATES.INTRO_NARRATION);
}

function resetGame() {
    lightBars = 5;
    currentLevel = 0;
    currentAttempt = 0;
    gameOver = false;
    gameWon = false;
    currentState = GAME_STATES.PLAYING;
    bgImage.src = assetPaths.levels[0];
    draw();
}

function showGuard(level) {
    console.debug('showGuard called', {level, guardPath: assetPaths.guards[level]});
    showShadowGuard = true;
    shadowGuardImg.src = `assets/shadow guards/${LEVEL_CONFIGS[level].guardImage}`;
    isInputLocked = true;
    draw();
}

function handleChoice(direction) {
    console.debug('handleChoice', {direction, currentLevel, currentAttempt, lightBars});
    if (isInputLocked) return;

    const currentConfig = LEVEL_CONFIGS[currentLevel];

    // Play footstep sound
    footstepSound.currentTime = 0;
    footstepSound.play();

    // Lock input until footstep sound ends
    isInputLocked = true;
    footstepSound.onended = () => {
        isInputLocked = false;
        // Check if choice was correct
        if (direction === currentConfig.correctPaths[currentAttempt]) {
            currentAttempt++;

            if (currentAttempt >= currentConfig.attempts) {
                // Level complete
                currentLevel++;
                currentAttempt = 0;

                if (currentLevel >= 3) {
                    currentState = GAME_STATES.VICTORY;
                    startVictorySequence();
                } else {
                    // Move to the next level
                    bgImage.src = assetPaths.levels[currentLevel];
                    dialogueText.textContent = LEVEL_CONFIGS[currentLevel].dialogue;
                    draw();
                }
            } else {
                // Continue on current level
                draw();
            }
        } else {
            // Wrong choice - reduce light bars based on level
            lightBars -= (currentLevel === 2) ? 2 : 1;

            if (lightBars <= 0) {
                // Game over
                currentState = GAME_STATES.GAME_OVER;
                bgImage.src = assetPaths.fail;
                draw();
            } else {
                // Show shadow guard
                showGuard(currentLevel);
            }
        }
        footstepSound.onended = null; // Clean up
    };
}

function startVictorySequence() {
    let frameIndex = 0;
    portalAnimationTimer = setInterval(() => {
        bgImage.src = assetPaths.portal[frameIndex];
        frameIndex = (frameIndex + 1) % assetPaths.portal.length;
        draw();
    }, 200);

    setTimeout(() => {
        clearInterval(portalAnimationTimer);
        // Show victory message
        document.getElementById('victory-message').classList.remove('hidden');
        
        // Reset game after delay
        setTimeout(() => {
            document.getElementById('victory-message').classList.add('hidden');
            resetGame();
        }, 5000);
    }, assetPaths.portal.length * 200);
}

function drawScene() {
    console.debug('drawScene called', {bgImage, complete: bgImage.complete, width: bgImage.naturalWidth});
    if (bgImage && bgImage.complete && bgImage.naturalWidth > 0) {
        // Draw background image to fit canvas exactly
        ctx.drawImage(bgImage, 0, 0, 800, 600);
    } else {
        // Black background when no image
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, 800, 600);
    }
}

function drawHUD() {
    // Draw star icon in the top-right to show level number
    ctx.fillStyle = "gold";
    ctx.font = "20px 'Press Start 2P'";
    ctx.textAlign = "right";
    ctx.fillText(`Level ${currentLevel + 1}`, 790, 30);

    // Draw light bars (stars) in top left
    const starSize = 20;
    const padding = 5;
    const startX = 10;
    const startY = 10;

    for (let i = 0; i < 5; i++) {
        ctx.fillStyle = i < lightBars ? "yellow" : "gray";
        ctx.beginPath();
        ctx.moveTo(startX + i * (starSize + padding) + starSize / 2, startY);
        for (let j = 0; j < 5; j++) {
            const angle = (j * 4 * Math.PI) / 5 - Math.PI / 2;
            const x = startX + i * (starSize + padding) + starSize / 2 + Math.cos(angle) * starSize / 2;
            const y = startY + starSize / 2 + Math.sin(angle) * starSize / 2;
            ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
    }

    // Update Luma's expression based on light bars
    if (lightBars > 0) {
        const expression = EXPRESSION_MAPPING[lightBars];
        if (expression) {
            const expressionImg = imageCache[assetPaths.expressions[expression]];
            if (expressionImg) {
                // Update portrait div background
                const portraitDiv = document.getElementById('luma-portrait');
                portraitDiv.style.backgroundImage = `url('${assetPaths.expressions[expression]}')`;
                portraitDiv.style.backgroundSize = 'cover';
                portraitDiv.style.backgroundPosition = 'center';
                
                // Also draw on canvas for backup
                ctx.drawImage(expressionImg, 10, 500, 80, 80);
            }
        }
    }
}

function draw() {
    // Clear with black background
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    switch (currentState) {
        case GAME_STATES.PLAYING:
            drawScene();
            drawHUD();

            if (showShadowGuard) {
                if (shadowGuardImg && shadowGuardImg.complete && shadowGuardImg.naturalWidth > 0) {
                    ctx.drawImage(shadowGuardImg, canvas.width / 2 - 100, canvas.height / 2 - 100, 200, 200);
                } else {
                    ctx.fillStyle = '#f00';
                    ctx.font = '16px sans-serif';
                    ctx.fillText('Guard image missing', canvas.width / 2 - 60, canvas.height / 2);
                }
                
                // Show input freeze message
                ctx.fillStyle = "white";
                ctx.font = "16px 'Press Start 2P'";
                ctx.textAlign = "center";
                ctx.fillText("Press ENTER to continue...", canvas.width/2, canvas.height - 50);
            }
            break;

        case GAME_STATES.GAME_OVER:
            ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
            break;

        case GAME_STATES.VICTORY:
            drawScene();
            break;
    }

    if (currentState !== GAME_STATES.PLAYING) {
        requestAnimationFrame(draw);
    }
}

// Event listeners
document.addEventListener("keydown", (e) => {
    console.log("Key pressed:", e.key); // Debug log
    
    if (currentState === GAME_STATES.INTRO_NARRATION) {
        if (e.key === 'Enter') {
            currentNarrationIndex++;
            handleNarration();
        }
        return;
    }
    
    if (currentState === GAME_STATES.PLAYING) {
        if (isInputLocked) {
            if (e.key === 'Enter') {
                isInputLocked = false;
                showShadowGuard = false;
                bgImage.src = assetPaths.levels[currentLevel];
                draw();
            }
            return;
        }

        let direction = null;
        if (e.key.toLowerCase() === 'a') direction = 'a';
        if (e.key.toLowerCase() === 'w') direction = 'w';
        if (e.key.toLowerCase() === 'd') direction = 'd';
        if (e.key === 'Enter') {
            // Confirm after guard event
            return;
        }

        if (direction) {
            handleChoice(direction);
        }
    }
});

const titleSlides = [
    "assets/start screen/title1.png",
    "assets/start screen/title2.png",
    "assets/start screen/title3.png",
    "assets/start screen/title4.png",
    "assets/start screen/title5.png"
];

const levelBackgrounds = [
    "assets/level 1/1bg.png",
    "assets/level 2/2bg.png",
    "assets/level 3/3bg.png"
];

const shadowGuards = [
    "assets/shadow guards/SG1.png", // Level 1
    "assets/shadow guards/SG2.png", // Level 2
    "assets/shadow guards/SG3.png", // Level 3
    "assets/shadow guards/SG0.png"  // Boss
];

const portalFrames = [
    "assets/portal/portal1.png",
    "assets/portal/portal2.png",
    "assets/portal/portal3.png",
    "assets/portal/portal4.png",
    "assets/portal/portal5.png",
    "assets/portal/portal6.png",
    "assets/portal/portal7.png"
];

const failScreen = "assets/failbg.png";

// Narration state management
let currentNarrationIndex = 0;
let narrationComplete = false;

function handleNarration() {
    const narrationTexts = document.querySelectorAll('.narration-text p');
    const skipText = document.querySelector('.skip-text');
    
    // Hide all narration texts
    narrationTexts.forEach(p => {
        p.classList.remove('current-text');
        p.style.opacity = '0';
        p.style.transform = 'translateY(20px)';
    });
    
    // Show current narration text
    if (currentNarrationIndex < narrationTexts.length) {
        const currentText = narrationTexts[currentNarrationIndex];
        currentText.classList.add('current-text');
        currentText.style.opacity = '1';
        currentText.style.transform = 'translateY(0)';
    } else {
        // All narration complete
        narrationComplete = true;
        document.getElementById('narration').classList.add('fade-out');
        setTimeout(() => {
            document.getElementById('narration').style.display = 'none';
            updateState(GAME_STATES.PLAYING);
        }, 1000);
    }
}

// Update game state management
function updateState(newState) {
    currentState = newState;
    
    switch (currentState) {
        case GAME_STATES.INTRO_NARRATION:
            document.getElementById('narration').style.display = 'flex';
            document.getElementById('gameCanvas').style.display = 'none';
            handleNarration();
            break;
            
        case GAME_STATES.PLAYING:
            document.getElementById('gameCanvas').style.display = 'block';
            bgImage.src = assetPaths.levels[currentLevel];
            dialogueText.textContent = LEVEL_CONFIGS[currentLevel].dialogue;
            draw();
            break;
            
        case GAME_STATES.GAME_OVER:
            document.getElementById('gameCanvas').style.display = 'block';
            draw();
            break;
            
        case GAME_STATES.VICTORY:
            document.getElementById('gameCanvas').style.display = 'block';
            draw();
            break;
    }
}

// Update game initialization
function initGame() {
    // Initialize game state
    currentState = GAME_STATES.INTRO_NARRATION;
    currentNarrationIndex = 0;
    narrationComplete = false;
    lightBars = 5;
    currentLevel = 0;
    currentAttempt = 0;
    gameOver = false;
    gameWon = false;
    showShadowGuard = false;
    isInputLocked = false;
}

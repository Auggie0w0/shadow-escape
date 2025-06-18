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
        guardImage: 'SG1.TIF'
    },
    1: { // Level 2
        correctPaths: ['w', 'a', 'd'], // straight, left, right
        shadowGuardPath: 'd', // shadow guard appears on right path
        attempts: 3,
        dialogue: "Which way will Luma go? LEFT, RIGHT, or FORWARD?",
        guardImage: 'SG2.TIF'
    },
    2: { // Level 3
        correctPaths: ['a', 'w'], // left, straight
        shadowGuardPath: 'a', // shadow guard appears on left path
        attempts: 3,
        dialogue: "Which way will Luma go? LEFT, RIGHT, or FORWARD?",
        guardImage: 'SG3.TIF'
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

let currentState = GAME_STATES.INTRO_NARRATION;
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
let currentLoreIndex = 0;
let currentPortalFrame = 0;
let portalAnimationTimer;

// Asset paths
const assetPaths = {
    titles: [
        "assets/start screen/title1.TIF",
        "assets/start screen/title2.TIF",
        "assets/start screen/title3.TIF",
        "assets/start screen/title4.TIF"
    ],
    lore: [
        "assets/start screen/lore1.TIF",
        "assets/start screen/lore2.TIF",
        "assets/start screen/lore3.TIF",
        "assets/start screen/lore4.TIF",
        "assets/start screen/lore5.TIF"
    ],
    levels: [
        "assets/level 1/1bg.TIF",
        "assets/level 2/2bg.TIF",
        "assets/level 3/3bg.TIF"
    ],
    guards: [
        "assets/shadow guards/SG0.TIF",
        "assets/shadow guards/SG1.TIF",
        "assets/shadow guards/SG2.TIF",
        "assets/shadow guards/SG3.TIF"
    ],
    portal: [
        "assets/portal/portal1.TIF",
        "assets/portal/portal2.TIF",
        "assets/portal/portal3.TIF",
        "assets/portal/portal4.TIF",
        "assets/portal/portal5.TIF",
        "assets/portal/portal6.TIF",
        "assets/portal/portal7.TIF"
    ],
    expressions: {
        happy: "assets/emotions/happy.TIF",
        worry: "assets/emotions/worry.TIF",
        unhappy: "assets/emotions/unhappy.TIF"
    },
    fail: "assets/failbg.TIF"
};

// Preload images
Promise.all([
    ...assetPaths.titles.map(loadImage),
    ...assetPaths.levels.map(loadImage),
    ...assetPaths.guards.map(loadImage),
    ...assetPaths.portal.map(loadImage),
    loadImage(assetPaths.expressions.happy),
    loadImage(assetPaths.expressions.worry),
    loadImage(assetPaths.expressions.unhappy),
    loadImage(assetPaths.fail)
]).then(() => {
    console.log("All assets loaded");
    startGame();
}).catch(error => console.error("Error loading assets:", error));

// Game functions
function startGame() {
    // Initialize game state
    currentState = GAME_STATES.INTRO_NARRATION;
    bgImage.src = assetPaths.titles[0];
    draw();
}

function advanceTitleSlides() {
    currentTitleIndex++;
    if (currentTitleIndex < assetPaths.titles.length) {
        bgImage.src = assetPaths.titles[currentTitleIndex];
        draw();
    } else {
        // Move to lore slides
        currentState = GAME_STATES.LORE_SLIDES;
        currentLoreIndex = 0;
        bgImage.src = assetPaths.lore[0];
        draw();
    }
}

function advanceLoreSlides() {
    currentLoreIndex++;
    if (currentLoreIndex < assetPaths.lore.length) {
        bgImage.src = assetPaths.lore[currentLoreIndex];
        draw();
    } else {
        // Show "Press anywhere to start" message
        ctx.fillStyle = "white";
        ctx.font = "24px 'Press Start 2P'";
        ctx.textAlign = "center";
        ctx.fillText("Press anywhere to start the game", canvas.width / 2, canvas.height - 50);
    }
}

function resetGame() {
    lightBars = 5;
    currentLevel = 0;
    currentAttempt = 0;
    gameOver = false;
    gameWon = false;
    currentState = GAME_STATES.TITLE_SCREEN;
    bgImage.src = assetPaths.titles[0];
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
        // Display win text
        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "white";
        ctx.font = "24px 'Press Start 2P'";
        ctx.textAlign = "center";
        let text1 = "Congratulations!";
        let text2 = "You helped Luma find her way back to her dimension.";
        let text3 = "She can now search for her parents!";
        ctx.fillText(text1, canvas.width / 2, canvas.height / 2 - 50);
        ctx.fillText(text2, canvas.width / 2, canvas.height / 2);
        ctx.fillText(text3, canvas.width / 2, canvas.height / 2 + 50);

        setTimeout(() => {
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

    // Draw Luma's expression based on light bars
    if (lightBars > 0) {
        const expression = EXPRESSION_MAPPING[lightBars];
        if (expression) {
            const expressionImg = imageCache[assetPaths.expressions[expression]];
            if (expressionImg) {
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
        case GAME_STATES.INTRO_NARRATION:
            ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
            break;

        case GAME_STATES.TITLE_SCREEN:
            ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
            break;

        case GAME_STATES.LORE_SLIDES:
            ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
            break;

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
            }
            break;

        case GAME_STATES.GAME_OVER:
            ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
            ctx.fillStyle = "white";
            ctx.font = "40px 'Press Start 2P'";
            ctx.textAlign = "center";
            ctx.fillText("Game Over", canvas.width / 2, canvas.height / 2);
            break;

        case GAME_STATES.VICTORY:
            drawScene();
            break;
    }

    if (currentState !== GAME_STATES.INTRO_NARRATION) {
        requestAnimationFrame(draw);
    } else {
        // Continue narration sequence
        setTimeout(advanceNarration, 3000);
    }
}

// Event listeners
document.addEventListener("keydown", (e) => {
    console.log("Key pressed:", e.key); // Debug log
    if (currentState === GAME_STATES.INTRO_NARRATION) {
        if (e.key === 'Enter' || e.key === 'Return') {
            console.log("Advance narration triggered"); // Debug log
            advanceNarration();
        }
        return;
    }

    if (currentState === GAME_STATES.TITLE_SCREEN) {
        currentState = GAME_STATES.PLAYING;
        bgImage.src = assetPaths.levels[0];
        dialogueText.textContent = LEVEL_CONFIGS[0].dialogue;
        draw();
        return;
    }

    if (currentState === GAME_STATES.GAME_OVER) {
        resetGame();
        return;
    }

    if (isInputLocked) {
        if (e.key === 'Enter') {
            isInputLocked = false;
            showShadowGuard = false;
            bgImage.src = assetPaths.levels[currentLevel];
            draw();
        }
        return;
    }

    if (currentState !== GAME_STATES.PLAYING) return;

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
});

function advanceNarration() {
    const currentText = document.querySelector('.current-text');
    const nextText = currentText?.nextElementSibling;
    if (nextText && nextText.classList.contains('next-text')) {
        currentText.classList.remove('current-text');
        nextText.classList.remove('next-text');
        nextText.classList.add('current-text');
    } else {
        narrationContainer.classList.add('fade-out');
        setTimeout(() => {
            narrationContainer.style.display = 'none';
            canvas.style.display = 'block';
            currentState = GAME_STATES.TITLE_SCREEN;
            draw();
        }, 1000);
    }
}

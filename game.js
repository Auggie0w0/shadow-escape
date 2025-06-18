// Game states
const GAME_STATES = {
    INTRO_NARRATION: 'intro_narration',
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
        attempts: 3,
        dialogue: "Which way will Luma go? LEFT, RIGHT, or FORWARD?"
    },
    1: { // Level 2
        correctPaths: ['w', 'a', 'd'], // straight, left, right
        shadowGuardPath: 'd', // shadow guard appears on right path
        attempts: 3,
        dialogue: "Which way will Luma go? LEFT, RIGHT, or FORWARD?"
    },
    2: { // Level 3
        correctPaths: ['a', 'w'], // left, straight
        shadowGuardPath: 'a', // shadow guard appears on left path
        attempts: 3,
        dialogue: "Which way will Luma go? LEFT, RIGHT, or FORWARD?"
    }
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
            resolve(imageCache[path]);
            return;
        }

        const img = new Image();
        img.onload = () => {
            imageCache[path] = img;
            resolve(img);
        };
        img.onerror = (e) => {
            reject(e);
        };
        img.src = path;
    });
}

// Asset paths
const assetPaths = {
    titles: [
        "assets/start screen/title1.TIF",
        "assets/start screen/title2.TIF",
        "assets/start screen/title3.TIF",
        "assets/start screen/title4.TIF",
        "assets/start screen/title5.tiff"
    ],
    levels: [
        "assets/level 1/1.tiff",
        "assets/level 2/2.tiff",
        "assets/level 3/3.tiff"
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
        happy: "assets/emotions/happy.tiff",
        worry: "assets/emotions/worry.tiff",
        unhappy: "assets/emotions/unhappy.tiff"
    },
    fail: "assets/failbg.tiff"
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

// Game variables
let currentTitleIndex = 0;
let currentPortalFrame = 0;
let portalAnimationTimer;

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
    showShadowGuard = true;
    shadowGuardImg.src = assetPaths.guards[level];
    isInputLocked = true;
    draw();
}

function handleChoice(direction) {
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
            // Wrong choice
            lightBars -= (currentLevel === 2) ? 2 : 1;

            if (lightBars <= 0) {
                // Game over
                currentState = GAME_STATES.GAME_OVER;
                bgImage.src = assetPaths.fail;
                draw();
            } else {
                // Show shadow guard
                showGuard(currentLevel + 1);
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
    ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
}

function drawHUD() {
    // Draw star icon in the top-right to show level number
    ctx.fillStyle = "gold";
    ctx.font = "20px 'Press Start 2P'";
    ctx.textAlign = "right";
    ctx.fillText(`Level ${currentLevel + 1}`, canvas.width - 10, 30);

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
}

function drawDialogueBox() {
    // Dialogue box dimensions and styling
    const boxWidth = canvas.width * 0.8;
    const boxHeight = 120;
    const boxX = (canvas.width - boxWidth) / 2;
    const boxY = canvas.height - boxHeight - 20;
    const cornerRadius = 10;

    // Draw rounded rectangle for the dialogue box
    ctx.fillStyle = "rgba(255, 255, 255, 0.8)"; // Semi-transparent white
    ctx.beginPath();
    ctx.moveTo(boxX + cornerRadius, boxY);
    ctx.lineTo(boxX + boxWidth - cornerRadius, boxY);
    ctx.quadraticCurveTo(boxX + boxWidth, boxY, boxX + boxWidth, boxY + cornerRadius);
    ctx.lineTo(boxX + boxWidth, boxY + boxHeight - cornerRadius);
    ctx.quadraticCurveTo(boxX + boxWidth, boxY + boxHeight, boxX + boxWidth - cornerRadius, boxY + boxHeight);
    ctx.lineTo(boxX + cornerRadius, boxY + boxHeight);
    ctx.quadraticCurveTo(boxX, boxY + boxHeight, boxX, boxY + boxHeight - cornerRadius);
    ctx.lineTo(boxX, boxY + cornerRadius);
    ctx.quadraticCurveTo(boxX, boxY, boxX + cornerRadius, boxY);
    ctx.closePath();
    ctx.fill();

    // Text styling
    ctx.fillStyle = "black";
    ctx.font = "16px 'Press Start 2P'";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";

    // Text wrapping function
    function wrapText(text, x, y, maxWidth, lineHeight) {
        let words = text.split(' ');
        let line = '';

        for (let n = 0; n < words.length; n++) {
            let testLine = line + words[n] + ' ';
            let metrics = ctx.measureText(testLine);
            let testWidth = metrics.width;

            if (testWidth > maxWidth && n > 0) {
                ctx.fillText(line, x, y);
                line = words[n] + ' ';
                y += lineHeight;
            } else {
                line = testLine;
            }
        }
        ctx.fillText(line, x, y);
    }

    // Dialogue text position and wrapping
    const textX = boxX + 20;
    const textY = boxY + 20;
    const maxWidth = boxWidth - 40;
    const lineHeight = 24;

    wrapText(LEVEL_CONFIGS[currentLevel].dialogue, textX, textY, maxWidth, lineHeight);
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
            ctx.fillStyle = "white";
            ctx.font = "24px 'Press Start 2P'";
            ctx.textAlign = "center";
            ctx.fillText("Press any key to start", canvas.width / 2, canvas.height - 50);
            break;

        case GAME_STATES.PLAYING:
            drawScene();
            drawHUD();
            drawDialogueBox();

            if (showShadowGuard) {
                ctx.drawImage(shadowGuardImg, canvas.width / 2 - 100, canvas.height / 2 - 100, 200, 200);
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

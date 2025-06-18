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
    fail: "assets/failbg.png",
    stars: [
        "assets/level 1/1.png",
        "assets/level 2/2.png",
        "assets/level 3/3.png"
    ],
    luma: "assets/luma mini.png"  // Add the high-res Luma image
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

function runTitleSequence() {
    const titleScreen = document.getElementById('title-screen');
    const titleImage = document.getElementById('title-image');
    const startText = document.getElementById('start-text');
    let currentTitleIndex = 0;
    
    // Show title screen
    titleScreen.style.display = 'flex';
    
    // Function to update title image
    const updateTitleImage = () => {
        if (currentTitleIndex < titleSlides.length) {
            titleImage.src = titleSlides[currentTitleIndex];
            
            // Show start text only on last image
            if (currentTitleIndex === titleSlides.length - 1) {
                startText.style.display = 'block';
            }
            
            currentTitleIndex++;
        }
    };
    
    // Initial image
    updateTitleImage();
    
    // Set up interval for title slides (1 second per frame)
    const titleInterval = setInterval(() => {
        if (currentTitleIndex < titleSlides.length) {
            updateTitleImage();
        } else {
            clearInterval(titleInterval);
        }
    }, 1000);
    
    // Handle click/enter to start
    const startGame = () => {
        clearInterval(titleInterval);
        titleScreen.style.display = 'none';
        updateState(GAME_STATES.PLAYING);
    };
    
    // Add event listeners
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && currentTitleIndex === titleSlides.length) {
            startGame();
        }
    });
    
    titleScreen.addEventListener('click', () => {
        if (currentTitleIndex === titleSlides.length) {
            startGame();
        }
    });
}

function resetGame() {
    lightBars = 5;
    currentLevel = 0;
    currentAttempt = 0;
    gameOver = false;
    gameWon = false;
    showShadowGuard = false;
    isInputLocked = false;
    
    // Update level star
    const levelStar = document.getElementById('level-star');
    if (levelStar) {
        levelStar.style.backgroundImage = `url('${assetPaths.stars[currentLevel]}')`;
    }
    
    updateState(GAME_STATES.PLAYING);
}

function showGuard(level) {
    console.debug('showGuard called', { level });

    // Special: use SG0 only once if dropping 2 lightBars
    if (currentLevel === 2 && lightBars <= 3 && !imageCache['SG0_shown']) {
        shadowGuardImg.src = assetPaths.guards[0]; // SG0
        imageCache['SG0_shown'] = true; // prevent repeat
    } else {
        shadowGuardImg.src = `assets/shadow guards/${LEVEL_CONFIGS[level].guardImage}`;
    }

    showShadowGuard = true;
    isInputLocked = true;
    draw();
}

function updateLevel() {
    // Start fade transition
    fadeTransition(() => {
        bgImage.src = assetPaths.levels[currentLevel];
        dialogueText.textContent = LEVEL_CONFIGS[currentLevel].dialogue;
        
        // Update level star if available
        const levelStar = document.getElementById('level-star');
        if (levelStar) {
            const starPath = assetPaths.stars[currentLevel];
            console.log(`Loading star image: ${starPath}`);
            
            try {
                levelStar.style.backgroundImage = `url('${starPath}')`;
                
                // Verify image loaded
                const img = new Image();
                img.onload = () => console.log(`Star image loaded successfully: ${starPath}`);
                img.onerror = () => {
                    console.warn(`Star image failed to load: ${starPath}`);
                    // Fallback to gold circle
                    levelStar.style.backgroundColor = '#FFD700';
                    levelStar.style.borderRadius = '50%';
                };
                img.src = starPath;
            } catch (e) {
                console.warn(`Error setting star image: ${e.message}`);
                // Fallback to gold circle
                levelStar.style.backgroundColor = '#FFD700';
                levelStar.style.borderRadius = '50%';
            }
        }
        
        // Show level title briefly
        showLevelTitle();
        
        draw();
    });
}

function fadeTransition(callback) {
    let alpha = 1;
    const fadeOut = () => {
        alpha -= 0.1;
        if (alpha <= 0) {
            callback();
            fadeIn();
        } else {
            ctx.globalAlpha = alpha;
            draw();
            requestAnimationFrame(fadeOut);
        }
    };
    
    const fadeIn = () => {
        alpha += 0.1;
        if (alpha >= 1) {
            ctx.globalAlpha = 1;
            draw();
        } else {
            ctx.globalAlpha = alpha;
            draw();
            requestAnimationFrame(fadeIn);
        }
    };
    
    fadeOut();
}

function showLevelTitle() {
    const levelTitle = document.createElement('div');
    levelTitle.id = 'level-title';
    levelTitle.textContent = `Entering Level ${currentLevel + 1}...`;
    document.body.appendChild(levelTitle);
    
    // Remove after animation
    setTimeout(() => {
        levelTitle.remove();
    }, 2000);
}

function drawHUD() {
    // Draw light bars
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

    // Draw level number
    ctx.fillStyle = "white";
    ctx.font = "20px 'Press Start 2P'";
    ctx.textAlign = "right";
    ctx.fillText(`Level ${currentLevel + 1}`, canvas.width - 10, 30);
}

function handleGameOver() {
    updateState(GAME_STATES.GAME_OVER);
    
    // Add one-time event listener for retry
    const handleRetry = (e) => {
        if (e.key === 'Enter') {
            document.removeEventListener('keydown', handleRetry);
            resetGame();
        }
    };
    
    document.addEventListener('keydown', handleRetry);
}

function handleChoice(direction) {
    if (isInputLocked) return;
    
    const currentConfig = LEVEL_CONFIGS[currentLevel];
    const directionMap = { a: 'LEFT', w: 'FORWARD', d: 'RIGHT' };
    
    // Lock input
    isInputLocked = true;
    
    // Play footstep sound
    const footstepSound = document.getElementById('footstep-sound');
    if (footstepSound) {
        footstepSound.currentTime = 0;
        footstepSound.play().catch(console.error);
    }
    
    // Update dialogue
    dialogueText.textContent = `Luma chose ${directionMap[direction]}.`;
    
    // Check if choice was correct
    if (direction !== currentConfig.correctPaths[currentAttempt]) {
        // Wrong choice - reduce light bars
        lightBars -= (currentLevel === 2) ? 2 : 1;
        
        if (lightBars <= 0) {
            handleGameOver();
            return;
        }
        
        // Show shadow guard
        showGuard(currentLevel);
    }
    
    // Increment attempt
    currentAttempt++;
    
    // Check level completion
    if (currentAttempt >= currentConfig.attempts) {
        currentLevel++;
        currentAttempt = 0;
        
        if (currentLevel >= 3) {
            updateState(GAME_STATES.VICTORY);
        } else {
            updateLevel();
        }
    } else {
        // Reset dialogue after delay
        setTimeout(() => {
            dialogueText.textContent = currentConfig.dialogue;
            isInputLocked = false;
            draw();
        }, 1000);
    }
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

function draw() {
    // Clear canvas
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    switch (currentState) {
        case GAME_STATES.PLAYING:
            // Draw background
            if (bgImage && bgImage.complete) {
                ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
            }
            
            // Draw Luma with higher resolution image
            const lumaImg = imageCache[assetPaths.luma];
            if (lumaImg) {
                const lumaWidth = 200;
                const lumaHeight = 300;
                const lumaX = 40;
                const lumaY = 160; // Position higher to reach into dark area
                ctx.drawImage(lumaImg, lumaX, lumaY, lumaWidth, lumaHeight);
            }
            
            // Draw shadow guard if shown
            if (showShadowGuard) {
                const guardImg = imageCache[`assets/shadow guards/${LEVEL_CONFIGS[currentLevel].guardImage}`];
                if (guardImg) {
                    ctx.drawImage(guardImg, canvas.width / 2 - 100, canvas.height / 2 - 100, 200, 200);
                    
                    // Show input freeze message
                    ctx.fillStyle = "white";
                    ctx.font = "16px 'Press Start 2P'";
                    ctx.textAlign = "center";
                    ctx.fillText("Press ENTER to continue...", canvas.width/2, canvas.height - 50);
                }
            }
            
            // Draw HUD
            drawHUD();
            break;

        case GAME_STATES.GAME_OVER:
            if (bgImage && bgImage.complete) {
                ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
            }
            // Show game over message
            ctx.fillStyle = "white";
            ctx.font = "24px 'Press Start 2P'";
            ctx.textAlign = "center";
            ctx.fillText("Game Over. Press Enter to play again.", canvas.width/2, canvas.height/2);
            break;

        case GAME_STATES.VICTORY:
            if (bgImage && bgImage.complete) {
                ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
            }
            break;
    }

    if (currentState !== GAME_STATES.PLAYING) {
        requestAnimationFrame(draw);
    }
}

// Event listeners
document.addEventListener("keydown", (e) => {
    // Handle game over reset first
    if (currentState === GAME_STATES.GAME_OVER && e.key === 'Enter') {
        resetGame();
        return;
    }
    
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
                draw(); // redraw scene with guard removed
                return;
            }
            return;
        }
        
        let direction = null;
        if (e.key.toLowerCase() === 'a') direction = 'a';
        if (e.key.toLowerCase() === 'w') direction = 'w';
        if (e.key.toLowerCase() === 'd') direction = 'd';
        
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
    const canvas = document.getElementById('gameCanvas');
    
    // Hide canvas during narration
    canvas.style.display = 'none';
    
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
        narrationContainer.classList.add('fade-out');
        setTimeout(() => {
            narrationContainer.style.display = 'none';
            updateState(GAME_STATES.TITLE_SCREEN);
            runTitleSequence();
        }, 1000);
    }
}

// Update game state management
function updateState(newState) {
    console.log(`State transition: ${currentState} -> ${newState}`);
    currentState = newState;
    
    switch (currentState) {
        case GAME_STATES.INTRO_NARRATION:
            document.getElementById('narration').style.display = 'flex';
            document.getElementById('gameCanvas').style.display = 'none';
            handleNarration();
            break;
            
        case GAME_STATES.TITLE_SCREEN:
            document.getElementById('gameCanvas').style.display = 'none';
            document.getElementById('title-screen').style.display = 'flex';
            runTitleSequence();
            break;
            
        case GAME_STATES.PLAYING:
            document.getElementById('gameCanvas').style.display = 'block';
            document.getElementById('title-screen').style.display = 'none';
            bgImage.src = assetPaths.levels[currentLevel];
            dialogueText.textContent = LEVEL_CONFIGS[currentLevel].dialogue;
            draw();
            break;
            
        case GAME_STATES.GAME_OVER:
            document.getElementById('gameCanvas').style.display = 'block';
            bgImage.src = assetPaths.fail;
            draw();
            break;
            
        case GAME_STATES.VICTORY:
            document.getElementById('gameCanvas').style.display = 'block';
            startVictorySequence();
            break;
    }
}

// Asset preloading
function preloadAssets() {
    const allAssets = [
        ...assetPaths.levels,
        ...assetPaths.guards,
        ...assetPaths.portal,
        ...Object.values(assetPaths.expressions),
        assetPaths.fail,
        ...assetPaths.stars,
        ...titleSlides
    ];

    console.log('Starting asset preload...');
    
    return Promise.all(allAssets.map(path => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                console.log(`Loaded: ${path}`);
                imageCache[path] = img;
                resolve(img);
            };
            img.onerror = () => {
                console.error(`Failed to load: ${path}`);
                reject(new Error(`Failed to load: ${path}`));
            };
            img.src = path;
        });
    }));
}

// Initialize game
async function initGame() {
    try {
        await preloadAssets();
        console.log('All assets loaded successfully');
        
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
        
        // Hide canvas initially
        document.getElementById('gameCanvas').style.display = 'none';
        
        // Set initial level star
        const levelStar = document.getElementById('level-star');
        if (levelStar) {
            levelStar.style.backgroundImage = `url('${assetPaths.stars[currentLevel]}')`;
        }
        
        // Start with narration
        updateState(GAME_STATES.INTRO_NARRATION);
    } catch (error) {
        console.error('Failed to initialize game:', error);
    }
}

// Start the game
window.addEventListener('load', () => {
    initGame().catch(error => {
        console.error('Game initialization failed:', error);
    });
});

// Remove the DOM-based Luma portrait since we're using canvas
document.addEventListener('DOMContentLoaded', () => {
    const lumaPortrait = document.getElementById('luma-portrait');
    if (lumaPortrait) {
        lumaPortrait.remove();
    }
});

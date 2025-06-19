// Game states
const GAME_STATES = {
    INTRO_NARRATION: 'intro_narration',
    TITLE_SCREEN: 'title_screen',
    LORE_SLIDES: 'lore_slides',
    PLAYING: 'playing',
    GAME_OVER: 'game_over',
    VICTORY: 'victory',
    ENDING: 'ending'
};

// Level configurations
const LEVEL_CONFIGS = {
    0: { // Level 1
        correctPath: 'd', // right
        shadowGuardPath: 'w', // shadow guard appears on straight path
        attempts: 1, // Changed from 3 to 1
        dialogue: "Which way will Luma go? LEFT, RIGHT, or FORWARD?",
        guardImage: 'SG1.png'
    },
    1: { // Level 2
        correctPath: 'w', // straight
        shadowGuardPath: 'd', // shadow guard appears on right path
        attempts: 1, // Changed from 3 to 1
        dialogue: "Which way will Luma go? LEFT, RIGHT, or FORWARD?",
        guardImage: 'SG2.png'
    },
    2: { // Level 3
        correctPath: 'a', // left
        shadowGuardPath: 'a', // shadow guard appears on left path
        attempts: 1, // Changed from 3 to 1
        dialogue: "Which way will Luma go? LEFT, RIGHT, or FORWARD?",
        guardImage: 'SG3.png'
    }
};

// Expression mapping based on light bars
const EXPRESSION_MAPPING = {
    3: 'happy',
    2: 'worry',
    1: 'unhappy',
    0: null
};

let currentState = GAME_STATES.PLAYING;
let lightBars = 3;
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
            reject(new Error(`Failed to load image: ${path}`));
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
        unhappy: "assets/emotions/unhappy.png",
        smug: "assets/emotions/smug.png"
    },
    fail: "assets/failbg.png",
    stars: [
        "assets/level 1/1.png",
        "assets/level 2/2.png",
        "assets/level 3/3.png"
    ],
    luma: "assets/luma mini.png",
    titleSlides: [
        "assets/start screen/title1.png",
        "assets/start screen/title2.png",
        "assets/start screen/title3.png",
        "assets/start screen/title4.png",
        "assets/start screen/title5.png"
    ]
};

// Preload images
async function preloadAssets() {
    const allAssets = [
        ...assetPaths.levels,
        ...assetPaths.guards,
        ...assetPaths.portal,
        ...Object.values(assetPaths.expressions),
        assetPaths.fail,
        ...assetPaths.stars,
        assetPaths.luma,
        ...assetPaths.titleSlides
    ];

    console.log('Starting asset preload...', allAssets);
    
    try {
        await Promise.all(allAssets.map(path => loadImage(path)));
        console.log("All assets loaded successfully");
        return true;
    } catch (error) {
        console.error("Error loading assets:", error);
        return false;
    }
}

// Game functions
function startGame() {
    // Start with narration
    updateState(GAME_STATES.INTRO_NARRATION);
}

function runTitleSequence() {
    const titleScreen = document.getElementById('title-screen');
    const titleImage = document.getElementById('title-image');
    const startText = document.getElementById('start-text');
    currentTitleIndex = 0;
    
    // Show title screen
    titleScreen.style.display = 'flex';
    startText.style.display = 'none';
    
    // Function to update title image
    const updateTitleImage = () => {
        if (currentTitleIndex < assetPaths.titleSlides.length) {
            const img = imageCache[assetPaths.titleSlides[currentTitleIndex]];
            if (img) {
                titleImage.src = assetPaths.titleSlides[currentTitleIndex];
                
                // Show start text only on last image
                if (currentTitleIndex === assetPaths.titleSlides.length - 1) {
                    startText.style.display = 'block';
                }
            }
            currentTitleIndex++;
        }
    };
    
    // Initial image
    updateTitleImage();
    
    // Set up interval for title slides (1 second per frame)
    const titleInterval = setInterval(() => {
        if (currentTitleIndex < assetPaths.titleSlides.length) {
            updateTitleImage();
        } else {
            clearInterval(titleInterval);
        }
    }, 1000);
}

function resetGame() {
    lightBars = 3;
    currentLevel = 0;
    currentAttempt = 0;
    gameOver = false;
    gameWon = false;
    showShadowGuard = false;
    isInputLocked = false;
    
    // Reset SG0_shown flag
    delete imageCache['SG0_shown'];
    
    // Ensure victory message is hidden
    const victoryMessage = document.getElementById('victory-message');
    if (victoryMessage) {
        victoryMessage.classList.remove('show');
        victoryMessage.style.display = 'none';
    }
    
    // Ensure ending screen is hidden
    const endingScreen = document.getElementById('ending-screen');
    if (endingScreen) {
        endingScreen.classList.remove('show', 'fade-out');
        endingScreen.style.display = 'none';
    }
    
    // Load initial background image
    bgImage = imageCache[assetPaths.levels[currentLevel]];
    
    // Update level star
    const levelStar = document.getElementById('level-star');
    if (levelStar) {
        levelStar.style.backgroundImage = `url('${assetPaths.stars[currentLevel]}')`;
    }
    
    updateState(GAME_STATES.PLAYING);
}

// Audio handling
function playSound(sound) {
    return new Promise((resolve, reject) => {
        if (!sound) {
            resolve();
            return;
        }
        
        sound.currentTime = 0;
        
        const onEnd = () => {
            sound.removeEventListener('ended', onEnd);
            resolve();
        };
        
        sound.addEventListener('ended', onEnd);
        
        sound.play().catch(error => {
            console.error('Error playing sound:', error);
            resolve(); // Resolve anyway to not block game flow
        });
    });
}

async function handleChoice(direction) {
    if (isInputLocked) return;
    
    const currentConfig = LEVEL_CONFIGS[currentLevel];
    const directionMap = { a: 'LEFT', w: 'FORWARD', d: 'RIGHT' };
    
    // Lock input immediately
    isInputLocked = true;
    
    // Play footstep sound and wait for it to finish
    const footstepSound = document.getElementById('footstep-sound');
    await playSound(footstepSound);
    
    // Update dialogue
    dialogueText.textContent = `Luma chose ${directionMap[direction]}.`;
    
    // Check if choice was correct
    if (direction !== currentConfig.correctPath) {
        // Wrong choice - reduce light bars
        lightBars -= (currentLevel === 2) ? 2 : 1;
        
        if (lightBars <= 0) {
            handleGameOver();
            return;
        }
        
        // Show shadow guard
        showGuard(currentLevel);
    } else {
        // Correct choice - move to next level after a short delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        showShadowGuard = false; // Ensure shadow guard is hidden
        currentLevel++;
        currentAttempt = 0;
        
        if (currentLevel >= 3) {
            if (lightBars > 0) {
                updateState(GAME_STATES.VICTORY);
            } else {
                handleGameOver();
            }
        } else {
            updateLevel();
        }
    }
}

function showGuard(level) {
    console.debug('showGuard called', { level });

    // Special: use SG0 only once if dropping 2 lightBars
    if (currentLevel === 2 && lightBars <= 3 && !imageCache['SG0_shown']) {
        shadowGuardImg = imageCache[assetPaths.guards[0]]; // SG0
        imageCache['SG0_shown'] = true; // prevent repeat
    } else {
        shadowGuardImg = imageCache[`assets/shadow guards/${LEVEL_CONFIGS[level].guardImage}`];
    }

    showShadowGuard = true;
    isInputLocked = true; // Keep input locked
    draw();
    
    // Show input prompt after a short delay
    setTimeout(() => {
        dialogueText.textContent = "Press Enter to continue...";
    }, 1000);
}

function updateLevel() {
    // Ensure shadow guard is hidden during transition
    showShadowGuard = false;
    isInputLocked = false;
    
    // Start fade transition
    fadeTransition(() => {
        bgImage = imageCache[assetPaths.levels[currentLevel]];
        dialogueText.textContent = LEVEL_CONFIGS[currentLevel].dialogue;
        
        // Update level star if available
        const levelStar = document.getElementById('level-star');
        if (levelStar) {
            const starPath = assetPaths.stars[currentLevel];
            console.log(`Loading star image: ${starPath}`);
            
            try {
                levelStar.style.backgroundImage = `url('${starPath}')`;
            } catch (e) {
                console.warn(`Error setting star image: ${e.message}`);
                // Fallback to gold circle
                levelStar.style.backgroundColor = '#FFD700';
                levelStar.style.borderRadius = '50%';
            }
        }
        
        // Show level title briefly
        showLevelTitle();
        
        // Ensure we're in playing state
        currentState = GAME_STATES.PLAYING;
        draw();
    });
}

function fadeTransition(callback) {
    let alpha = 1;
    
    // Ensure shadow guard is hidden during transition
    showShadowGuard = false;
    
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

    for (let i = 0; i < 3; i++) { // Draw 3 stars instead of 5
        ctx.fillStyle = i < lightBars ? "yellow" : "gray";
        ctx.beginPath();
        ctx.moveTo(startX + i * (starSize + padding) + starSize / 2, startY);
        for (let j = 0; j < 5; j++) { // Each star is still 5-pointed
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
    bgImage = imageCache[assetPaths.fail];
    draw();
}

function startVictorySequence() {
    // Only show portal animation if player has stars left
    if (lightBars > 0) {
        let frameIndex = 0;
        const victoryMessage = document.getElementById('victory-message');
        
        // Hide shadow guard during victory sequence
        showShadowGuard = false;
        isInputLocked = true;
        
        // Start portal animation
        portalAnimationTimer = setInterval(() => {
            const portalImg = imageCache[assetPaths.portal[frameIndex]];
            if (portalImg) {
                bgImage = portalImg;
                draw();
            }
            frameIndex = (frameIndex + 1) % assetPaths.portal.length;
        }, 200);

        // Show victory message after portal animation
        setTimeout(() => {
            clearInterval(portalAnimationTimer);
            victoryMessage.classList.add('show');
            
            // Show ending screen after victory message
            setTimeout(() => {
                victoryMessage.classList.remove('show');
                showEndingScreen();
            }, 3000);
        }, assetPaths.portal.length * 200);
    } else {
        // If no stars left, go to game over
        handleGameOver();
    }
}

function showEndingScreen() {
    const endingScreen = document.getElementById('ending-screen');
    const textElements = endingScreen.querySelectorAll('p:not(.press-enter)');
    const pressEnterText = endingScreen.querySelector('p.press-enter');
    
    // Show the container but keep texts hidden
    endingScreen.style.display = 'flex';
    endingScreen.classList.add('show');
    
    // Reset all text elements
    textElements.forEach(text => {
        text.style.opacity = '0';
        text.style.transform = 'translateY(20px)';
    });
    if (pressEnterText) {
        pressEnterText.style.opacity = '0';
        pressEnterText.style.transform = 'translateY(20px)';
    }
    
    // Stagger the text animations with longer delays
    textElements.forEach((text, index) => {
        setTimeout(() => {
            text.classList.add('current-text');
            text.style.opacity = '1';
            text.style.transform = 'translateY(0)';
        }, (index + 1) * 1000); // 1 second delay between each text
    });
    
    // Show the "Press Enter" text after all other text has appeared
    if (pressEnterText) {
        setTimeout(() => {
            pressEnterText.classList.add('current-text');
            pressEnterText.style.opacity = '1';
            pressEnterText.style.transform = 'translateY(0)';
        }, (textElements.length + 1) * 1000 + 500); // Additional delay after other text
    }
    
    // Update game state
    currentState = GAME_STATES.ENDING;
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
            } else {
                // Fallback to black background
                ctx.fillStyle = 'black';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }
            
            // Draw emotion image based on light bars (replacing Luma)
            const currentEmotion = EXPRESSION_MAPPING[lightBars];
            if (currentEmotion && currentEmotion !== null) {
                const emotionImg = imageCache[assetPaths.expressions[currentEmotion]];
                if (emotionImg) {
                    const emotionWidth = 300; // Bigger size
                    const emotionHeight = 400; // Bigger size
                    const emotionX = 50; // Left side positioning
                    const emotionY = 100; // Centered vertically
                    ctx.drawImage(emotionImg, emotionX, emotionY, emotionWidth, emotionHeight);
                }
            }
            
            // Draw shadow guard if shown
            if (showShadowGuard) {
                if (shadowGuardImg) {
                    ctx.drawImage(shadowGuardImg, canvas.width / 2 - 100, canvas.height / 2 - 100, 200, 200);
                    
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
            } else {
                ctx.fillStyle = 'black';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
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
            } else {
                ctx.fillStyle = 'black';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }
            break;

        case GAME_STATES.ENDING:
            // Implement ending screen drawing logic here
            break;
    }

    if (currentState !== GAME_STATES.PLAYING) {
        requestAnimationFrame(draw);
    }
}

// Global event listeners
document.addEventListener('keydown', handleKeyPress);
document.addEventListener('click', handleClick);

function handleKeyPress(e) {
    console.log('Key pressed:', e.key, 'Current state:', currentState);
    
    switch (currentState) {
        case GAME_STATES.ENDING:
            if (e.key === 'Enter') {
                const endingScreen = document.getElementById('ending-screen');
                endingScreen.classList.add('fade-out');
                
                // Wait for fade out animation
                setTimeout(() => {
                    endingScreen.classList.remove('show', 'fade-out');
                    endingScreen.style.display = 'none';
                    // Reset game and show title screen
                    resetGame();
                    updateState(GAME_STATES.TITLE_SCREEN);
                }, 1000);
            }
            break;
            
        case GAME_STATES.INTRO_NARRATION:
            if (e.key === 'Enter') {
                currentNarrationIndex++;
                handleNarration();
            }
            break;
            
        case GAME_STATES.TITLE_SCREEN:
            if (e.key === 'Enter' && currentTitleIndex >= assetPaths.titleSlides.length) {
                startGameFromTitle();
            }
            break;
            
        case GAME_STATES.PLAYING:
            if (isInputLocked) {
                if (e.key === 'Enter' && showShadowGuard) {
                    // When Enter is pressed while shadow guard is shown
                    isInputLocked = false;
                    showShadowGuard = false;
                    bgImage = imageCache[assetPaths.levels[currentLevel]];
                    draw();
                    
                    // Move to next level after shadow guard disappears
                    setTimeout(() => {
                        currentLevel++;
                        if (currentLevel >= 3) {
                            if (lightBars > 0) {
                                updateState(GAME_STATES.VICTORY);
                            } else {
                                handleGameOver();
                            }
                        } else {
                            updateLevel();
                        }
                    }, 500);
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
            break;
    }
}

function handleClick(e) {
    if (currentState === GAME_STATES.TITLE_SCREEN && currentTitleIndex >= assetPaths.titleSlides.length) {
        startGameFromTitle();
    }
}

function startGameFromTitle() {
    const titleScreen = document.getElementById('title-screen');
    titleScreen.style.display = 'none';
    updateState(GAME_STATES.PLAYING);
}

// Narration state management
let currentNarrationIndex = 0;
let narrationComplete = false;

function handleNarration() {
    const narrationTexts = document.querySelectorAll('.narration-text p');
    const skipText = document.querySelector('.skip-text');
    const canvas = document.getElementById('gameCanvas');
    const narrationContainer = document.getElementById('narration');
    
    // Hide canvas during narration
    canvas.style.display = 'none';
    narrationContainer.style.display = 'flex';
    
    // Hide all narration texts
    narrationTexts.forEach(p => {
        p.classList.remove('current-text');
        p.style.opacity = '0';
        p.style.transform = 'translateY(20px)';
    });
    
    // Show current narration text or move to title screen
    if (currentNarrationIndex < narrationTexts.length) {
        const currentText = narrationTexts[currentNarrationIndex];
        currentText.classList.add('current-text');
        currentText.style.opacity = '1';
        currentText.style.transform = 'translateY(0)';
        
        // Show skip text
        if (skipText) {
            skipText.style.opacity = '1';
        }
    } else {
        // All narration complete
        if (skipText) {
            skipText.style.opacity = '0';
        }
        narrationContainer.classList.add('fade-out');
        
        // Wait for fade out animation
        setTimeout(() => {
            narrationContainer.style.display = 'none';
            narrationContainer.classList.remove('fade-out');
            updateState(GAME_STATES.TITLE_SCREEN);
        }, 1000);
    }
}

// Update game state management
function updateState(newState) {
    console.log(`State transition: ${currentState} -> ${newState}`);
    currentState = newState;
    
    // Clean up any lingering UI elements
    const victoryMessage = document.getElementById('victory-message');
    const endingScreen = document.getElementById('ending-screen');
    
    if (newState !== GAME_STATES.VICTORY && newState !== GAME_STATES.ENDING) {
        if (victoryMessage) {
            victoryMessage.classList.remove('show');
            victoryMessage.style.display = 'none';
        }
        if (endingScreen) {
            endingScreen.classList.remove('show', 'fade-out');
            endingScreen.style.display = 'none';
        }
    }
    
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
            bgImage = imageCache[assetPaths.levels[currentLevel]];
            dialogueText.textContent = LEVEL_CONFIGS[currentLevel].dialogue;
            draw();
            break;
            
        case GAME_STATES.GAME_OVER:
            document.getElementById('gameCanvas').style.display = 'block';
            bgImage = imageCache[assetPaths.fail];
            draw();
            break;
            
        case GAME_STATES.VICTORY:
            document.getElementById('gameCanvas').style.display = 'block';
            startVictorySequence();
            break;

        case GAME_STATES.ENDING:
            // Implement ending screen logic here
            break;
    }
}

// Initialize game
async function initGame() {
    try {
        const assetsLoaded = await preloadAssets();
        if (!assetsLoaded) {
            throw new Error('Failed to load all assets');
        }
        
        // Initialize game state
        currentState = GAME_STATES.INTRO_NARRATION;
        currentNarrationIndex = 0;
        narrationComplete = false;
        lightBars = 3;
        currentLevel = 0;
        currentAttempt = 0;
        gameOver = false;
        gameWon = false;
        showShadowGuard = false;
        isInputLocked = false;
        
        // Reset SG0_shown flag
        delete imageCache['SG0_shown'];
        
        // Hide canvas initially
        document.getElementById('gameCanvas').style.display = 'none';
        
        // Ensure victory message is hidden
        const victoryMessage = document.getElementById('victory-message');
        if (victoryMessage) {
            victoryMessage.classList.remove('show');
            victoryMessage.style.display = 'none';
        }
        
        // Ensure ending screen is hidden
        const endingScreen = document.getElementById('ending-screen');
        if (endingScreen) {
            endingScreen.classList.remove('show', 'fade-out');
            endingScreen.style.display = 'none';
        }
        
        // Set initial level star
        const levelStar = document.getElementById('level-star');
        if (levelStar) {
            levelStar.style.backgroundImage = `url('${assetPaths.stars[currentLevel]}')`;
        }
        
        // Start with narration
        updateState(GAME_STATES.INTRO_NARRATION);
    } catch (error) {
        console.error('Failed to initialize game:', error);
        alert('Failed to load game assets. Please refresh the page to try again.');
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
    
    // Ensure victory and ending screens are hidden on page load
    const victoryMessage = document.getElementById('victory-message');
    if (victoryMessage) {
        victoryMessage.classList.remove('show');
        victoryMessage.style.display = 'none';
    }
    
    const endingScreen = document.getElementById('ending-screen');
    if (endingScreen) {
        endingScreen.classList.remove('show', 'fade-out');
        endingScreen.style.display = 'none';
    }
});

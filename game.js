// Game states
const GAME_STATES = {
    TITLE_SLIDES: 'title_slides',
    PLAYING: 'playing',
    GAME_OVER: 'game_over',
    VICTORY: 'victory'
};

// Level configurations
const LEVEL_CONFIGS = [
    { correctPath: 'd', guardImage: 'SG1.TIF' }, // Level 1: right
    { correctPath: 'w', guardImage: 'SG2.TIF' }, // Level 2: forward
    { correctPath: 'a', guardImage: 'SG3.TIF' }  // Level 3: left
];

let currentState = GAME_STATES.TITLE_SLIDES;
let currentSlide = 0;
let lightBars = 5;
let currentLevel = 0;
let showShadowGuard = false;
let isInputLocked = false;
let bgImage = new Image();
let shadowGuardImg = new Image();
let lumaImg = new Image();
let portalFrame = 0;
let portalTimer;

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Asset paths
const titleSlides = [
    'assets/start screen/title1.TIF',
    'assets/start screen/title2.TIF',
    'assets/start screen/title3.TIF',
    'assets/start screen/title4.TIF',
    'assets/start screen/title5.TIF'
];
const levelBackgrounds = [
    'assets/level 1/1bg.TIF',
    'assets/level 2/2bg.TIF',
    'assets/level 3/3bg.TIF'
];
const shadowGuards = [
    'assets/shadow guards/SG1.TIF',
    'assets/shadow guards/SG2.TIF',
    'assets/shadow guards/SG3.TIF',
    'assets/shadow guards/SG0.TIF'
];
const portalFrames = [
    'assets/portal/portal1.TIF',
    'assets/portal/portal2.TIF',
    'assets/portal/portal3.TIF',
    'assets/portal/portal4.TIF',
    'assets/portal/portal5.TIF',
    'assets/portal/portal6.TIF',
    'assets/portal/portal7.TIF'
];
const expressions = {
    happy: 'assets/emotions/happy.TIF',
    worry: 'assets/emotions/worry.TIF',
    unhappy: 'assets/emotions/unhappy.TIF'
};
const failScreen = 'assets/failbg.TIF';

function loadImage(path) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
        img.src = path;
    });
}

function startGame() {
    currentState = GAME_STATES.TITLE_SLIDES;
    currentSlide = 0;
    lightBars = 5;
    currentLevel = 0;
    showShadowGuard = false;
    isInputLocked = false;
    bgImage.src = titleSlides[0];
    draw();
}

function advanceSlide() {
    currentSlide++;
    if (currentSlide < titleSlides.length) {
        bgImage.src = titleSlides[currentSlide];
        draw();
    } else {
        currentState = GAME_STATES.PLAYING;
        currentLevel = 0;
        bgImage.src = levelBackgrounds[0];
        draw();
    }
}

function resetGame() {
    startGame();
}

function showGuard() {
    showShadowGuard = true;
    shadowGuardImg.src = `assets/shadow guards/${LEVEL_CONFIGS[currentLevel].guardImage}`;
    isInputLocked = true;
    draw();
}

function handleChoice(direction) {
    if (isInputLocked) return;
    const correct = LEVEL_CONFIGS[currentLevel].correctPath;
    if (direction === correct) {
        currentLevel++;
        if (currentLevel >= 3) {
            currentState = GAME_STATES.VICTORY;
            startVictorySequence();
        } else {
            bgImage.src = levelBackgrounds[currentLevel];
            draw();
        }
    } else {
        lightBars -= (currentLevel === 2) ? 2 : 1;
        if (lightBars <= 0) {
            currentState = GAME_STATES.GAME_OVER;
            bgImage.src = failScreen;
            draw();
        } else {
            showGuard();
        }
    }
}

function startVictorySequence() {
    portalFrame = 0;
    currentState = GAME_STATES.VICTORY;
    portalTimer = setInterval(() => {
        bgImage.src = portalFrames[portalFrame];
        portalFrame = (portalFrame + 1) % portalFrames.length;
        draw();
    }, 200);
    setTimeout(() => {
        clearInterval(portalTimer);
        bgImage.src = '';
        draw();
        setTimeout(() => {
            startGame();
        }, 5000);
    }, portalFrames.length * 200);
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (bgImage && bgImage.src) ctx.drawImage(bgImage, 0, 0, 800, 600);
    if (currentState === GAME_STATES.PLAYING && lightBars > 0) {
        // Draw Luma expression
        let expr = 'happy';
        if (lightBars <= 2) expr = 'unhappy';
        else if (lightBars <= 4) expr = 'worry';
        lumaImg.src = expressions[expr];
        if (lumaImg && lumaImg.src) ctx.drawImage(lumaImg, 10, 500, 80, 80);
    }
    if (showShadowGuard && shadowGuardImg && shadowGuardImg.src) {
        ctx.drawImage(shadowGuardImg, 300, 150, 200, 200); // Centered in dark region
    }
}

document.addEventListener('keydown', (e) => {
    if (currentState === GAME_STATES.TITLE_SLIDES) {
        advanceSlide();
        return;
    }
    if (currentState === GAME_STATES.PLAYING) {
        if (isInputLocked) {
            if (e.key === 'Enter') {
                isInputLocked = false;
                showShadowGuard = false;
                bgImage.src = levelBackgrounds[currentLevel];
                draw();
            }
            return;
        }
        let direction = null;
        if (e.key === 'ArrowLeft') direction = 'a';
        if (e.key === 'ArrowUp') direction = 'w';
        if (e.key === 'ArrowRight') direction = 'd';
        if (direction) handleChoice(direction);
    }
    if (currentState === GAME_STATES.GAME_OVER) {
        resetGame();
    }
    if (currentState === GAME_STATES.VICTORY) {
        startGame();
    }
});

// Start the game
startGame();

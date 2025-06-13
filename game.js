// Game states
const GAME_STATES = {
    INTRO_NARRATION: 'intro_narration',
    TITLE_SCREEN: 'title_screen',
    PLAYING: 'playing',
    GAME_OVER: 'game_over',
    VICTORY: 'victory'
};

let currentState = GAME_STATES.INTRO_NARRATION;
let lightBars = 3; // Changed from 5 to 3
let currentLevel = 0;
let gameOver = false;
let gameWon = false;
let showShadowGuard = false;

// Background images
const backgrounds = {
    start: "assets/startBG.GIF",
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

// Intro narration text
const introText = [
    "Where am I?",
    "I touched that shiny star...",
    "The next thing I know I ended up here in pitch black.",
    "I have to look for my parents and go back to my dimension!"
];
let currentIntroText = 0;

// Questions for each level
const questions = [
    "Level 1: Do you go LEFT, RIGHT, or FORWARD?",
    "Level 2: Shadow guards are near. Choose LEFT, RIGHT, or FORWARD.",
    "Level 3: Final path. Will you go LEFT, RIGHT, or FORWARD?"
];

const correctPaths = ["right", "forward", "left"];

// Load images
const bgImage = new Image();
bgImage.src = backgrounds.start;

const portalImg = new Image();
let currentFrame = 0;
let frameCounter = 0;

// Audio elements
const bgMusic = document.getElementById("bg-music");
const correctSound = document.getElementById("correct-sound");
const wrongSound = document.getElementById("wrong-sound");
const winSound = document.getElementById("win-sound");
const gameOverSound = document.getElementById("game-over-sound");

// Event listeners
document.addEventListener("keydown", handleKeyPress);
canvas.addEventListener("click", handleMouseClick);

function handleKeyPress(e) {
    if (currentState === GAME_STATES.INTRO_NARRATION) {
        if (e.key.toLowerCase() === 's') {
            currentState = GAME_STATES.TITLE_SCREEN;
            bgImage.src = backgrounds.start;
        } else {
            currentIntroText = (currentIntroText + 1) % introText.length;
            if (currentIntroText === 0) {
                currentState = GAME_STATES.TITLE_SCREEN;
                bgImage.src = backgrounds.start;
            }
        }
        return;
    }

    if (currentState === GAME_STATES.TITLE_SCREEN) {
        currentState = GAME_STATES.PLAYING;
        bgImage.src = backgrounds.level1;
        bgMusic.play().catch(e => console.error("Audio autoplay failed:", e));
        return;
    }

    if (currentState !== GAME_STATES.PLAYING) return;

    let direction = "";
    if (e.key === "ArrowLeft") direction = "left";
    if (e.key === "ArrowRight") direction = "right";
    if (e.key === "ArrowUp") direction = "forward";

    if (direction && correctPaths[currentLevel] !== direction) {
        lightBars--;
        showShadowGuard = true;
        wrongSound.play();
        setTimeout(() => showShadowGuard = false, 1000);
    }

    if (lightBars <= 0) {
        currentState = GAME_STATES.GAME_OVER;
        bgImage.src = backgrounds.fail;
        bgMusic.pause();
        gameOverSound.play();
        return;
    }

    if (direction === correctPaths[currentLevel]) {
        correctSound.play();
        currentLevel++;
        if (currentLevel >= 3) {
            currentState = GAME_STATES.VICTORY;
            portalImg.src = portalFrames[0];
            bgMusic.pause();
            winSound.play();
            return;
        }
        bgImage.src = backgrounds[`level${currentLevel + 1}`];
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    switch (currentState) {
        case GAME_STATES.INTRO_NARRATION:
            // Draw black background
            ctx.fillStyle = "black";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Draw intro text
            ctx.fillStyle = "white";
            ctx.font = "24px Arial";
            ctx.textAlign = "center";
            ctx.fillText(introText[currentIntroText], canvas.width/2, canvas.height/2);
            
            // Draw skip text
            ctx.font = "16px Arial";
            ctx.textAlign = "right";
            ctx.fillText("Press 'S' to skip", canvas.width - 20, canvas.height - 20);
            break;

        case GAME_STATES.TITLE_SCREEN:
            ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
            ctx.fillStyle = "white";
            ctx.font = "24px Arial";
            ctx.textAlign = "center";
            ctx.fillText("Press any key to start", canvas.width/2, canvas.height - 50);
            break;

        case GAME_STATES.PLAYING:
            ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
            drawHUD();
            break;

        case GAME_STATES.GAME_OVER:
            ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
            ctx.fillStyle = "white";
            ctx.font = "40px Arial";
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

    requestAnimationFrame(draw);
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

    // Draw question box at bottom
    const boxHeight = 70;
    const boxY = canvas.height - boxHeight - 20;
    const boxX = 20;
    const boxWidth = canvas.width - 40;

    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
    ctx.strokeStyle = "white";
    ctx.lineWidth = 2;
    ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);

    ctx.fillStyle = "white";
    ctx.font = "20px Arial";
    ctx.textAlign = "left";
    ctx.fillText(questions[currentLevel], boxX + 20, boxY + 40);
}

// Start the game
draw();

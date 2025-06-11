const titleScreens = [
    "assets/title1.jpeg",
    "assets/title2.jpeg",
    "assets/title3.jpeg",
    "assets/title4.jpeg"
];
let introIndex = 0;
let introDone = false;
const titleImage = new Image();
titleImage.src = titleScreens[introIndex];
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Audio elements
const bgMusic = document.getElementById("bg-music");
const correctSound = document.getElementById("correct-sound");
const wrongSound = document.getElementById("wrong-sound");
const winSound = document.getElementById("win-sound");
const gameOverSound = document.getElementById("game-over-sound");

// Game assets
const lumaImg = new Image();
lumaImg.src = "assets/luma.png";

function loadImage(src) {
    const img = new Image();
    img.src = src;
    return img;
}

const lumaExpressions = {
    happy: loadImage("assets/happy.jpeg"),
    smug: loadImage("assets/smug.jpeg"),
    worry: loadImage("assets/worry.jpeg"),
    unhappy: loadImage("assets/unhappy.jpeg")
};

const shadowGuardImg = loadImage("assets/SG1.jpeg");

let showShadowGuard = false;
let gameWon = false;

const backgrounds = [
    "assets/IMG_1066.jpeg", // Level 1
    "assets/2.jpeg",        // Level 2
    "assets/3.jpeg"         // Level 3
];

const questions = [
    "Level 1: Do you go LEFT, RIGHT, or FORWARD?",
    "Level 2: Shadow guards are near. Choose LEFT, RIGHT, or FORWARD.",
    "Level 3: Final path. Will you go LEFT, RIGHT, or FORWARD?"
];

const correctPaths = ["right", "forward", "left"];
let currentLevel = 0;
let lightBars = 5;
let gameOver = false;

const bgImage = new Image();
bgImage.src = backgrounds[currentLevel];

const portalFrames = [
    "assets/portal1.jpeg",
    "assets/portal2.jpeg",
    "assets/portal3.jpeg",
    "assets/portal4.jpeg",
    "assets/portal5.jpeg",
    "assets/portal6.jpeg",
    "assets/portal7.jpeg"
];
let currentFrame = 0;
const portalImg = new Image();
let frameCounter = 0;

document.addEventListener("keydown", () => {
    if (!introDone) {
        introIndex++;
        if (introIndex >= titleScreens.length) {
            introDone = true;
            bgImage.src = backgrounds[currentLevel]; // Start game with level 1 bg
            bgMusic.play().catch(e => console.error("Audio autoplay failed:", e));
        } else {
            titleImage.src = titleScreens[introIndex];
        }
    }
});

document.addEventListener("keydown", handleKeyPress);
canvas.addEventListener("click", handleMouseClick);

function resetGame() {
    currentLevel = 0;
    lightBars = 5;
    gameOver = false;
    gameWon = false;
    showShadowGuard = false;
    bgImage.src = backgrounds[currentLevel];
    currentFrame = 0;
    frameCounter = 0;
    bgMusic.currentTime = 0;
    bgMusic.play().catch(e => console.error("Audio autoplay failed:", e));
}

function handleMouseClick(e) {
    if (gameOver && !gameWon) {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Retry button area
        const buttonX = 350;
        const buttonY = 350;
        const buttonWidth = 100;
        const buttonHeight = 50;

        if (
            x >= buttonX && x <= buttonX + buttonWidth &&
            y >= buttonY && y <= buttonY + buttonHeight
        ) {
            resetGame();
        }
    }
}

function handleKeyPress(e) {
    if (gameOver) return;

    let direction = "";
    if (e.key === "ArrowLeft") direction = "left";
    if (e.key === "ArrowRight") direction = "right";
    if (e.key === "ArrowUp") direction = "forward";

    if (direction && correctPaths[currentLevel] !== direction) {
        // Wrong choice: lose light
        lightBars -= currentLevel === 2 ? 2 : 1;
        showShadowGuard = true;
        wrongSound.play();
        setTimeout(() => showShadowGuard = false, 1000);
    }

    if (lightBars <= 0) {
        gameOver = true;
        gameWon = false;
        bgMusic.pause();
        gameOverSound.play();
        return;
    }

    if (direction === correctPaths[currentLevel]) {
        correctSound.play();
        currentLevel++;
        if (currentLevel >= backgrounds.length) {
            gameOver = true;
            gameWon = true;
            portalImg.src = portalFrames[0];
            bgMusic.pause();
            winSound.play();
            try {
                localStorage.setItem('shadowEscape.hasWon', 'true');
            } catch (e) {
                console.error("localStorage not available:", e);
            }
            return;
        }
        bgImage.src = backgrounds[currentLevel];
    }
}

function drawHUD() {
    ctx.fillStyle = "white";
    ctx.font = "20px Arial";
    ctx.fillText(`Light: ${lightBars}`, 20, 30);

    // Dialogue box for question
    const boxHeight = 70;
    const boxY = canvas.height - boxHeight - 20;
    const boxX = 20;
    const boxWidth = canvas.width - 40;

    // Draw the box
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
    ctx.strokeStyle = "white";
    ctx.lineWidth = 2;
    ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);

    // Draw the question text
    ctx.fillStyle = "white";
    ctx.font = "20px Arial";
    ctx.fillText(questions[currentLevel], boxX + 20, boxY + 40);
}

function draw() {
    const time = Date.now();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!introDone) {
        ctx.drawImage(titleImage, 0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "white";
        ctx.font = "24px Arial";
        ctx.fillText("Press any key to continue...", 260, 550);

        try {
            if (localStorage.getItem('shadowEscape.hasWon') === 'true') {
                ctx.font = "40px Arial";
                ctx.fillStyle = "gold";
                ctx.fillText("⭐", canvas.width - 60, 50);
            }
        } catch (e) {
            // localStorage not available, do nothing
        }
    } else if (gameOver) {
        if (gameWon) {
            // Victory screen
            ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height); // Final background
            ctx.drawImage(portalImg, 300, 200, 200, 200); // Draw animated portal
            ctx.fillStyle = "white";
            ctx.font = "30px Arial";
            ctx.fillText("Luma is reunited with her family!", 180, 450);

            frameCounter++;
            if (frameCounter % 8 === 0) {
                currentFrame = (currentFrame + 1) % portalFrames.length;
                portalImg.src = portalFrames[currentFrame];
            }
        } else {
            // Game over screen
            ctx.fillStyle = "black";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = "white";
            ctx.font = "40px Arial";
            ctx.fillText("Game Over", 300, 200);
            ctx.font = "24px Arial";
            ctx.fillText("Luma lost all her light.", 280, 250);

            // Retry button
            const buttonX = 350;
            const buttonY = 350;
            const buttonWidth = 100;
            const buttonHeight = 50;
            ctx.fillStyle = "#555";
            ctx.fillRect(buttonX, buttonY, buttonWidth, buttonHeight);
            ctx.strokeStyle = "white";
            ctx.strokeRect(buttonX, buttonY, buttonWidth, buttonHeight);
            ctx.fillStyle = "white";
            ctx.font = "20px Arial";
            ctx.fillText("Retry", buttonX + 25, buttonY + 32);
        }
    } else {
        ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
        drawHUD();
        const expression = lightBars === 5 ? "happy" :
                           lightBars >= 3 ? "worry" :
                           lightBars >= 1 ? "unhappy" : "smug";
        const bobbingOffset = Math.sin(time / 200) * 5;
        ctx.drawImage(lumaExpressions[expression], 20, 100 + bobbingOffset, 100, 100);
        if (showShadowGuard) {
            ctx.drawImage(shadowGuardImg, 650, 450, 100, 100);
        }
    }
    requestAnimationFrame(draw);
}

draw();

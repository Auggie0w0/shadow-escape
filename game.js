const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Game assets
const lumaImg = new Image();
lumaImg.src = "assets/luma.png";

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

document.addEventListener("keydown", handleKeyPress);

function handleKeyPress(e) {
    if (gameOver) return;

    let direction = "";
    if (e.key === "ArrowLeft") direction = "left";
    if (e.key === "ArrowRight") direction = "right";
    if (e.key === "ArrowUp") direction = "forward";

    if (direction && correctPaths[currentLevel] !== direction) {
        // Wrong choice: lose light
        lightBars -= currentLevel === 2 ? 2 : 1;
    }

    if (lightBars <= 0) {
        gameOver = true;
        alert("Game Over! Luma lost all light.");
        return;
    }

    if (direction === correctPaths[currentLevel]) {
        currentLevel++;
        if (currentLevel >= backgrounds.length) {
            gameOver = true;
            alert("You Win! Luma found the relic.");
            // Show animated sprite at victory screen
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
            portalImg.src = portalFrames[0];

            function animatePortal() {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height); // Final background
                ctx.drawImage(portalImg, 300, 200, 200, 200); // Draw animated portal
                ctx.fillStyle = "white";
                ctx.font = "30px Arial";
                ctx.fillText("Luma is reunited with her family!", 180, 450);
                currentFrame = (currentFrame + 1) % portalFrames.length;
                portalImg.src = portalFrames[currentFrame];
                if (gameOver) requestAnimationFrame(animatePortal);
            }
            animatePortal();
            return;
        }
        bgImage.src = backgrounds[currentLevel];
    }
}

function drawHUD() {
    ctx.fillStyle = "white";
    ctx.font = "20px Arial";
    ctx.fillText(`Light: ${lightBars}`, 20, 30);
    ctx.fillText(questions[currentLevel], 20, 60);
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
    drawHUD();
    ctx.drawImage(lumaImg, 350, 450, 100, 100); // Display Luma at a fixed point
    requestAnimationFrame(draw);
}

draw();

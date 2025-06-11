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


document.addEventListener("keydown", () => {
    if (!introDone) {
        introIndex++;
        if (introIndex >= titleScreens.length) {
            introDone = true;
            bgImage.src = backgrounds[currentLevel]; // Start game with level 1 bg
        } else {
            titleImage.src = titleScreens[introIndex];
        }
    }
});

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
        showShadowGuard = true;
        setTimeout(() => showShadowGuard = false, 1000);
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
    if (!introDone) {
        ctx.drawImage(titleImage, 0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "white";
        ctx.font = "24px Arial";
        ctx.fillText("Press any key to continue...", 260, 550);
    } else {
        ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
        drawHUD();
        const expression = lightBars === 5 ? "happy" :
                           lightBars >= 3 ? "worry" :
                           lightBars >= 1 ? "unhappy" : "smug";
        ctx.drawImage(lumaExpressions[expression], 20, 100, 100, 100);
        if (showShadowGuard) {
            ctx.drawImage(shadowGuardImg, 650, 450, 100, 100);
        }
    }
    requestAnimationFrame(draw);
}

draw();

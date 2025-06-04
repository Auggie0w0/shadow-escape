const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let luma = {
    x: 50,
    y: 50,
    width: 30,
    height: 30,
    speed: 4,
    color: "white"
};

let keys = {};

document.addEventListener("keydown", e => keys[e.key] = true);
document.addEventListener("keyup", e => keys[e.key] = false);

function update() {
    if (keys["ArrowUp"]) luma.y -= luma.speed;
    if (keys["ArrowDown"]) luma.y += luma.speed;
    if (keys["ArrowLeft"]) luma.x -= luma.speed;
    if (keys["ArrowRight"]) luma.x += luma.speed;
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = luma.color;
    ctx.fillRect(luma.x, luma.y, luma.width, luma.height);
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

gameLoop();

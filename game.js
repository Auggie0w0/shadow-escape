const lumaImg = new Image();
lumaImg.src = "assets/luma.png"; // Replace with correct path to Luma's sprite
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Maze data (Level 1)
const maze = [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1],
    [1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
];

const TILE_SIZE = 50; // Define the size of each maze tile

let luma = {
    x: -1,
    y: -1,
    width: 30,
    height: 30,
    speed: 4,
    color: "white"
};

// Find the starting position of Luma based on the maze
for (let row = 0; row < maze.length; row++) {
    for (let col = 0; col < maze[row].length; col++) {
        if (maze[row][col] === 0) {
            luma.x = col * TILE_SIZE + (TILE_SIZE - luma.width) / 2;
            luma.y = row * TILE_SIZE + (TILE_SIZE - luma.height) / 2;
            break; // Found the start, exit loops
        }
    }
    if (luma.x !== -1) break; // Exit outer loop
}

let keys = {};

document.addEventListener("keydown", e => keys[e.key] = true);
document.addEventListener("keyup", e => keys[e.key] = false);

// Function to draw the maze
function drawMaze() {
    ctx.fillStyle = "#333"; // Wall color
    for (let row = 0; row < maze.length; row++) {
        for (let col = 0; col < maze[row].length; col++) {
            if (maze[row][col] === 1) { // If it's a wall tile
                ctx.fillRect(col * TILE_SIZE, row * TILE_SIZE, TILE_SIZE, TILE_SIZE);
            }
        }
    }
}

// Function to check for collision with maze walls
function checkCollision(x, y) {
    // Get the tile coordinates of the player's corners
    const playerLeft = Math.floor(x / TILE_SIZE);
    const playerRight = Math.floor((x + luma.width) / TILE_SIZE);
    const playerTop = Math.floor(y / TILE_SIZE);
    const playerBottom = Math.floor((y + luma.height) / TILE_SIZE);

    // Check if any of the player's corners are inside a wall tile
    for (let row = playerTop; row <= playerBottom; row++) {
        for (let col = playerLeft; col <= playerRight; col++) {
            // Ensure coordinates are within maze bounds
            if (row >= 0 && row < maze.length && col >= 0 && col < maze[0].length) {
                if (maze[row][col] === 1) {
                    return true; // Collision detected
                }
            }
        }
    }
    return false; // No collision
}

function update() {
    let nextX = luma.x;
    let nextY = luma.y;

    if (keys["ArrowUp"]) nextY -= luma.speed;
    if (keys["ArrowDown"]) nextY += luma.speed;
    if (keys["ArrowLeft"]) nextX -= luma.speed;
    if (keys["ArrowRight"]) nextX += luma.speed;

    // Check for collision before updating position
    if (!checkCollision(nextX, luma.y)) {
        luma.x = nextX;
    }
    if (!checkCollision(luma.x, nextY)) {
        luma.y = nextY;
    }
} 

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawMaze(); // Draw the maze first
    ctx.drawImage(lumaImg, luma.x, luma.y, luma.width, luma.height);
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

gameLoop();

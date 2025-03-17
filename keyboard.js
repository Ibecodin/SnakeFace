// Start the keyboard-controlled version of the game
function startKeyboardGame() {
    console.log("Keyboard mode activated!");

    // Hide the welcome screen and show the game
    document.getElementById("welcome-screen").style.display = "none";
    document.getElementById("game-container").style.display = "block";
    document.getElementById("snake_board").style.display = "block";
    document.getElementById("score").style.display = "block";

    // Reset score
    score = 0;
    document.getElementById('score').innerHTML = score;

    // Start the keyboard-specific game loop
    begin_keyboard_game();

    // Attach keyboard event listener
    document.addEventListener("keydown", handleKeyPress);

    console.log("Keyboard event listener attached!");
}

// New, separate game loop just for keyboard mode
function begin_keyboard_game() {
    console.log("Keyboard game loop started!");

    // Set up the snake game on the canvas
    snake_game = new Board(document.getElementById("snake_board"));

    // Run the game loop at an interval
    interval = window.setInterval(() => {
        console.log("Keyboard snake moving:", snake_game.direction);
        snake_game.update_step(snake_game);
    }, 300);
}

document.removeEventListener("keydown", handleKeyPress); // Ensure no duplicates
document.addEventListener("keydown", handleKeyPress);

// Handle arrow key inputs for keyboard mode
function handleKeyPress(event) {
    event.preventDefault(); // Stop arrow keys from focusing buttons
    console.log("Key pressed:", event.key);

    const key = event.key;

    // Change snake direction — prevent reversing
    if (key === "ArrowUp" && snake_game.direction !== "D") {
        console.log("Moving up!");
        snake_game.direction = "U";
    } else if (key === "ArrowDown" && snake_game.direction !== "U") {
        console.log("Moving down!");
        snake_game.direction = "D";
    } else if (key === "ArrowLeft" && snake_game.direction !== "R") {
        console.log("Moving left!");
        snake_game.direction = "L";
    } else if (key === "ArrowRight" && snake_game.direction !== "L") {
        console.log("Moving right!");
        snake_game.direction = "R";
    }

    console.log("Snake direction now:", snake_game.direction);
}

// Connect the button to keyboard mode
document.getElementById("arrow-control").addEventListener("click", startKeyboardGame);

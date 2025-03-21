var foodImage = new Image();
foodImage.src = "food.png";  

document.addEventListener("DOMContentLoaded", function () {
    const welcomeScreen = document.getElementById("welcome-screen");
    const faceControlButton = document.getElementById("face-control");
    const gameContainer = document.getElementById("game-container");
    const canvas = document.getElementById("gameCanvas");
    const scoreDisplay = document.getElementById("score");
    const video = document.getElementById("video");

    faceControlButton.addEventListener("click", function () {
        welcomeScreen.style.display = "none";
        gameContainer.style.display = "block";
        canvas.style.display = "block";
        scoreDisplay.style.display = "block";

        initFaceTracking();
    });

    async function initFaceTracking() {
        //console.log("Face tracking initialized.");
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            navigator.mediaDevices.getUserMedia({ video: true }).then(function (stream) {
                video.srcObject = stream;
                video.play();
            }).catch(function () {
                alert("Camera access is required for face tracking.");
            });
        }
        model = await facemesh.load();
        startFaceControlGame();
    }

    function startFaceControlGame() {
        //console.log("Face control game started!");
        begin_game();  // Ensure this function starts the snake game
    }
});

// --- Existing Game Logic ---
function load_video() {
    var video = document.getElementById('video');
    if(navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ video: true }).then(function(stream) {
            video.srcObject = stream;
            video.play();
        });
    }
}

var video;
var model;

async function init() {
    video = document.getElementById('video');
    if(navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ video: true }).then(function(stream) {
            video.srcObject = stream;
            video.play();
        }).catch(function() {
            document.getElementById('warning').innerHTML = "Please check your permissions: access to camera is needed to estimate head direction to control the snake.";
        });
    }
    model = await facemesh.load();
}

var preds;
var left_cheek;
var right_cheek;
var lips_lower_inner;
var left_diff;
var right_diff;
var lr;
var ud;
var cross;
var init_lr;
var init_ud;
var direction = "centre";
var pred_interval;
let score=0;

async function main() {
  const predictions = await model.estimateFaces(video);
  return predictions;
}

function cross_normalised(x, y){
    cross = [x[1] * y[2] - x[2] * y[1], x[2] * y[0] - x[0] * y[2],  x[0] * y[1] - x[1] * y[0] ];
    norm = Math.sqrt((cross[0] ** 2) + (cross[1] ** 2) + (cross[2] ** 2));
    return [cross[0] / norm, cross[1] / norm, cross[2] / norm];
}

function get_predictions() {
  predictions = main();
  predictions.then(function(val){
      if (val.length > 0){
      preds = val[0];
      left_cheek = preds["annotations"]["leftCheek"][0];
      right_cheek = preds["annotations"]["rightCheek"][0];

      lips_lower_inner = [0, 0, 0];
      lips_coords = preds["annotations"]["lipsLowerInner"];
      for (i=0; i < lips_coords.length; i++) {
          for (j=0; j < 3; j++){
            lips_lower_inner[j] += lips_coords[i][j];
          }
      }
      for (j=0; j < 3; j++){
          lips_lower_inner[j] = lips_lower_inner[j] / lips_coords.length;
      }

      left_diff = [];
      right_diff = [];
      for (i=0; i< 3; i++){
          left_diff.push(left_cheek[i] - lips_lower_inner[i]);
          right_diff.push(right_cheek[i] - lips_lower_inner[i]);
      }

      cross = cross_normalised(left_diff, right_diff);
      //console.log(cross);

      lr = cross[0];
      ud = cross[1];
      if (init_lr === undefined){
          init_lr = lr;
      }
      if (init_ud === undefined){
          init_ud = ud;
      }

      tol = 0.2;
      if (lr - init_lr > tol){
          direction = "left";
      } else if (lr - init_lr < -tol) { 
          direction = "right";
      } else if (ud - init_ud > tol) {
          direction = "down";
      } else if (ud - init_ud < -tol) {
          direction = "up";
      } else {
          direction = "centre";
      }
      document.getElementById('direction').innerHTML = direction;
      document.getElementById('score').innerHTML = score;
      }
    });
}

function start_pred() {
    document.getElementById('direction').innerHTML = "Thinking...";
    pred_interval = window.setInterval(() => get_predictions(), 1000/10);
}

function stop_pred() {
    window.clearInterval(pred_interval);
}

class Board {
    constructor(canvas){
        this.canvas = canvas;
        this.length = 1;
        this.direction = "D";
        this.positions = [[5,10]];
        this.box_dim = 15;
        this.grid_size = 40;
        score = 0;
        this.context = this.canvas.getContext("2d");
        var random_pos_x = 4 +  Math.floor(Math.random() * 12);
        var random_pos_y = 4 +  Math.floor(Math.random() * 12);
        this.food = [random_pos_x, random_pos_y];
    }
    plot(obj) {
        obj.context.fillStyle = "#FFFFFF";
        obj.context.fillRect(0, 0, obj.box_dim * obj.grid_size, obj.box_dim * obj.grid_size);

        obj.context.fillStyle = "#000000";
        obj.context.fillRect(0, 0, 1, obj.box_dim * obj.grid_size);
        obj.context.fillRect(0, 0, obj.box_dim * obj.grid_size, 1);
        obj.context.fillRect(0, obj.box_dim * obj.grid_size - 1, obj.box_dim * obj.grid_size, 1);
        obj.context.fillRect(obj.box_dim * obj.grid_size - 1, 0, 1, obj.box_dim * obj.grid_size);

        // Draw the food image
        let foodSize = obj.box_dim * 1.2; // Slightly bigger than a grid cell
        let foodX = obj.food[0] * obj.box_dim + (obj.box_dim - foodSize) / 2;
        let foodY = obj.food[1] * obj.box_dim + (obj.box_dim - foodSize) / 2;

        obj.context.drawImage(foodImage, foodX, foodY, foodSize, foodSize);


        var i;
        var x;
        var y;
        for (i = 0; i < obj.positions.length; i++) {
            x = obj.positions[i][0];
            y = obj.positions[i][1];
             
            // Use a gradient effect for a smooth look
            let gradient = obj.context.createLinearGradient(x * obj.box_dim, y * obj.box_dim, (x + 1) * obj.box_dim, (y + 1) * obj.box_dim);
            gradient.addColorStop(0, "#079e16");  // Dark green (top)
            gradient.addColorStop(1, "#0abe1c");  // Light green (bottom)

            obj.context.fillStyle = gradient;
            obj.context.beginPath();
            obj.context.roundRect(x * obj.box_dim, y * obj.box_dim, obj.box_dim, obj.box_dim, 5); // Rounded corners
            obj.context.fill();
        }

        document.getElementById('score').innerHTML = score;
        if (score > 1) {
            document.getElementById('circle').style.visibility = "visible";
        }

        return;
    }
    new_food(obj){
        var random_pos_x = 4 + Math.floor(Math.random() * 12);
        var random_pos_y = 4 + Math.floor(Math.random() * 12);

        while (obj.check_intersects(obj, [random_pos_x, random_pos_y])){
            random_pos_x = Math.floor(Math.random() * obj.grid_size);
            random_pos_y = Math.floor(Math.random() * obj.grid_size);
        }
        obj.food = [random_pos_x, random_pos_y];
    }

    check_intersects(obj, coords){
        var x;
        var y;
        var i;
        for (i=0; i < obj.positions.length; i++){
            x = obj.positions[i][0];
            y = obj.positions[i][1];
            if ((x == coords[0]) && (y == coords[1])){
                return Boolean(1);
            }           
        }
        if (Boolean){
            score++;  //increases score where it checks if theres an intersection
            console.log(score);
        }
        return Boolean(0);
    }

    end_if_intersects(obj, new_head) {
        for (let i = 0; i < obj.positions.length; i++) {
            const [x, y] = obj.positions[i];
    
            if ((x == new_head[0] && y == new_head[1]) ||
                new_head[0] < 0 || new_head[1] < 0 ||
                new_head[0] >= obj.grid_size || new_head[1] >= obj.grid_size) {
                
                window.clearInterval(interval);
                stop_pred(); // Stop the face tracking loop too
                console.log("Game Over!");
    
                // Show the game over popup and final score
                document.getElementById('final-score').innerText = score;
                document.getElementById('game-over-screen').style.display = "block";
    
                return true;  // Ensure the game fully stops
            }
        }
        return false;  // Keep running if no collision
    }
    

    update_step(obj){
        if (direction == 'down' && obj.direction != 'U'){
            obj.direction = "D";
        } else if (direction == 'up' && obj.direction != 'D'){
            obj.direction = "U";
        } else if (direction == 'left' && obj.direction != 'R'){
            obj.direction = "L";
        } else if (direction == 'right' && obj.direction != 'L'){
            obj.direction = "R";
        } 

        var head = obj.positions[obj.positions.length - 1];
        var new_head;
        if (obj.direction == "D"){
            new_head = [head[0], head[1] + 1];
        } else if (obj.direction == "U"){
            new_head = [head[0], head[1] - 1];
        } else if (obj.direction == "R"){
            new_head = [head[0] + 1, head[1]];
        } else if (obj.direction == "L"){
            new_head = [head[0] - 1, head[1]];
        }

        obj.end_if_intersects(obj, new_head);

        obj.positions.push(new_head);
        if (new_head[0] != obj.food[0] | new_head[1] != obj.food[1]){
            obj.positions.shift();
        } else {
            obj.new_food(obj);
        }
        obj.plot(obj);
        return;
    }
}

var interval;

function begin_game() {
    if (pred_interval === undefined){
      start_pred()
    }
    var c = document.getElementById("snake_board");
    snake_game = new Board(c);
    document.getElementById('score').innerHTML = "Score:";
    document.getElementById('button').innerHTML = "Restart game";
    document.getElementById('score').innerHTML = score;

    var speed;
    if (document.getElementById('r1').checked){
        speed = 400
    } else if (document.getElementById('r2').checked) {
        speed = 300
    } else if (document.getElementById('r3').checked) {
        speed = 200
    } else if (document.getElementById('r4').checked) {
        speed = 150
    }
    if (interval){
        window.clearInterval(interval);
    }
    interval = window.setInterval(
        () => snake_game.update_step(snake_game), speed);
}

function restartGame() {
    console.log("Restarting Game!"); // Debug check
    
    // Hide the popup
    document.getElementById('game-over-screen').style.display = "none";
    
    // Reset the score
    score = 0;
    document.getElementById('score').innerHTML = score;

    // Restart face tracking and predictions
    start_pred(); 

    // Restart the game
    begin_game();
}
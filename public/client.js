//FLAPPY BIRD GAME
//inspired by Dan Shiffman's Flappy Bird Tutorial - >   https://www.youtube.com/watch?v=cXgA1d_E-jY&t=611s
class Bird {
  constructor() {
    this.x = width / 2;
    this.y = height / 2;
    this.radius = 5;
    this.Vy = 0;
    this.jumpheight = 6;
    this.dead = false;
    this.score = 0;
    this.color = this.randomColor();
  }

  update() {
    this.y += this.Vy;
    this.Vy += 0.2;
    this.score = this.calculateScore();

    for (let i = 0; i < pipes.length; i++) {
      //check if touch top pipe
      if (
        this.x > pipes[i].x &&
        this.x < pipes[i].x + pipes[i].Pipewidth &&
        this.y < pipes[i].TopPipeHeight
      ) {
        this.dead = true;
      }

      //check if touch bottom pipe
      if (
        this.x > pipes[i].x &&
        this.x < pipes[i].x + pipes[i].Pipewidth &&
        this.y > height - pipes[i].BottomPipeHeight
      ) {
        this.dead = true;
      }
    }

    if (this.dead) {
      socket.emit("dead", username);
    }

    //emit score to server
    socket.emit("scores", this.score);
  }

  show() {
    this.circle(this.x, this.y, this.radius);
  }

  jump() {
    this.Vy -= this.jumpheight;
  }

  calculateScore() {
    //find pipe just passed (score will equal that pipe's index)
    let mindist = 10000;
    let score = 0;
    for (let i = 0; i < pipes.length; ++i) {
      let d = this.dist(this.x, this.y, pipes[i].x, this.y);
      if ((d < mindist) & (pipes[i].x < width / 2 - pipes[i].Pipewidth)) {
        mindist = d;
        score = i;
      }
    }

    score += 1; //since first index of a pipe is 0
    return score;
  }

  circle(x, y, r) {
    let c = document.getElementById("canvas");
    let ctx = c.getContext("2d");
    ctx.beginPath();
    ctx.arc(x, y, r, 0, 2 * Math.PI);
    ctx.closePath();
    ctx.fillStyle = this.color;
    ctx.fill();
  }

  randomColor() {
    return "hsl(" + random(0, 255) + ", 100%, 80%)";
  }

  dist(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
  }
}

class Pipe {
  constructor(startX, startY) {
    this.x = startX;
    this.BottomPipeHeight = startY;
    this.Pipewidth = 50;
    this.Pipegap = 200;
    this.TopPipeHeight = height - (this.BottomPipeHeight + this.Pipegap);
    this.speed = 5;
    this.gameScore = 0;
  }

  update() {
    this.x -= this.speed;
  }

  show() {
    //bottom pipe
    this.rect(
      this.x,
      height - this.BottomPipeHeight,
      this.Pipewidth,
      this.BottomPipeHeight
    );
    //top pipe
    this.rect(this.x, 0, this.Pipewidth, this.TopPipeHeight);
  }

  rect(x, y, width, height) {
    let c = document.getElementById("canvas");
    let ctx = c.getContext("2d");
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(x, y, width, height);
  }
}

const socket = io();
let flappy;
let pipes = [];
let height = $("#canvas").height();
let width = $("#canvas").width();
let game = false;
let username;
let interval;
let counterInterval;
let counter = 3;

//set width of chatroom in css
$("#chatroom").css("width", window.innerWidth - 1080);

//setup
$("#startFlappyGame").hide();
$("#canvas").hide();
$("#waitingroomtext").hide();
$("#currentgameLeaderboard").hide();
$("#allTimeLeaderboard").hide();
$("#chatroom").hide();
$("#activeUsers").hide();
$("#youdiedtext").hide();

//start game
flappy = new Bird();
$("#startFlappyGame").click(startFlappyGame);

$("#SignUp").click(function () {
  let password = $("#password").val();
  username = $("#username").val();

  if (username && password) {
    socket.emit("SignUp", username, password);
  } else if (!username && password) {
    alert("Please enter a username");
  } else if (username && !password) {
    alert("Please enter a password");
  } else if (!username && !password) {
    alert("Please enter a username and password");
  }
});

$("#login").click(function () {
  let password = $("#password").val();
  username = $("#username").val();

  if (username && password) {
    socket.emit("login", username, password);
  } else if (!username && password) {
    alert("Please enter a username");
  } else if (username && !password) {
    alert("Please enter a password");
  } else if (!username && !password) {
    alert("Please enter a username and password");
  }
});

function connectGame() {
  //make login inputs and buttons dissapearr by making the entire div dissapear
  $("#authentication").hide();

  //show canvass and liists
  $("#canvas").show();
  $("#currentgameLeaderboard").show();
  $("#allTimeLeaderboard").show();
  $("#chatroom").show();
  $("#activeUsers").show();

  //change title
  $("h1").html("Multiplayer Flappy Bird!");

  //change background image
  $("body").css(
    "background-image",
    "url('https://cdn.glitch.com/b7eb593f-7abf-4353-97ed-b139d4d95334%2FDownload-Sky-Wallpapers-High-Resolution.jpg?v=1614655474226')"
  );
}

function startFlappyGame() {
  socket.emit("userstartedFlappyGame");
}

function draw() {
  let c = document.getElementById("canvas");
  let ctx = c.getContext("2d");
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, width, height);

  if (flappy.dead == false) {
    flappy.update();
    flappy.show();

    c.onclick = jump;
    function jump() {
      if (game) {
        flappy.jump();
      }
      console.log("hi");
    }

    for (let i = 0; i < pipes.length; i++) {
      pipes[i].show();
      pipes[i].update();
    }

    //update score as long as bird is alive
    socket.emit("score", username, flappy.score);
  }

  if (flappy.dead) {
    $("#youdiedtext").show();
  }
}

//socket.io stuff
socket.on("addnewPipe", function (pipeHeight) {
  pipes.push(new Pipe(width, pipeHeight));
});

//get pipe values
socket.on("pipes", function (pipeHeights) {
  for (let i = 0; i < pipeHeights.length; i++) {
    pipes[i] = new Pipe(width + i * 300, pipeHeights[i]);
  }
});

socket.on("showscores", function (userscores) {
  let stats = []; //make new arr to not disturb userscores
  for (let i = 0; i < userscores.length; i++) {
    stats[i] = userscores[i][0] + " " + userscores[i][1];
  }

  stats = stats.join("<li>");
  $("#currentgameLeaderboardscores").html("<li>" + stats + "</li>");

  let list = document
    .getElementById("currentgameLeaderboardscores")
    .querySelectorAll("li");

  list.forEach((item, index) => {
    if (userscores[index][2] == "dead") {
      item.style.color = "red";
    }
  });
});

socket.on("gameplay", function (gameplay) {
  if (gameplay) {
    $("#waitingroomtext").show();
  } else {
    $("#startFlappyGame").show();
    $("#waitingroomtext").hide();
  }
});

socket.on("startGame", function () {
  //set delay interval
  counterInterval = setInterval(gameDelay, 900);

  //let chat know before delay
  $("#countertext").html("The game will begin in " + counter + " seconds");
  $("#countertext").show();

  //hide start game button
  $("#startFlappyGame").hide();
  flappy.show();
});

function gameDelay() {
  counter -= 1;

  $("#countertext").html("The game will begin in " + counter + " seconds");
  if (counter == 0) {
    interval = setInterval(draw, 13);
    game = true;
    counter = 3;
    $("#countertext").hide();
    clearInterval(counterInterval);
  }
}

socket.on("everyoneDead", function () {
  reset(); //reset variables

  //make sure background clears
  let c = document.getElementById("canvas");
  let ctx = c.getContext("2d");
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, width, height);

  socket.emit("reset");
});

function reset() {
  flappy = new Bird();
  clearInterval(interval);
  game = false;
  $("#startFlappyGame").show();
  $("#youdiedtext").hide();
}

socket.on("signupfailed", function (username) {
  alert(username + " is already taken");
  //clear input so user can re-enter
  $("#username").val("");
  $("#password").val("");
});

socket.on("loginfailed", function (username) {
  alert(username + " was either not found or the password was incorrect");
  //clear input so user can re-enter
  $("#username").val("");
  $("#password").val("");
});

socket.on("authenticationSuccessful", function () {
  connectGame();
  socket.emit("ConnectGame");
});

socket.on("WelcometoGame", function () {
  alert("Welcome " + username + "!");
});

socket.on("allTimeLeaderboard", function (allTimeLeaderboard) {
  for (let i = 0; i < allTimeLeaderboard.length; i++) {
    allTimeLeaderboard[i] =
      allTimeLeaderboard[i][0] + " " + allTimeLeaderboard[i][1];
  }
  allTimeLeaderboard = allTimeLeaderboard.join("<li>");
  $("#allTimeLeaderboardscores").html("<li>" + allTimeLeaderboard + "</li>");
});

//chatroom
$("#submitbutton").click(function () {
  let newChat = $("#chat").val();
  if (newChat) {
    socket.emit("addchats", username, newChat);
    $("#chat").val("");
  }
});

socket.on("chats", function (chatlog) {
  //only show if there are chats
  if (chatlog.length >= 1) {
    //put username above chat
    for (let i = 0; i < chatlog.length; i++) {
      chatlog[i] = chatlog[i][0] + "<br>" + chatlog[i][1];
    }
    chatlog = chatlog.join("<li>");
    $("#chatlist").html("<li>" + chatlog + "</li>");
  }

  let chats = document.getElementById("chatlist");
  chats.scrollTop = chats.scrollHeight;
});

socket.on("users", function (userlog) {
  userlog = userlog.join("<li>");
  $("#users").html("<li>" + userlog + "</li>");
});

socket.on("newHighScore", function (highscore, username) {
  alert("Congrats " + username + " on a new all time high score of " + highscore);
})

socket.on("WelcomeLogin", function (highscore) {
  alert("Welcome back " + username + "! Currently your all time high score is " + highscore + " :)")
});

function random(min, max) {
  return Math.random() * (max - min) + min;
}

function circle(x, y, r) {
  let c = document.getElementById("canvas");
  let ctx = c.getContext("2d");
  ctx.beginPath();
  ctx.arc(x, y, r, 0, 2 * Math.PI);
  ctx.closePath();
  ctx.fillStyle = "#FF0000";
  ctx.fill();
}

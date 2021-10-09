const express = require("express");
const app = express();
const http = require("http").Server(app);
const io = require("socket.io")(http);
const anyDB = require("any-db");
const conn = anyDB.createConnection("sqlite3://flappybird.db");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");

//game storageee
let pipeHeights = [];
let Pipewidth = 50;
let userstats = [];
let gameplay = false;
let waitingroom = [];
let allTimeLeaderboard = [];
let activeUsers = [];
let chats = [];

//canvas size
let height = 500;
let width = 500;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static("public"));

//acccesss HTML files
var engines = require("consolidate");
app.engine("html", engines.hogan);
app.engine("css", engines.hogan);
app.set("views", __dirname + "/views");

// https://expressjs.com/en/starter/basic-routing.html
app.get("/", (request, response) => {
  response.sendFile(__dirname + "/views/index.html");
});

//socket.io stuff
io.on("connection", socket => {
  //set game to false if no active users
  if (activeUsers.length > 1) {
    gameplay = false;
    userstats = [];
  }

  socket.on("SignUp", function(username, password) {
    //check if username is already taken
    let add = true;
    conn.query("SELECT * FROM flappybird;", function(err, response) {
      response.rows.forEach((item, index) => {
        if (response.rows[index]["usernames"] == username) {
          add = false;
        }
      });

      //if username is not taken then add username to database andd encrypted password
      if (add) {
        //hash
        bcrypt.hash(password, 10, (err, hash) => {
          conn.query("INSERT INTO flappybird VALUES($1, $2, $3);", [
            username,
            hash,
            0 //score starts out at 0
          ]);
        });

        //add to active users
        socket.username = username;
        activeUsers.push(username);

        //emit to people in game
        io.to("game").emit("users", activeUsers);
        socket.emit("authenticationSuccessful");
        socket.emit("WelcometoGame");
      } else {
        socket.emit("signupfailed", username);
      }
    });
  });

  socket.on("login", function(username, password) {
    //check if username is in database
    conn.query("SELECT * FROM flappybird;", function(err, response) {
      let usernamefound = false;
      response.rows.forEach((item, index) => {
        if (response.rows[index]["usernames"] == username) {
          usernamefound = true;
          //passwords are all hashed for security so need to use bcrypt to see if the user's password matches what is in the database
          bcrypt.compare(password, response.rows[index]["passwords"], function(
            err,
            results
          ) {
            if (results) {
              //add to active users
              socket.username = username;
              activeUsers.push(username);
              
              //update every connected user's active user list
              io.to("game").emit("users", activeUsers);
              
              //let the client know they are logged in and can display the game page
              socket.emit("authenticationSuccessful");
              //send an alert to the user telling them they are welcome and their current high score
              socket.emit("WelcomeLogin", response.rows[index]["scores"]);
            } else {
              //let the user know if their login failed, if their password did match with their username in the database
              socket.emit("loginfailed", username);
            }
          });
        }
      });

      if (usernamefound == false) {
        //let user know if their login failed because their username was not in the database
        socket.emit("loginfailed", username);
      }
    });
  });

  socket.on("ConnectGame", function() {
    //emit the all time leader board (top 10 highest scores)
    let AllTimeLeaderboard = [];
    conn.query("SELECT * FROM allTimeLeaderboard;", function(err, response) {
      response.rows.forEach((item, index) => {
        AllTimeLeaderboard.push([
          response.rows[index]["usernames"],
          response.rows[index]["scores"]
        ]);
      });

      socket.emit("allTimeLeaderboard", AllTimeLeaderboard);
    });

    //tell connected user if a game is already in play
    socket.emit("gameplay", gameplay);

    //if game is in play then put user in waiting room otherwise let user join game
    if (gameplay) {
      waitingroom.push(socket);
    } else {
      socket.join("game");
    }

    //emit recent chats from chatroom and active users
    socket.emit("chats", chats);
    socket.emit("users", activeUsers);
  });

  socket.on("userstartedFlappyGame", function() {
    //start off adding 5 to an array
    for (let i = 0; i < 5; i++) {
      pipeHeights[i] = random(20, 300);
    }

    gameplay = true;
    io.to("game").emit("pipes", pipeHeights);
    io.to("game").emit("startGame");
  });

  socket.on("reset", function() {
    gameplay = false;
    //before clear stats, update all time leaderboard
    let AllTimeLeaderboard = [];

    conn.query("SELECT * FROM allTimeLeaderboard;", function(err, response) {
      //1.) get all usernames/scores from leaderboard in database
      response.rows.forEach((item, index) => {
        AllTimeLeaderboard.push([
          response.rows[index]["usernames"],
          response.rows[index]["scores"]
        ]);
      });

      //2.) add new scores
      for (let i = 0; i < userstats.length; i++) {
        AllTimeLeaderboard.push([userstats[i][0], userstats[i][1]]);
      }

      //3.) convert string to Int
      for (let i = 0; i < AllTimeLeaderboard.length; i++) {
        AllTimeLeaderboard[i][1] = parseInt(AllTimeLeaderboard[i][1]);
      }

      //4.) sort in the new scores so they are in order
      AllTimeLeaderboard = bubblesort2D(AllTimeLeaderboard);

      //5.) cut the leaderboard to top 10 scores and then put them in reverse order
      if (AllTimeLeaderboard.length > 10) {
        AllTimeLeaderboard = AllTimeLeaderboard.slice(
          AllTimeLeaderboard.length - 10
        );
      }
      AllTimeLeaderboard = AllTimeLeaderboard.reverse();

      //6.) clear database and insert new values
      conn.query("DELETE FROM AllTimeLeaderboard");
      for (let i = 0; i < AllTimeLeaderboard.length; i++) {
        conn.query("INSERT INTO AllTimeLeaderboard VALUES($1, $2);", [
          AllTimeLeaderboard[i][0],
          AllTimeLeaderboard[i][1]
        ]);
      }

      io.to("game").emit("allTimeLeaderboard", AllTimeLeaderboard);
      userstats = []; //clear prioor stats
    });

    //empty out waiting room
    for (let i = 0; i < waitingroom.length; i++) {
      waitingroom[i].emit("gameplay", gameplay);
      waitingroom[i].join("game");
    }

    //clear waiting room
    waitingroom = [];

    //get new starting pipes
    for (let i = 0; i < 5; i++) {
      pipeHeights[i] = random(20, 300);
    }

    io.to("game").emit("pipes", pipeHeights);
  });

  socket.on("dead", function(username) {
    for (let i = 0; i < userstats.length; i++) {
      if (userstats[i][0] == username) {
        userstats[i][2] = "dead";
        break;
      }
    }

    //see if max score in database should be updated
    for (let i = 0; i < userstats.length; i++) {
      if (userstats[i][0] == username) {
        conn.query(
          "SELECT * FROM flappybird WHERE usernames = $1;",
          [username],
          function(err, response) {
            if (userstats[i][1] > response.rows[0]["scores"]) {
              conn.query(
                "UPDATE flappybird SET scores=$1 WHERE usernames=$2;",
                [userstats[i][1], username]
              );
               socket.emit("newHighScore", userstats[i][1], userstats[i][0]);
            }
          }
        );
        break;
      }
    }

    //check if everyone is dead to end game
    let everyoneDead = true;
    for (let i = 0; i < userstats.length; i++) {
      if (userstats[i][2] == "alive") {
        everyoneDead = false;
        break;
      }
    }

    if (everyoneDead) {
      io.to("game").emit("everyoneDead");
    }
  });

  //score
  socket.on("score", function(username, score) {
    let add = true;

    //update score if username already in arr
    for (let i = 0; i < userstats.length; i++) {
      if (userstats[i][0] == username) {
        userstats[i][1] = score;
        add = false;
        break;
      }
    }

    //add username to arr if its not there already
    if (add) {
      userstats.push([username, score, "alive"]); //if just added, status should always be alive
    }

    //check to see if need to add pipe
    for (let i = 0; i < userstats.length; i++) {
      if (userstats[i][1] - 1 == pipeHeights.length - 1) {
        //since score is always pipe index + 1
        let newpipe = random(50, 300);
        pipeHeights.push(newpipe);
        io.to("game").emit("addnewPipe", newpipe);
        break;
      }
    }

    io.emit("showscores", userstats);
  });

  //chatroom code
  //add chats
  socket.on("addchats", function(username, newChat) {
    chats.push([username, newChat]);
    io.emit("chats", chats);
  });

  //say user disconnect wheen a user disconnects
  socket.on("disconnect", () => {
    activeUsers.splice(activeUsers.indexOf(socket.username), 1);
    io.to("game").emit("users", activeUsers);
  });
});

function random(min, max) {
  return Math.random() * (max - min) + min;
}

//based off the bubblesort we learned in class
function bubblesort2D(list) {
  for (let i = 0; i < list.length; i++) {
    for (let j = 0; j < list.length - 1; j++) {
      if (list[j][1] > list[j + 1][1]) {
        let scoreswap = list[j][1];
        list[j][1] = list[j + 1][1];
        list[j + 1][1] = scoreswap;

        let nameswap = list[j][0];
        list[j][0] = list[j + 1][0];
        list[j + 1][0] = nameswap;
      }
    }
  }
  return list;
}

// listen for requests :)
const listener = http.listen(process.env.PORT, () => {
  console.log("Your app is listening on port " + listener.address().port);
});

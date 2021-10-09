# A Multiplayer Flappy Bird Game
A [node.js](https://nodejs.org/en/docs/) application that uses [Express](https://expressjs.com/) and [Socket.io](https://socket.io/docs/v4/client-api/) to create a multiplayer [flappy bird](https://en.wikipedia.org/wiki/Flappy_Bird) game, where users can play and connect real-time.

## Functionality

### Authentication

The web app begins with prompting the user to either sign-up or login. All user data (usernames, passwords, and high scores) are stored in a [SQLite3](https://www.npmjs.com/package/sqlite3) database.
To maintain user privacy, the passwords are encrypted using [bcrypt](https://www.npmjs.com/package/bcrypt).

![authentication img](/images/authentication.png)

### Flappy Bird Game

When one person starts the game, the game starts for all active users at the same time. During game play, you can see other people's scores and their color font turns red when their bird dies. The UI for the game is seen in the demo video below.

https://user-images.githubusercontent.com/81705278/136645600-cdc33bd2-e808-45ee-a87f-f004178dd487.mp4

### All Time Leaderboard

In a separate table of the database, a Leaderboard is kept for the top 10 highest scores and the corresponding usernames. The table is always kept in order from highest to lowest using a 2D version of bubble sort.

### Chatroom

There is a chatroom on the right-hand side, so users can interact with each other directly. The purpose of this add-on was so users can communicate when to start the game, and if some users die early and get bored, they can also communicate to pass time until the game finishes. Similar to the flappy bird game itself, the chatroom is built using Socket.io for real-time communication. 

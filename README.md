# A Multiplayer Flappy Bird Game
A [node.js](https://nodejs.org/en/docs/) application that uses [Socket.io](https://socket.io/docs/v4/client-api/) to create a multiplayer [flappy bird](https://en.wikipedia.org/wiki/Flappy_Bird) game, where users can play and connect real-time.

## Functionality

### Authentication

The web app begins with prompting the user to either sign-up or login. All user data (usernames, passwords, and high scores) are stored in a [SQLite3](https://www.npmjs.com/package/sqlite3) database.
To maintain user privacy, the passwords are encrypted using [bcrypt](https://www.npmjs.com/package/bcrypt).

![authentication img](/images/authentication.png)

### Flappy Bird Game

When one person starts the game, the game starts for all active users at the same time. During game play, you can see other people's scores and their color font turns red when their bird dies. The UI for the game is seen in the demo video below.

https://user-images.githubusercontent.com/81705278/136645600-cdc33bd2-e808-45ee-a87f-f004178dd487.mp4

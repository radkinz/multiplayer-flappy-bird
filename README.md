# A Multiplayer Flappy Bird Game
A [node.js](https://nodejs.org/en/docs/) application that uses [Socket.io](https://socket.io/docs/v4/client-api/) to create a multiplayer [flappy bird](https://en.wikipedia.org/wiki/Flappy_Bird) game, where users can play and connect real-time.

## Functionality

### Authentication

The web app begins with prompting the user to either sign-up or login. All user data (usernames, passwords, and high scores) are stored in a [SQLite3](https://www.npmjs.com/package/sqlite3) database.
To maintain user privacy, the passwords are encrypted using [bcrypt](https://www.npmjs.com/package/bcrypt).

![authentication img](/images/authentication.png)

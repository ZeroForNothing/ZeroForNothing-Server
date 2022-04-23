require('dotenv').config();
const express = require('express')
const app = express()
app.use(express.json())

let GameServer = require('./Classes/GameServer')
let gameServer = new GameServer();

const serverManager = require('http').Server(app)
const io = require("socket.io")(serverManager,
  {
    cors: {
      origin: "http://localhost",
      methods: ["GET", "POST"]
    }
  }
);
function serverLog(text) {
  console.log("Game Server =>", text);
}

serverManager.listen(process.env.GAMEPORT, () => serverLog(`Listening on port 3004`));

// let Queue = require('./Classes/Queue.js');

setInterval(() => {
  gameServer.onUpdate();
}, 100 / 3, 0);

io.on('connection', function (socket) {
  serverLog("Connection Started ( Socket id: " + socket.id + " )")
  socket.on('socketLogin', function (data) {
    if (data.platform != null && data.email != null)
      gameServer.onConnected(socket, data.platform, data.email);
  });
})
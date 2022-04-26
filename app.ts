require('dotenv').config();
const express = require('express')
const app = express()
app.use(express.json())

let GameServer = require('./Code/Server')
let nodeServer = new GameServer();

const serverManager = require('http').Server(app)
const io = require("socket.io")(serverManager,
  {
    cors: {
      origin: "http://localhost",
      methods: ["GET", "POST"]
    }
  }
);
function serverLog(text : string) {
  console.log("Game Server =>", text);
}

serverManager.listen(process.env.PORT, () => serverLog(`Listening on port ${process.env.PORT}`));

// let Queue = require('./Classes/Queue.js');

setInterval(() => {
  nodeServer.onUpdate();
}, 100 / 3);

io.on('connection', function (socket : any) {
  serverLog("Connection Started ( Socket id: " + socket.id + " )")
  socket.on('socketLogin', function (data : any) {
    if (data.email != null)
    nodeServer.onConnected(socket, data.email);
  });
})
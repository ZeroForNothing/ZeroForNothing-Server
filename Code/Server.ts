const Connection = require('./Connection')
const Database = require('./Database')
const Queue = require('./Queue')
const User = require('./User')
//Lobbies
const LobbyBase = require('./Lobbies/LobbyBase')
const GameLobby = require('./Lobbies/GameLobby')
const SearchLobby = require('./Lobbies/SearchLobby')
const GameLobbySettings = require('./Lobbies/GameLobbySettings')

module.exports = class Server {
  connections  : typeof Connection[string];
  database : typeof Database;

  competitiveMatchQueue : typeof Queue;
  normalMatchQueue : typeof Queue;

  gameLobbySettings : typeof GameLobbySettings;

  searchLobbys : typeof SearchLobby[string];
  gameLobbys : typeof GameLobby[string];
  SearchLobby : typeof SearchLobby;
  groupBase : typeof LobbyBase;

  constructor() {
    let server = this;
    server.connections  = [];
    server.database = new Database();

    server.competitiveMatchQueue = new Queue(server);
    server.normalMatchQueue = new Queue(server);

    server.searchLobbys = [];
    server.gameLobbys = [];

    server.SearchLobby = new SearchLobby();
    server.SearchLobby.id = "SearchLobby";
    server.searchLobbys["SearchLobby"] = server.SearchLobby;

    server.gameLobbySettings = new GameLobbySettings();
  }
  log(text : string){
    console.log("Game Server =>" , text)
  }
  //Interval update every 30frames
  onUpdate() {
    let server = this;
    //Update each lobby
    for (let id in server.gameLobbys) {
      server.gameLobbys[id].onUpdate();
    }
  }

  //Handle a new connection to the server
  onConnected(socket : any , email : string) {
    let server = this;
    server.log("Fetching user data for " + email);
    server.database.getDataForSocket(email, (data : typeof User) => {
      if (data.userID != null) {
        let userID = data.userID;
        if (server.connections["User_" + userID] != null) {
          server.connections["User_" + userID].startOtherPlatform(socket, server);
        } else {
          server.connections["User_" + data.userID] = new Connection(socket, server, data)
        }
      } else {
        server.log("User is invalid");
      }
    })
  }

  onDisconnected(connection = Connection) {
    let server = this;
    let id = connection.id;

    //Tell Other players currently in the lobby that we have disconnected from the game
    if (connection.gameLobby != null) {
      connection.gameLobby.onLeaveGameLobby(connection)
    }

    server.connections["User_" + id].socket = null;
    connection.log('Disconnected');
  }

  closeDownLobby(index : string) {
    let server = this;
    server.log('Closing down lobby ( ' + index + ' )');
    delete server.gameLobbys[index];
  }
  createGameLobby(connection : typeof Connection, data : any) {
    let server = this;
    let name = data.name;
    let gameMode = data.settings.gameMode
    let maxPlayers = data.settings.maxPlayers;
    if (connection.player.class == null) {
      connection.socket.emit('ShowError', {
        error: "Must have a class selected"
      });
      return;
    }
    if (name == null || name.trim().length == 0) {
      connection.socket.emit('ShowError', {
        error: "Must insert lobby name"
      });
      return;
    }
    if (gameMode == null || (gameMode !== server.gameLobbySettings.NORMAL && gameMode !== server.gameLobbySettings.COMPETITIVE)) {
      connection.socket.emit('ShowError', {
        error: "Must select lobby mode"
      });
      return;
    }
    if (maxPlayers == null || isNaN(maxPlayers) || maxPlayers < 50 || maxPlayers > 200) {
      connection.socket.emit('ShowError', {
        error: "Must select max amount of players in the lobby"
      });
      return;
    }
    let checkLobbyAlreadyExist = false;
    Object.keys(server.gameLobbys).forEach(lobbyIndex => {
      if (server.gameLobbys[lobbyIndex].name == name) {
        checkLobbyAlreadyExist = true;
        return;
      }
    });
    if (checkLobbyAlreadyExist) {
      connection.gameSocket.emit('ShowError', {
        error: "Lobby with name: " + name + " already exists"
      });
      return;
    }
    let gameLobby = new GameLobby(name, new GameLobbySettings(gameMode, parseInt(maxPlayers), 1));
    let lobbyID = gameLobby.id;
    gameLobby.endGameLobby = function() {
      server.closeDownLobby(lobbyID)
    };
    server.gameLobbys[lobbyID] = gameLobby;
    server.gameLobbys[lobbyID].onSwitchGameLobby(connection, server);
  }
  getLobbyList(socket : any) {
    let lobbyList : any[] = [];
    let server = this;
    let gameLobbies = server.gameLobbys;
    Object.keys(server.gameLobbys).forEach(lobbyIndex => {
      let amount = 0;
      server.gameLobbys[lobbyIndex].connections.forEach((c : typeof Connection) => {
        if (c.gameSocket != null) amount++;
      });
      let temp = {
        id: server.gameLobbys[lobbyIndex].id,
        name: server.gameLobbys[lobbyIndex].name,
        amount: amount,
        settings: server.gameLobbys[lobbyIndex].settings
      };
      lobbyList.push(temp);
    });
    let returnData = {
      lobbyData: lobbyList
    }

    server.log('Found (' +gameLobbies.length +') lobbies');
    socket.emit('getLobbyList', returnData);
  }
  joinOpenLobby(connection = Connection, lobbyID : string) {
    let server = this;
    //let lobbyFound = false;
    //let gameLobbies = server.gameLobbys;
    let lobby = server.gameLobbys[lobbyID];
    if (lobby != null)
      if (lobby.canEnterGameLobby(connection))
        lobby.onSwitchGameLobby(connection);
  }
}
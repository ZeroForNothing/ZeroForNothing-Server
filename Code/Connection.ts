let Player = require('./Player')
let User = require('./User')
let InfernoBlaze = require('./PlayerClasses/InfernoBlaze')
let Quest_Traveler = require('./Quests/Quest_Traveler')
let Vector3 = require('./Utility/Vector3')
let GameLobby = require('./Lobbies/GameLobby')
let SearchLobby = require('./Lobbies/SearchLobby')
let GameLobbySettings = require('./Lobbies/GameLobbySettings')
const Server = require('./Server');
export {}
module.exports = class Connection {

  id : string;
  quests  : any[];
  socket  : any;

  gameLobby : typeof GameLobby;
  searchLobby : typeof SearchLobby;

  server : typeof Server;
  player : typeof Player;
  user : typeof User;

  constructor(socket : any, server : typeof Server, userData : typeof User) {
    let connection = this;
    connection.id = userData.id;
    connection.quests = [];
    connection.socket = socket;

    connection.gameLobby = null;
    connection.searchLobby = null;

    connection.server = server;
    connection.player = new Player();
    connection.user = new User(userData);

    // let groupLobbyID = "GroupLobby";
    // if (groupLobbyID != null && groupLobbys[groupLobbyID] != null) {
    //   let groupLobbys = server.groupLobbys;
    //   socket.join(groupLobbyID);
    //   connection.groupLobby = groupLobbys[groupLobbyID];
    //   connection.groupLobby.onEnterGroupLobby(connection);
    // }
    connection.createEvents();
    return connection;
  }
  log(text : string) {
    console.log('Connection ( id:', this.id, ', name:', this.user.name, ', code: #', this.user.code, ') =>', text);
  }
  startOtherPlatform(socket : any) {
    let connection = this;
    connection.socket = socket;
      connection.createEvents();
    
  }

  everySocketInLobby(socketEvent : string, lobbyID : string, data :any = null) {
    let connection = this;
    connection.socket.broadcast.to(lobbyID).emit(socketEvent, data);
  }
  everySocketJoinLobby(lobbyID : string) {
    let connection = this;
      connection.socket.join(lobbyID, function () {
        connection.log('Entered the lobby ('+ lobbyID+ ') with game');
      });
  }
  everySocketLeaveLobby(lobbyID : string) {
    let connection = this;
  connection.socket.leave(lobbyID, function () {
        connection.log('Left the lobby ('+ lobbyID+ ') with game');
      });
  }
  PickClass(classID : number) {
    let connection = this;
    let userLvl = 1;
    let pickedClass = null;
    if (classID == 1) {
      pickedClass = new InfernoBlaze(userLvl);
    } else {
      connection.socket.emit('ShowError', {
        error: "No class is selected"
      });
      return;
    }
    if (pickedClass != null) {
      connection.player.class = pickedClass;
      connection.player.class.onStart(connection);
      connection.socket.emit('playerClass', connection.player.class);
    }
  }
  JoinGame(data : any) {
    //fix it
    let connection = this;
    if (connection.player.class == null) {
      connection.socket.emit('ShowError', {
        error: "Must pick a class before joining a Lobby"
      });
      return;
    }
    if (connection.gameLobby != null && (data == null || data.id == null)) {
      connection.gameLobby.onEnterGameLobby(connection);
    } else if (data != null && data.id != null && data.id.trim().length != 0) {
      connection.server.joinOpenLobby(connection, data.id);
    } else {
      connection.socket.emit('ShowError', {
        error: "Must select a lobby to join first"
      });
    }
  }
  createEvents() {
    let connection = this;
    let userID = connection.id;
    let socket = connection.socket;
    let server = connection.server;
    let player = connection.player;
    let quests = connection.quests;
    let playerClass = connection.player.class;
    let user = connection.user;

    connection.log('Connected');
    socket.emit('registerUser', {
      zeroCoin: user.zeroCoin,
      normalCoin: user.normalCoin,
      profilePicType: user.profilePicType,
      picToken: user.picToken,
      username: user.name,
      userCode: user.code,
      userEmail: user.email,
      settings: user.settings
    });


      //tell game what class the player have before start
      if(connection.player.class)
      connection.log("Player class currently "+ connection.player.class.id)
    if (connection.player.class != null) {
      connection.socket.emit('playerClass', connection.player.class);
    }
    socket.emit('registerPlayer', {
      id: connection.id,
      myQuests: connection.quests
    });
    if (connection.gameLobby == null) {
      let returnData = {
        state: "Social"
      }
      socket.emit('lobbyUpdate', returnData);
    } else {
      connection.JoinGame(null);
    }


    socket.on('getLobbyList', function () {
      server.getLobbyList(socket);
    });
    socket.on('createGameLobby', function (data : any) {
      server.createGameLobby(connection, data);
    });
    socket.on('PickClass', function (data : any) {
      let classID = data.id;
      connection.PickClass(classID);
      playerClass = connection.player.class;
    });

    socket.on('AcceptedQuest', function (data : any) {
      let questAlreadyTaken = false;
      let questID = data.id
      quests.forEach(quest => {
        if (quest.id == questID) {
          questAlreadyTaken = true;
          return;
        }
      });
      if (!questAlreadyTaken) {
        connection.gameLobby.serverItems.forEach((item : any) => {
          if (data.botID == item.id && item.quests != null) {
            item.quests.forEach((questItem : any) => {
              if (questID == questItem.id) {
                quests.push(questItem);
                connection.log("Accepted quest " + questID)
                let returnData = {
                  id: questID,
                  questItem: questItem
                }
                socket.emit('AcceptedQuest', returnData);
                return;
              }
            });
            return;
          }
        });
      }
    });
    socket.on('DeclinedQuest', function (data : any) {
      quests.forEach((quest, index) => {
        if (quest.id == data.id) {
          quest.resetQuestAmount();
          quests.splice(index, 1);
          connection.log("Declined quest " + data.id)
          socket.emit('DeclinedQuest', data);
          return;
        }
      });
    });
    socket.on('LootQuest', function (data : any) {
      quests.forEach((quest, index) => {
        if (quest.id == data.id && quest.isReached) {
          quest.resetQuestAmount();
          quests.splice(index, 1);
          connection.GainCoinAndExperience(quest.normalCoin, quest.experience);
          socket.emit("LootQuest", data)
          connection.log("Recieved quest loot")
          return;
        }
      });
    });

    socket.on('joinGame', function (data : any) {
      connection.JoinGame(data);
    });

    socket.on('InfrontPlayerStats', function (data : any) {
      player.InfrontPlayerStats(connection, data.id);
    });
    interface updatePlayer {
      position : typeof Vector3;
      isGrounded : number;
      isBlocking : number;
      isCrouching : number;
      isRunning : number;
      animation : number;
      rotation : number;
    }
    socket.on('updatePlayer', function (data : updatePlayer) {
      if (playerClass == null) return;
      player.position.x = data.position.x;
      player.position.y = data.position.y;
      player.position.z = data.position.z;
      player.isGrounded = data.isGrounded;
      player.isBlocking = data.isBlocking;
      player.isCrouching = data.isCrouching;
      player.isRunning = data.isRunning;
      player.animation = data.animation;
      player.rotation = data.rotation;

      if (player.isTakingDamage == 1 || player.isBlocking == 1 || player.isAttacking == 1 || player.isDead == 1) {
        playerClass.speed = 0;
      } else if (player.isRunning == 1 && player.isCrouching != 1 && player.isGrounded == 1) {
        playerClass.speed = playerClass.normalSpeed * 2;
      } else {
        playerClass.speed = playerClass.normalSpeed;
      }
      socket.emit('playerSpeed', {
        s: playerClass.speed
      })
    });
    socket.on('LeftWeapon', function ( data : any) {
      if (playerClass == null || player.isTakingDamage || player.isBlocking || !player.isGrounded || player.isAttacking) return;
      playerClass.LeftWeapon(connection, data);
    })
    socket.on('RightWeapon', function (data : any) {
      if (playerClass == null || player.isTakingDamage || player.isBlocking || !player.isGrounded || player.isAttacking) return;
      playerClass.RightWeapon(connection, data);
    })
    socket.on('QAbility', function (data : any) {
      if (playerClass == null || player.isTakingDamage || player.isBlocking || !player.isGrounded || player.isAttacking) return;
      playerClass.QAbility(connection, data);
    })
    socket.on('EAbility', function (data : any) {
      if (playerClass == null || player.isTakingDamage || player.isBlocking || !player.isGrounded || player.isAttacking) return;
      playerClass.EAbility(connection, data);
    })
    socket.on('RAbility', function (data : any) {
      if (playerClass == null || player.isTakingDamage || player.isBlocking || !player.isGrounded || player.isAttacking) return;
      playerClass.RAbility(connection, data);
    })
    socket.on('ping', function () {
      socket.emit('pong');
    });
    socket.on('getSkins', function (data : any) {
      server.database.getSkins(data.search, data.category, data.option, (dataD : any) => {
        socket.emit('getSkins', {
          skinData: dataD.skinData
        });
      })
    })
    socket.on('getClassList', function () {
      let classData = [];
      classData.push(new InfernoBlaze(1));
      socket.emit('getClassList', classData);
    })

    socket.on('disconnect', function () {
      server.onDisconnected(connection);
    });

    socket.on('SetGameSound', function (data : any) {
      if (data != null)
        if (!isNaN(data.sound))
          server.database.SetGameSound(userID, data.sound)
    });
    socket.on('SetGameThemeColor', function (data : any) {
      if (data != null)
        if (!isNaN(data.color))
          server.database.SetGameThemeColor(userID, data.color)
    });

    socket.on('createLobby', function (data : any) {
      if (data == null) return;
      if (data.lobbyType != 0 && data.lobbyType != 1) return;
      if (connection.searchLobby.id != server.generalServerID) {
        socket.emit('updateLobby', {
          lobbyType: data.lobbyType
        })
        socket.broadcast.to(connection.searchLobby.id).emit('updateLobby', {
          lobbyType: data.lobbyType
        })
        return;
      }
      let gamelobby = new GameLobby(new GameLobbySettings(data.lobbyType, 5, 1));
      gamelobby.endGameLobby = function () {
        server.closeDownLobby(gamelobby.id)
      }
      server.searchLobbys[gamelobby.id] = gamelobby;
      server.searchLobby[gamelobby.id].onEnterSearchLobby(connection, userID);
      connection.log('Creating a new '+ data.lobbyType+ 'lobby');
      //need to get hold on of //count //type //owner //players  //name or id
      socket.emit('createLobby', {
        lobbyType: data.lobbyType,
        username: user.name,
        userCode: user.code,
        lobbyCount: server.searchLobbys[gamelobby.id].connections.length
      })
    });
    socket.on('backToGameType', function () {
      if (userID == connection.searchLobby.leader)
        socket.emit('backToGameType')
    });
    socket.on('leaveLobby', function () {
      if (connection.searchLobby.inQueue) {
        if (connection.searchLobby.settings.gameMode == 0) {
          server.competitiveMatchQueue.leaveQueue(connection.searchLobby.id);
        } else {
          server.normalMatchQueue.leaveQueue(connection.searchLobby.id);
        }
      }
      server.searchLobbys[connection.searchLobby.id].onLeaveSearchLobby(connection);
    });
    socket.on('getFriendlistForLobby', function () {
      socket.emit('getFriendlistForLobby', {
        friendList: user.friendList
      })
    });
    socket.on('searchForUserToInvite', function (data : any) {
      if (data.username == null || data.userCode == null || isNaN(data.userCode)) return;
      server.database.searchForUser(userID, data.username, data.userCode, (dataD : any) => {
        socket.emit('searchForUserToInvite', {
          userCorrectName: dataD.userCorrectName,
          friendCode: dataD.friendCode,
          picToken: dataD.picToken,
          picType: dataD.picType,
          username: data.username,
          userCode: data.userCode
        });
      })
    })
    socket.on('kickPlayerFromLobby', function (data : any) {
      if (userID != connection.searchLobby.leader) return;
      if (data.username == null || data.userCode == null || isNaN(data.userCode)) return;
      connection.searchLobby.connections.forEach((friendConn : Connection) => {
        if (friendConn.user.name == data.username && friendConn.user.code == data.userCode) {
          // friendConn.socket.emit('OpenWindow', {
          //   window: data.window
          // });
          friendConn.socket.emit('gotKickedDialog');
          friendConn.socket.to(connection.searchLobby.id).emit('kickPlayerFromLobby', data)
          server.searchLobbys[connection.searchLobby.id].onLeaveSearchLobby(friendConn);
          return;
        }
      });
    });
    socket.on('sendLobbyMsg', function (data : any) {
      let date = new Date();
      socket.emit('sendLobbyMsg', {
        message: data.message,
        username: user.name,
        userCode: user.code,
        myself: true,
        date: date
      });
      socket.broadcast.to(connection.searchLobby.id).emit('sendLobbyMsg', {
        message: data.message,
        username: user.name,
        userCode: user.code,
        myself: false,
        date: date
      });
    });
    socket.on('inviteToLobby', function (data : any) {
      server.connections.forEach((friendConn : Connection) => {
        if (friendConn.user.name == data.username && friendConn.user.code == data.userCode) {
          friendConn.socket.emit('inviteToLobby', {
            lobbyID: connection.searchLobby.id,
            username: user.name,
            userCode: user.code
          });
        }
      })
    });
    socket.on('joinLobby', function (data : any) {
      if (server.searchLobbys[data.lobbyID] == null) return;
      if (!server.searchLobbys[data.lobbyID].canEnterLobby(connection)) return;

      let oldLobbyID = connection.searchLobby.id;
      if (connection.searchLobby.inQueue) {
        if (connection.searchLobby.settings.gameMode == 0) {
          server.competitiveMatchQueue.leaveQueue(oldLobbyID)
        } else {
          server.normalMatchQueue.leaveQueue(oldLobbyID)
        }
      }
      // WINDOW = "Home";
      // socket.emit('OpenWindow', {
      //   window: "Home"
      // })
      socket.emit('playerLeftLobby', null);
      socket.broadcast.to(oldLobbyID).emit("playerLeftLobby", {
        username: user.name,
        userCode: user.code,
        lobbyCount: server.searchLobbys[oldLobbyID].connections.length
      });
      server.searchLobbys[data.lobbyID].onSwitchSearchLobby(connection);
      let lobbyPlayerNames : any[] = [];
      let lobbyPlayerCodes : any[] = [];
      connection.searchLobby.connections.forEach((friendConn : Connection) => {
        lobbyPlayerNames.push(friendConn.user.name)
        lobbyPlayerCodes.push(friendConn.user.code)
      })
      // WINDOW = "Lobby";
      // socket.emit('OpenWindow', {
      //   window: "Lobby"
      // })
      socket.emit('joinLobby', {
        gameMode: server.searchLobbys[data.lobbyID].settings.gameMode,
        username: user.name,
        userCode: user.code,
        friendList: user.friendList,
        lobbyPlayerNames: lobbyPlayerNames,
        lobbyPlayerCodes: lobbyPlayerCodes,
        myself: true
      })
      socket.broadcast.to(connection.searchLobby.id).emit('joinLobby', {
        gameMode: server.searchLobbys[data.lobbyID].settings.gameMode,
        username: user.name,
        userCode: user.code,
        friendList: user.friendList,
        lobbyPlayerNames: lobbyPlayerNames,
        lobbyPlayerCodes: lobbyPlayerCodes,
        myself: false
      })
    });
    socket.on('promoteToLobbyLeader', function (data : any) {
      // if (connection.searchLobby.leader != userID) return;
      // if (data.username == null || data.userCode == null || isNaN(data.userCode)) return;
      // let promotedPlayerIndex = connection.searchLobby.connections.findIndex((friendConn) => {
      //   return (data.username == friendConn.user.name && data.userCode == friendConn.user.code);
      // })
      // server.searchLobbys[lobbyID].leader = server.searchLobbys[lobbyID].connections[promotedPlayerIndex];
      // server.searchLobbys[lobbyID].connections[promotedPlayerIndex].socket.emit('promoteToLobbyLeader');
      // let imLeader = false;
      // if (user.name == data.username && user.code == data.userCode)
      //   imLeader = true;
      // socket.emit('promoteToLobbyLeader', {
      //   username: data.username,
      //   userCode: user.code,
      //   imLeader: imLeader,
      //   myself: true
      // })
      // socket.broadcast.to(connection.searchLobby.id).emit('promoteToLobbyLeader', {
      //   username: data.username,
      //   userCode: user.code,
      //   myself: false
      // })
    });

    socket.on('startQueue', function () {
      if (connection.searchLobby.leader != userID) return;
      let queueObj : any = new Object();
      queueObj.acceptShown = false;
      queueObj.socket = socket;
      queueObj.lobbyCount = connection.searchLobby.connections.length;
      queueObj.lobbyID = connection.searchLobby.id;
      connection.searchLobby.inQueue = true;
      if (connection.searchLobby.settings.gameMode == 0) {
        server.competitiveMatchQueue.enterQueue(queueObj);
      } else {
        server.normalMatchQueue.enterQueue(queueObj);
      }
    });
    socket.on('stopQueue', function () {
      if (connection.searchLobby.leader != userID) return;
      if (connection.searchLobby.settings.gameMode == 0) {
        server.competitiveMatchQueue.leaveQueue(connection.searchLobby.id);
      } else {
        server.normalMatchQueue.leaveQueue(connection.searchLobby.id);
      }
    });
    socket.on('acceptMatch', function () {
      if (!connection.searchLobby.inQueue) return;
      connection.searchLobby.membersAccepted.push(true)
      socket.emit('acceptMatch')
    });
    socket.on('declineMatch', function () {
      if (!connection.searchLobby.inQueue) return;
      connection.searchLobby.membersAccepted.push(false)
      socket.emit('declineMatch')
    });
    // socket.on('leavingMainLobby', function(data) {
    //   if (data.queueLobbyName != null) {
    //     socket.leave('findingMatchID_' + data.queueLobbyName, function() {
    //       clients[data.username].queueLobbyName = null;
    //     })
    //   }
    // });
    // socket.on('showingAllyTeamTimeEnded', function(data) {
    //   if (data.queueLobbyName != null) {
    //     socket.emit('tellLobbyEveryoneShown')
    //   }
    // });
    // socket.on('firstPickingTimeEnded', function(data) {
    //   if (data.queueLobbyName != null) {
    //     socket.emit('tellPlayersFirstPick')
    //   }
    // });
    // socket.on('bondedBeforeTimeEnded', function(data) {
    //   if (data.queueLobbyName != null) {
    //     io.to('findingMatchID_' + data.queueLobbyName).emit('tellPlayersBonded')
    //   }
    // });
  }
  GainCoinAndExperience(normalCoin : number, experience : number) {
    let connection = this;
    interface GainCoinAndExperience{
      normalCoin : number;
      experience : number;
    }
    connection.server.database.GainCoinAndExperience(connection.id, normalCoin, experience, (dataD : GainCoinAndExperience) => {
      connection.user.normalCoin = dataD.normalCoin;
      connection.user.experience = dataD.experience;
      if (connection.socket != null)
        connection.socket.emit('GainCoinAndExperience', {
          normalCoin: normalCoin,
          experience: experience
        });
    })
  }
}
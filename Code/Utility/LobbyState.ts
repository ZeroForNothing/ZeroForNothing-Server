module.exports = class LobbyState  {
  LOBBY = 'Lobby';
  GAME = 'Game';
  ENDGAME = 'EndGame';
  currentState : string;
  constructor(){
    //current state of the lobby
    this.currentState = this.LOBBY;
  }

}

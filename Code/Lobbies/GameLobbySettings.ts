module.exports = class GameLobbySettings {
  COMPETITIVE = "Competitive";
  NORMAL = "Normal"
  gameMode : string;
  minPlayers : number;
  maxPlayers : number;
  constructor(gameMode : string, maxPlayers : number, minPlayers : number) {
    // 0 for competitive and 1 for normal // in open world 0 for PVP and 1 for PVE
    this.gameMode = gameMode;
    this.minPlayers = minPlayers;
    this.maxPlayers = maxPlayers;
  }
}
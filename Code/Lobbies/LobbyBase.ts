let {
  nanoid
} = require('nanoid')
const Connection = require('../Connection')
export {}
module.exports = class LobbyBase {
  id : string;
  connections : typeof Connection;
  constructor() {
    this.id = nanoid();
    this.connections = [];
  }
  onUpdate() {}
  onEnterLobby() {}
  onLeaveLobby() {}
}
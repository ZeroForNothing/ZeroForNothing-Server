var {
  nanoid
} = require('nanoid');
var Vector3 = require('./Vector3.js');
export {}
module.exports = class ServerObject {
  id : string;
  name : string;
  position : typeof Vector3;
  constructor() {
    this.id = nanoid();
    this.name = "ServerObject";
    this.position = new Vector3();
  }
}
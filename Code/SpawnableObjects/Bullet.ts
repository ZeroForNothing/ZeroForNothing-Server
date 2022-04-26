var ServerObject = require('../Utility/ServerObject.js');
var Vector3 = require('../Utility/Vector3.js');
export {}
module.exports = class Bullet extends ServerObject {
  direction : typeof Vector3;
  speed : number;
  isDestroyed : boolean;
  activator : string;
  constructor() {
    super();
    this.direction = new Vector3();
    this.speed = 0.3;
    this.isDestroyed = false;
    this.activator = '';
  }
  onUpdate() {
    this.position.x += this.direction.x * this.speed;
    this.position.y += this.direction.y * this.speed;
    this.position.z += this.direction.z * this.speed;
    return this.isDestroyed;
  }
}
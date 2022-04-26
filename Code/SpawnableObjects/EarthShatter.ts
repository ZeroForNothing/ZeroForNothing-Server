var ServerObject = require('../Utility/ServerObject.js');
export {}
module.exports = class EarthShatter extends ServerObject {
  isDestroyed : boolean;
  activator : string;
  lifeSpan : number;
  aliveTime : number;
  constructor() {
    super();
    this.isDestroyed = false;
    this.activator = '';
    this.lifeSpan = 4210;
    this.aliveTime = (new Date()).getTime() + this.lifeSpan;
  }
  onUpdate() {
    this.isDestroyed = this.aliveTime <= (new Date()).getTime();
    return this.isDestroyed;
  }
}
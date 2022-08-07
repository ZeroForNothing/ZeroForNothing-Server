module.exports = class User {
  name : string;
  code : number;
  email : string;
  token : string;
  prof : string;
  wall : string;
  newAcc : number;
  zeroCoin : number;
  normalCoin : number;
  experience : number;
  friendList : [];
  settings : any;
  constructor(data : User) {
    this.name = data.name;
    this.code = data.code;
    this.email = data.email;
    this.token = data.token;
    this.prof = data.prof;
    this.wall = data.wall;
    this.newAcc = data.newAcc;
    this.zeroCoin = data.zeroCoin;
    this.normalCoin = data.normalCoin;
    this.experience = data.experience;
    this.friendList = [];
    this.settings = data.settings;
  }
  ToJson() {
    return {
      email: this.email,
      name: this.name,
      code : this.code,
      token: this.token,
      prof: this.prof,
      newAcc: this.newAcc,
      settings: this.settings
    }
  }
}

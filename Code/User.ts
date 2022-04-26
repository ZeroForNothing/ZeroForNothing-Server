module.exports = class User {
  name : string;
  code : number;
  email : string;
  picToken : string;
  profilePicType : string;
  wallpaperPicType : string;
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
    this.picToken = data.picToken;
    this.profilePicType = data.profilePicType;
    this.wallpaperPicType = data.wallpaperPicType;
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
      picToken: this.picToken,
      profilePicType: this.profilePicType,
      newAcc: this.newAcc,
      settings: this.settings
    }
  }
}

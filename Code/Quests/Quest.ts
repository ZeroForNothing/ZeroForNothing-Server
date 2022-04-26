module.exports = class Quest {
  id : number;
  requiredAmount : number;
  title : string;
  description : string;
  experience : number;
  normalCoin : number;
  currentAmount : number;
  isReached : boolean;
  constructor() {
    this.currentAmount = 0;
    this.isReached = false;
  }
  increaseQuestAmount() {
    this.currentAmount++;
    this.isReached = (this.currentAmount >= this.requiredAmount);
  }
  resetQuestAmount() {
    this.currentAmount = 0;
    this.isReached = false;
  }
}
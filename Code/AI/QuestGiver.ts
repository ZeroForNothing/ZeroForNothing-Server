let Vector3 = require('../Utility/Vector3')
let AIBase = require('../AI/AIBase')
export {}
module.exports = class QuestGiver extends AIBase {
  name  : string;
  quests : any;
  constructor(Quests : any) {
    super();
    this.name = "AI_QuestBot";
    this.quests = Quests;
  }
  requestQuest() {
    return this.quests;
  }
}
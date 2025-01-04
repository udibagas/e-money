class Card {
  constructor(
    type = "",
    uid = "",
    dataValidityFlag = "",
    number = "",
    balance = 0
  ) {
    this.type = type;
    this.uid = uid;
    this.dataValidityFlag = dataValidityFlag;
    this.number = number;
    this.balance = balance;
  }

  reset() {
    this.type = "";
    this.uid = "";
    this.dataValidityFlag = "";
    this.number = "";
    this.balance = 0;
  }
}

module.exports = new Card();

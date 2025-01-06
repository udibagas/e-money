const { validityFlags, cardTypes } = require("./constants");

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

  static create(data) {
    // 06 00 00 00 0F 01 5E B5 03 93 60 88 50 00 00 00 14 00 00 4D 7F
    // 06 = Card Type = Jakcard DKI Card
    // 00 00 00 0F 01 5E B5 = Card UID (0F015EB5)
    // 03 = Card Data validity flag = Both card number and card balance is valid
    // 93 60 88 50 00 00 00 14 = Card Number (9360 8850 0000 0014)
    // 00 00 4D 7F = Card Balance (Rp. 19.839)

    // 060000000F015EB503936088500000001400004D7F

    // 02 0015020000008f441e1d 03 6032984031044294 00006f54 8e e money
    // 02 00150500000047bb9fc2 03 0145202200110508 00001194 6d flazz
    // 02 0015030456d5e2db7580 01 6013500467325578 00000000 03 bri

    const cardType = data.slice(0, 2);
    const cardUID = data.slice(2, 22);
    const cardDataValidityFlag = data.slice(22, 24);
    const cardNumber = data.slice(24, 40);
    const cardBalance = data.slice(40, 48);

    return new Card(
      cardType,
      cardUID,
      cardDataValidityFlag,
      cardNumber,
      parseInt(cardBalance, 16)
    );
  }

  reset() {
    this.type = "";
    this.uid = "";
    this.dataValidityFlag = "";
    this.number = "";
    this.balance = 0;
  }

  get typeDescription() {
    return cardTypes[this.type];
  }

  get insufficientBalance() {
    return this.dataValidityFlag === "01";
  }

  get invalidCardNumber() {
    return this.dataValidityFlag === "00" || this.dataValidityFlag === "02";
  }

  get isValid() {
    return this.dataValidityFlag === "03";
  }

  get dataValidityFlagDescription() {
    return validityFlags[this.dataValidityFlag];
  }

  get balanceFormatted() {
    return this.balance.toLocaleString("id-ID", {
      style: "currency",
      currency: "IDR",
    });
  }
}

module.exports = Card;

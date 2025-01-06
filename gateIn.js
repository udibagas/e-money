require("dotenv").config();
const { default: axios } = require("axios");
const { SerialPort } = require("serialport");

const { cardTypes, VALID, validityFlags } = require("./constants");

function parseData(data) {
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

  return {
    cardType: cardTypes[cardType],
    cardUID,
    cardDataValidityFlag,
    cardDataValidityFlagText: validityFlags[cardDataValidityFlag],
    cardNumber,
    cardBalance: parseInt(cardBalance, 16),
  };
}

// console.log(parseData("060000000F015EB503936088500000001400004D7F"));
// console.log(parseData("020015020000008f441e1d03603298403104429400006f548e"));

const port = new SerialPort({
  path: process.env.SERIAL_PORT_IN || "/dev/ttyUSB0",
  baudRate: 9600,
  dataBits: 8,
  parity: "none",
  stopBits: 1,
});

function reconnect() {
  console.log("Reconnecting serial port...");
  port.removeAllListeners();
  if (port.isOpen) port.close();
  port.open();
}

port.on("open", () => {
  console.log("Serial port open");
});

port.on("error", (error) => {
  console.error("Serial port error", error);
  reconnect();
});

port.on("data", (data) => {
  data = data.toString("hex");
  console.log("Data received: " + data);

  const {
    cardType,
    cardUID,
    cardDataValidityFlag,
    cardDataValidityFlagText,
    cardNumber,
    cardBalance,
  } = parseData(data);

  console.log("Card Type: " + cardType);
  console.log("Card UID: " + cardUID);
  console.log(
    `Card Data Validity Flag: [${cardDataValidityFlag}] ${cardDataValidityFlagText}`
  );
  console.log("Card Number: " + cardNumber);
  console.log("Card Balance: Rp. " + cardBalance.toLocaleString());
});

require("dotenv").config();
const { default: axios } = require("axios");
const { SerialPort, ReadlineParser } = require("serialport");

const { cardTypes, VALID } = require("./constants");

function parseData(data) {
  // 06 00 00 00 0F 01 5E B5 03 93 60 88 50 00 00 00 14 00 00 4D 7F
  // 06 = Card Type = Jakcard DKI Card
  // 00 00 00 0F 01 5E B5 = Card UID (0F015EB5)
  // 03 = Card Data validity flag = Both card number and card balance is valid
  // 93 60 88 50 00 00 00 14 = Card Number (9360 8850 0000 0014)
  // 00 00 4D 7F = Card Balance (Rp. 19.839)

  // 060000000F015EB503936088500000001400004D7F

  const cardType = data.slice(0, 2);
  const cardUID = data.slice(2, 16);
  const cardDataValidityFlag = data.slice(16, 18);
  const cardNumber = data.slice(18, 34);
  const cardBalance = data.slice(34, 42);

  return {
    cardType: cardTypes[cardType],
    cardUID,
    cardDataValidityFlag,
    cardNumber,
    cardBalance: parseInt(cardBalance, 16),
  };
}

// console.log(parseData("060000000F015EB503936088500000001400004D7F"));

const port = new SerialPort({
  path: process.env.SERIAL_PORT_IN || "/dev/ttyUSB0",
  baudRate: 9600,
  dataBits: 8,
  parity: "none",
  stopBits: 1,
});

const parser = port.pipe(
  new ReadlineParser({ includeDelimiter: false, delimiter: "\r\n" })
);

port.on("open", () => {
  console.log("Serial port open");
});

port.on("error", (error) => {
  console.error("Serial port error", error);
});

parser.on("data", (data) => {
  console.log("Data received: " + data);

  const [cardType, cardUID, cardDataValidityFlag, cardNumber, cardBalance] =
    parseData(data);

  console.log("Card Type: " + cardTypes[cardType]);
  console.log("Card UID: " + cardUID);
  console.log("Card Data Validity Flag: " + cardDataValidityFlag);
  console.log("Card Number: " + cardNumber);
  console.log("Card Balance: Rp. " + cardBalance.toLocaleString());

  // todo: open gate
  if (cardDataValidityFlag === VALID) {
    console.log("Opening gate...");
    // axios
    //   .post(process.env.GATE_OUT_URL, {
    //     cardNumber,
    //   })
    //   .then((response) => {
    //     console.log("Gate opened");
    //   })
    //   .catch((error) => {
    //     console.error("Failed to open gate");
    //   });
  }
});

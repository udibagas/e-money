require("dotenv").config();
const { default: axios } = require("axios");
const { SerialPort } = require("serialport");
const Card = require("./card");
const { cardTypes, VALID, validityFlags } = require("./constants");

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
  const card = Card.create(data);
  console.log("Card type:", card.typeDescription);
  console.log("Card UID:", card.uid);
  console.log("Card data validity flag:", validityFlags[card.dataValidityFlag]);
  console.log("Card number:", card.number);
  console.log("Card balance:", card.balanceFormatted);
});

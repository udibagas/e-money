require("dotenv").config();
const { SerialPort, ReadyParser, ReadlineParser } = require("serialport");
const { getTimestamp } = require("./helpers/time");
const card = require("./card");
const { statusCodes, SIZE_SMALL, COLOR_BLACK } = require("./constants");

const port = new SerialPort({
  path: process.env.SERIAL_PORT_OUT || "/dev/ttyUSB0",
  baudRate: 38400,
  dataBits: 8,
  parity: "none",
  stopBits: 1,
});

port.on("error", (error) => {
  console.error("Serial port error", error);
});

port.on("open", () => {
  console.log("Serial port open. Initializing device...");

  init((err) => {
    if (err) return console.error(err);

    console.log("Device initialized");
    mainLoop();
  });
});

const parser = port.pipe(new ReadlineParser());

parser.on("data", (data) => {
  console.log("Data received: " + data);

  // const statusCode = data.slice(0, 6);
  // const additionalData = data.slice(6);
  // const statusMessage = statusCodes[statusCode] || "Unknown status code";
  // console.log("Status code: " + statusCode);

  // if (statusCode === "000000") {
  //   console.log(statusMessage);
  //   buzz();
  // } else {
  //   console.error(statusMessage);
  //   buzz(false);
  // }
});

function init(callback) {
  const { INIT_KEY } = process.env;

  port.write(Buffer.from(`EF0101${INIT_KEY}`, "hex"), (err) => {
    if (err) {
      callback(`Failed to initialize device: ${err.message}`);
    }

    parser.once("data", (data) => {
      const statusCode = data.slice(2, 8);
      const mid = data.slice(8);

      if (statusCode === "000000") {
        callback(null, mid);
      } else {
        callback("Failed to initialize device. Incorrect key");
      }
    });
  });
}

function checkBalance() {
  const timestamp = getTimestamp();

  port.write(`EF0102${timestamp}0010`, "hex", (err) => {
    if (err) {
      return console.error(`Failed to check balance: ${err.message}`);
    }

    parser.once("data", (data) => {
      console.log("Data received: " + data);
      const statusCode = data.toString().slice(0, 8);

      if (statusCode != "00000000") {
        return console.error(statusCodes[statusCode] || "Unknown status code");
      }

      const cardType = data.slice(8, 10);
      const cardNumber = data.slice(10, 26);
      const balanceHex = data.slice(26);
      const balance = parseInt(balanceHex, 16);

      card.type = cardType;
      card.number = cardNumber;
      card.balance = balance;

      console.log(card);
    });
  });
}

function deduct(amount) {
  const timestamp = getTimestamp();
  const amountHex = amount.toString(16).padStart(8, "0");

  port.write(`EF0103${timestamp}${amountHex}0010`, "hex", (err) => {
    if (err) {
      console.error("Failed to deduct balance", err.message);
    }
  });
}

function setDisplay(text, size = SIZE_SMALL, color = COLOR_BLACK) {
  const hexText = Buffer.from(text, "utf8").toString("hex");

  port.write(`EF01090301${hexText}${size}${color}`, "hex", (err) => {
    if (err) {
      console.error("Failed to set display", err.message);
    }
  });
}

function resetDisplay() {
  port.write(`EF010900`, "hex", (err) => {
    if (err) {
      console.error("Failed to reset display", err.message);
    }
  });
}

function buzz(success = true) {
  port.write(`EF010902${success ? "00" : "01"}`, "hex", (err) => {
    if (err) {
      console.error("Failed to buzz", err.message);
    }
  });
}

function mainLoop() {
  setInterval(() => {
    // baca kartu, cek database berdasarkan nomor kartu

    // lihat transaksi terakhir kartu terkait
    // hit ke api untuk mendapatkan tarif terakhir
    // cek saldo kartu

    checkBalance();

    // if (card.balance < amount) {
    //   setDisplay("Saldo tidak mencukupi", "01", "03");
    //   buzz(false);
    //   return;
    // }

    // deduct(amount);
    // buzz();
    // setDisplay("Transaksi berhasil", "01", "04");
    // setDisplay(`Saldo: ${balance}`, "01", "01");

    // setTimeout(resetDisplay, 3000);
    // card.reset();
  }, 2000);
}

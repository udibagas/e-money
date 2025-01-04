require("dotenv").config();
const { SerialPort, ReadyParser } = require("serialport");

const statusCodes = {
  "000000": "Command success",
  "011001": "General error",
  "011002": "Reader waiting timeout",
  "011003": "Reader initialization failed (Incorrect key)",
  "011004": "Not enough balance",
  "011005":
    "Reader found lost contact on card transaction /interrupted transaction",
  "011006":
    "Reader expected card from previous transaction (for auto correction purpose)",
  "011007": "Deduct Interval less than n second (default 2 sec)",
};

const port = new SerialPort({
  path: process.env.SERIAL_PORT_OUT || "/dev/ttyUSB0",
  baudRate: 38400,
  dataBits: 8,
  parity: "none",
  stopBits: 1,
});

const parser = port.pipe(new ReadyParser());

port.on("open", () => {
  console.log("Serial port open. Initializing device...");
  init();
});

port.on("error", (error) => {
  console.error("Serial port error", error);
});

parser.on("data", (data) => {
  console.log("Data received: " + data);

  const statusCode = data.slice(0, 6);
  const additionalData = data.slice(6);
  const statusMessage = statusCodes[statusCode] || "Unknown status code";
  console.log("Status code: " + statusCode);

  if (statusCode === "000000") {
    console.log(statusMessage);
    buzz();
  } else {
    console.error(statusMessage);
    buzz(false);
  }
});

function init() {
  const { INIT_KEY } = process.env;

  port.write(`EF0101${INIT_KEY}`, "hex", (err) => {
    if (err) {
      console.error("Failed to initialize device");
    }
  });
}

function getTimestamp() {
  const now = new Date();
  const date = now.getDate().toString().padStart(2, "0");
  const month = (now.getMonth() + 1).toString().padStart(2, "0");
  const year = now.getFullYear().toString();
  const hour = now.getHours().toString().padStart(2, "0");
  const minute = now.getMinutes().toString().padStart(2, "0");
  const second = now.getSeconds().toString().padStart(2, "0");

  return `${date}${month}${year}${hour}${minute}${second}`;
}

function checkBalance() {
  const timestamp = getTimestamp();

  port.write(`EF0102${timestamp}0010`, "hex", (err) => {
    if (err) {
      console.error("Failed to check balance", err.message);
    } else {
    }
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

// size:
// 01 = Small
// 02 = Medium
// 03 = Large

// color:
// 01 = BLACK
// 02 = WHITE
// 03 = RED
// 04 = GREEN
// 05 = BLUE
function setDisplay(text, size = "01", color = "01") {
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

function getCardData() {
  port.write(`EF010C`, "hex", (err) => {
    if (err) {
      console.error("Failed to get card data", err.message);
    }
  });
}

function main() {
  setInterval(() => {
    // baca kartu, cek database berdasarkan nomor kartu
    // lihat transaksi terakhir kartu terkait
    // hit ke api untuk mendapatkan tarif terakhir
    // cek saldo kartu

    if (balance < amount) {
      setDisplay("Saldo tidak mencukupi", "01", "03");
      buzz(false);
      return;
    }

    deduct(amount);
    buzz();
    setDisplay("Transaksi berhasil", "01", "04");
    checkBalance();
    setDisplay(`Saldo: ${balance}`, "01", "01");

    setTimeout(resetDisplay, 3000);

    // jika saldo mencukupi, lakukan transaksi
    // jika transaksi berhasil, tampilkan pesan sukses
    // jika transaksi gagal, tampilkan pesan gagal
    // jika saldo tidak mencukupi, tampilkan pesan saldo tidak mencukupi
    // jika kartu tidak valid, tampilkan pesan kartu tidak valid
  }, 100);
}

main();

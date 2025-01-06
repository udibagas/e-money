require("dotenv").config();
const { SerialPort } = require("serialport");
const { getTimestamp } = require("./helpers/time");
const { statusCodes, SIZE_SMALL, COLOR_BLACK } = require("./constants");

class Device {
  scanInterval = null;

  constructor(path = "/dev/ttyUSB0", baudRate = 38400) {
    this.port = new SerialPort({ path, baudRate });
    this.registerEventListeners();
  }

  registerEventListeners() {
    this.port.on("error", (error) => {
      console.error("Serial port error", error);
      this.reconnect();
    });

    this.port.on("open", () => {
      console.log("Serial port open. Initializing device...");

      this.init((err, mid) => {
        if (err) return console.error(err);

        console.log("Device initialized", mid);
        this.scan();
      });
    });
  }

  reconnect() {
    console.log("Reconnecting serial port...");
    this.port.removeAllListeners();
    if (this.port.isOpen) this.port.close();
    this.port.open();
    this.registerEventListeners();
  }

  calculateLRC(data) {
    let lrc = 0;

    for (let i = 0; i < data.length; i++) {
      lrc ^= data.charCodeAt(i);
    }

    return lrc.toString(16).toUpperCase().padStart(2, "0");
  }

  prepareData(data) {
    const dataPrepare =
      (data.length / 2).toString(16).toUpperCase().padStart(4, "0") + data;
    const lrc = this.calculateLRC(dataPrepare);
    return Buffer.from(`02${dataPrepare}${lrc}`, "hex");
  }

  init(callback) {
    const { INIT_KEY } = process.env;

    if (!INIT_KEY) {
      return callback("Initialization key not found");
    }

    const data = this.prepareData(`EF0101${INIT_KEY}`);
    console.log("Data prepared: " + data.toString("hex"));

    this.port.write(data, "hex", (err) => {
      if (err) {
        return callback(`Failed to initialize device: ${err.message}`);
      }

      let res = this.port.read();

      if (res === null) {
        return callback("Failed to initialize device. No data received");
      }

      res = res.toString("hex");
      console.log("Data received: " + res);
      const statusCode = res.slice(2, 8);

      if (statusCode !== "000000") {
        return callback("Failed to initialize device. Incorrect key");
      }

      const mid = res.slice(8);
      callback(null, mid);
    });
  }

  checkBalance(callback) {
    const timestamp = getTimestamp();
    const data = this.prepareData(`EF0102${timestamp}0010`);

    this.port.write(data, "hex", (err) => {
      if (err) {
        return callback(`Failed to check balance: ${err.message}`);
      }

      let res = this.port.read();

      if (res === null) {
        return callback("Failed to check balance. No data received");
      }

      res = res.toString("hex");
      console.log("Data received: " + res);
      const statusCode = res.slice(0, 8);

      if (statusCode != "00000000") {
        return callback(statusCodes[statusCode] || "Unknown status code");
      }

      const cardType = res.slice(8, 10);
      const cardNumber = res.slice(10, 26);
      const balanceHex = res.slice(26);
      const balance = parseInt(balanceHex, 16);

      callback(null, balance);
    });
  }

  deduct(amount, callback) {
    const timestamp = getTimestamp();
    const amountHex = amount.toString(16).padStart(8, "0");
    const data = this.prepareData(`EF0103${timestamp}${amountHex}0010`);

    this.port.write(data, "hex", (err) => {
      if (err) {
        return callback("Failed to deduct balance", err.message);
      }

      let res = this.port.read();

      if (res === null) {
        return callback("Failed to deduct balance. No data received");
      }

      res = res.toString("hex");
      console.log("Data received: " + res);
      // todo: parsing response
    });
  }

  setDisplay(text, size = SIZE_SMALL, color = COLOR_BLACK, callback) {
    const hexText = Buffer.from(text, "utf8").toString("hex");
    const data = this.prepareData(`EF01090301${hexText}${size}${color}`);

    this.port.write(data, "hex", (err) => {
      if (err) {
        return callback("Failed to set display", err.message);
      }

      callback(null);
    });
  }

  resetDisplay(callback) {
    this.port.write(this.prepareData(`EF010900`), "hex", (err) => {
      if (err) {
        return callback("Failed to reset display", err.message);
      }

      callback(null);
    });
  }

  buzz(success = true, callback) {
    const data = this.prepareData(`EF010902${success ? "00" : "01"}`);
    this.port.write(data, "hex", (err) => {
      if (err) {
        return callback("Failed to buzz", err.message);
      }

      callback(null);
    });
  }

  scan() {
    this.scanInterval = setInterval(() => {
      this.checkBalance((err, balance) => {
        if (err) {
          return console.error(err);
        }

        console.log("Balance:", balance);
      });
    }, 3000);
  }

  disconnect() {
    this.port.close();
    this.port.removeAllListeners();
    clearInterval(this.scanInterval);
  }
}

module.exports = Device;

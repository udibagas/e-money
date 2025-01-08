require("dotenv").config();
const Device = require("./device");
const { SERIAL_PORT_OUT } = process.env;

if (!SERIAL_PORT_OUT) throw new Error("SERIAL_PORT_OUT is required");

const device = new Device(SERIAL_PORT_OUT);
setTimeout(() => device.buzz(), 5000);

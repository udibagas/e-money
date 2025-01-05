function calculateLRC(data) {
  let lrc = 0;

  for (let i = 0; i < data.length; i++) {
    lrc ^= data.charCodeAt(i);
  }

  return lrc.toString(16).toUpperCase().padStart(2, "0");
}

function prepareData(data) {
  const dataPrepare =
    (data.length / 2).toString(16).toUpperCase().padStart(4, "0") + data;
  const lrc = calculateLRC(dataPrepare);
  return Buffer.from(`02${dataPrepare}${lrc}`, "hex");
}

module.exports = { prepareData };

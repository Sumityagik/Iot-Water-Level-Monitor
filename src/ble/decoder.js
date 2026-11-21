
function decodeSensorData(rawData) {
    const bytes = Buffer.from(rawData);

    if (bytes.length < 4) {
        throw new Error("Invalid BLE packet: minimum 4 bytes required");
    }

    // Extract distance in millimetres
    const distanceMm = bytes.readUInt16BE(0);

    // Extract status and battery
    const sensorStatus = bytes.readUInt8(2);
    const batteryPercentage = bytes.readUInt8(3);

    return {
        distanceMm,
        distanceCm: distanceMm / 10,
        sensorStatus,
        batteryPercentage,
        rawHex: bytes.toString("hex")
    };
}

module.exports = { decodeSensorData };

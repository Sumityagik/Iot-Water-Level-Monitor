
const { decodeSensorData } = require("./decoder");
const { calculateWaterLevel } = require("../sensor/waterLevel");

// Simulated BLE packet
const rawData = Buffer.from([0x01, 0xF4, 0x01, 0x64]);

const sensorData = decodeSensorData(rawData);

const waterData = calculateWaterLevel(
    sensorData.distanceCm
);

const finalData = {
    device: "SIMULATED_BLE_DEVICE",
    timestamp: new Date().toISOString(),
    ...sensorData,
    ...waterData
};

console.log("\nWATER LEVEL SENSOR DATA\n");
console.log(JSON.stringify(finalData, null, 2));


const mqtt = require("mqtt");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const { decodeSensorData } = require("../ble/decoder");
const { calculateWaterLevel } = require("../sensor/waterLevel");

const MQTT_URL = process.env.MQTT_URL || "mqtt://localhost:1883";
const MQTT_TOPIC = process.env.MQTT_TOPIC || "waterlevel/sensor/data";

const gpsFile = path.join(__dirname, "../../data/gps_location.json");

const client = mqtt.connect(MQTT_URL, {
    clientId: "water_level_publisher",
    reconnectPeriod: 3000,
    connectTimeout: 10000
});

client.on("connect", () => {
    console.log("Connected to MQTT broker:", MQTT_URL);
    console.log("Publishing topic:", MQTT_TOPIC);

    publishSensorData();

    setInterval(publishSensorData, 5000);
});

client.on("error", (error) => {
    console.error("MQTT Error:", error.message);
});

function publishSensorData() {
    try {
        // Simulated BLE packet from Phase 2
        const rawData = Buffer.from([0x01, 0xF4, 0x01, 0x64]);

        const sensorData = decodeSensorData(rawData);

        const waterData = calculateWaterLevel(
            sensorData.distanceCm
        );

        // Read latest GPS coordinates
        let gpsData = null;

        if (fs.existsSync(gpsFile)) {
            gpsData = JSON.parse(
                fs.readFileSync(gpsFile, "utf8")
            );
        }

        const payload = {
            deviceId: "SIMULATED_BLE_DEVICE",
            timestamp: new Date().toISOString(),

            sensor: {
                distanceCm: sensorData.distanceCm,
                waterLevelCm: waterData.waterLevelCm,
                fillPercentage: waterData.fillPercentage,
                status: sensorData.sensorStatus,
                batteryPercentage: sensorData.batteryPercentage,
                rawHex: sensorData.rawHex
            },

            gps: gpsData
        };

        client.publish(
            MQTT_TOPIC,
            JSON.stringify(payload),
            { qos: 1 },
            (error) => {
                if (error) {
                    console.error("Publish failed:", error.message);
                    return;
                }

                console.log("\nDATA PUBLISHED SUCCESSFULLY");
                console.log(JSON.stringify(payload, null, 2));
            }
        );

    } catch (error) {
        console.error("Data processing error:", error.message);
    }
}

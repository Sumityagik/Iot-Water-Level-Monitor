
const mqtt = require("mqtt");
require("dotenv").config();

const MQTT_URL = process.env.MQTT_URL || "mqtt://localhost:1883";
const MQTT_TOPIC = process.env.MQTT_TOPIC || "waterlevel/sensor/data";

const client = mqtt.connect(MQTT_URL, {
    clientId: "water_level_subscriber",
    reconnectPeriod: 3000
});

client.on("connect", () => {
    console.log("Connected to MQTT broker");

    client.subscribe(MQTT_TOPIC, { qos: 1 }, (error) => {
        if (error) {
            console.error("Subscription failed:", error.message);
            return;
        }

        console.log("Subscribed to:", MQTT_TOPIC);
        console.log("Waiting for sensor messages...\n");
    });
});

client.on("message", (topic, message) => {
    try {
        const data = JSON.parse(message.toString());

        console.log("\n========== MQTT MESSAGE ==========");
        console.log("Topic:", topic);
        console.log("Device:", data.deviceId);
        console.log("Water Level:", data.sensor.waterLevelCm, "cm");
        console.log("Fill:", data.sensor.fillPercentage, "%");
        console.log("Distance:", data.sensor.distanceCm, "cm");
        console.log("GPS:", data.gps);
        console.log("Timestamp:", data.timestamp);
        console.log("==================================");

    } catch (error) {
        console.error("Message parsing error:", error.message);
    }
});

client.on("error", (error) => {
    console.error("MQTT Subscriber Error:", error.message);
});

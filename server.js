
const express = require("express");
const fs = require("fs");
const path = require("path");

const {
    getSensorReadings
} = require("./src/cloud/elasticsearch");

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const dataDir = path.join(__dirname, "data");
const gpsFile = path.join(dataDir, "gps_location.json");

fs.mkdirSync(dataDir, { recursive: true });

// Receive and save GPS coordinates
app.post("/api/gps", (req, res) => {
    const { latitude, longitude, accuracy, timestamp } = req.body;

    if (
        typeof latitude !== "number" ||
        typeof longitude !== "number" ||
        latitude < -90 || latitude > 90 ||
        longitude < -180 || longitude > 180
    ) {
        return res.status(400).json({
            success: false,
            message: "Invalid GPS coordinates"
        });
    }

    const gpsData = {
        latitude,
        longitude,
        accuracy: Number(accuracy) || null,
        timestamp: timestamp || new Date().toISOString()
    };

    fs.writeFileSync(
        gpsFile,
        JSON.stringify(gpsData, null, 2)
    );

    res.json({
        success: true,
        data: gpsData
    });
});

// Get GPS coordinates
app.get("/api/gps", (req, res) => {
    if (!fs.existsSync(gpsFile)) {
        return res.status(404).json({
            message: "GPS location not available"
        });
    }

    res.json(JSON.parse(fs.readFileSync(gpsFile, "utf8")));
});

// Get historical readings from Elasticsearch
app.get("/api/readings", async (req, res) => {
    try {
        const limit = Math.min(
            Math.max(Number(req.query.limit) || 20, 1),
            100
        );

        const readings = await getSensorReadings(limit);

        res.json({
            success: true,
            count: readings.length,
            readings
        });

    } catch (error) {
        console.error("Reading API error:", error.message);

        res.status(500).json({
            success: false,
            message: "Unable to retrieve sensor readings"
        });
    }
});

// Get the latest reading
app.get("/api/latest", async (req, res) => {
    try {
        const readings = await getSensorReadings(1);

        if (readings.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No sensor readings available"
            });
        }

        res.json({
            success: true,
            data: readings[0]
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Dashboard health endpoint
app.get("/api/status", async (req, res) => {
    try {
        const readings = await getSensorReadings(1);

        res.json({
            success: true,
            elasticsearch: "connected",
            hasReadings: readings.length > 0,
            lastReading: readings[0]?.timestamp || null
        });

    } catch (error) {
        res.status(503).json({
            success: false,
            elasticsearch: "unavailable"
        });
    }
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});

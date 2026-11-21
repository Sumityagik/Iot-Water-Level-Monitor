
const waterLevelElement = document.getElementById("waterLevel");
const fillElement = document.getElementById("fillPercentage");
const fillBar = document.getElementById("fillBar");
const distanceElement = document.getElementById("distance");
const batteryElement = document.getElementById("battery");

const statusElement = document.getElementById("connectionStatus");

let waterChart;

// Initialize chart
function initializeChart() {

    const context = document
        .getElementById("waterChart")
        .getContext("2d");

    waterChart = new Chart(context, {
        type: "line",

        data: {
            labels: [],
            datasets: [{
                label: "Water Level (cm)",
                data: [],
                borderColor: "#0d9488",
                backgroundColor: "rgba(13,148,136,0.12)",
                fill: true,
                tension: 0.3
            }]
        },

        options: {
            responsive: true,

            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

// Fetch latest sensor reading
async function updateLatestReading() {

    try {

        const response = await fetch("/api/latest");

        if (!response.ok) {
            throw new Error("No sensor reading available");
        }

        const result = await response.json();
        const data = result.data;

        const sensor = data.sensor || {};

        waterLevelElement.textContent =
            `${sensor.waterLevelCm ?? "--"} cm`;

        fillElement.textContent =
            `${sensor.fillPercentage ?? "--"}%`;

        fillBar.style.width =
            `${Math.max(0, Math.min(100, Number(sensor.fillPercentage) || 0))}%`;

        distanceElement.textContent =
            `${sensor.distanceCm ?? "--"} cm`;

        batteryElement.textContent =
            `${sensor.batteryPercentage ?? "--"}%`;

        statusElement.textContent = "Elasticsearch connected";
        statusElement.className = "status online";

        updateGPS(data.gps);

    } catch (error) {

        console.error("Latest reading error:", error.message);

        statusElement.textContent = "Data unavailable";
        statusElement.className = "status offline";
    }
}

// Display GPS details
function updateGPS(gps) {

    if (!gps) {
        document.getElementById("latitude").textContent = "--";
        document.getElementById("longitude").textContent = "--";
        document.getElementById("accuracy").textContent = "--";
        document.getElementById("mapLink").style.display = "none";
        return;
    }

    document.getElementById("latitude").textContent =
        gps.latitude ?? "--";

    document.getElementById("longitude").textContent =
        gps.longitude ?? "--";

    document.getElementById("accuracy").textContent =
        gps.accuracy != null ? `${gps.accuracy} m` : "--";

    const mapLink = document.getElementById("mapLink");

    if (
        typeof gps.latitude === "number" &&
        typeof gps.longitude === "number"
    ) {
        mapLink.href =
            `https://www.google.com/maps?q=${gps.latitude},${gps.longitude}`;

        mapLink.style.display = "inline";
    } else {
        mapLink.style.display = "none";
    }
}

// Fetch historical readings
async function updateHistory() {

    try {

        const response = await fetch("/api/readings?limit=20");

        if (!response.ok) {
            throw new Error("Unable to fetch history");
        }

        const result = await response.json();

        // API returns newest first; charts read oldest to newest
        const readings = result.readings.reverse();

        waterChart.data.labels = readings.map(item => {
            return new Date(item.timestamp).toLocaleTimeString();
        });

        waterChart.data.datasets[0].data = readings.map(item => {
            return item.sensor?.waterLevelCm ?? null;
        });

        waterChart.update();

        updateTable([...readings].reverse());

    } catch (error) {
        console.error("History error:", error.message);
    }
}

// Display recent records
function updateTable(readings) {

    const table = document.getElementById("readingsTable");

    if (readings.length === 0) {
        table.innerHTML =
            '<tr><td colspan="5">No readings available</td></tr>';
        return;
    }

    table.innerHTML = readings.map(item => {

        const sensor = item.sensor || {};

        return `
            <tr>
                <td>${new Date(item.timestamp).toLocaleString()}</td>
                <td>${sensor.waterLevelCm ?? "--"} cm</td>
                <td>${sensor.fillPercentage ?? "--"}%</td>
                <td>${sensor.distanceCm ?? "--"} cm</td>
                <td>${sensor.batteryPercentage ?? "--"}%</td>
            </tr>
        `;

    }).join("");
}

// Start dashboard
async function startDashboard() {

    initializeChart();

    await Promise.all([
        updateLatestReading(),
        updateHistory()
    ]);

    // Refresh automatically every five seconds
    setInterval(() => {
        updateLatestReading();
        updateHistory();
    }, 5000);
}

startDashboard();

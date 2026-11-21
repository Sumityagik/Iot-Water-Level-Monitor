
const startButton = document.getElementById("startGPS");
const statusElement = document.getElementById("status");

startButton.addEventListener("click", () => {

    if (!navigator.geolocation) {
        statusElement.textContent =
            "Geolocation is not supported by this browser.";
        return;
    }

    statusElement.textContent = "Getting GPS location...";

    navigator.geolocation.getCurrentPosition(

        async (position) => {

            const gpsData = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy,
                timestamp: new Date(
                    position.timestamp
                ).toISOString()
            };

            document.getElementById("latitude").textContent =
                gpsData.latitude;

            document.getElementById("longitude").textContent =
                gpsData.longitude;

            document.getElementById("accuracy").textContent =
                gpsData.accuracy.toFixed(2) + " metres";

            try {

                const response = await fetch("/api/gps", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(gpsData)
                });

                const result = await response.json();

                if (!response.ok) {
                    throw new Error(result.message);
                }

                statusElement.textContent =
                    "GPS location saved successfully!";

                console.log("GPS Response:", result);

            } catch (error) {

                statusElement.textContent =
                    "Backend Error: " + error.message;

                console.error(error);
            }
        },

        (error) => {
            statusElement.textContent =
                "GPS Error: " + error.message;
        },

        {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 5000
        }
    );
});

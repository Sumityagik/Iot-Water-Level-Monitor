
const { withBindings } = require("@stoprocent/noble");
const fs = require("fs");
const path = require("path");

// Explicit Windows Bluetooth binding
const noble = withBindings("win");

const discoveredDevices = new Map();

async function startScanner() {
    try {
        console.log("\n=================================");
        console.log("   IoT BLE DEVICE SCANNER ");
        console.log("=================================\n");

        console.log("Waiting for Bluetooth adapter...");

        await noble.waitForPoweredOnAsync(15000);

        console.log("Bluetooth adapter is ready.\n");
        console.log("Scanning for nearby BLE devices...\n");

        noble.on("discover", (peripheral) => {

            const device = {
                id: peripheral.id,
                address: peripheral.address,
                name:
                    peripheral.advertisement.localName ||
                    "Unknown Device",
                rssi: peripheral.rssi,
                serviceUUIDs:
                    peripheral.advertisement.serviceUuids || [],
                manufacturerData:
                    peripheral.advertisement.manufacturerData
                        ? peripheral.advertisement.manufacturerData.toString("hex")
                        : null
            };

            discoveredDevices.set(device.id, device);

            console.log("---------------------------------");
            console.log("Device Name :", device.name);
            console.log("Device ID   :", device.id);
            console.log("Address     :", device.address);
            console.log("RSSI        :", device.rssi, "dBm");
            console.log(
                "Services    :",
                device.serviceUUIDs.join(", ") || "Not advertised"
            );
        });

        await noble.startScanningAsync([], true);

        console.log("\nScanning for 20 seconds...\n");

        await new Promise(resolve => setTimeout(resolve, 20000));

        await noble.stopScanningAsync();

        const devices = Array.from(discoveredDevices.values());

        const outputDir = path.join(__dirname, "../../data");
        fs.mkdirSync(outputDir, { recursive: true });

        fs.writeFileSync(
            path.join(outputDir, "ble_devices.json"),
            JSON.stringify(devices, null, 2)
        );

        console.log("\n=================================");
        console.log("BLE SCAN COMPLETED");
        console.log("Devices Found:", devices.length);
        console.log("Saved: data/ble_devices.json");
        console.log("=================================\n");

        devices.forEach((device, index) => {
            console.log(
                `${index + 1}. ${device.name} | ${device.id}`
            );
        });

    } catch (error) {
        console.error("BLE Scanner Error:", error.message);
    } finally {
        try {
            await noble.stopScanningAsync();
        } catch (_) {}

        noble.stop();
    }
}

startScanner();

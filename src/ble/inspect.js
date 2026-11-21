
const { withBindings } = require("@stoprocent/noble");
const fs = require("fs");
const path = require("path");

const noble = withBindings("win");

async function inspectDevice(deviceId) {

    if (!deviceId) {
        console.log(
            "Usage: node src/ble/inspect.js <DEVICE_ID>"
        );
        return;
    }

    let peripheral;

    try {
        console.log("\nConnecting to BLE device:", deviceId);

        await noble.waitForPoweredOnAsync(15000);

        peripheral = await noble.connectAsync(deviceId);

        console.log("Connected successfully!");

        console.log("\nDiscovering GATT services...");

        const { services } =
            await peripheral.discoverAllServicesAndCharacteristicsAsync();

        const result = {
            deviceId: peripheral.id,
            deviceName:
                peripheral.advertisement.localName || "Unknown",
            services: []
        };

        for (const service of services) {

            const serviceInfo = {
                uuid: service.uuid,
                characteristics: []
            };

            console.log("\nSERVICE UUID:", service.uuid);

            for (const characteristic of service.characteristics) {

                const charInfo = {
                    uuid: characteristic.uuid,
                    properties: characteristic.properties,
                    rawDataHex: null,
                    rawDataDecimal: null,
                    readError: null
                };

                console.log("\n  CHARACTERISTIC UUID:",
                    characteristic.uuid);

                console.log(
                    "  PROPERTIES:",
                    characteristic.properties.join(", ")
                );

                if (characteristic.properties.includes("read")) {

                    try {
                        const rawData =
                            await characteristic.readAsync();

                        const bytes = Buffer.from(rawData);

                        charInfo.rawDataHex = bytes.toString("hex");

                        charInfo.rawDataDecimal = Array.from(bytes);

                        console.log(
                            "  RAW HEX:",
                            bytes.toString("hex")
                        );

                        console.log(
                            "  RAW DECIMAL:",
                            Array.from(bytes)
                        );

                    } catch (error) {

                        charInfo.readError = error.message;

                        console.log(
                            "  READ ERROR:",
                            error.message
                        );
                    }

                } else {
                    console.log(
                        "  Reading not supported by this characteristic."
                    );
                }

                serviceInfo.characteristics.push(charInfo);
            }

            result.services.push(serviceInfo);
        }

        const outputDir = path.join(__dirname, "../../data");

        fs.mkdirSync(outputDir, { recursive: true });

        fs.writeFileSync(
            path.join(outputDir, "gatt_inspection.json"),
            JSON.stringify(result, null, 2)
        );

        console.log("\nGATT inspection saved successfully.");

    } catch (error) {

        console.error("\nConnection/Inspection Error:", error.message);

    } finally {

        if (peripheral) {
            try {
                await peripheral.disconnectAsync();
                console.log("\nDevice disconnected.");
            } catch (error) {
                console.log("Disconnect:", error.message);
            }
        }

        noble.stop();
    }
}

inspectDevice(process.argv[2]);

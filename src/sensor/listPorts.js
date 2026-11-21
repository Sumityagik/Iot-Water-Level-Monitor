
const { SerialPort } = require("serialport");

async function listPorts() {
    const ports = await SerialPort.list();

    console.log("\nAVAILABLE SERIAL PORTS\n");

    ports.forEach((port, index) => {
        console.log({
            number: index + 1,
            path: port.path,
            manufacturer: port.manufacturer,
            vendorId: port.vendorId,
            productId: port.productId,
            serialNumber: port.serialNumber
        });
    });

    if (ports.length === 0) {
        console.log("No serial ports detected.");
    }
}

listPorts().catch(console.error);

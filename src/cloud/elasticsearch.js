
const {
    initializeElasticsearch,
    getSensorReadings
} = require("./elasticsearch");

async function testElasticsearch() {
    try {
        await initializeElasticsearch();

        console.log("\nFETCHING STORED SENSOR RECORDS...\n");

        const readings = await getSensorReadings(20);

        console.log("Total records retrieved:", readings.length);

        console.log(
            JSON.stringify(readings, null, 2)
        );

    } catch (error) {
        console.error("Search failed:", error.message);
    }
}

testElasticsearch();


const TANK_HEIGHT_CM = 200;

function calculateWaterLevel(distanceCm) {

    const waterLevelCm = Math.max(
        0,
        Math.min(TANK_HEIGHT_CM, TANK_HEIGHT_CM - distanceCm)
    );

    const fillPercentage =
        (waterLevelCm / TANK_HEIGHT_CM) * 100;

    return {
        tankHeightCm: TANK_HEIGHT_CM,
        distanceCm,
        waterLevelCm: Number(waterLevelCm.toFixed(2)),
        fillPercentage: Number(fillPercentage.toFixed(2))
    };
}

module.exports = { calculateWaterLevel };

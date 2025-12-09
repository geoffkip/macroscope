import { initialize, requestPermission, readRecords, writeRecords, getGrantedPermissions } from 'react-native-health-connect';

export const initHealthConnect = async () => {
    try {
        const isInitialized = await initialize();
        console.log('Health Connect Initialized:', isInitialized);
        return isInitialized;
    } catch (e) {
        console.error("Health Connect Init Failed:", e);
        return false;
    }
};

export const requestHealthPermissions = async () => {
    try {
        const permissions = await requestPermission([
            { accessType: 'read', recordType: 'Nutrition' },
            { accessType: 'write', recordType: 'Nutrition' },
            { accessType: 'read', recordType: 'TotalCaloriesBurned' }, // Optional: for context
        ]);
        console.log('Permissions granted:', permissions);
        return permissions;
    } catch (e) {
        console.error("Permission Request Failed:", e);
        return [];
    }
};

export const syncMealToHealthConnect = async (meal) => {
    if (!meal || !meal.analysis || !meal.analysis.total) return;

    const { calories, protein, carbs, fats } = meal.analysis.total;
    const startTime = new Date(meal.timestamp).toISOString();
    const endTime = new Date(meal.timestamp + 60000).toISOString(); // 1 min duration

    try {
        await writeRecords([
            {
                recordType: 'Nutrition',
                startTime,
                endTime,
                energy: { value: calories, unit: 'kilocalories' },
                protein: { value: protein, unit: 'grams' },
                totalCarbohydrate: { value: carbs, unit: 'grams' },
                totalFat: { value: fats, unit: 'grams' },
                name: meal.mealType || 'Meal',
            },
        ]);
        console.log("Meal synced to Health Connect");
    } catch (e) {
        console.error("Failed to sync meal:", e);
    }
};

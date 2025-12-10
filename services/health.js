import { initialize, requestPermission, readRecords, writeRecords, getGrantedPermissions, getSdkStatus, SdkAvailabilityStatus } from 'react-native-health-connect';

export const checkHealthConnectStatus = async () => {
    try {
        const status = await getSdkStatus();
        return status;
    } catch (e) {
        console.error("SDK Status check failed", e);
        return SdkAvailabilityStatus.SDK_UNAVAILABLE;
    }
}

export const initHealthConnect = async () => {
    try {
        const status = await getSdkStatus();
        if (status === SdkAvailabilityStatus.SDK_UNAVAILABLE) {
            console.error("Health Connect SDK is not available on this device");
            // Return specific code to let UI handle it, or false
            return status;
        }
        if (status === SdkAvailabilityStatus.SDK_UNINSTALLED) {
            console.error("Health Connect SDK is not installed");
            return status;
        }
        if (status === SdkAvailabilityStatus.SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED) {
            return status;
        }

        const isInitialized = await initialize();
        console.log('Health Connect Initialized:', isInitialized);
        return true;
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
            { accessType: 'read', recordType: 'TotalCaloriesBurned' },
            { accessType: 'read', recordType: 'Hydration' },
            { accessType: 'write', recordType: 'Hydration' },
        ]);
        console.log('Permissions granted:', permissions);
        return permissions;
    } catch (e) {
        console.error("Permission Request Failed:", e);
        return [];
    }
};

// Helper to get local ISO string with timezone offset
const getLocalISOString = (date) => {
    const tzOffset = -date.getTimezoneOffset();
    const sign = tzOffset >= 0 ? '+' : '-';
    const hours = String(Math.floor(Math.abs(tzOffset) / 60)).padStart(2, '0');
    const minutes = String(Math.abs(tzOffset) % 60).padStart(2, '0');

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
    const second = String(date.getSeconds()).padStart(2, '0');
    const ms = String(date.getMilliseconds()).padStart(3, '0');

    return `${year}-${month}-${day}T${hour}:${minute}:${second}.${ms}${sign}${hours}:${minutes}`;
};

export const syncWaterToHealthConnect = async (id, amount, timestamp) => {
    console.log("=== WATER SYNC START ===");
    console.log("Params: id=", id, "amount=", amount, "timestamp=", timestamp);

    try {
        // Ensure HC is initialized before writing
        console.log("Initializing Health Connect...");
        const initResult = await initialize();
        console.log("Init result:", initResult);

        if (!initResult) {
            console.log("Health Connect not initialized, skipping water sync");
            return false;
        }

        const startDate = new Date(timestamp);
        const endDate = new Date(timestamp + 1000); // 1 second duration

        // Use local time with timezone offset (NOT UTC!)
        const startTime = getLocalISOString(startDate);
        const endTime = getLocalISOString(endDate);
        const uniqueId = `water_${id}`;

        const record = {
            recordType: 'Hydration',
            startTime,
            endTime,
            volume: { value: amount, unit: 'milliliters' },
            metadata: {
                clientRecordId: uniqueId,
                clientRecordVersion: 1,
            }
        };

        console.log("Writing record:", JSON.stringify(record, null, 2));

        const result = await writeRecords([record]);
        console.log("Write result:", JSON.stringify(result, null, 2));
        console.log("=== WATER SYNC SUCCESS ===");
        return true;
    } catch (e) {
        console.error("=== WATER SYNC FAILED ===");
        console.error("Error:", e);
        console.error("Error message:", e?.message);
        console.error("Error stack:", e?.stack);
        return false;
    }
};

export const deleteWaterFromHealthConnect = async (id) => {
    const uniqueId = `water_${id}`;
    try {
        await import('react-native-health-connect').then(mod => {
            mod.deleteRecords('Hydration', { clientRecordIdsList: [uniqueId] });
        });
        console.log("Water deleted from Health Connect - ID:", uniqueId);
    } catch (e) {
        console.log("Failed to delete water from HC:", e);
    }
};

export const syncMealToHealthConnect = async (meal) => {
    if (!meal || !meal.analysis || !meal.analysis.total || !meal.id) return;

    console.log("=== MEAL SYNC START ===");
    console.log("Meal ID:", meal.id, "Type:", meal.mealType);

    try {
        // Ensure HC is initialized before writing
        const initResult = await initialize();
        if (!initResult) {
            console.log("Health Connect not initialized, skipping meal sync");
            return;
        }

        const { calories, protein, carbs, fats } = meal.analysis.total;
        const startDate = new Date(meal.timestamp);
        const endDate = new Date(meal.timestamp + 60000); // 1 min duration

        // Use local time with timezone offset (NOT UTC!)
        const startTime = getLocalISOString(startDate);
        const endTime = getLocalISOString(endDate);

        // Unique ID for Upsert (Update/Insert)
        // Health Connect will overwrite any record with this same clientRecordId
        const uniqueId = `meal_${meal.id}`;

        const record = {
            recordType: 'Nutrition',
            startTime,
            endTime,
            energy: { value: calories, unit: 'kilocalories' },
            protein: { value: protein, unit: 'grams' },
            totalCarbohydrate: { value: carbs, unit: 'grams' },
            totalFat: { value: fats, unit: 'grams' },
            name: meal.mealType || 'Meal',
            metadata: {
                clientRecordId: uniqueId,
                clientRecordVersion: 1,
            }
        };

        console.log("Writing meal record:", JSON.stringify(record, null, 2));
        const result = await writeRecords([record]);
        console.log("Meal write result:", JSON.stringify(result, null, 2));
        console.log("=== MEAL SYNC SUCCESS ===");
    } catch (e) {
        console.error("Failed to sync meal:", e);
    }
};

export const deleteMealFromHealthConnect = async (mealId) => {
    if (!mealId) return;
    const uniqueId = `meal_${mealId}`;
    try {
        // Must use the EXACT same ID format as writing
        // deleteRecordsByUids is for internal UIDs. 
        // deleteRecordsByClientRecordIds is for our custom IDs.
        // Check library: react-native-health-connect uses `deleteRecordsByClientRecordIds` usually exposed via unique interface or direct call.
        // Wait, standard library signature check: 
        // It typically exposes `deleteRecords` taking { recordType, clientRecordIdsList }

        // Actually react-native-health-connect uses: deleteRecords(recordType, { clientRecordIdsList: [...] })

        // Let's verify standard usage. If unknown, we might need to check lib types.
        // Assuming standard google wrapper:

        // *Correction*: The react-native-health-connect library exports `deleteRecords`.
        // Signature: deleteRecords(recordType, { idsList, clientRecordIdsList })

        await import('react-native-health-connect').then(mod => {
            mod.deleteRecords('Nutrition', { clientRecordIdsList: [uniqueId] });
        });

        console.log("Meal deleted from Health Connect - ID:", uniqueId);
    } catch (e) {
        console.error("Failed to delete meal from Health Connect:", e);
    }
};

import { openDB } from 'idb';

const DB_NAME = 'macroscope-db';
const DB_VERSION = 1;
const STORE_NAME = 'meals';

export const initDB = async () => {
    return openDB(DB_NAME, DB_VERSION, {
        upgrade(db) {
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                const store = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
                store.createIndex('date', 'date', { unique: false });
            }
        },
    });
};

export const addMeal = async (date, mealType, analysis, image) => {
    const db = await initDB();
    return db.add(STORE_NAME, {
        date, // Stored as YYYY-MM-DD string
        mealType, // 'breakfast', 'lunch', 'dinner', 'snack' 
        analysis, // The JSON object from Gemini
        image, // Base64 string
        timestamp: Date.now()
    });
};

export const getMealsByDate = async (date) => {
    const db = await initDB();
    return db.getAllFromIndex(STORE_NAME, 'date', date);
};

export const deleteMeal = async (id) => {
    const db = await initDB();
    return db.delete(STORE_NAME, id);
};

export const getAllMeals = async () => {
    const db = await initDB();
    return db.getAll(STORE_NAME);
}

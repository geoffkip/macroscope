import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';

const DB_NAME = 'macroscope.db';

// --- Web Implementation (localStorage) ---
const WebDB = {
    async getMeals() {
        const data = localStorage.getItem('meals');
        return data ? JSON.parse(data) : [];
    },
    async saveMeals(meals) {
        localStorage.setItem('meals', JSON.stringify(meals));
    },
    async getSettings() {
        const data = localStorage.getItem('settings');
        return data ? JSON.parse(data) : {};
    },
    async saveSettings(settings) {
        localStorage.setItem('settings', JSON.stringify(settings));
    }
};

// --- Native Implementation (SQLite) ---
let db = null;
const initNativeDB = async () => {
    if (db) return db;
    try {
        db = await SQLite.openDatabaseAsync(DB_NAME);

        await db.execAsync(`
          PRAGMA journal_mode = WAL;
          CREATE TABLE IF NOT EXISTS meals (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date TEXT NOT NULL,
            mealType TEXT NOT NULL,
            data TEXT NOT NULL,
            imageBase64 TEXT,
            timestamp INTEGER
          );
          CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT
          );
        `);

        return db;
    } catch (error) {
        console.error("Database initialization failed:", error);
        db = null; // Reset on failure
        throw error;
    }
};

// --- Universal API ---

export const getSetting = async (key) => {
    if (Platform.OS === 'web') {
        const settings = await WebDB.getSettings();
        return settings[key] || null;
    } else {
        const database = await initNativeDB();
        const row = await database.getFirstAsync('SELECT value FROM settings WHERE key = ?', key);
        return row ? row.value : null;
    }
};

export const saveSetting = async (key, value) => {
    if (Platform.OS === 'web') {
        const settings = await WebDB.getSettings();
        settings[key] = value;
        await WebDB.saveSettings(settings);
    } else {
        const database = await initNativeDB();
        await database.runAsync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', key, value);
    }
};

export const addMeal = async (date, mealType, analysis, imageBase64) => {
    if (Platform.OS === 'web') {
        const meals = await WebDB.getMeals();
        const newMeal = {
            id: Date.now(), // simple ID for web
            date,
            mealType,
            data: JSON.stringify(analysis),
            imageBase64,
            timestamp: Date.now()
        };
        meals.push(newMeal);
        await WebDB.saveMeals(meals);
        return newMeal.id;
    } else {
        const database = await initNativeDB();
        const result = await database.runAsync(
            'INSERT INTO meals (date, mealType, data, imageBase64, timestamp) VALUES (?, ?, ?, ?, ?)',
            date,
            mealType,
            JSON.stringify(analysis),
            imageBase64,
            Date.now()
        );
        return result.lastInsertRowId;
    }
};

export const getMealsByDate = async (date) => {
    if (Platform.OS === 'web') {
        const meals = await WebDB.getMeals();
        return meals
            .filter(meal => meal.date === date)
            .map(meal => ({
                ...meal,
                analysis: typeof meal.data === 'string' ? JSON.parse(meal.data) : meal.data
            }));
    } else {
        const database = await initNativeDB();
        const rows = await database.getAllAsync('SELECT * FROM meals WHERE date = ?', date);
        return rows.map(row => ({
            ...row,
            analysis: JSON.parse(row.data)
        }));
    }
};

export const deleteMeal = async (id) => {
    if (Platform.OS === 'web') {
        let meals = await WebDB.getMeals();
        meals = meals.filter(m => m.id !== id);
        await WebDB.saveMeals(meals);
    } else {
        const database = await initNativeDB(); // Kept initNativeDB as initDB is not defined elsewhere
        try {
            console.log("Deleting meal with ID:", id);
            await database.runAsync('DELETE FROM meals WHERE id = ?', [id]);
        } catch (error) {
            console.error("Failed to delete meal:", error);
            throw error;
        }
    }
};

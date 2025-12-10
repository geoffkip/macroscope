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
let dbInitPromise = null;

const initNativeDB = async () => {
    // If already initialized and valid, return
    if (db) {
        try {
            // Test if connection is still valid
            await db.getFirstAsync('SELECT 1');
            return db;
        } catch (testError) {
            console.log("DB connection stale, reinitializing...");
            db = null;
            dbInitPromise = null;
        }
    }

    // Prevent concurrent initialization
    if (dbInitPromise) {
        return dbInitPromise;
    }

    dbInitPromise = (async () => {
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
                  CREATE TABLE IF NOT EXISTS water_logs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    date TEXT NOT NULL,
                    amount INTEGER NOT NULL,
                    timestamp INTEGER
                  );
                `);

            console.log("Database initialized successfully");
            return db;
        } catch (error) {
            console.error("Database initialization failed:", error);
            db = null;
            dbInitPromise = null;
            throw error;
        }
    })();

    return dbInitPromise;
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

export const updateMeal = async (id, newAnalysis) => {
    if (Platform.OS === 'web') {
        const meals = await WebDB.getMeals();
        const index = meals.findIndex(m => m.id === id);
        if (index !== -1) {
            // Keep existing fields, update data & analysis
            // We store data as string in web mock too
            meals[index].data = JSON.stringify(newAnalysis);
            meals[index].analysis = newAnalysis;
            await WebDB.saveMeals(meals);
        }
    } else {
        const database = await initNativeDB();
        if (!database) throw new Error("Database not initialized");

        await database.runAsync(
            'UPDATE meals SET data = ? WHERE id = ?',
            JSON.stringify(newAnalysis),
            id
        );
    }
};

export const deleteMeal = async (id) => {
    if (Platform.OS === 'web') {
        let meals = await WebDB.getMeals();
        meals = meals.filter(m => m.id !== id);
        await WebDB.saveMeals(meals);
    } else {
        const database = await initNativeDB();
        if (!database) throw new Error("Database not initialized");

        try {
            console.log("Deleting meal with ID:", id);
            await database.runAsync('DELETE FROM meals WHERE id = ?', id);
        } catch (error) {
            console.error("Failed to delete meal:", error);
            throw error;
        }
    }
};

// --- Water API ---
export const addWaterLog = async (date, amount) => {
    if (Platform.OS === 'web') {
        const logs = JSON.parse(localStorage.getItem('water_logs') || '[]');
        const newLog = { id: Date.now(), date, amount, timestamp: Date.now() };
        logs.push(newLog);
        localStorage.setItem('water_logs', JSON.stringify(logs));
        return newLog.id;
    } else {
        const database = await initNativeDB();
        if (!database) throw new Error("Database not initialized");

        const result = await database.runAsync(
            'INSERT INTO water_logs (date, amount, timestamp) VALUES (?, ?, ?)',
            date, amount, Date.now()
        );
        return result.lastInsertRowId;
    }
};

export const getWaterLogs = async (date) => {
    if (Platform.OS === 'web') {
        const logs = JSON.parse(localStorage.getItem('water_logs') || '[]');
        return logs.filter(l => l.date === date);
    } else {
        const database = await initNativeDB();
        const rows = await database.getAllAsync('SELECT * FROM water_logs WHERE date = ?', date);
        return rows;
    }
};

export const deleteWaterLog = async (id) => {
    if (Platform.OS === 'web') {
        let logs = JSON.parse(localStorage.getItem('water_logs') || '[]');
        logs = logs.filter(l => l.id !== id);
        localStorage.setItem('water_logs', JSON.stringify(logs));
    } else {
        const database = await initNativeDB();
        await database.runAsync('DELETE FROM water_logs WHERE id = ?', id);
    }
};

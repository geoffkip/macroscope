// USDA FoodData Central API Service
// Free API: 1,000 requests/hour with API key

const USDA_API_KEY = process.env.EXPO_PUBLIC_USDA_API_KEY || 'DEMO_KEY';
const BASE_URL = 'https://api.nal.usda.gov/fdc/v1';

// Nutrient IDs in USDA database
const NUTRIENT_IDS = {
    CALORIES: 1008,
    PROTEIN: 1003,
    CARBS: 1005,
    FAT: 1004,
    FIBER: 1079,
    SUGAR: 2000,
    SODIUM: 1093,
    CHOLESTEROL: 1253,
};

/**
 * Search USDA database for foods
 * @param {string} query - Search term (e.g., "chicken breast")
 * @param {number} pageSize - Number of results (default 15)
 * @returns {Promise<Array>} - Array of food items
 */
export const searchFoods = async (query, pageSize = 15) => {
    if (!query || query.trim().length < 2) {
        return [];
    }

    try {
        const url = `${BASE_URL}/foods/search?api_key=${USDA_API_KEY}&query=${encodeURIComponent(query)}&pageSize=${pageSize}&dataType=Foundation,SR Legacy`;

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`USDA API error: ${response.status}`);
        }

        const data = await response.json();

        return (data.foods || []).map(food => ({
            fdcId: food.fdcId,
            name: food.description,
            brand: food.brandName || null,
            servingSize: food.servingSize || 100,
            servingSizeUnit: food.servingSizeUnit || 'g',
            nutrients: extractNutrients(food.foodNutrients || []),
        }));
    } catch (error) {
        console.error('USDA search error:', error);
        throw error;
    }
};

/**
 * Extract macros from USDA nutrient array
 * @param {Array} foodNutrients - Array of nutrient objects from USDA
 * @returns {Object} - { calories, protein, carbs, fats, fiber, sugar, sodium, cholesterol }
 */
const extractNutrients = (foodNutrients) => {
    const getNutrient = (nutrientId) => {
        const nutrient = foodNutrients.find(n => n.nutrientId === nutrientId);
        return nutrient ? Math.round(nutrient.value * 10) / 10 : 0;
    };

    return {
        calories: getNutrient(NUTRIENT_IDS.CALORIES),
        protein: getNutrient(NUTRIENT_IDS.PROTEIN),
        carbs: getNutrient(NUTRIENT_IDS.CARBS),
        fats: getNutrient(NUTRIENT_IDS.FAT),
        fiber: getNutrient(NUTRIENT_IDS.FIBER),
        sugar: getNutrient(NUTRIENT_IDS.SUGAR),
        sodium: getNutrient(NUTRIENT_IDS.SODIUM),
        cholesterol: getNutrient(NUTRIENT_IDS.CHOLESTEROL),
    };
};

/**
 * Format a USDA food item for MacroScope meal logging
 * @param {Object} food - Food item from searchFoods
 * @param {number} servings - Number of servings (default 1)
 * @returns {Object} - Analysis object compatible with MacroScope
 */
export const formatFoodForMeal = (food, servings = 1) => {
    const { nutrients } = food;

    return {
        items: [
            {
                name: food.name,
                quantity: servings,
                unit: food.servingSizeUnit,
                calories: Math.round(nutrients.calories * servings),
                protein: Math.round(nutrients.protein * servings * 10) / 10,
                carbs: Math.round(nutrients.carbs * servings * 10) / 10,
                fats: Math.round(nutrients.fats * servings * 10) / 10,
                sugar: Math.round(nutrients.sugar * servings * 10) / 10,
                fiber: Math.round(nutrients.fiber * servings * 10) / 10,
                sodium: Math.round(nutrients.sodium * servings),
                cholesterol: Math.round(nutrients.cholesterol * servings),
                portion: `${food.servingSize * servings}${food.servingSizeUnit}`,
            }
        ],
        total: {
            calories: Math.round(nutrients.calories * servings),
            protein: Math.round(nutrients.protein * servings * 10) / 10,
            carbs: Math.round(nutrients.carbs * servings * 10) / 10,
            fats: Math.round(nutrients.fats * servings * 10) / 10,
            sugar: Math.round(nutrients.sugar * servings * 10) / 10,
            fiber: Math.round(nutrients.fiber * servings * 10) / 10,
            sodium: Math.round(nutrients.sodium * servings),
            cholesterol: Math.round(nutrients.cholesterol * servings),
        },
        description: `${food.name} (${food.servingSize * servings}${food.servingSizeUnit})`,
    };
};

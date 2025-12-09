import { GoogleGenerativeAI } from "@google/generative-ai";

export const analyzeImage = async (imageData, apiKey) => {
    if (!apiKey) {
        throw new Error("API Key is required");
    }

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        // Remove data:image/jpeg;base64, prefix if present
        const base64Data = imageData.split(',')[1] || imageData;

        const prompt = `
      Analyze this image of food. Identify the main dish and breakdown its estimated macronutrients.
      Return ONLY a valid JSON object with the following structure:
      {
        "items": [
          {
            "name": "Specific food item name (e.g. Grilled Chicken Breast)",
            "calories": 150,
            "protein": 25,
            "carbs": 0,
            "fats": 5,
            "portion": "approximate portion size"
          }
        ],
        "total": {
          "calories": 500,
          "protein": 30,
          "carbs": 60,
          "fats": 20
        },
        "description": "Brief summary of the meal"
      }
      Do not wrap in markdown code blocks. Just the raw JSON string.
    `;

        const imagePart = {
            inlineData: {
                data: base64Data,
                mimeType: "image/jpeg",
            },
        };

        const result = await model.generateContent([prompt, imagePart]);
        const response = await result.response;
        const text = response.text();

        // clean up any markdown formatting if gemini adds it despite instructions
        const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();

        return JSON.parse(cleanText);
    } catch (error) {
        console.error("AI Analysis Failed:", error);
        throw error;
    }
};

import { GoogleGenerativeAI } from "@google/generative-ai";

export const analyzeImage = async (base64Image, apiKey) => {
  if (!apiKey) {
    throw new Error("API Key is required");
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Expo Camera returns base64 directly, usually without the prefix
    // But we should ensure it's clean
    const cleanBase64 = base64Image.replace(/^data:image\/\w+;base64,/, "");

    const prompt = `
      Analyze this image of food. Identify the main dish and breakdown its estimated macronutrients.
      
      CRITICAL: if the image does not CLEARLY contain food (e.g. it is a person, object, or blurry), return EXACTLY: { "error": "Food not recognized in photo" }
      
      Otherwise, return ONLY a valid JSON object with the following structure:
      {
        "items": [
          {
            "name": "Specific food item name",
            "quantity": 1,
            "unit": "serving/slice/piece",
            "calories": 150,
            "protein": 25,
            "carbs": 0,
            "fats": 5,
            "portion": "description of quantity (e.g. 1 slice)"
          }
        ],
        "total": {
          "calories": 500,
          "protein": 30,
          "carbs": 60,
          "fats": 20
        },
        "description": "Brief summary of the meal including quantity"
      }
      Do not wrap in markdown code blocks. Just the raw JSON string.
    `;

    const imagePart = {
      inlineData: {
        data: cleanBase64,
        mimeType: "image/jpeg",
      },
    };

    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const text = response.text();

    // Cleanup
    const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanText);

  } catch (error) {
    console.error("AI Service Error:", error);
    throw error;
  }
};

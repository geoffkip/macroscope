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
            "sugar": 0,
            "fiber": 0,
            "sodium": 0, // in mg
            "cholesterol": 0, // in mg
            "portion": "description of quantity (e.g. 1 slice)"
          }
        ],
        "total": {
          "calories": 500,
          "protein": 30,
          "carbs": 60,
          "fats": 20,
          "sugar": 5,
          "fiber": 5,
          "sodium": 200,
          "cholesterol": 50
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

    // Check for "Food not recognized" error (loose matching)
    if (cleanText.toLowerCase().includes("food not recognized")) {
      return { error: "Food not recognized in photo" };
    }

    try {
      return JSON.parse(cleanText);
    } catch (e) {
      console.error("Failed to parse AI response:", cleanText);
      throw new Error("Invalid response from AI");
    }

  } catch (error) {
    console.error("AI Service Error:", error);
    throw error;
  }
};

export const refineAnalysis = async (originalAnalysis, userInstruction, apiKey) => {
  if (!apiKey) throw new Error("API Key is required");

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `
    You are a nutrition assistant.
    
    Original Food Analysis:
    ${JSON.stringify(originalAnalysis)}
    
    User Correction/Refinement:
    "${userInstruction}"
    
    Task:
    1. Update the food items and nutrients based STRICTLY on the user's correction.
    2. If the user says "swap peanut butter for almond butter", replace the item and recalculate nutrients.
    3. If the user says "it was only half", halve the quantities.
    4. Keep the same JSON structure as the original.
    5. Return ONLY valid JSON.
  `;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();

  const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();

  try {
    return JSON.parse(cleanText);
  } catch (e) {
    console.error("Failed to parse refined AI response:", cleanText);
    throw new Error("Invalid response from AI during refinement");
  }
};

export const analyzeText = async (description, apiKey) => {
  if (!apiKey) throw new Error("API Key is required");

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `
      Analyze this text description of a meal: "${description}"
      
      Identify the food items, estimate quantities if not specified, and breakdown estimated macronutrients.
      
      Return ONLY a valid JSON object with the following structure:
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
            "sugar": 0,
            "fiber": 0,
            "sodium": 0, // in mg
            "cholesterol": 0, // in mg
            "portion": "description of quantity (e.g. 1 slice)"
          }
        ],
        "total": {
          "calories": 500,
          "protein": 30,
          "carbs": 60,
          "fats": 20,
          "sugar": 5,
          "fiber": 5,
          "sodium": 200,
          "cholesterol": 50
        },
        "description": "Brief summary of the meal including quantity"
      }
      Do not wrap in markdown code blocks. Just the raw JSON string.
    `;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();

  const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();

  try {
    return JSON.parse(cleanText);
  } catch (e) {
    console.error("Failed to parse text analysis response:", cleanText);
    throw new Error("Invalid response from AI");
  }
};


import { GoogleGenAI, Type } from "@google/genai";

// Initialize the Gemini API client using the API key from environment variables.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getChestRewardFlavor = async (username: string) => {
  if (!process.env.API_KEY) return { chestName: "Cassa del Pollaio", message: "Hai trovato qualcosa di utile!" };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `L'utente ${username} ha aperto una cassa in un gioco di galline. Genera un nome epico per la cassa e un messaggio di congratulazioni divertente. Rispondi in JSON.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            chestName: { type: Type.STRING },
            message: { type: Type.STRING }
          },
          required: ["chestName", "message"]
        }
      }
    });
    // Extracting text output from GenerateContentResponse using the .text property.
    const text = response.text || "{}";
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini Error:", error);
    return { chestName: "Cassa del Pollaio", message: "Hai trovato qualcosa di utile!" };
  }
};

export const getLevelFlavorText = async (level: number) => {
  if (!process.env.API_KEY) return { encouragement: "Vola alto!", joke: "Gallina vecchia fa buon brodo... ma salta male!" };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `L'utente ha raggiunto il livello ${level} in Gallina Dash. Messaggio di incoraggiamento breve e battuta a tema galline. Rispondi in JSON.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            encouragement: { type: Type.STRING },
            joke: { type: Type.STRING }
          },
          required: ["encouragement", "joke"]
        }
      }
    });
    // Extracting text output from GenerateContentResponse using the .text property.
    const text = response.text || "{}";
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini Error:", error);
    return { encouragement: "Vola alto!", joke: "Gallina vecchia fa buon brodo... ma salta male!" };
  }
};


import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getChestRewardFlavor = async (username: string) => {
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
    return JSON.parse(response.text);
  } catch (error) {
    return { chestName: "Cassa del Pollaio", message: "Hai trovato qualcosa di utile!" };
  }
};

export const getLevelFlavorText = async (level: number) => {
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
    return JSON.parse(response.text);
  } catch (error) {
    return { encouragement: "Vola alto!", joke: "Gallina vecchia fa buon brodo... ma salta male!" };
  }
};

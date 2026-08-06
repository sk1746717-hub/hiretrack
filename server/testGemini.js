import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

console.log("API Key:", process.env.GEMINI_API_KEY);

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

try {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: "Say hello.",
  });

  console.log("SUCCESS");
  console.log(response.text);
} catch (err) {
  console.error("FULL ERROR:");
  console.dir(err, { depth: null });
}
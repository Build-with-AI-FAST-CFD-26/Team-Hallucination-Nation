import "dotenv/config";
import { GoogleGenerativeAI } from "@google/generative-ai";

async function test() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("GEMINI_API_KEY not found in .env");
    return;
  }
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  try {
    const result = await model.generateContent("Hello, are you working?");
    console.log("Response:", result.response.text());
    console.log("API Key is working!");
  } catch (error) {
    console.error("API Key check failed:", error);
  }
}

test();

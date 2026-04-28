import "dotenv/config";
import { GoogleGenerativeAI } from "@google/generative-ai";

async function listModels() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return;
  const genAI = new GoogleGenerativeAI(apiKey);
  try {
    // There is no direct listModels in the standard SDK easily accessible like this
    // But we can try to hit the endpoint manually or check the error message
    console.log("Checking API key...");
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent("test");
    console.log("Success!");
  } catch (error: any) {
    console.log("Status:", error.status);
    console.log("Message:", error.message);
  }
}
listModels();

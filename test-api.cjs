require("dotenv").config();
const { GEMINI_API_KEY } = process.env;
async function test() {
  const models = ["gemini-1.5-pro", "gemini-1.5-flash", "gemini-flash-lite-latest"];
  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
      console.log("Testing model:", model);
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: "Respond with valid JSON: {\"hello\": \"world\"}" }] }]
        })
      });
      const data = await res.json();
      console.log(`Model ${model} returned:`, data.candidates ? "SUCCESS" : data.error);
    } catch (e) {
      console.error(e);
    }
  }
}
test();

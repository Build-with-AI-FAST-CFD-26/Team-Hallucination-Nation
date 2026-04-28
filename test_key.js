const apiKey = "AIzaSyD9z-SkOuRTHiezCG_aKbp1ISuKVJfCEA0";
const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

fetch(url)
  .then(res => res.json())
  .then(data => {
    if (data.models) {
      console.log("API Key is working! Found models:", data.models.length);
      console.log("Sample model:", data.models[0].name);
    } else {
      console.log("API Key error or no models found:", JSON.stringify(data));
    }
  })
  .catch(err => console.error("Fetch error:", err));

const apiKey = "AIzaSyD9z-SkOuRTHiezCG_aKbp1ISuKVJfCEA0";
const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

fetch(url)
  .then(res => res.json())
  .then(data => {
    if (data.models) {
      console.log("Available models:");
      data.models.forEach(m => console.log(m.name));
    } else {
      console.log("Error:", JSON.stringify(data));
    }
  })
  .catch(err => console.error("Fetch error:", err));

const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../server/.env") });

async function test() {
  const apiKey = process.env.GEMINI_API_KEY;
  console.log("Using API Key:", apiKey ? `${apiKey.slice(0, 10)}...` : "UNDEFINED");
  
  if (!apiKey) {
    console.error("Error: GEMINI_API_KEY is not defined in server/.env");
    return;
  }

  const model = "gemini-1.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const payload = {
    contents: [{ parts: [{ text: "Hello! Respond in 3 words." }] }]
  };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    console.log("HTTP Status:", res.status);
    const body = await res.json();
    console.log("Response Body:", JSON.stringify(body, null, 2));
  } catch (err) {
    console.error("Fetch Connection Error:", err);
  }
}

test();

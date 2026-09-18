require("dotenv").config();

async function getGroqModels() {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return;
  try {
    const res = await fetch("https://api.groq.com/openai/v1/models", {
      headers: { Authorization: `Bearer ${apiKey}` }
    });
    const data = await res.json();
    console.log("GROQ ACTIVE MODELS:", data.data?.map(m => m.id));
  } catch (e) {
    console.error("Groq models err:", e);
  }
}

async function testOpenRouterValidModels() {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return;
  const models = [
    "meta-llama/llama-3.3-70b-instruct",
    "meta-llama/llama-3.1-8b-instruct",
    "qwen/qwen-2.5-7b-instruct",
    "deepseek/deepseek-r1",
    "google/gemini-2.0-flash-exp:free"
  ];
  for (const m of models) {
    try {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({ model: m, messages: [{ role: "user", content: "Hi" }], max_tokens: 10 })
      });
      const data = await res.json();
      if (res.ok) console.log("OPENROUTER WORKS:", m, data.choices?.[0]?.message?.content);
      else console.log("OPENROUTER FAIL:", m, res.status, data.error?.message);
    } catch(e) {
      console.log("OPENROUTER ERR:", m, e.message);
    }
  }
}

async function testGeminiValidModels() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return;
  const models = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-2.0-flash", "gemini-1.0-pro"];
  for (const m of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${apiKey}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: "Hi" }] }] })
      });
      const data = await res.json();
      if (res.ok) console.log("GEMINI WORKS:", m, data.candidates?.[0]?.content?.parts?.[0]?.text);
      else console.log("GEMINI FAIL:", m, res.status, data.error?.message);
    } catch(e) {
      console.log("GEMINI ERR:", m, e.message);
    }
  }
}

async function run() {
  await getGroqModels();
  await testOpenRouterValidModels();
  await testGeminiValidModels();
}

run();

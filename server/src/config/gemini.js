const DEFAULT_SYSTEM_INSTRUCTION = "You are CareerOS, a premium AI Career Intelligence Platform. Always format your responses in clean, professional markdown. Focus on action-oriented advice, technical evidence, and measurable career progression metrics.";
const DEFAULT_OPENAI_MODEL = "gpt-4.1";

async function generateGeminiContent(prompt, systemInstruction = DEFAULT_SYSTEM_INSTRUCTION, jsonMode = false) {
  const geminiKey = process.env.GEMINI_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  if (openaiKey) {
    const openaiResult = await generateOpenAI(prompt, systemInstruction, jsonMode, openaiKey);
    if (openaiResult) {
      return openaiResult;
    }
    console.warn("[AI API] OpenAI failed, falling back to Gemini if available.");
  }

  if (geminiKey) {
    return await generateGemini(prompt, systemInstruction, jsonMode, geminiKey);
  }

  console.warn("[AI API] WARNING: No GEMINI_API_KEY or OPENAI_API_KEY configured. Falling back to local heuristics.");
  return null;
}

async function generateGemini(prompt, systemInstruction, jsonMode, apiKey) {
  const FALLBACK_MODELS = [
    "gemini-1.5-flash",
    "gemini-2.5-flash",
    "gemini-2.5-flash-lite",
    "gemini-flash-latest",
    "gemini-2.0-flash",
    "gemini-pro-latest"
  ];

  const preferredModel = process.env.GEMINI_MODEL;
  const modelsToTry = preferredModel ? [preferredModel, ...FALLBACK_MODELS] : FALLBACK_MODELS;

  for (const model of modelsToTry) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const payload = {
      contents: [{ parts: [{ text: prompt }] }]
    };

    if (systemInstruction) {
      payload.systemInstruction = {
        parts: [{ text: systemInstruction }]
      };
    }

    if (jsonMode) {
      payload.generationConfig = {
        responseMimeType: "application/json"
      };
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        const textResult = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (textResult) {
          console.log(`[Gemini API] Successfully generated content using model: ${model}`);
          return textResult;
        }
      } else {
        const errText = await res.text();
        console.warn(`[Gemini API] Model ${model} failed with status ${res.status}: ${errText.slice(0, 150)}`);
      }
    } catch (err) {
      clearTimeout(timeoutId);
      if (err.name === "AbortError") {
        console.warn(`[Gemini API] Model ${model} request timed out after 6 seconds.`);
      } else {
        console.error(`[Gemini API] Error trying model ${model}:`, err);
      }
    }
  }

  console.error("[Gemini API] All fallback models failed to generate content.");
  return null;
}

async function generateOpenAI(prompt, systemInstruction, jsonMode, apiKey) {
  const model = process.env.OPENAI_MODEL || DEFAULT_OPENAI_MODEL;
  const url = "https://api.openai.com/v1/chat/completions";

  const payload = {
    model,
    messages: [
      { role: "system", content: systemInstruction },
      { role: "user", content: prompt }
    ],
    temperature: 0.7,
    max_tokens: 800
  };

  if (jsonMode) {
    payload.response_format = { type: "json" };
  }

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error(`[OpenAI API] Call failed with status ${res.status}: ${errText}`);
      return null;
    }

    const data = await res.json();
    const textResult = data?.choices?.[0]?.message?.content;
    return textResult || null;
  } catch (err) {
    console.error("[OpenAI API] Network/parsing error:", err);
    return null;
  }
}

module.exports = { generateGeminiContent };

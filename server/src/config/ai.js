const DEFAULT_SYSTEM_INSTRUCTION = "You are CareerOS, a premium AI Career Intelligence Platform. Always format your responses in clean, professional markdown. Focus on action-oriented advice, technical evidence, and measurable career progression metrics.";
const DEFAULT_OPENAI_MODEL = "gpt-4o-mini";

async function generateAiContent(prompt, systemInstruction = DEFAULT_SYSTEM_INSTRUCTION, jsonMode = false) {
  const geminiKey = process.env.GEMINI_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY || process.env.OPEN_AI_API_KEY;
  const groqKey = process.env.GROQ_API_KEY;
  const openRouterKey = process.env.OPENROUTER_API_KEY;

  // Try Gemini first if key is configured
  if (geminiKey) {
    const geminiResult = await generateGemini(prompt, systemInstruction, jsonMode, geminiKey);
    if (geminiResult) return geminiResult;
    console.warn("[AI API] Gemini failed, falling back to OpenAI if available.");
  }

  // Fallback to OpenAI
  if (openaiKey) {
    const openaiResult = await generateOpenAI(prompt, systemInstruction, jsonMode, openaiKey);
    if (openaiResult) return openaiResult;
    console.warn("[AI API] OpenAI fallback failed, falling back to Groq if available.");
  }

  // Fallback to Groq
  if (groqKey) {
    const groqResult = await generateGroq(prompt, systemInstruction, jsonMode, groqKey);
    if (groqResult) return groqResult;
    console.warn("[AI API] Groq fallback failed, falling back to OpenRouter if available.");
  }

  // Fallback to OpenRouter
  if (openRouterKey) {
    const openRouterResult = await generateOpenRouter(prompt, systemInstruction, jsonMode, openRouterKey);
    if (openRouterResult) return openRouterResult;
    console.warn("[AI API] OpenRouter fallback failed.");
  }

  console.warn("[AI API] No working provider configured; callers must use grounded local degradation.");
  return null;
}

async function generateGemini(prompt, systemInstruction, jsonMode, apiKey) {
  // Keep this list limited to currently supported model IDs. A 429 is a
  // billing/quota problem, not a reason to retry a long list of models.
  const FALLBACK_MODELS = ["gemini-2.5-flash"];

  const preferredModel = process.env.GEMINI_MODEL;
  const modelsToTry = preferredModel ? [preferredModel] : FALLBACK_MODELS;

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
    const timeoutId = setTimeout(() => controller.abort(), 30000);

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
    payload.response_format = { type: "json_object" };
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

async function generateGroq(prompt, systemInstruction, jsonMode, apiKey) {
  const model = process.env.GROQ_MODEL || "llama3-8b-8192";
  const url = "https://api.groq.com/openai/v1/chat/completions";

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
    payload.response_format = { type: "json_object" };
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
      console.error(`[Groq API] Call failed with status ${res.status}: ${errText}`);
      return null;
    }

    const data = await res.json();
    return data?.choices?.[0]?.message?.content || null;
  } catch (err) {
    console.error("[Groq API] Network/parsing error:", err);
    return null;
  }
}

async function generateOpenRouter(prompt, systemInstruction, jsonMode, apiKey) {
  const model = process.env.OPENROUTER_MODEL || "meta-llama/llama-3-8b-instruct:free";
  const url = "https://openrouter.ai/api/v1/chat/completions";

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
    payload.response_format = { type: "json_object" };
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
      console.error(`[OpenRouter API] Call failed with status ${res.status}: ${errText}`);
      return null;
    }

    const data = await res.json();
    return data?.choices?.[0]?.message?.content || null;
  } catch (err) {
    console.error("[OpenRouter API] Network/parsing error:", err);
    return null;
  }
}

module.exports = { generateAiContent };

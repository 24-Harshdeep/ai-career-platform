const DEFAULT_SYSTEM_INSTRUCTION = "You are CareerOS, a premium AI Career Intelligence Platform. Always format your responses in clean, professional markdown. Focus on action-oriented advice, technical evidence, and measurable career progression metrics.";

function cleanJsonResponse(text) {
  if (!text) return text;
  let cleaned = text.trim();
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.replace(/^```json\s*/, "").replace(/\s*```$/, "");
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```\s*/, "").replace(/\s*```$/, "");
  }
  cleaned = cleaned.trim();
  
  const firstBrace = cleaned.indexOf("{");
  const firstBracket = cleaned.indexOf("[");
  const lastBrace = cleaned.lastIndexOf("}");
  const lastBracket = cleaned.lastIndexOf("]");

  if (firstBracket !== -1 && lastBracket !== -1 && (firstBrace === -1 || firstBracket < firstBrace)) {
    cleaned = cleaned.substring(firstBracket, lastBracket + 1);
  } else if (firstBrace !== -1 && lastBrace !== -1) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }

  return cleaned;
}

const uniqueModels = (...models) => [...new Set(models.filter(Boolean))];

// Keep fallback models provider-specific. Model IDs are not portable between
// OpenRouter, Groq, Gemini, and OpenAI even when the model family is similar.
const AI_FALLBACK_PIPELINE = [
  {
    name: "OpenRouter",
    key: () => process.env.OPENROUTER_API_KEY,
    models: uniqueModels(
      process.env.OPENROUTER_MODEL,
      "meta-llama/llama-3.3-70b-instruct",
      "meta-llama/llama-3.1-8b-instruct",
      "qwen/qwen-2.5-7b-instruct"
    ),
    execute: generateOpenRouterModel
  },
  {
    name: "Groq",
    key: () => process.env.GROQ_API_KEY,
    models: uniqueModels(
      process.env.GROQ_MODEL,
      "groq/compound",
      "groq/compound-mini",
      "qwen/qwen3.8-27b",
      "openai/gpt-oss-120b"
    ),
    execute: generateGroqModel
  },
  {
    name: "Gemini",
    key: () => process.env.GEMINI_API_KEY,
    models: uniqueModels(
      process.env.GEMINI_MODEL,
      "gemini-2.5-flash",
      "gemini-3.5-flash-lite",
      "gemini-3.1-flash-lite"
    ),
    execute: generateGeminiModel
  },
  {
    name: "OpenAI",
    key: () => process.env.OPENAI_API_KEY || process.env.OPEN_AI_API_KEY,
    models: uniqueModels(
      process.env.OPENAI_MODEL,
      "gpt-4o-mini",
      "gpt-4.1-mini"
    ),
    execute: generateOpenAIModel
  }
];

async function generateAiContent(prompt, systemInstruction = DEFAULT_SYSTEM_INSTRUCTION, jsonMode = false) {
  for (const provider of AI_FALLBACK_PIPELINE) {
    const apiKey = provider.key();
    if (!apiKey) {
      console.warn(`[AI Pipeline] ${provider.name} skipped: API key is not configured.`);
      continue;
    }

    for (const model of provider.models) {
      try {
        const rawResult = await provider.execute(prompt, systemInstruction, jsonMode, apiKey, model);
        if (rawResult) {
          if (jsonMode) {
            const cleanedResult = cleanJsonResponse(rawResult);
            JSON.parse(cleanedResult);
            console.log(`[AI Pipeline SUCCESS] Provider: ${provider.name} | Model: ${model}`);
            return cleanedResult;
          }
          console.log(`[AI Pipeline SUCCESS] Provider: ${provider.name} | Model: ${model}`);
          return rawResult;
        }
      } catch (err) {
        console.warn(`[AI Pipeline Warning] ${provider.name} (${model}) failed: ${err.message}`);
      }
    }
  }

  console.warn("[AI Pipeline] All fallback providers and models failed to generate content.");
  return null;
}

async function generateOpenRouterModel(prompt, systemInstruction, jsonMode, apiKey, model) {
  const url = "https://openrouter.ai/api/v1/chat/completions";
  const payload = {
    model,
    messages: [
      { role: "system", content: systemInstruction },
      { role: "user", content: prompt }
    ],
    temperature: 0.7,
    max_tokens: 1000
  };

  if (jsonMode) {
    payload.response_format = { type: "json_object" };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    return readOpenAICompatibleResponse(res, "OpenRouter", model);
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

async function generateGroqModel(prompt, systemInstruction, jsonMode, apiKey, model) {
  const url = "https://api.groq.com/openai/v1/chat/completions";
  const payload = {
    model,
    messages: [
      { role: "system", content: systemInstruction },
      { role: "user", content: prompt }
    ],
    temperature: 0.7,
    max_tokens: 1000
  };

  if (jsonMode) {
    payload.response_format = { type: "json_object" };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    return readOpenAICompatibleResponse(res, "Groq", model);
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

async function generateGeminiModel(prompt, systemInstruction, jsonMode, apiKey, model) {
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
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      const detail = await getResponseError(res);
      throw new Error(`${res.status} ${detail}`);
    }
    const data = await res.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || null;
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

async function generateOpenAIModel(prompt, systemInstruction, jsonMode, apiKey, model) {
  const url = "https://api.openai.com/v1/chat/completions";
  const payload = {
    model,
    messages: [
      { role: "system", content: systemInstruction },
      { role: "user", content: prompt }
    ],
    temperature: 0.7,
    max_tokens: 1000
  };

  if (jsonMode) {
    payload.response_format = { type: "json_object" };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    return readOpenAICompatibleResponse(res, "OpenAI", model);
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

async function getResponseError(res) {
  try {
    const data = await res.json();
    return data?.error?.message || data?.message || res.statusText || "request failed";
  } catch {
    return res.statusText || "request failed";
  }
}

async function readOpenAICompatibleResponse(res, providerName, model) {
  if (!res.ok) {
    const detail = await getResponseError(res);
    throw new Error(`${res.status} ${providerName} ${model}: ${detail}`);
  }
  const data = await res.json();
  return data?.choices?.[0]?.message?.content || null;
}

module.exports = { generateAiContent };

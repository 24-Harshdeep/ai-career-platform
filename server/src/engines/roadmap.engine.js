const { generateAiContent } = require("../config/ai");

async function generatePersonalizedRoadmap(careerContext) {
  const prompt = `You are the CareerOS curriculum designer.
Based on the following user's Career Context, generate a single personalized learning track (Roadmap) consisting of 3 modules. 
Each module should focus on filling their specific skill gaps and weaknesses to help them reach their target role: "${careerContext.targetRole}".

User Career Context:
${JSON.stringify(careerContext, null, 2)}

Output a JSON object conforming EXACTLY to this schema:
{
  "id": "personalized-track-1",
  "title": "Personalized [Target Role] Track",
  "modules": [
    {
      "id": "mod-1",
      "title": "Module Title",
      "subSkills": [
        { "id": "mod-1-sub-1", "title": "Specific concept to learn", "xpReward": 50 },
        { "id": "mod-1-sub-2", "title": "Specific concept to practice", "xpReward": 40 }
      ]
    }
  ]
}

Ensure you ONLY output a valid JSON object. Do not include markdown formatting like \`\`\`json.`;

  try {
    const geminiJson = await generateAiContent(
      prompt,
      "You are the CareerOS personalized roadmap generator. Respond ONLY with a valid JSON object.",
      true
    );

    if (!geminiJson) {
      throw new Error("Gemini returned empty response for Roadmap generation");
    }

    const parsed = JSON.parse(geminiJson);
    return parsed;
  } catch (err) {
    console.error("Roadmap Engine Error:", err);
    // Safe fallback to static templates if Gemini goes down
    const { getTemplatesForGoal } = require("../config/roadmaps");
    return getTemplatesForGoal(careerContext.targetRole)[0];
  }
}

module.exports = { generatePersonalizedRoadmap };

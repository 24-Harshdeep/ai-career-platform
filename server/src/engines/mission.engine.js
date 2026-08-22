const { generateAiContent } = require("../config/ai");
const Mission = require("../models/Mission");

async function generateDailyMissions(careerContext) {
  const prompt = `You are the CareerOS intelligence engine.
Based on the following user's Career Context, generate exactly 3 small, achievable "Daily Missions" they can do today to improve their career readiness.
These should be short, practical tasks taking 15-30 mins each (e.g., "Add compound indexes to project X", "Practice 1 system design question", "Reach out to 1 alumni").

User Career Context:
${JSON.stringify(careerContext, null, 2)}

Output a JSON array of 3 mission objects. Each object MUST conform EXACTLY to this schema:
{
  "title": "Short, actionable mission title (max 8 words)",
  "scoreReward": "Number between 1 and 5 indicating impact"
}

Ensure you ONLY output a valid JSON array.`;

  try {
    const geminiJson = await generateAiContent(
      prompt,
      "You are the CareerOS daily mission generator. Respond ONLY with a valid JSON array.",
      true
    );

    if (!geminiJson) {
      throw new Error("Gemini returned empty response for Missions");
    }

    const parsed = JSON.parse(geminiJson);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch (err) {
    console.error("Mission Engine Error:", err);
    // Safe fallback if Gemini goes down
    return [
      { title: "Review latest GitHub commits for best practices", scoreReward: 2 },
      { title: "Complete one mock interview question", scoreReward: 3 },
      { title: "Update your target skills list", scoreReward: 1 }
    ];
  }
}

function calculateMissionReward(mission, currentXp, currentLevel) {
  const xpReward = mission.xpReward || 50;
  const scoreReward = mission.scoreReward || 1;

  const newXp = currentXp + xpReward;
  // Level up threshold set at every 1000 XP
  const newLevel = Math.floor(newXp / 1000) + 1;
  const leveledUp = newLevel > currentLevel;

  return {
    xpGained: xpReward,
    scoreGained: scoreReward,
    newXp,
    newLevel,
    leveledUp
  };
}

module.exports = { generateDailyMissions, calculateMissionReward };

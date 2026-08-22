const User = require("../models/User");
const Resume = require("../models/Resume");
const ResumeAnalysis = require("../models/ResumeAnalysis");
const DeveloperProfile = require("../models/DeveloperProfile");
const CoachMessage = require("../models/CoachMessage");

const { routeCoachPrompt } = require("../engines/ai/coachRouter.engine");
const { generateAiContent } = require("../config/ai");

async function generateCoachReply(userId, activePath, userMessage) {
  let context = {};

  try {
    const { getCareerContext } = require("./careerContext.service");
    context = await getCareerContext(userId);
  } catch (err) {
    console.error("[Coach Service] Failed to load context:", err);
    throw new Error("Unable to load user context for AI Coach");
  }

  // Save User's incoming message to DB first
  try {
    await CoachMessage.create({
      userId,
      sender: "user",
      text: userMessage,
      activePath
    });
  } catch (e) {
    console.error("[Coach Service] Failed to save user message:", e);
  }

  // Query past messages for context window
  let historyLogs = [];
  try {
    historyLogs = await CoachMessage.find({ userId }).sort({ createdAt: 1 });
    // slice last 10 messages
    if (historyLogs.length > 10) {
      historyLogs = historyLogs.slice(-10);
    }
  } catch (e) {
    console.error("[Coach Service] Failed to fetch past messages history:", e);
  }

  const formattedHistory = historyLogs
    .map(m => `${m.sender === "user" ? "User" : "Coach"}: ${m.text}`)
    .join("\n");

  // 1. Get routed prompt
  const routed = routeCoachPrompt(activePath, context);
  const userTextLower = (userMessage || "").toLowerCase();

  const formatContextValue = (val) => {
    if (val === undefined || val === null || val === "" || Number.isNaN(val)) {
      return "Not set";
    }
    return val;
  };

  const safeTargetRole = formatContextValue(context.targetRole);
  
  // 2. Call AI API for real-time response
  const prompt = `User Target Role: ${safeTargetRole}
Full Career Context: ${JSON.stringify(context, null, 2)}
Active Page: ${activePath}

Past Conversation History:
${formattedHistory || "None"}

User Message: "${userMessage}"

Reply directly to the user as their personal ${routed.role}.`;

  const systemInstruction = `You are the CareerOS AI ${routed.role}.
Act as a highly technical, frank, and supportive peer/buddy. Avoid formal corporate greetings, verbose filler, or repetitive introduction templates. Speak directly, honestly, and conversationally.

Formatting & Markdown Rules:
- Ensure your markdown list structures are clean and properly aligned.
- Always use a blank line before and after list blocks.
- Ensure bullet items start with an asterisk followed by a space (e.g., "* Item text"). Do not indent bullets with double spaces.

Dynamic Length Scaling:
- Adjust the length of your response to match the user's request.
- For short, simple, or conversational questions, respond with a concise, direct 2-3 sentence buddy-style reply.
- For deep-dives (e.g., roadmap plans, code explanations, resume rewrites), provide structured, detailed breakdowns.`;

  const aiResponse = await generateAiContent(prompt, systemInstruction);
  
  let finalReply = aiResponse;

  // 3. Safe Local Fallback if ALL providers fail
  if (!finalReply) {
    finalReply = "> ⚠️ **System Alert**: AI coaching is temporarily unavailable. Your current profile does not contain enough verified information to generate a personalized recommendation or the AI providers are currently unreachable. Complete your Career DNA or add a verified resume/opportunity to continue.";
  }

  // Save AI reply to DB
  try {
    await CoachMessage.create({
      userId,
      sender: "coach",
      text: finalReply,
      activePath
    });
  } catch (e) {
    console.error("[Coach Service] Failed to save coach reply:", e);
  }

  return {
    role: routed.role,
    reply: finalReply
  };
}

// 4. Retrieve persistent chat history
async function getCoachChatHistory(userId) {
  try {
    const messages = await CoachMessage.find({ userId }).sort({ createdAt: 1 });
    return messages.map(m => ({
      id: m._id.toString(),
      sender: m.sender,
      text: m.text,
      timestamp: new Date(m.createdAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
      })
    }));
  } catch (err) {
    return [];
  }
}

module.exports = { 
  generateCoachReply,
  getCoachChatHistory
};

const User = require("../models/User");
const Resume = require("../models/Resume");
const ResumeAnalysis = require("../models/ResumeAnalysis");
const DeveloperProfile = require("../models/DeveloperProfile");
const CoachMessage = require("../models/CoachMessage");

const { routeCoachPrompt } = require("../engines/ai/coachRouter.engine");
const { generateAiContent } = require("../config/ai");

async function generateCoachReply(userId, activePath, userMessage, targetSessionId = null) {
  let context = {};

  try {
    const { getCareerContext } = require("./careerContext.service");
    context = await getCareerContext(userId);
  } catch (err) {
    console.error("[Coach Service] Failed to load context; using minimal context:", err.message);
    context = {
      targetRole: "Full Stack Developer",
      careerScore: 0,
      experienceLevel: "Intermediate",
      resumeContext: {
        atsScore: 0,
        missingKeywords: [],
        identifiedSkills: []
      },
      devContext: null,
      activeJobs: [],
      activeRecommendations: []
    };
  }

  // Resolve or create sessionId
  let sessionId = targetSessionId;
  if (!sessionId) {
    // Check if user has an existing session in the last 30 minutes
    const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000);
    const lastMsg = await CoachMessage.findOne({ userId, createdAt: { $gte: thirtyMinsAgo } }).sort({ createdAt: -1 });
    if (lastMsg && lastMsg.sessionId) {
      sessionId = lastMsg.sessionId;
    } else {
      sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    }
  }

  // Save User's incoming message to DB first
  try {
    await CoachMessage.create({
      userId,
      sender: "user",
      text: userMessage,
      activePath,
      sessionId
    });
  } catch (e) {
    console.error("[Coach Service] Failed to save user message:", e);
  }

  // Query past messages in current session for context window
  let historyLogs = [];
  try {
    historyLogs = await CoachMessage.find({ userId, sessionId }).sort({ createdAt: 1 });
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
Act as a highly technical, frank, and supportive peer/buddy. Speak directly, honestly, professionally, and conversationally. Do NOT use emojis (e.g. 💪, 🚀, 🔥) or informal text icons in your responses.

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
    finalReply = "> **System Alert**: AI coaching is temporarily unavailable. Your current profile does not contain enough verified information to generate a personalized recommendation or the AI providers are currently unreachable. Complete your Career DNA or add a verified resume/opportunity to continue.";
  }

  // Save AI reply to DB
  try {
    await CoachMessage.create({
      userId,
      sender: "coach",
      text: finalReply,
      activePath,
      sessionId
    });
  } catch (e) {
    console.error("[Coach Service] Failed to save coach reply:", e);
  }

  return {
    role: routed.role,
    reply: finalReply,
    sessionId
  };
}

// 4. Retrieve persistent chat session list (threads)
async function getCoachSessions(userId) {
  try {
    const messages = await CoachMessage.find({ userId }).sort({ createdAt: 1 });
    if (!messages || messages.length === 0) return [];

    const sessionMap = new Map();

    messages.forEach((msg) => {
      // Use existing sessionId or assign a fallback for legacy messages without a sessionId
      const sId = msg.sessionId || "sess_legacy";
      if (!sessionMap.has(sId)) {
        sessionMap.set(sId, {
          sessionId: sId,
          title: "",
          firstPrompt: "",
          updatedAt: msg.createdAt,
          messageCount: 0
        });
      }

      const session = sessionMap.get(sId);
      session.updatedAt = msg.createdAt;

      if (msg.sender === "user") {
        session.messageCount += 1;
        if (!session.firstPrompt) {
          session.firstPrompt = msg.text;
          const cleanTitle = msg.text.replace(/\s+/g, " ").trim();
          session.title = cleanTitle.length > 45 ? `${cleanTitle.substring(0, 42)}...` : cleanTitle;
        }
      }
    });

    const sessions = Array.from(sessionMap.values())
      .map((s) => ({
        sessionId: s.sessionId,
        title: s.title || "Career Coach Chat",
        updatedAt: s.updatedAt,
        formattedDate: new Date(s.updatedAt).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit"
        }),
        messageCount: s.messageCount
      }))
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    return sessions;
  } catch (err) {
    console.error("[Coach Service] Failed to get coach sessions:", err);
    return [];
  }
}

// 5. Retrieve persistent chat history for a specific session (or latest session)
async function getCoachChatHistory(userId, targetSessionId = null) {
  try {
    let query = { userId };
    if (targetSessionId) {
      if (targetSessionId === "sess_legacy") {
        query = { userId, $or: [{ sessionId: "sess_legacy" }, { sessionId: null }, { sessionId: { $exists: false } }] };
      } else {
        query = { userId, sessionId: targetSessionId };
      }
    } else {
      // Find the latest session ID
      const latestMsg = await CoachMessage.findOne({ userId }).sort({ createdAt: -1 });
      if (latestMsg) {
        const sId = latestMsg.sessionId || "sess_legacy";
        if (sId === "sess_legacy") {
          query = { userId, $or: [{ sessionId: "sess_legacy" }, { sessionId: null }, { sessionId: { $exists: false } }] };
        } else {
          query = { userId, sessionId: sId };
        }
      }
    }

    const messages = await CoachMessage.find(query).sort({ createdAt: 1 });
    const formattedMessages = messages.map((m) => ({
      id: m._id.toString(),
      sender: m.sender,
      text: m.text,
      timestamp: new Date(m.createdAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
      })
    }));

    const activeSessionId = targetSessionId || (messages.length > 0 ? messages[0].sessionId || "sess_legacy" : null);

    return {
      sessionId: activeSessionId,
      messages: formattedMessages
    };
  } catch (err) {
    console.error("[Coach Service] Failed to fetch chat history:", err);
    return { sessionId: null, messages: [] };
  }
}

module.exports = { 
  generateCoachReply,
  getCoachSessions,
  getCoachChatHistory
};

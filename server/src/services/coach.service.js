const User = require("../models/User");
const Resume = require("../models/Resume");
const ResumeAnalysis = require("../models/ResumeAnalysis");
const DeveloperProfile = require("../models/DeveloperProfile");
const CoachMessage = require("../models/CoachMessage");
const { mockDb } = require("../config/mockDb");
const { routeCoachPrompt } = require("../engines/ai/coachRouter.engine");
const { generateGeminiContent } = require("../config/gemini");

async function generateCoachReply(userId, activePath, userMessage) {
  let context = {};

  try {
    const userDoc = await User.findById(userId);
    
    // Load context details
    const resume = await Resume.findOne({ userId }).sort({ uploadDate: -1 });
    const resumeAnalysis = resume 
      ? await ResumeAnalysis.findOne({ userId, resumeId: resume._id }) 
      : null;
      
    const devProfile = await DeveloperProfile.findOne({ userId });

    context = {
      goal: userDoc ? userDoc.goal : "Full Stack Developer",
      score: userDoc ? userDoc.score : 82,
      experienceLevel: userDoc ? userDoc.experience : "Intermediate",
      resumeAtsScore: resumeAnalysis ? resumeAnalysis.atsScore : 82,
      missingKeywords: resumeAnalysis ? (resumeAnalysis.missingKeywords || []).map(m => m.keyword) : ["Docker", "CI/CD"],
      suggestedImprovements: resumeAnalysis ? resumeAnalysis.suggestedImprovements : ["Incorporate testing"],
      activeTrack: "Full Stack Track",
      nextSubSkill: "JWT Authentication",
      repoCount: devProfile ? devProfile.repositoryCount : 3,
      overallHealth: devProfile ? devProfile.overallHealth : 80,
      missingPractices: devProfile ? devProfile.missingPractices : []
    };
  } catch (err) {
    // Offline local fallback
    context = {
      goal: mockDb.user.goal,
      score: mockDb.user.score,
      experienceLevel: mockDb.user.experience,
      resumeAtsScore: 82,
      missingKeywords: ["Docker", "CI/CD"],
      suggestedImprovements: ["Incorporate testing"],
      activeTrack: "Full Stack Track",
      nextSubSkill: "JWT Authentication",
      repoCount: 3,
      overallHealth: 80,
      missingPractices: []
    };
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

  // 2. Call Gemini API for real-time response
  const prompt = `User Target Goal: ${context.goal}
User Experience: ${context.experienceLevel}
Career Score: ${context.score}
Resume ATS Score: ${context.resumeAtsScore}%
Missing Resume Keywords: ${context.missingKeywords.join(", ")}
GitHub Repos Health: ${context.overallHealth}%
Missing Project Practices: ${context.missingPractices.join(", ") || "None"}
Active learning subskill: ${context.nextSubSkill}
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

  const geminiResponse = await generateGeminiContent(prompt, systemInstruction);
  if (geminiResponse) {
    // Save AI reply to DB
    try {
      await CoachMessage.create({
        userId,
        sender: "coach",
        text: geminiResponse,
        activePath
      });
    } catch (e) {
      console.error("[Coach Service] Failed to save coach reply:", e);
    }

    return {
      role: routed.role,
      reply: geminiResponse
    };
  }

  // 3. Fallback to specialized mock replies if Gemini is offline
  const apiKey = process.env.GEMINI_API_KEY;
  let notice = "";
  if (!apiKey) {
    notice = "> ⚠️ **System Alert**: `GEMINI_API_KEY` is not defined in your `server/.env` configuration. Running in offline sandbox fallback mode.\n\n";
  } else {
    notice = "> ⚠️ **System Alert**: Google Gemini API returned a transient error (e.g., HTTP 503 high-demand spike or HTTP 429 quota exhaust). Falling back to localized guidelines.\n\n";
  }

  let reply = "";
  if (routed.role === "Resume Coach") {
    if (userTextLower.includes("score") || userTextLower.includes("how")) {
      reply = `${notice}Your current ATS Score is **${context.resumeAtsScore}%**. To boost it higher, I recommend adding missing keywords like: **${context.missingKeywords.join(", ")}**. You can also rewrite your project bullets to use action verbs (e.g. 'architected Express server layers' instead of 'worked on backend').`;
    } else {
      reply = `${notice}Hi there! I am your AI Resume Coach. Paste a bullet point from your resume or ask me how to optimize it for ATS keywords, and I will rewrite it with active verbs and quantified metrics!`;
    }
  } else if (routed.role === "Learning Coach") {
    if (userTextLower.includes("jwt") || userTextLower.includes("auth")) {
      reply = `${notice}JWT (JSON Web Tokens) are used for stateless user sessions. In Express, you sign a token upon login: \`jwt.sign({ id: user._id }, SECRET, { expiresIn: '1d' })\`. Then write an auth middleware checking the \`Authorization: Bearer <token>\` header.`;
    } else {
      reply = `${notice}Hello! I am your Learning Coach. Let's conquer the next sub-skill on your track: **${context.nextSubSkill}**. Ask me to explain any concept, code block, or database queries!`;
    }
  } else if (routed.role === "Interview Coach") {
    reply = `${notice}Let's run a mock technical review! Tell me: how do you optimize a search database index query, and what is the difference between a SQL join and an index scan? Take a moment to frame your response.`;
  } else if (routed.role === "Project Coach") {
    if (userTextLower.includes("docker")) {
      reply = `${notice}Here is a standard Dockerfile configuration to containerize your Node server:\n\n\`\`\`dockerfile\nFROM node:18-alpine\nWORKDIR /usr/src/app\nCOPY package*.json ./\nRUN npm install --omit=dev\nCOPY . .\nEXPOSE 5000\nCMD ["node", "src/index.js"]\n\`\`\`\n\nSave this in your server root directory to resolve the Docker missing practice audit warning!`;
    } else {
      reply = `${notice}I am your Project Coach. I audited your repositories and found an overall health of **${context.overallHealth}%**. You have some missing practices. Let's fix them together! Ask me how to add Docker setups, unit tests, or LICENSE files.`;
    }
  } else {
    // Career Coach / Default
    reply = `${notice}Greetings! I am your Career Coach. Your overall Career Score stands at **${context.score}**. Based on your target role as a **${context.goal}**, your next highest impact step is: Connect & Scan GitHub Portfolio to gain +3 score. Let me know if you need guidelines on where to start!`;
  }

  // Save fallback AI reply to DB as well for continuity
  try {
    await CoachMessage.create({
      userId,
      sender: "coach",
      text: reply,
      activePath
    });
  } catch (e) {
    console.error("[Coach Service] Failed to save fallback coach reply:", e);
  }

  return {
    role: routed.role,
    reply
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

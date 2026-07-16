const crypto = require("crypto");
const User = require("../models/User");
const Resume = require("../models/Resume");
const ResumeAnalysis = require("../models/ResumeAnalysis");
const { mockDb } = require("../config/mockDb");

const { parseResumeText } = require("../engines/resume/resumeParser.engine");
const { matchRoleKeywords } = require("../engines/resume/keywordMatcher.engine");
const { calculateAtsScore } = require("../engines/resume/atsScore.engine");
const { toResumeAnalysisDTO } = require("../dto/resume.dto");
const { recalculateUserStats } = require("./career.service");

// 1. Upload and analyze resume
async function uploadAndAnalyzeResume(userId, filename, rawText, customStoragePath = null) {
  const hash = crypto.createHash("md5").update(rawText).digest("hex");

  try {
    const userDoc = await User.findById(userId);
    const targetRole = userDoc ? userDoc.goal : "Full Stack Developer";

    // 1. Parse text into sections
    const structured = parseResumeText(rawText);

    // 2. Save raw Resume metadata
    const resume = await Resume.create({
      userId,
      filename,
      storagePath: customStoragePath || `/uploads/${userId}/${filename}`,
      fileHash: hash,
      parsedText: rawText,
      structuredSections: structured
    });

    // 3. Match keywords and analyze using Gemini API
    const prompt = `Analyze this candidate resume text for a target role as a "${targetRole}". 
Evaluate its keywords, projects, formatting, action verbs, and quantified impact.
Resume text: "${rawText}"

Output a JSON object conforming exactly to this structure:
{
  "atsScore": 82,
  "breakdown": {
    "keywords": 85,
    "projects": 75,
    "skills": 90,
    "formatting": 95,
    "actionVerbs": 70,
    "quantifiedImpact": 65
  },
  "missingKeywords": [
    {
      "keyword": "Docker",
      "importance": "High",
      "reason": "Crucial tool for modern containerized backend deployments.",
      "expectedScoreGain": 3,
      "expectedReadinessGain": 5
    }
  ],
  "suggestedImprovements": [
    "Add concrete metrics to quantify achievements.",
    "Detail your Docker and Kubernetes experience."
  ]
}`;

    const { generateGeminiContent } = require("../config/gemini");
    const geminiJson = await generateGeminiContent(prompt, "You are a professional ATS resume scanner. Respond only with valid JSON.", true);
    
    let scoreData = null;
    let matchData = null;

    if (geminiJson) {
      try {
        const parsed = JSON.parse(geminiJson);
        scoreData = {
          atsScore: parsed.atsScore || 75,
          breakdown: parsed.breakdown || { keywords: 70, projects: 70, skills: 70, formatting: 80, actionVerbs: 70, quantifiedImpact: 60 },
          suggestedImprovements: parsed.suggestedImprovements || ["Quantify your bullet points"]
        };
        matchData = {
          missingKeywords: parsed.missingKeywords || []
        };
      } catch (e) {
        console.error("Failed to parse Gemini resume scan JSON, falling back to local:", e);
      }
    }

    // Local Fallback if Gemini failed
    if (!scoreData || !matchData) {
      const matchRoleKeywords = require("../engines/resume/keywordMatcher.engine").matchRoleKeywords;
      const calculateAtsScore = require("../engines/resume/atsScore.engine").calculateAtsScore;
      const rawMatch = matchRoleKeywords(structured.skills, targetRole);
      const rawScore = calculateAtsScore({
        matchedCount: rawMatch.matchedCount,
        totalRequired: rawMatch.totalRequired,
        parsedText: rawText,
        projectsCount: userDoc ? userDoc.projectsCount : 3
      });
      scoreData = {
        atsScore: rawScore.atsScore,
        breakdown: rawScore.breakdown,
        suggestedImprovements: rawScore.suggestedImprovements
      };
      matchData = {
        missingKeywords: rawMatch.missingKeywords
      };
    }

    // 5. Save Resume Analysis document
    const analysis = await ResumeAnalysis.create({
      userId,
      resumeId: resume._id,
      atsScore: scoreData.atsScore,
      breakdown: scoreData.breakdown,
      missingKeywords: matchData.missingKeywords,
      suggestedImprovements: scoreData.suggestedImprovements,
      analysisVersion: "v1.0.0"
    });

    // 6. Update User profile flag
    if (userDoc) {
      userDoc.hasResumeScanned = true;
      await userDoc.save();
    }

    // 7. Force Career score calculations update
    await recalculateUserStats(userId);

    return toResumeAnalysisDTO(analysis, resume);
  } catch (err) {
    // Offline local fallback
    mockDb.user.hasResumeScanned = true;

    // Simulate analysis on mockDb
    const structured = parseResumeText(rawText);
    const matchData = matchRoleKeywords(structured.skills, mockDb.user.goal);
    const scoreData = calculateAtsScore({
      matchedCount: matchData.matchedCount,
      totalRequired: matchData.totalRequired,
      parsedText: rawText,
      projectsCount: mockDb.user.projectsCount
    });

    const mockAnalysis = {
      atsScore: scoreData.atsScore,
      breakdown: scoreData.breakdown,
      missingKeywords: matchData.missingKeywords,
      suggestedImprovements: scoreData.suggestedImprovements,
      analysisVersion: "v1.0.0",
      analyzedAt: new Date()
    };

    const mockResume = {
      filename,
      uploadDate: new Date()
    };

    // Update in-memory user
    mockDb.user.score = Math.min(100, mockDb.user.score + 5);

    return toResumeAnalysisDTO(mockAnalysis, mockResume);
  }
}

// 2. Fetch latest analysis
async function getResumeAnalysis(userId) {
  try {
    const resume = await Resume.findOne({ userId }).sort({ uploadDate: -1 });
    if (!resume) return null;

    const analysis = await ResumeAnalysis.findOne({ userId, resumeId: resume._id });
    if (!analysis) return null;

    return toResumeAnalysisDTO(analysis, resume);
  } catch (err) {
    // Offline local fallback
    const mockAnalysis = {
      atsScore: 82,
      breakdown: { keywords: 90, projects: 75, skills: 88, formatting: 95, actionVerbs: 68, quantifiedImpact: 60 },
      missingKeywords: [
        { keyword: "Docker", importance: "High", reason: "Frequently required for backend deployments.", expectedScoreGain: 2, expectedReadinessGain: 4 },
        { keyword: "CI/CD Pipelines", importance: "Medium", reason: "Automated test integration asset.", expectedScoreGain: 1, expectedReadinessGain: 2 }
      ],
      suggestedImprovements: [
        "Incorporate missing technical skills highlighted in keyword analysis.",
        "Add concrete metrics to quantify achievements."
      ],
      analysisVersion: "v1.0.0",
      analyzedAt: new Date()
    };
    return toResumeAnalysisDTO(mockAnalysis, { filename: "resume_optimized.pdf", uploadDate: new Date() });
  }
}

module.exports = {
  uploadAndAnalyzeResume,
  getResumeAnalysis
};

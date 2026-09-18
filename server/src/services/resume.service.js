const crypto = require("crypto");
const User = require("../models/User");
const Resume = require("../models/Resume");
const ResumeAnalysis = require("../models/ResumeAnalysis");
const ResumeChangeLog = require("../models/ResumeChangeLog");
const GithubRepository = require("../models/GithubRepository");
const GithubRepositoryAnalysis = require("../models/GithubRepositoryAnalysis");
const ProjectAudit = require("../models/ProjectAudit");
const ProjectAnalysis = require("../models/ProjectAnalysis");
const CareerProfile = require("../models/CareerProfile");
const Roadmap = require("../models/Roadmap");

const { parseResumeText } = require("../engines/resume/resumeParser.engine");
const { matchRoleKeywords } = require("../engines/resume/keywordMatcher.engine");
const { calculateAtsScore } = require("../engines/resume/atsScore.engine");
const { toResumeAnalysisDTO } = require("../dto/resume.dto");
const { recalculateUserStats } = require("./career.service");
const { logCareerEvent } = require("./analytics.service");
const { generateAiContent } = require("../config/ai");

// Helper: Check if string is a URL or link token
function isUrlString(str) {
  if (!str || typeof str !== "string") return false;
  const lower = str.toLowerCase().trim();
  return (
    lower.startsWith("http://") ||
    lower.startsWith("https://") ||
    lower.includes("drive.google.com") ||
    lower.includes("docs.google.com") ||
    lower.includes("github.com") ||
    lower.includes("linkedin.com") ||
    lower.includes("coursera.org") ||
    lower.includes("udemy.com") ||
    lower.match(/^(www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,}\/?[^\s]*$/)
  );
}

// Helper: Extract date range from text string
function extractDateRange(text) {
  if (!text) return { startDate: "", endDate: "", currentlyWorking: false, cleanText: text };

  const datePattern = /((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|[0-9]{1,2}\/)?\s*[0-9]{4})\s*(?:-|to|–|—)\s*((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|[0-9]{1,2}\/)?\s*[0-9]{4}|Present|Current|Now)/i;
  const match = text.match(datePattern);

  if (match) {
    const startDate = match[1].trim();
    const endRaw = match[2].trim();
    const currentlyWorking = Boolean(endRaw.match(/Present|Current|Now/i));
    const endDate = currentlyWorking ? "Present" : endRaw;
    const cleanText = text.replace(match[0], "").trim();
    return { startDate, endDate, currentlyWorking, cleanText };
  }

  return { startDate: "", endDate: "", currentlyWorking: false, cleanText: text };
}

// Helper: fallback parsing to populate rich schema structures locally without fabricating details
function fallbackParseToStructured(rawText, userDoc) {
  const localSections = parseResumeText(rawText);

  // Parse contact details out if present in raw text
  let phone = "";
  let email = "";
  let location = "";
  let name = userDoc ? userDoc.name : "";
  if (userDoc) {
    email = userDoc.email;
  }

  const lines = (rawText || "").split("\n").map(l => l.trim()).filter(Boolean);
  for (const line of lines) {
    const s = line.toLowerCase();
    if (s.startsWith("phone:") || (s.includes("phone:") && s.match(/\+?\d+/))) {
      phone = line.replace(/phone:/i, "").trim();
    } else if (s.startsWith("email:") || (s.includes("@") && s.includes("mail.com"))) {
      email = line.replace(/email:/i, "").trim();
    } else if (s.startsWith("address:") || s.startsWith("location:")) {
      const candidateLoc = line.replace(/address:|location:/i, "").trim();
      if (!isUrlString(candidateLoc)) {
        location = candidateLoc;
      }
    }
  }

  const isContactLine = (l) => {
    const s = l.toLowerCase();
    return s.includes("phone:") || s.includes("email:") || s.includes("address:") || s.includes("github:") || s.includes("linkedin:") || s.includes("contact") || s.includes("+91") || s.includes("gmail.com") || s.includes("mail.com") || s.includes("portfolio") || s.match(/^\+?\d[\d\s\-]{8,}$/);
  };

  const experienceLines = (localSections.experience || []).filter(l => !isContactLine(l));
  const projectLines = (localSections.projects || []).filter(l => !isContactLine(l));
  const educationLines = (localSections.education || []).filter(l => !isContactLine(l));

  // Extract certifications
  const certifications = [];
  const rawCertLines = [
    ...(localSections.certifications || [])
  ];

  for (const line of rawCertLines) {
    const s = line.trim();
    if (!s) continue;
    const lower = s.toLowerCase();
    if (lower === "coursera" || lower === "certificate" || lower === "certification") {
      continue;
    }
    
    // Extract URL if present
    const urlMatch = s.match(/(https?:\/\/[^\s]+)/);
    const credentialUrl = urlMatch ? urlMatch[1] : "";
    let certName = s;
    if (urlMatch) {
      certName = certName.replace(credentialUrl, "").trim();
    }
    
    certifications.push({
      name: certName,
      issuer: "",
      issueDate: "",
      credentialId: "",
      credentialUrl: credentialUrl,
      evidenceText: line,
      source: "resume",
      confidence: 50,
      isRelevant: true
    });
  }

  const finalEducation = [];
  for (const line of educationLines) {
    const s = line.toLowerCase();
    if (s.split(" ").length > 20 || s.includes("learning") || s.includes("building")) {
      continue; 
    }
    const { startDate, endDate, currentlyWorking } = extractDateRange(line);
    const parts = line.split(/[|\-:]+/).map(p => p.trim()).filter(Boolean);
    
    finalEducation.push({
      institution: parts[0] || line,
      degree: parts[1] || "",
      fieldOfStudy: parts[2] || "",
      major: parts[2] || "",
      location: "",
      startDate,
      endDate,
      currentlyStudying: currentlyWorking,
      gpa: line.match(/gpa:?\s*([0-9\.\/]+)/i)?.[1] || "",
      description: line,
      institutionUrl: ""
    });
  }

  const finalWork = [];
  for (const line of experienceLines) {
    const { startDate, endDate, currentlyWorking, cleanText } = extractDateRange(line);
    const parts = cleanText.split(/[|\-:]+/).map(p => p.trim()).filter(Boolean);

    let company = "";
    let position = "";
    let parsedLoc = "";
    let expUrl = "";

    const nonUrlParts = [];
    for (const part of parts) {
      if (isUrlString(part)) {
        expUrl = part;
      } else {
        nonUrlParts.push(part);
      }
    }

    if (nonUrlParts.length >= 2) {
      company = nonUrlParts[0];
      position = nonUrlParts[1];
      if (nonUrlParts[2] && !isUrlString(nonUrlParts[2])) {
        parsedLoc = nonUrlParts[2];
      }
    } else if (nonUrlParts.length === 1) {
      company = nonUrlParts[0];
    }

    finalWork.push({
      company,
      position,
      employmentType: "",
      location: parsedLoc,
      startDate,
      endDate,
      currentlyWorking,
      description: line,
      bulletPoints: nonUrlParts.length > 2 ? nonUrlParts.slice(2) : [line],
      experienceUrl: expUrl
    });
  }

  // Map project candidates from summary if projects are empty
  let finalProjects = [];
  let parsedProjectsList = [...projectLines];
  let cleanSummaryLines = (localSections.summary || []).filter(l => !isContactLine(l));

  if (parsedProjectsList.length === 0) {
    const projectActionVerbs = ["developed", "implemented", "built", "created", "designed", "configured", "deployed"];
    const projectCandidates = cleanSummaryLines.filter(l => {
      const firstWord = l.toLowerCase().split(/\s+/)[0];
      return projectActionVerbs.includes(firstWord);
    });
    if (projectCandidates.length > 0) {
      parsedProjectsList = projectCandidates;
      cleanSummaryLines = cleanSummaryLines.filter(l => !projectCandidates.includes(l));
    }
  }

  for (const line of parsedProjectsList) {
    const { startDate, endDate } = extractDateRange(line);
    const parts = line.split(/[|\-:]+/).map(p => p.trim()).filter(Boolean);
    let title = parts[0] || line;
    let projLink = "";
    let githubUrl = "";
    let liveUrl = "";

    for (const part of parts) {
      if (isUrlString(part)) {
        projLink = part;
        if (part.includes("github.com")) githubUrl = part;
        else liveUrl = part;
      }
    }

    finalProjects.push({
      title,
      technologies: parts[1] && !isUrlString(parts[1]) ? parts[1].split(",").map(t => t.trim()) : [],
      description: line,
      bulletPoints: parts.slice(2).filter(p => !isUrlString(p)),
      link: projLink,
      githubUrl,
      liveUrl,
      startDate,
      endDate
    });
  }

  // Parse skills from lines
  const skillsList = {
    languages: [],
    frontend: [],
    backend: [],
    database: [],
    tools: [],
    other: []
  };

  const skillLines = (localSections.skills || []).filter(l => !isContactLine(l));
  for (const line of skillLines) {
    const parts = line.split(/[,\/]+/).map(s => s.trim()).filter(Boolean);
    for (const part of parts) {
      if (isUrlString(part)) continue;
      const pLower = part.toLowerCase();
      if (pLower.includes("javascript") || pLower.includes("typescript") || pLower.includes("python") || pLower.includes("java") || pLower.includes("c++") || pLower.includes("html") || pLower.includes("css")) {
        skillsList.languages.push(part);
      } else if (pLower.includes("react") || pLower.includes("next") || pLower.includes("vue") || pLower.includes("angular") || pLower.includes("tailwind") || pLower.includes("bootstrap")) {
        skillsList.frontend.push(part);
      } else if (pLower.includes("node") || pLower.includes("express") || pLower.includes("django") || pLower.includes("flask") || pLower.includes("nest")) {
        skillsList.backend.push(part);
      } else if (pLower.includes("mongo") || pLower.includes("postgre") || pLower.includes("sql") || pLower.includes("mysql") || pLower.includes("redis")) {
        skillsList.database.push(part);
      } else if (pLower.includes("git") || pLower.includes("docker") || pLower.includes("aws") || pLower.includes("netlify") || pLower.includes("heroku") || pLower.includes("npm") || pLower.includes("webpack")) {
        skillsList.tools.push(part);
      } else {
        skillsList.other.push(part);
      }
    }
  }

  // Deduplicate skills lists
  Object.keys(skillsList).forEach(k => {
    skillsList[k] = Array.from(new Set(skillsList[k]));
  });

  return {
    personalInfo: {
      name,
      email,
      phone,
      location,
      githubUrl: "",
      linkedinUrl: "",
      portfolioUrl: ""
    },
    summary: cleanSummaryLines.join(" "),
    workExperience: finalWork,
    projects: finalProjects,
    skills: skillsList,
    education: finalEducation,
    achievements: [],
    certifications,
    leadership: [],
    activities: [],
    links: []
  };
}

async function uploadAndAnalyzeResume(userId, filename, rawText, customStoragePath = null) {
  const hash = crypto.createHash("md5").update(rawText).digest("hex");

  try {
    const userDoc = await User.findById(userId);
    const targetRole = userDoc ? userDoc.goal : "Full Stack Developer";

    // 1. Fast deterministic local parse baseline (<10ms)
    let parsedContent = fallbackParseToStructured(rawText, userDoc);

    // 2. Fetch context in parallel
    const { getCareerContext } = require("./careerContext.service");
    let userContext = { devContext: {} };
    try {
      userContext = await getCareerContext(userId);
    } catch (contextErr) {
      console.warn("[Resume Analysis] Career context unavailable:", contextErr.message);
    }

    // Helper: Execute AI call with strict timeout so API responds fast (<4.5s)
    const runAiWithTimeout = (promise, ms = 4500) => {
      let timer;
      const timeout = new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error("AI call timed out")), ms);
      });
      return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
    };

    // 3. Run AI Parse Refinement & AI ATS Analysis concurrently
    const parsePrompt = `You are a professional ATS resume parsing system.
Extract all details from the resume text and format into clean JSON object:
Personal info, summary, workExperience (array), projects (array), skills (object with languages, frontend, backend, database, tools, other arrays), education (array), certifications (array).
Do not invent information not present.
Resume Text: "${rawText.substring(0, 4000)}"`;

    const analysisPrompt = `Analyze candidate resume for target role as "${targetRole}".
Resume Text: "${rawText.substring(0, 3000)}"
Verified Career Context: ${JSON.stringify(userContext.devContext || {})}
Output JSON with keys: atsScore (number 0-100), breakdown ({keywords, projects, skills, formatting, actionVerbs, quantifiedImpact}), truthfulnessReport ({exaggeratedSkills, missingVerifiedSkills}), missingKeywords ([{keyword, importance, reason, expectedScoreGain, expectedReadinessGain}]), suggestedImprovements ([string]).`;

    const [aiParseRes, aiAnalysisRes] = await Promise.allSettled([
      runAiWithTimeout(generateAiContent(parsePrompt, "You are a precise ATS parser. Output JSON only.", true), 4500),
      runAiWithTimeout(generateAiContent(analysisPrompt, "You are a professional ATS resume scanner. Respond only with valid JSON.", true), 4500)
    ]);

    if (aiParseRes.status === "fulfilled" && aiParseRes.value) {
      try {
        const aiParsed = JSON.parse(aiParseRes.value);
        if (aiParsed && (aiParsed.workExperience || aiParsed.skills)) {
          parsedContent = {
            ...parsedContent,
            ...aiParsed,
            personalInfo: { ...parsedContent.personalInfo, ...(aiParsed.personalInfo || {}) },
            skills: { ...parsedContent.skills, ...(aiParsed.skills || {}) }
          };
        }
      } catch (e) {
        console.warn("[Resume Parsing] Failed to parse AI JSON result, using local baseline");
      }
    }

    let scoreData = null;
    if (aiAnalysisRes.status === "fulfilled" && aiAnalysisRes.value) {
      try {
        const parsed = JSON.parse(aiAnalysisRes.value);
        scoreData = {
          atsScore: parsed.atsScore || 65,
          breakdown: parsed.breakdown || { keywords: 60, projects: 60, skills: 60, formatting: 80, actionVerbs: 60, quantifiedImpact: 50 },
          truthfulnessReport: parsed.truthfulnessReport || { exaggeratedSkills: [], missingVerifiedSkills: [] },
          suggestedImprovements: parsed.suggestedImprovements || ["Add metrics to your experience bullets."],
          missingKeywords: parsed.missingKeywords || []
        };
      } catch (e) {
        console.warn("[Resume Analysis] Failed to parse AI ATS score JSON, using local score matching");
      }
    }

    // Local Fallback if AI ATS analysis timed out or failed
    if (!scoreData) {
      const matchRoleKeywords = require("../engines/resume/keywordMatcher.engine").matchRoleKeywords;
      const calculateAtsScore = require("../engines/resume/atsScore.engine").calculateAtsScore;
      
      const flatSkills = [
        ...(parsedContent.skills?.languages || []),
        ...(parsedContent.skills?.frontend || []),
        ...(parsedContent.skills?.backend || []),
        ...(parsedContent.skills?.database || []),
        ...(parsedContent.skills?.tools || []),
        ...(parsedContent.skills?.other || [])
      ];

      const rawMatch = matchRoleKeywords(flatSkills, targetRole);
      const rawScore = calculateAtsScore({
        matchedCount: rawMatch.matchedCount,
        totalRequired: rawMatch.totalRequired,
        parsedText: rawText,
        projectsCount: userDoc ? userDoc.projectsCount : 3
      });
      scoreData = {
        atsScore: rawScore.atsScore,
        breakdown: rawScore.breakdown,
        truthfulnessReport: { exaggeratedSkills: [], missingVerifiedSkills: [] },
        suggestedImprovements: rawScore.suggestedImprovements,
        missingKeywords: rawMatch.missingKeywords
      };
    }

    // 5. Save Resume Analysis document
    const analysis = await ResumeAnalysis.create({
      userId,
      resumeId: resume._id,
      atsScore: scoreData.atsScore,
      breakdown: scoreData.breakdown,
      truthfulnessReport: scoreData.truthfulnessReport,
      missingKeywords: scoreData.missingKeywords,
      suggestedImprovements: scoreData.suggestedImprovements,
      analysisVersion: "v1.0.0"
    });

    // 6. Update User profile flag & sync extracted skills into CareerProfile & User model
    if (userDoc) {
      userDoc.hasResumeScanned = true;
      await userDoc.save();
    }

    const profile = await CareerProfile.findOne({ userId });
    if (profile && parsedContent && parsedContent.skills) {
      const updatedPossessed = {
        languages: Array.from(new Set([...(profile.skillsPossessed?.languages || []), ...(parsedContent.skills.languages || [])])),
        frontend: Array.from(new Set([...(profile.skillsPossessed?.frontend || []), ...(parsedContent.skills.frontend || [])])),
        backend: Array.from(new Set([...(profile.skillsPossessed?.backend || []), ...(parsedContent.skills.backend || [])])),
        database: Array.from(new Set([...(profile.skillsPossessed?.database || []), ...(parsedContent.skills.database || [])])),
        tools: Array.from(new Set([...(profile.skillsPossessed?.tools || []), ...(parsedContent.skills.tools || [])])),
        technical: Array.from(new Set([...(profile.skillsPossessed?.technical || []), ...(parsedContent.skills.other || [])])),
        soft: profile.skillsPossessed?.soft || [],
        cloud: profile.skillsPossessed?.cloud || [],
        devops: profile.skillsPossessed?.devops || []
      };
      profile.skillsPossessed = updatedPossessed;
      profile.markModified("skillsPossessed");
      await profile.save();

      const totalSkillsCount = [
        ...updatedPossessed.languages,
        ...updatedPossessed.frontend,
        ...updatedPossessed.backend,
        ...updatedPossessed.database,
        ...updatedPossessed.tools,
        ...updatedPossessed.technical
      ].length;

      if (userDoc) {
        userDoc.skillsCount = totalSkillsCount;
        if (parsedContent.projects && parsedContent.projects.length > 0) {
          userDoc.projectsCount = Math.max(userDoc.projectsCount || 0, parsedContent.projects.length);
        }
        await userDoc.save();
      }
    }

    // These are secondary side effects. Do not turn a successful resume
    // analysis into a failed upload if analytics recalculation is unavailable.
    try {
      await logCareerEvent(
        userId,
        "Resume Scanned",
        "ATS Engine",
        15,
        { atsScore: scoreData.atsScore }
      );
    } catch (eventErr) {
      console.warn("[Resume Analysis] Career event logging failed:", eventErr.message);
    }

    try {
      await recalculateUserStats(userId);
    } catch (statsErr) {
      console.warn("[Resume Analysis] Career stats recalculation failed:", statsErr.message);
    }

    return getResumeAnalysis(userId);
  } catch (err) {
    console.error("Upload and scan resume service error:", err);
    throw err;
  }
}

// Helper to fetch and auto-migrate legacy resumes
async function getOrCreateActiveResume(userId) {
  const resume = await Resume.findOne({ userId });
  if (!resume) return null;

  if (!resume.versions || resume.versions.length === 0) {
    const parsedContent = fallbackParseToStructured(resume.parsedText, null);
    resume.versions = [{
      versionNumber: 1,
      title: "Original Upload",
      optimizationGoal: "ATS Optimization",
      personalInfo: parsedContent.personalInfo || {},
      summary: parsedContent.summary || "",
      workExperience: parsedContent.workExperience || [],
      projects: parsedContent.projects || [],
      skills: parsedContent.skills || { languages: [], frontend: [], backend: [], database: [], tools: [], other: [] },
      education: parsedContent.education || [],
      achievements: parsedContent.achievements || [],
      certifications: parsedContent.certifications || []
    }];
    resume.activeVersionId = 1;
    resume.markModified("versions");
    await resume.save();
  }
  return resume;
}

// 2. Fetch latest active version and analysis DTO
async function getResumeAnalysis(userId) {
  try {
    const resume = await getOrCreateActiveResume(userId);
    if (!resume) return null;

    const activeVersion = resume.versions.find(v => v.versionNumber === resume.activeVersionId) || resume.versions[0];
    const analysis = await ResumeAnalysis.findOne({ userId, resumeId: resume._id }) || {
      atsScore: 75,
      breakdown: { keywords: 70, projects: 70, skills: 70, formatting: 85, actionVerbs: 65, quantifiedImpact: 50 },
      missingKeywords: [],
      suggestedImprovements: []
    };

    const changeLogs = await ResumeChangeLog.find({ userId, resumeId: resume._id, versionNumber: resume.activeVersionId });

    return {
      resumeId: resume._id,
      filename: resume.filename,
      activeVersionId: resume.activeVersionId,
      versionsList: resume.versions.map(v => ({
        versionNumber: v.versionNumber,
        title: v.title,
        optimizationGoal: v.optimizationGoal,
        createdAt: v.createdAt
      })),
      activeVersionContent: {
        personalInfo: activeVersion.personalInfo,
        summary: activeVersion.summary,
        workExperience: activeVersion.workExperience,
        projects: activeVersion.projects,
        skills: activeVersion.skills,
        education: activeVersion.education,
        achievements: activeVersion.achievements,
        certifications: activeVersion.certifications || [],
        leadership: activeVersion.leadership || [],
        activities: activeVersion.activities || [],
        links: activeVersion.links || []
      },
      atsScore: analysis.atsScore,
      aiConfidence: activeVersion.versionNumber === 1 ? 90 : 98, // Initial parse starts lower, optimizations hit higher
      breakdown: analysis.breakdown,
      missingKeywords: analysis.missingKeywords,
      suggestedImprovements: analysis.suggestedImprovements,
      changeLogs: changeLogs.map(log => ({
        _id: log._id,
        section: log.section,
        originalText: log.originalText,
        rewrittenText: log.rewrittenText,
        editedText: log.editedText,
        reason: log.reason,
        status: log.status
      }))
    };
  } catch (err) {
    console.error("Failed to fetch resume analysis details:", err);
    return null;
  }
}

// 3. Save Resume Form Edits
async function saveResumeEdits(userId, content) {
  const resume = await getOrCreateActiveResume(userId);
  if (!resume) throw new Error("No resume found to edit.");

  const activeIdx = resume.versions.findIndex(v => v.versionNumber === resume.activeVersionId);
  if (activeIdx === -1) throw new Error("Active resume version not found.");

  // Save the fields directly
  resume.versions[activeIdx].personalInfo = content.personalInfo || {};
  resume.versions[activeIdx].summary = content.summary || "";
  resume.versions[activeIdx].workExperience = content.workExperience || [];
  resume.versions[activeIdx].projects = content.projects || [];
  resume.versions[activeIdx].skills = content.skills || { languages: [], frontend: [], backend: [], database: [], tools: [], other: [] };
  resume.versions[activeIdx].education = content.education || [];
  resume.versions[activeIdx].achievements = content.achievements || [];
  resume.versions[activeIdx].certifications = content.certifications || [];
  resume.versions[activeIdx].leadership = content.leadership || [];
  resume.versions[activeIdx].activities = content.activities || [];
  resume.versions[activeIdx].links = content.links || [];

  resume.markModified("versions");
  await resume.save();

  // Recalculate ATS Score for the updated content
  const UserDoc = await User.findById(userId);
  const targetRole = UserDoc ? UserDoc.goal : "Full Stack Developer";

  const flatSkills = [
    ...(content.skills?.languages || []),
    ...(content.skills?.frontend || []),
    ...(content.skills?.backend || []),
    ...(content.skills?.database || []),
    ...(content.skills?.tools || []),
    ...(content.skills?.other || [])
  ];

  const matchRoleKeywords = require("../engines/resume/keywordMatcher.engine").matchRoleKeywords;
  const calculateAtsScore = require("../engines/resume/atsScore.engine").calculateAtsScore;
  const rawMatch = matchRoleKeywords(flatSkills, targetRole);
  
  // Create plain text payload to estimate formatting metrics
  const plainText = `${content.summary} ${content.workExperience.map(w => w.description + " " + w.bulletPoints.join(" ")).join(" ")} ${content.projects.map(p => p.description + " " + p.bulletPoints.join(" ")).join(" ")}`;
  const scoreData = calculateAtsScore({
    matchedCount: rawMatch.matchedCount,
    totalRequired: rawMatch.totalRequired,
    parsedText: plainText,
    projectsCount: content.projects.length
  });

  await ResumeAnalysis.findOneAndUpdate(
    { userId, resumeId: resume._id },
    {
      atsScore: scoreData.atsScore,
      breakdown: scoreData.breakdown,
      missingKeywords: rawMatch.missingKeywords,
      suggestedImprovements: scoreData.suggestedImprovements
    },
    { upsert: true }
  );

  await recalculateUserStats(userId);
  return getResumeAnalysis(userId);
}

// 4. Create New Resume Fork Version
async function forkResumeVersion(userId, title, goal = "ATS Optimization") {
  const resume = await getOrCreateActiveResume(userId);
  if (!resume) throw new Error("No resume exists to fork.");

  const activeVersion = resume.versions.find(v => v.versionNumber === resume.activeVersionId);
  if (!activeVersion) throw new Error("Active resume version not found.");

  const newVersionId = resume.versions.length + 1;
  const forkedCopy = JSON.parse(JSON.stringify(activeVersion));
  forkedCopy.versionNumber = newVersionId;
  forkedCopy.title = title || `Version ${newVersionId}`;
  forkedCopy.optimizationGoal = goal;
  forkedCopy.createdAt = new Date();

  resume.versions.push(forkedCopy);
  resume.activeVersionId = newVersionId;
  await resume.save();

  return getResumeAnalysis(userId);
}

// 5. Restore Resume Version
async function restoreResumeVersion(userId, versionNumber) {
  const resume = await getOrCreateActiveResume(userId);
  if (!resume) throw new Error("No resume exists to restore.");

  const versionExists = resume.versions.some(v => v.versionNumber === versionNumber);
  if (!versionExists) throw new Error(`Version ${versionNumber} does not exist.`);

  resume.activeVersionId = versionNumber;
  await resume.save();

  return getResumeAnalysis(userId);
}

// 6. Cross-Sync suggestions across modules (GitHub, Portfolio, DNA, Roadmap)
async function getCrossSyncSuggestions(userId) {
  try {
    const resume = await getOrCreateActiveResume(userId);
    if (!resume) return [];

    const activeVersion = resume.versions.find(v => v.versionNumber === resume.activeVersionId) || resume.versions[0];
    const resumeSkills = activeVersion ? [
      ...(activeVersion.skills?.languages || []),
      ...(activeVersion.skills?.frontend || []),
      ...(activeVersion.skills?.backend || []),
      ...(activeVersion.skills?.database || []),
      ...(activeVersion.skills?.tools || []),
      ...(activeVersion.skills?.other || [])
    ].map(s => s.toLowerCase().trim()) : [];

    const suggestions = [];

    // A. Portfolio Sync Check
    const auditedProjects = await ProjectAudit.find({ userId });
    const projectAnalyses = await ProjectAnalysis.find({ userId });
    for (const proj of auditedProjects) {
      const titleLower = proj.title.toLowerCase();
      // Check if project is on resume
      const hasOnResume = activeVersion?.projects?.some(p => p.title.toLowerCase().includes(titleLower) || titleLower.includes(p.title.toLowerCase()));
      if (!hasOnResume) {
        suggestions.push({
          module: "Portfolio Sync",
          title: `Missing Audited Project: "${proj.title}"`,
          description: `You've audited and deployed "${proj.title}" with a ${projectAnalyses.find(a => a.projectId.toString() === proj._id.toString())?.overallScore || 80}% rating. Consider adding it to your resume's Projects section.`,
          action: "add_project",
          data: {
            title: proj.title,
            link: proj.url,
            technologies: ["React", "Node.js", "MongoDB"],
            description: "Full stack deployment project audited on CareerOS."
          }
        });
      }
    }

    // B. GitHub Sync Check
    const repos = await GithubRepository.find({ userId });
    for (const repo of repos) {
      if (repo.language) {
        const langLower = repo.language.toLowerCase();
        if (!resumeSkills.includes(langLower)) {
          suggestions.push({
            module: "GitHub Sync",
            title: `Unlisted Repository Language: "${repo.language}"`,
            description: `You have active repositories written in "${repo.language}" on GitHub, but it is not listed in your resume's skills.`,
            action: "add_skill",
            data: { category: "languages", skill: repo.language }
          });
        }
      }
    }

    // C. Career DNA Sync Check
    const profile = await CareerProfile.findOne({ userId });
    if (profile && profile.targetRole) {
      const targetRole = profile.targetRole;
      const expectedSkills = targetRole.includes("Frontend") 
        ? ["React", "Next.js", "TypeScript"] 
        : targetRole.includes("Backend") 
        ? ["Node.js", "Express", "PostgreSQL", "Docker"]
        : ["React", "Node.js", "TypeScript", "Docker"];

      for (const req of expectedSkills) {
        if (!resumeSkills.includes(req.toLowerCase())) {
          suggestions.push({
            module: "Career DNA",
            title: `Recommended Target Role Skill: "${req}"`,
            description: `Your target role is set to "${targetRole}". Emphasize your profile by listing "${req}" in your skills inventory.`,
            action: "add_skill",
            data: { category: req === "TypeScript" ? "languages" : "frontend", skill: req }
          });
        }
      }
    }

    // D. Roadmap Milestones Check
    const roadmap = await Roadmap.findOne({ userId });
    if (roadmap && roadmap.phases) {
      for (const phase of roadmap.phases) {
        if (phase.milestones) {
          for (const m of phase.milestones) {
            if (m.isCompleted) {
              const skillTitle = m.title.replace("Master ", "").replace("Learn ", "").trim();
              if (!resumeSkills.includes(skillTitle.toLowerCase())) {
                suggestions.push({
                  module: "Roadmap Milestones",
                  title: `Completed Learning Milestone: "${skillTitle}"`,
                  description: `You completed the "${m.title}" course roadmap step. List "${skillTitle}" under your verified resume credentials.`,
                  action: "add_skill",
                  data: { category: "tools", skill: skillTitle }
                });
              }
            }
          }
        }
      }
    }

    return suggestions;
  } catch (err) {
    console.error("Cross-sync recommendations retrieval error:", err);
    return [];
  }
}

// 7. Full AI Resume Optimization (Generates Version snap and ChangeLogs)
async function optimizeResumeContent(userId, goal, targetDescription) {
  const resume = await getOrCreateActiveResume(userId);
  if (!resume) throw new Error("No resume exists to optimize.");

  const activeVersion = resume.versions.find(v => v.versionNumber === resume.activeVersionId);
  if (!activeVersion) throw new Error("Active version content missing.");

  // Fetch cross-module context details
  const repos = await GithubRepository.find({ userId });
  const repoLanguages = Array.from(new Set(repos.map(r => r.language).filter(Boolean)));
  const auditedProjects = await ProjectAudit.find({ userId });
  const profile = await CareerProfile.findOne({ userId });
  const targetRole = profile ? profile.targetRole : "Full Stack Developer";

  const crossContext = {
    targetRole,
    syncedLanguages: repoLanguages,
    deployedProjects: auditedProjects.map(p => ({ title: p.title, url: p.url }))
  };

  const optimizePrompt = `You are a CareerOS Professional Resume Optimizer.
Analyze the current resume structure, cross-module development achievements, and target requirements to rewrite, format, and enhance this resume into its BEST version.
Ensure all claims remain factual and truthful—do not invent fake companies, years, degrees, or certifications.

Target Strategy: "${goal || "ATS Optimization"}"
${targetDescription ? `Target Job Details / Description:\n"${targetDescription}"` : ""}

Cross-Module Synced Capabilities (Verified Developer Work):
${JSON.stringify(crossContext)}

Current Resume JSON Content:
${JSON.stringify({
  personalInfo: activeVersion.personalInfo,
  summary: activeVersion.summary,
  workExperience: activeVersion.workExperience,
  projects: activeVersion.projects,
  skills: activeVersion.skills,
  education: activeVersion.education,
  achievements: activeVersion.achievements
})}

Output a JSON object conforming exactly to this structure:
{
  "optimizedResume": {
    "personalInfo": {
      "name": "Full Name",
      "email": "Email Address",
      "phone": "Phone Number",
      "location": "City, State or Country",
      "githubUrl": "GitHub Link",
      "linkedinUrl": "LinkedIn Link",
      "portfolioUrl": "Portfolio Link"
    },
    "summary": "Rewritten summary focused on the target role/goal",
    "workExperience": [
      {
        "company": "Company Name",
        "position": "Job Title",
        "location": "Location",
        "startDate": "Start Date",
        "endDate": "End Date",
        "description": "Short overview description",
        "bulletPoints": [
          "Optimized bullet using action verbs and technical stack. Insert metrics if they already exist, DO NOT invent fake numbers."
        ]
      }
    ],
    "projects": [
      {
        "title": "Project Title",
        "technologies": ["React", "Node.js"],
        "description": "Brief description",
        "bulletPoints": [
          "Optimized project bullet detailing technologies and contributions."
        ],
        "link": "Project link"
      }
    ],
    "skills": {
      "languages": ["JavaScript", "TypeScript"],
      "frontend": ["React", "Next.js"],
      "backend": ["Node.js", "Express"],
      "database": ["MongoDB"],
      "tools": ["Git", "Docker"],
      "other": ["Agile"]
    },
    "education": [
      {
        "institution": "University Name",
        "degree": "Degree",
        "major": "Major",
        "startDate": "Start Date",
        "endDate": "End Date",
        "gpa": "GPA"
      }
    ],
    "achievements": [
      "Factual achievement or certification"
    ],
    "certifications": [
      {
        "name": "Certification Name",
        "issuer": "Issuing Organization",
        "issueDate": "Date or Year",
        "credentialUrl": "Link if any",
        "isRelevant": true
      }
    ]
  },
  "atsScore": 92,
  "aiConfidence": 97,
  "changeLog": [
    {
      "section": "Work Experience - Google",
      "originalText": "Original bullet description",
      "rewrittenText": "AI optimized bullet description",
      "reason": "Uses stronger action verb and highlights Next.js capability."
    }
  ],
  "unquantifiedStatements": [
    {
      "originalText": "Cleaned up front-end files to speed page rendering.",
      "promptQuestion": "Can you share the approximate percentage or millisecond increase in rendering speeds?"
    }
  ]
}`;

  let optimizationResponse = null;
  try {
    const geminiJson = await generateAiContent(optimizePrompt, "You are a professional resume writer. Respond only in valid JSON.", true);
    if (geminiJson) {
      optimizationResponse = JSON.parse(geminiJson);
    }
  } catch (err) {
    console.error("[Resume Optimization] AI prompt call failed:", err);
  }

  // Fallback if AI optimization failed
  if (!optimizationResponse) {
    optimizationResponse = {
      optimizedResume: JSON.parse(JSON.stringify(activeVersion)),
      atsScore: 88,
      aiConfidence: 90,
      changeLog: [],
      unquantifiedStatements: []
    };
  }

  // Clear existing pending changelogs for this active version
  await ResumeChangeLog.deleteMany({ userId, resumeId: resume._id, versionNumber: resume.activeVersionId, status: "pending" });

  // Create Pending Change Log Entries
  if (optimizationResponse.changeLog && optimizationResponse.changeLog.length > 0) {
    const logs = optimizationResponse.changeLog.map(item => ({
      userId,
      resumeId: resume._id,
      versionNumber: resume.activeVersionId, // tie to current version for review
      section: item.section,
      originalText: item.originalText,
      rewrittenText: item.rewrittenText,
      reason: item.reason,
      status: "pending"
    }));
    await ResumeChangeLog.insertMany(logs);
  }

  // Update Analysis Record (store improvements, don't overwrite real ATS score yet)
  await ResumeAnalysis.findOneAndUpdate(
    { userId, resumeId: resume._id },
    {
      suggestedImprovements: (optimizationResponse.unquantifiedStatements || []).map(q => q.originalText)
    },
    { upsert: true }
  );

  await logCareerEvent(
    userId,
    "Resume Optimized",
    "AI Optimizer",
    25,
    { atsScore: optimizationResponse.atsScore, targetGoal: goal }
  );

  await recalculateUserStats(userId);

  return {
    ...await getResumeAnalysis(userId),
    unquantifiedStatements: optimizationResponse.unquantifiedStatements || []
  };
}

// 8. Review Pending Change Log
async function reviewChangeLog(userId, logId, status, editedText = "") {
  const log = await ResumeChangeLog.findOne({ _id: logId, userId });
  if (!log) throw new Error("Change log not found.");
  
  log.status = status;
  if (status === "edited") {
    log.editedText = editedText;
  }
  await log.save();
  return getResumeAnalysis(userId);
}

// 9. Apply Accepted/Edited Change Logs
async function applyChangeLogs(userId, goal) {
  const resume = await getOrCreateActiveResume(userId);
  if (!resume) throw new Error("No resume exists.");
  
  const activeVersion = resume.versions.find(v => v.versionNumber === resume.activeVersionId);
  if (!activeVersion) throw new Error("Active version missing.");

  const logs = await ResumeChangeLog.find({ userId, resumeId: resume._id, versionNumber: resume.activeVersionId });
  
  const newVersionId = resume.versions.length + 1;
  const newContent = JSON.parse(JSON.stringify(activeVersion));
  newContent.versionNumber = newVersionId;
  newContent.title = `${goal || "AI"} Optimized Version`;
  newContent.createdAt = new Date();

  const replaceText = (obj, original, replacement) => {
    if (!obj) return obj;
    if (typeof obj === 'string') {
      return obj === original ? replacement : obj;
    }
    if (Array.isArray(obj)) {
      return obj.map(item => replaceText(item, original, replacement));
    }
    if (typeof obj === 'object') {
      const newObj = {};
      for (const key in obj) {
        newObj[key] = replaceText(obj[key], original, replacement);
      }
      return newObj;
    }
    return obj;
  };

  for (const log of logs) {
    if (log.status === "accepted") {
      Object.assign(newContent, replaceText(newContent, log.originalText, log.rewrittenText));
    } else if (log.status === "edited") {
      Object.assign(newContent, replaceText(newContent, log.originalText, log.editedText));
    }
  }

  resume.versions.push(newContent);
  resume.activeVersionId = newVersionId;
  await resume.save();

  // Clear logs for old version
  await ResumeChangeLog.deleteMany({ userId, resumeId: resume._id, versionNumber: activeVersion.versionNumber });

  return getResumeAnalysis(userId);
}

module.exports = {
  uploadAndAnalyzeResume,
  getResumeAnalysis,
  saveResumeEdits,
  forkResumeVersion,
  restoreResumeVersion,
  getCrossSyncSuggestions,
  optimizeResumeContent,
  reviewChangeLog,
  applyChangeLogs
};

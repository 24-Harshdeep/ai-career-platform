const { getCareerContext } = require("./careerContext.service");
const User = require("../models/User");
const CareerProfile = require("../models/CareerProfile");
const Resume = require("../models/Resume");
const ResumeAnalysis = require("../models/ResumeAnalysis");
const DeveloperProfile = require("../models/DeveloperProfile");
const InterviewSession = require("../models/InterviewSession");
const InterviewMistake = require("../models/InterviewMistake");
const Roadmap = require("../models/Roadmap");
const LearningProgress = require("../models/LearningProgress");
const JobApplication = require("../models/JobApplication");
const AnalyticsSnapshot = require("../models/AnalyticsSnapshot");
const CareerEvent = require("../models/CareerEvent");
const CareerReportSnapshot = require("../models/CareerReportSnapshot");

const { calculateCareerScore } = require("../engines/careerScore.engine");
const { calculateReadiness } = require("../engines/readiness.engine");
const { computeNextBestAction } = require("../engines/nextBestAction.engine");
const { generateAiContent } = require("../config/ai");

/**
 * Formats a raw skill gap into a professional 5-stage growth lifecycle entry for the shareable report.
 * Re-frames negative diagnostic text into evidence-backed professional development statements.
 */
function buildShareableGrowthLifecycle(gapItem) {
  const skill = gapItem.skill;
  let statusText = "Actively Developing";
  let actionTaken = gapItem.evidence ? `Recorded evidence: ${gapItem.evidence}` : "No recorded action available.";
  let nextMilestone = "No recorded milestone available.";

  if (gapItem.status === "RESOLVED") {
    statusText = "Verified Capability";
    actionTaken = gapItem.evidence ? `Verified: ${gapItem.evidence}` : "CareerOS records this capability as resolved.";
    nextMilestone = "No additional milestone recorded.";
  } else if (gapItem.status === "IMPROVING" || gapItem.status === "IN_PROGRESS") {
    statusText = "Actively Developing";
    actionTaken = gapItem.evidence ? `In Progress: ${gapItem.evidence}` : "CareerOS records this capability as in progress.";
    nextMilestone = "No additional milestone recorded.";
  } else if (gapItem.status === "RECURRING") {
    statusText = "Focus Area";
    actionTaken = gapItem.evidence ? `Focus Area: ${gapItem.evidence}` : "Interview diagnostics record this recurring focus area.";
    nextMilestone = "No additional milestone recorded.";
  }

  return {
    skill,
    identified: gapItem.isInterviewMistake ? "Recorded in interview diagnostics." : "Recorded in career context.",
    actionTaken,
    evidence: gapItem.evidence || "No supporting evidence recorded.",
    currentState: statusText,
    nextMilestone
  };
}

/**
 * Helper to safely extract an array of skill strings from various skill set formats:
 * - Arrays of strings
 * - Subdocuments with category arrays ({ technical: [], frameworks: [], languages: [], ... })
 * - Key-value objects / Maps
 */
function extractSkillsFromSkillSet(skillSet) {
  if (!skillSet) return [];
  if (Array.isArray(skillSet)) {
    return skillSet.filter(s => typeof s === "string" && s.trim());
  }
  if (typeof skillSet === "object") {
    const skills = [];
    const obj = typeof skillSet.toObject === "function" ? skillSet.toObject() : skillSet;
    
    // Check known category arrays first
    const categories = ["technical", "frameworks", "languages", "tools", "database", "cloud", "devops", "soft", "frontend", "backend"];
    for (const cat of categories) {
      if (Array.isArray(obj[cat])) {
        obj[cat].forEach(item => {
          if (typeof item === "string" && item.trim()) skills.push(item.trim());
        });
      }
    }
    
    // Fallback for general key-value pairs if categories yielded nothing
    if (skills.length === 0) {
      for (const [k, v] of Object.entries(obj)) {
        if (k === "_id") continue;
        if (Array.isArray(v)) {
          v.forEach(item => { if (typeof item === "string" && item.trim()) skills.push(item.trim()); });
        } else if (typeof v === "string" && v.trim()) {
          skills.push(v.trim());
        } else if (v === true && k.trim()) {
          skills.push(k.trim());
        }
      }
    }
    return skills;
  }
  return [];
}

/**
 * Returns role-aligned default skills for standard candidate target roles if profile is sparse.
 */
function getDefaultRoleSkills(targetRole = "") {
  const roleLower = targetRole.toLowerCase();
  if (roleLower.includes("frontend")) {
    return ["React", "TypeScript", "Next.js", "HTML/CSS", "State Management", "REST APIs"];
  }
  if (roleLower.includes("backend")) {
    return ["Node.js", "Express", "REST APIs", "PostgreSQL/MongoDB", "System Architecture", "Authentication & Security"];
  }
  if (roleLower.includes("data") || roleLower.includes("python")) {
    return ["Python", "SQL", "Data Analysis", "Pandas & NumPy", "Machine Learning", "ETL Pipelines"];
  }
  if (roleLower.includes("devops") || roleLower.includes("cloud")) {
    return ["Docker", "Kubernetes", "CI/CD Pipelines", "AWS/GCP", "Terraform", "Linux Systems"];
  }
  // Default Full Stack / Software Engineer
  return ["JavaScript", "TypeScript", "React", "Node.js", "REST APIs", "Database Management"];
}

/**
 * Derives the Skill Gap Lifecycle for a user's skills against their target role.
 * Statuses: NEW | IN_PROGRESS | IMPROVING | RESOLVED | RECURRING
 */
async function computeSkillGapLifecycle(userId, targetRole, profile, resumeContext, pastSessions, unresolvedMistakes, learningProgressList) {
  const possessedSkills = extractSkillsFromSkillSet(profile?.skillsPossessed);
  const targetSkills = extractSkillsFromSkillSet(profile?.skillsTarget);

  const resumeGaps = resumeContext?.missingKeywords || [];
  const mistakeConcepts = unresolvedMistakes.map(m => m.concept);
  const completedModules = learningProgressList.filter(p => p.completed).map(p => p.topic || p.title);
  const activeModules = learningProgressList.filter(p => !p.completed).map(p => p.topic || p.title);

  const allSkillNames = new Set(
    [
      ...targetSkills,
      ...resumeGaps,
      ...mistakeConcepts,
      ...possessedSkills
    ].filter(s => typeof s === "string" && s.trim().length > 0)
  );

  const lifecycle = [];

  for (const skill of allSkillNames) {
    if (!skill || typeof skill !== "string") continue;
    const normSkill = skill.trim();

    const isPossessed = possessedSkills.some(s => (typeof s === "string" ? s : String(s || "")).toLowerCase() === normSkill.toLowerCase());
    const isResumeGap = resumeGaps.some(g => (typeof g === "string" ? g : String(g || "")).toLowerCase() === normSkill.toLowerCase());
    const isMistake = mistakeConcepts.some(m => (typeof m === "string" ? m : String(m || "")).toLowerCase() === normSkill.toLowerCase());
    const isCompletedInRoadmap = completedModules.some(m => (typeof m === "string" ? m : String(m || "")).toLowerCase().includes(normSkill.toLowerCase()));
    const isActiveInRoadmap = activeModules.some(m => (typeof m === "string" ? m : String(m || "")).toLowerCase().includes(normSkill.toLowerCase()));

    let status = "NEW";
    let evidence = "Identified as target role requirement.";

    if (isMistake) {
      const mistakeObj = unresolvedMistakes.find(m => (typeof m.concept === "string" ? m.concept : String(m.concept || "")).toLowerCase() === normSkill.toLowerCase());
      if (mistakeObj && mistakeObj.frequency > 1) {
        status = "RECURRING";
        evidence = `Recurring weakness flagged in ${mistakeObj.frequency} interview sessions.`;
      } else if (isCompletedInRoadmap || isPossessed) {
        status = "IMPROVING";
        evidence = "Identified in previous interview; corresponding roadmap module completed.";
      } else {
        status = "IN_PROGRESS";
        evidence = "Identified as interview weakness; currently being addressed.";
      }
    } else if (isCompletedInRoadmap && isPossessed) {
      status = "RESOLVED";
      evidence = "Skill possessed and roadmap learning module completed.";
    } else if (isPossessed && !isResumeGap) {
      status = "RESOLVED";
      evidence = "Verified skill possessed with no resume gaps.";
    } else if (isActiveInRoadmap || isCompletedInRoadmap) {
      status = "IMPROVING";
      evidence = "Roadmap module active/completed for this skill.";
    } else if (isResumeGap) {
      status = "NEW";
      evidence = "Flagged as missing keyword in ATS resume analysis.";
    }

    lifecycle.push({
      skill: normSkill,
      status,
      isPossessed,
      isResumeGap,
      isInterviewMistake: isMistake,
      evidence
    });
  }

  return lifecycle;
}

/**
 * Builds the complete dynamic Central Brain Career Intelligence DTO.
 * Supports mode = "shareable" (professional recruiter-grade portfolio) vs mode = "private" (internal diagnostic).
 */
async function generateCareerIntelligenceReport(userId, mode = "shareable") {
  const user = await User.findById(userId).select("-password");
  if (!user) throw new Error("User not found");

  const profile = await CareerProfile.findOne({ userId });
  const careerContext = await getCareerContext(userId);
  const targetRole = careerContext.targetRole;
  const careerGoal = profile?.careerGoal || user.goal || "Not available";

  // Fetch Resume & structured version data
  const latestResume = await Resume.findOne({ userId }).sort({ uploadDate: -1 });
  let resumeAnalysis = null;
  let resumeVersion = null;

  if (latestResume) {
    resumeAnalysis = await ResumeAnalysis.findOne({ resumeId: latestResume._id });
    if (latestResume.versions && latestResume.versions.length > 0) {
      resumeVersion = latestResume.versions.find(v => v.versionNumber === latestResume.activeVersionId) || latestResume.versions[0];
    }
  }

  // Extract structured Experience, Projects, Education, Certifications from Resume
  const workExperience = resumeVersion?.workExperience || [];
  const resumeProjects = resumeVersion?.projects || [];
  const educationList = resumeVersion?.education || [];
  const certificationsList = resumeVersion?.certifications || [];
  const personalInfo = resumeVersion?.personalInfo || {};

  // Fetch Developer, GitHub, and Portfolio Project Audit evidence
  const devProfile = await DeveloperProfile.findOne({ userId });
  const GithubRepository = require("../models/GithubRepository");
  const ProjectAudit = require("../models/ProjectAudit");

  const githubRepos = await GithubRepository.find({ userId }).sort({ stars: -1, updatedAt: -1 }).limit(10);
  const projectAudits = await ProjectAudit.find({ userId }).sort({ createdAt: -1 });

  // Combine Resume Projects, GitHub Repositories, and Project Audits for Portfolio Section
  const combinedProjects = [];
  const seenProjectTitles = new Set();

  for (const proj of resumeProjects) {
    if (proj.title && proj.title.trim()) {
      const rawTitle = proj.title.trim();
      const shortTitle = rawTitle.length > 60 ? rawTitle.substring(0, 57) + "..." : rawTitle;
      seenProjectTitles.add(shortTitle.toLowerCase());
      combinedProjects.push({
        name: shortTitle,
        role: profile?.targetRole || "Not available",
        techStack: proj.technologies || [],
        description: proj.description || (proj.bulletPoints ? proj.bulletPoints.join(". ") : rawTitle),
        bulletPoints: proj.bulletPoints || [rawTitle],
        githubUrl: proj.githubUrl || proj.link || "",
        liveUrl: proj.liveUrl || proj.link || "",
        evidence: "Resume Verified Project"
      });
    }
  }

  for (const pa of projectAudits) {
    if (pa.title && !seenProjectTitles.has(pa.title.trim().toLowerCase())) {
      seenProjectTitles.add(pa.title.trim().toLowerCase());
      combinedProjects.push({
        name: pa.title.trim(),
        role: profile?.targetRole || "Not available",
        techStack: pa.projectType ? [pa.projectType] : [],
        description: `Verified project record${pa.projectType ? ` in ${pa.projectType}` : ""}.`,
        bulletPoints: [`Platform: ${pa.deploymentPlatform || "Not available"}`, `Status: ${pa.status || "Not available"}`],
        githubUrl: pa.url || "",
        liveUrl: pa.url || "",
        evidence: "Portfolio Intelligence Verified"
      });
    }
  }

  for (const repo of githubRepos) {
    if (repo.name && !seenProjectTitles.has(repo.name.trim().toLowerCase())) {
      seenProjectTitles.add(repo.name.trim().toLowerCase());
      combinedProjects.push({
        name: repo.name.trim(),
        role: "Not available",
        techStack: repo.topics && repo.topics.length > 0 ? repo.topics : (repo.primaryLanguage ? [repo.primaryLanguage] : []),
        description: repo.description || "GitHub repository record available.",
        bulletPoints: [repo.primaryLanguage && `Primary Language: ${repo.primaryLanguage}`, repo.stars !== undefined && `Stars: ${repo.stars}`].filter(Boolean),
        githubUrl: repo.url || "",
        liveUrl: "",
        evidence: "GitHub Repository Verified"
      });
    }
  }

  // Sanitize raw resume experience entries to prevent blank position/company fields
  const cleanedWorkExperience = workExperience
    .map(exp => {
      const pos = (exp.position && exp.position.trim()) 
        ? exp.position.trim() 
        : "";

      let comp = (exp.company && exp.company.trim() && exp.company.trim() !== pos) 
        ? exp.company.trim() 
        : "";
      
      if (comp.length > 40) comp = comp.substring(0, 37) + "...";

      return {
        company: comp,
        position: pos,
        startDate: exp.startDate || "",
        endDate: exp.endDate || "",
        location: exp.location || "",
        description: exp.description || "",
        bulletPoints: exp.bulletPoints || []
      };
    })
    .filter(exp => exp.position && exp.company);

  const effectiveWorkExperience = cleanedWorkExperience;

  // Fetch Interview History & Extract Technical Topics
  const pastSessions = await InterviewSession.find({ userId }).sort({ createdAt: -1 });
  const completedSessions = pastSessions.filter(s => s.overallScore && s.overallScore > 0);
  const unresolvedMistakes = await InterviewMistake.find({ userId, resolved: false });

  const topicsSet = new Set();
  for (const s of completedSessions) {
    if (s.role) topicsSet.add(`${s.role} Technical Assessment`);
    if (s.type) topicsSet.add(`${s.type} Core Concepts`);
    if (Array.isArray(s.questions)) {
      for (const q of s.questions) {
        if (q.questionText) {
          const qLower = q.questionText.toLowerCase();
          if (qLower.includes("react")) topicsSet.add("React & Component Architecture");
          else if (qLower.includes("node")) topicsSet.add("Node.js & Runtime Execution");
          else if (qLower.includes("api") || qLower.includes("rest") || qLower.includes("http")) topicsSet.add("REST API Design & Protocols");
          else if (qLower.includes("database") || qLower.includes("sql") || qLower.includes("mongo")) topicsSet.add("Database Schema & Optimization");
          else if (qLower.includes("state")) topicsSet.add("Application State Management");
          else if (qLower.includes("security") || qLower.includes("auth") || qLower.includes("jwt")) topicsSet.add("Security & Authentication");
          else if (qLower.includes("async") || qLower.includes("promise")) topicsSet.add("Asynchronous Programming & Event Loop");
          else {
            const topicPhrase = q.questionText.split(" ").slice(0, 4).join(" ");
            if (topicPhrase.length > 5) topicsSet.add(topicPhrase);
          }
        }
      }
    }
  }

  const topicsArray = Array.from(topicsSet);

  let interviewMetrics = {
    completedCount: completedSessions.length,
    averageScore: null,
    latestScore: null,
    technicalScore: null,
    communicationScore: null,
    problemSolvingScore: null,
    confidenceScore: null,
    repeatingMistakes: unresolvedMistakes.map(m => m.concept),
    topicsCovered: topicsArray,
    statusText: completedSessions.length > 0 ? `${completedSessions.length} interview assessment(s) completed across key technical topics.` : "Interview development tracking active."
  };

  if (completedSessions.length > 0) {
    const total = completedSessions.reduce((acc, s) => acc + s.overallScore, 0);
    interviewMetrics.averageScore = Math.round(total / completedSessions.length);
    interviewMetrics.latestScore = completedSessions[0].overallScore;

    const techSum = completedSessions.reduce((acc, s) => acc + (s.technicalScore || s.overallScore), 0);
    const commSum = completedSessions.reduce((acc, s) => acc + (s.communicationScore || s.overallScore), 0);
    const probSum = completedSessions.reduce((acc, s) => acc + (s.problemSolvingScore || s.overallScore), 0);
    const confSum = completedSessions.reduce((acc, s) => acc + (s.confidenceScore || s.overallScore), 0);

    interviewMetrics.technicalScore = Math.round(techSum / completedSessions.length);
    interviewMetrics.communicationScore = Math.round(commSum / completedSessions.length);
    interviewMetrics.problemSolvingScore = Math.round(probSum / completedSessions.length);
    interviewMetrics.confidenceScore = Math.round(confSum / completedSessions.length);
  }

  // Fetch Roadmap & Learning Progress
  // Roadmap does not currently have an isArchived field. Querying for
  // `isArchived: false` excludes every document where the field is absent,
  // which made valid roadmaps disappear from the report.
  const roadmap = await Roadmap.findOne({ userId });
  const learningProgressList = await LearningProgress.find({ userId });
  const completedModules = learningProgressList.filter(p => p.completed);

  const roadmapModuleCount = (roadmap?.modules || []).reduce(
    (count, module) => count + (module.subSkills?.length || 0),
    0
  );
  const roadmapCompletedCount = completedModules.length;
  const calculatedRoadmapProgress = roadmapModuleCount > 0
    ? Math.round((roadmapCompletedCount / roadmapModuleCount) * 100)
    : 0;

  const roadmapMetrics = {
    hasRoadmap: !!roadmap,
    completionPercentage: calculatedRoadmapProgress,
    completedModulesCount: roadmapCompletedCount,
    totalModulesCount: roadmapModuleCount || roadmapCompletedCount,
    streak: user.streakDays || 0,
    modules: roadmap?.modules || []
  };

  // Fetch Applications
  const applications = await JobApplication.find({ userId });

  // Calculate Real-Time Career Score
  const scoreInput = {
    hasResumeScanned: !!resumeAnalysis,
    hasGithubScanned: !!devProfile,
    projectsCount: devProfile?.repositoryCount || combinedProjects.length,
    skillsCount: Object.keys(profile?.skillsPossessed || {}).length,
    roadmapAverageProgress: roadmapMetrics.completionPercentage,
    applicationsCount: applications.length,
    masteredQuestionsCount: interviewMetrics.completedCount,
    streakDays: user.streakDays || 0
  };
  const careerScoreObj = calculateCareerScore(scoreInput);

  // Calculate Real-Time Job Readiness
  const readinessInput = {
    careerScore: careerScoreObj.score,
    hasResumeScanned: !!resumeAnalysis,
    resumeScore: resumeAnalysis?.atsScore || 0,
    hasGithubScanned: !!devProfile,
    projectsCount: devProfile?.repositoryCount || combinedProjects.length,
    interviewScore: interviewMetrics.averageScore,
    masteredQuestionsCount: interviewMetrics.completedCount
  };
  const readinessObj = calculateReadiness(readinessInput);

  // Compute Historical Growth Deltas
  const latestSnapshot = await AnalyticsSnapshot.findOne({ userId }).sort({ createdAt: -1 });
  let growthMetrics = {
    previousScore: null,
    currentScore: careerScoreObj.score,
    weeklyGrowth: 0,
    monthlyGrowth: 0,
    growthText: latestSnapshot ? `Score updated based on recent activity.` : "Initial baseline established."
  };

  if (latestSnapshot && latestSnapshot.careerScore !== undefined) {
    growthMetrics.previousScore = latestSnapshot.careerScore;
    const delta = careerScoreObj.score - latestSnapshot.careerScore;
    growthMetrics.weeklyGrowth = delta;
    growthMetrics.growthText = delta >= 0 ? `+${delta} pts from previous baseline.` : `${delta} pts change.`;
  }

  // Skill Gap Lifecycle
  const gapLifecycle = await computeSkillGapLifecycle(
    userId, 
    targetRole, 
    profile, 
    careerContext.resumeContext, 
    completedSessions, 
    unresolvedMistakes, 
    learningProgressList
  );

  // Next Best Action
  const nextActions = await computeNextBestAction(careerContext);

  // AI Executive Summary
  let executiveSummary = "";
  try {
    const prompt = `Synthesize a professional, recruiter-facing Career Growth Summary for candidate ${user.name} targeting the role of "${targetRole}".
Candidate Goal: ${careerGoal}.
Projects: ${combinedProjects.length > 0 ? combinedProjects.map(p => p.name).join(", ") : "No verified projects available"}
Experience: ${workExperience.length > 0 ? workExperience.map(e => `${e.position} at ${e.company}`).join(", ") : "No verified professional experience available"}

Requirements:
1. Write 2 concise, factual, highly professional paragraphs detailing: Current Career Direction -> Core Technical Focus -> Major Demonstrated Projects -> Professional Development.
2. Refer explicitly to the target role "${targetRole}".
3. Do NOT use generic AI fluff or self-praise phrases like "demonstrates proactive determination".
4. Use gender-neutral language only. Refer to the person as "the candidate" or "the professional"; never use he, his, him, she, her, or hers.
5. Do NOT make claims that are not supported by the supplied CareerOS data. If data is missing, say that it is not available.
6. Do NOT output markdown symbols like asterisks (**), headers (###), or horizontal rules (---). Plain text only.`;

    executiveSummary = await generateAiContent(
      prompt,
      "You are a Principal Executive Recruiter and Technical Architect. Write concise, factual, professional paragraphs without raw markdown tags.",
      false
    );
  } catch (aiErr) {
    console.error("AI Summary generation error:", aiErr.message);
  }

  // Clean raw markdown
  if (executiveSummary) {
    executiveSummary = executiveSummary
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .replace(/\*(.*?)\*/g, "$1")
      .replace(/^#+\s*/gm, "")
      .replace(/^---\s*$/gm, "")
      .replace(/`/g, "")
      .replace(/\b(he|she|him)\b/gi, "the candidate")
      .replace(/\b(his|her|hers)\b/gi, "the candidate's")
      .trim();
  }

  if (!executiveSummary || executiveSummary.trim().length === 0) {
    executiveSummary = `The candidate is targeting the role of ${targetRole} with the stated career goal of ${careerGoal}. Verified projects, professional experience, and capability evidence are included only where available in CareerOS.\n\nNo additional professional claims are made where supporting CareerOS data is unavailable.`;
  }

  // Build Technology & Capability Matrix (Grouped)
  const skillsMatrix = {
    frontend: [],
    backend: [],
    engineering: [],
    database: [],
    languages: []
  };

  const resumeSkills = resumeVersion?.skills || {};
  const possessedObj = profile?.skillsPossessed ? (typeof profile.skillsPossessed.toObject === "function" ? profile.skillsPossessed.toObject() : profile.skillsPossessed) : {};

  const addSkillToMatrix = (category, name, level = "Working Knowledge", evidence = ["CareerOS Context"]) => {
    if (!name || typeof name !== "string") return;
    const cleanName = name.trim();
    if (!cleanName) return;
    const list = skillsMatrix[category] || skillsMatrix.engineering;
    if (!list.some(s => s.name.toLowerCase() === cleanName.toLowerCase())) {
      list.push({ name: cleanName, level, evidence: Array.isArray(evidence) ? evidence : [evidence] });
    }
  };

  // Populate from Resume Skills
  if (Array.isArray(resumeSkills.frontend)) resumeSkills.frontend.forEach(s => addSkillToMatrix("frontend", s, "Strong", ["Resume", "Projects"]));
  if (Array.isArray(resumeSkills.backend)) resumeSkills.backend.forEach(s => addSkillToMatrix("backend", s, "Strong", ["Resume", "Backend"]));
  if (Array.isArray(resumeSkills.database)) resumeSkills.database.forEach(s => addSkillToMatrix("database", s, "Strong", ["Resume", "Database"]));
  if (Array.isArray(resumeSkills.languages)) resumeSkills.languages.forEach(s => addSkillToMatrix("languages", s, "Strong", ["Resume", "GitHub"]));
  if (Array.isArray(resumeSkills.tools)) resumeSkills.tools.forEach(s => addSkillToMatrix("engineering", s, "Working Knowledge", ["Resume", "Tools"]));
  if (Array.isArray(resumeSkills.other)) resumeSkills.other.forEach(s => addSkillToMatrix("engineering", s, "Working Knowledge", ["Resume"]));

  // Populate from Career Profile possessed skills
  if (Array.isArray(possessedObj.frameworks)) possessedObj.frameworks.forEach(s => addSkillToMatrix("frontend", s, "Verified", ["Career Profile"]));
  if (Array.isArray(possessedObj.technical)) possessedObj.technical.forEach(s => addSkillToMatrix("engineering", s, "Verified", ["Career Profile"]));
  if (Array.isArray(possessedObj.languages)) possessedObj.languages.forEach(s => addSkillToMatrix("languages", s, "Verified", ["Career Profile"]));
  if (Array.isArray(possessedObj.tools)) possessedObj.tools.forEach(s => addSkillToMatrix("engineering", s, "Verified", ["Career Profile"]));
  if (Array.isArray(possessedObj.database)) possessedObj.database.forEach(s => addSkillToMatrix("database", s, "Verified", ["Career Profile"]));
  if (Array.isArray(possessedObj.cloud) || Array.isArray(possessedObj.devops)) {
    [...(possessedObj.cloud || []), ...(possessedObj.devops || [])].forEach(s => addSkillToMatrix("engineering", s, "Verified", ["Career Profile"]));
  }

  // Build Career Trajectory Visual Timeline
  const currentRole = effectiveWorkExperience[0]?.position || "Not available";
  const trajectoryTimeline = [
    educationList.length > 0 && { title: "Education", detail: `${educationList[0].degree || "Qualification"} at ${educationList[0].institution || "Institution not available"}` },
    skillsMatrix.languages.length > 0 && { title: "Verified capabilities", detail: skillsMatrix.languages.map(s => s.name).slice(0, 3).join(", ") },
    combinedProjects.length > 0 && { title: "Verified projects", detail: `${combinedProjects.length} project record(s)` },
    effectiveWorkExperience.length > 0 && { title: "Verified experience", detail: `${effectiveWorkExperience.length} experience record(s)` },
    interviewMetrics.completedCount > 0 && { title: "Interview validation", detail: `${interviewMetrics.completedCount} completed assessment(s)` },
    { title: "Target role", detail: `${targetRole} — ${careerGoal}` }
  ].filter(Boolean);

  // Build Shareable Growth Lifecycles
  const shareableLifecycles = gapLifecycle.map(buildShareableGrowthLifecycle);

  // Compute Confidence Contributors Breakdown
  const totalMatrixSkills = Object.values(skillsMatrix).flat().length;
  const confidenceContributors = {
    interviewPerformance: interviewMetrics.confidenceScore || (interviewMetrics.completedCount > 0 ? Math.min(100, interviewMetrics.averageScore || 70) : 60),
    projectEvidence: combinedProjects.length > 0 ? Math.min(100, combinedProjects.length * 25) : 35,
    skillEvidence: totalMatrixSkills > 0 ? Math.min(100, totalMatrixSkills * 10) : 45,
    learningConsistency: user.streakDays ? Math.min(100, user.streakDays * 15 + 30) : 40
  };

  const calculatedConfidence = Math.round(
    (confidenceContributors.interviewPerformance * 0.35) +
    (confidenceContributors.projectEvidence * 0.25) +
    (confidenceContributors.skillEvidence * 0.25) +
    (confidenceContributors.learningConsistency * 0.15)
  );

  const reportDTO = {
    mode,
    userId: user._id.toString(),
    candidateName: user.name,
    candidateEmail: mode === "shareable" ? undefined : user.email,
    personalInfo: {
      githubUrl: personalInfo.githubUrl || profile?.githubUrl || user.githubUrl || "",
      linkedinUrl: personalInfo.linkedinUrl || profile?.linkedinUrl || "",
      portfolioUrl: personalInfo.portfolioUrl || profile?.portfolioUrl || ""
    },
    targetRole,
    currentRole,
    careerGoal,
    experienceLevel: profile?.experienceLevel || user.experience || "Intermediate",
    generatedAt: new Date().toISOString(),
    reportPeriod: `${new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toLocaleDateString()} – ${new Date().toLocaleDateString()}`,
    
    // Core Scores
    careerScore: careerScoreObj.score,
    scoreBreakdown: mode === "private" ? careerScoreObj.breakdown : undefined,
    jobReadiness: readinessObj.jobReadiness,
    recommendationLevel: readinessObj.recommendation,
    confidence: calculatedConfidence,
    confidenceContributors,
    
    // Growth
    growth: growthMetrics,
    
    // Sections for Shareable Report
    executiveSummary,
    currentFocusAreas: [
      "Frontend Architecture & Modern Web UI",
      "Backend API Engineering & Database Optimization",
      "AI-Powered Application Integration",
      "Production Security & Authentication Practices"
    ],
    careerDirectionVisual: [
      "Current Development",
      currentRole,
      targetRole,
      careerGoal
    ],
    skillsMatrix,
    projects: combinedProjects,
    workExperience: effectiveWorkExperience,
    education: educationList,
    certifications: certificationsList,
    shareableLifecycles,
    trajectoryTimeline,
    
    // Private Diagnostics
    skillGapLifecycle: gapLifecycle,
    resumeIntelligence: {
      atsScore: resumeAnalysis?.atsScore || 0,
      missingKeywords: resumeAnalysis?.missingKeywords || [],
      identifiedSkills: resumeAnalysis?.identifiedSkills || [],
      statusText: resumeAnalysis ? "Resume scanned and analyzed." : "No resume scanned yet."
    },
    
    interviewIntelligence: interviewMetrics,
    roadmapIntelligence: roadmapMetrics,
    projectIntelligence: {
      count: devProfile?.repositoryCount || combinedProjects.length,
      overallHealth: devProfile?.overallHealth || 0,
      missingPractices: devProfile?.missingPractices || [],
      languages: devProfile?.languageDistribution || {}
    },
    
    nextBestActions: nextActions
  };

  return reportDTO;
}

/**
 * Generates and saves a timestamped snapshot of the Career Report.
 */
async function createCareerReportSnapshot(userId, mode = "shareable", title = "") {
  const reportDTO = await generateCareerIntelligenceReport(userId, mode);

  // Determine version number
  const count = await CareerReportSnapshot.countDocuments({ userId, mode });
  const versionNumber = count + 1;
  const snapshotTitle = title || `Career Report v${versionNumber} (${reportDTO.targetRole})`;

  const snapshot = new CareerReportSnapshot({
    userId,
    targetRole: reportDTO.targetRole,
    careerGoal: reportDTO.careerGoal,
    careerScore: reportDTO.careerScore,
    jobReadiness: reportDTO.jobReadiness,
    confidence: reportDTO.confidence,
    weeklyGrowth: reportDTO.growth.weeklyGrowth,
    monthlyGrowth: reportDTO.growth.monthlyGrowth,
    versionNumber,
    mode,
    title: snapshotTitle,
    snapshotData: reportDTO,
    generatedAt: new Date()
  });

  await snapshot.save();
  return { snapshot, reportDTO };
}

module.exports = {
  generateCareerIntelligenceReport,
  createCareerReportSnapshot,
  computeSkillGapLifecycle
};

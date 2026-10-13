const { getCareerContext, resolveCareerGoal } = require("./careerContext.service");
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
const JobOpportunity = require("../models/JobOpportunity");
const AnalyticsSnapshot = require("../models/AnalyticsSnapshot");
const CareerEvent = require("../models/CareerEvent");
const CareerReportSnapshot = require("../models/CareerReportSnapshot");
const CareerAiSummary = require("../models/CareerAiSummary");

const { calculateCareerScore } = require("../engines/careerScore.engine");
const { calculateReadiness } = require("../engines/readiness.engine");
const { calculateConfidenceScore } = require("../engines/confidence.engine");
const { groundedFallbackActions } = require("../engines/nextBestAction.engine");
const { generateAiContent } = require("../config/ai");

/**
 * Helper to count flat skills in segmented structure.
 */
function getSkillsCount(skillsObj) {
  if (!skillsObj) return 0;
  const obj = typeof skillsObj.toObject === "function" ? skillsObj.toObject() : skillsObj;
  return [
    ...(obj.technical || []),
    ...(obj.soft || []),
    ...(obj.tools || []),
    ...(obj.frameworks || []),
    ...(obj.languages || []),
    ...(obj.cloud || []),
    ...(obj.devops || []),
    ...(obj.database || [])
  ].length;
}

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
  // Independent persisted reads run together; report reads never invoke AI.
  const GithubRepository = require("../models/GithubRepository");
  const ProjectAudit = require("../models/ProjectAudit");
  const [user, profile, latestResume, resumeAnalysis, devProfile, githubRepos,
    projectAudits, pastSessions, unresolvedMistakes, roadmap, learningProgressList,
    applicationCount, opportunityCount, latestSnapshot, latestAiSummary] = await Promise.all([
    User.findById(userId).select("-passwordHash").lean(),
    CareerProfile.findOne({ userId }).lean(),
    Resume.findOne({ userId }).sort({ uploadDate: -1 }).lean(),
    ResumeAnalysis.findOne({ userId }).sort({ analyzedAt: -1 }).lean(),
    DeveloperProfile.findOne({ userId }).lean(),
    GithubRepository.find({ userId }).sort({ stars: -1, updatedAt: -1 }).limit(10).lean(),
    ProjectAudit.find({ userId }).sort({ createdAt: -1 }).lean(),
    InterviewSession.find({ userId }).sort({ createdAt: -1 }).lean(),
    InterviewMistake.find({ userId, resolved: false }).lean(),
    Roadmap.findOne({ userId }).lean(),
    LearningProgress.find({ userId }).lean(),
    JobApplication.countDocuments({ userId }),
    JobOpportunity.countDocuments({ userId }),
    AnalyticsSnapshot.findOne({ userId }).sort({ createdAt: -1 }).lean(),
    CareerAiSummary.findOne({ userId }).sort({ createdAt: -1 }).lean()
  ]);
  if (!user) throw new Error("User not found");
  const targetRole = profile?.targetRole || user.role || "Software Engineer";
  const missingKeywords = (resumeAnalysis?.missingKeywords || [])
    .map(item => typeof item === "string" ? item : item.keyword)
    .filter(item => typeof item === "string" && item.trim());
  const resumeContext = resumeAnalysis ? { ...resumeAnalysis, missingKeywords } : null;

  const rawGoal = (profile?.careerGoal && profile.careerGoal.trim()) || (user?.goal && user.goal.trim());
  const careerGoal = (rawGoal && rawGoal !== "Not available") ? rawGoal : "Career goal not configured";

  // Fetch Resume & structured version data
  let resumeVersion = null;

  if (latestResume) {
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
  // Helper to resolve project role without falling back to "Not available"
  const resolveProjectRole = (projRole, projTech = []) => {
    if (projRole && typeof projRole === "string" && projRole.trim() && projRole.trim() !== "Not available") {
      return projRole.trim();
    }
    if (profile?.targetRole && typeof profile.targetRole === "string" && profile.targetRole.trim() && profile.targetRole.trim() !== "Not available") {
      return profile.targetRole.trim();
    }
    if (targetRole && typeof targetRole === "string" && targetRole.trim() && targetRole.trim() !== "Not available") {
      return targetRole.trim();
    }
    if (user?.role && typeof user.role === "string" && user.role.trim() && user.role.trim() !== "Not available") {
      return user.role.trim();
    }
    const stackStr = (Array.isArray(projTech) ? projTech.join(" ") : String(projTech)).toLowerCase();
    if (stackStr.includes("react") || stackStr.includes("node") || stackStr.includes("express") || stackStr.includes("mongo")) {
      return "Full Stack Developer";
    }
    if (stackStr.includes("python") || stackStr.includes("sql") || stackStr.includes("api") || stackStr.includes("backend")) {
      return "Backend Developer";
    }
    if (stackStr.includes("frontend") || stackStr.includes("css") || stackStr.includes("html") || stackStr.includes("vue")) {
      return "Frontend Developer";
    }
    return "Software Developer";
  };

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
        role: resolveProjectRole(proj.role || proj.position, proj.technologies),
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
        role: resolveProjectRole(pa.role, pa.projectType ? [pa.projectType] : []),
        techStack: pa.projectType ? [pa.projectType] : [],
        description: `Verified project record${pa.projectType ? ` in ${pa.projectType}` : ""}.`,
        bulletPoints: [
          pa.deploymentPlatform ? `Platform: ${pa.deploymentPlatform}` : null,
          pa.status ? `Status: ${pa.status}` : null
        ].filter(Boolean),
        githubUrl: pa.url || "",
        liveUrl: pa.url || "",
        evidence: "Portfolio Intelligence Verified"
      });
    }
  }

  for (const repo of githubRepos) {
    if (repo.name && !seenProjectTitles.has(repo.name.trim().toLowerCase())) {
      seenProjectTitles.add(repo.name.trim().toLowerCase());
      const tech = repo.topics && repo.topics.length > 0 ? repo.topics : (repo.primaryLanguage ? [repo.primaryLanguage] : []);
      combinedProjects.push({
        name: repo.name.trim(),
        role: resolveProjectRole(null, tech),
        techStack: tech,
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
  const completedSessions = pastSessions.filter(s => s.overallScore && s.overallScore > 0);

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
    statusText: completedSessions.length > 0
      ? `${completedSessions.length} interview assessment(s) completed across key technical topics.`
      : "No completed interviews yet. Complete your first interview to establish an interview-performance baseline."
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
  const roadmapSkills = (roadmap?.modules || []).flatMap(module => module.subSkills || []);
  const roadmapSkillIds = new Set(roadmapSkills.map(skill => skill.id));
  const completedModules = learningProgressList.filter(p => p.completed && roadmapSkillIds.has(p.subSkillId));

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

  // Combine JobApplication and JobOpportunity counts for application parity across services
  const applicationsCount = applicationCount + opportunityCount;
  const skillsCount = getSkillsCount(profile?.skillsPossessed) || extractSkillsFromSkillSet(profile?.skillsPossessed).length;

  // Calculate Real-Time Career Score using authoritative engine
  const scoreInput = {
    hasResumeScanned: !!resumeAnalysis || !!user.hasResumeScanned,
    hasGithubScanned: !!user.hasGithubScanned,
    projectsCount: user.projectsCount || 0,
    skillsCount,
    roadmapAverageProgress: roadmapMetrics.completionPercentage,
    applicationsCount,
    masteredQuestionsCount: Math.max(user.masteredQuestionsCount || 0, completedSessions.length * 3),
    streakDays: user.streakDays || 0
  };
  const careerScoreObj = calculateCareerScore(scoreInput);

  // Calculate Real-Time Job Readiness using authoritative engine
  const readinessInput = {
    careerScore: careerScoreObj.score,
    hasResumeScanned: !!resumeAnalysis || !!user.hasResumeScanned,
    resumeScore: resumeAnalysis?.atsScore || 0,
    hasGithubScanned: !!user.hasGithubScanned,
    projectsCount: user.projectsCount || 0,
    interviewScore: interviewMetrics.averageScore,
    masteredQuestionsCount: user.masteredQuestionsCount || 0
  };
  const readinessObj = calculateReadiness(readinessInput);

  // Compute Historical Growth Deltas
  let growthMetrics = {
    previousScore: null,
    currentScore: careerScoreObj.score,
    weeklyGrowth: 0,
    monthlyGrowth: 0,
    growthText: latestSnapshot ? `Score updated based on recent activity.` : "Initial baseline established. Future reports will show measurable growth from this baseline."
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
    resumeContext,
    completedSessions,
    unresolvedMistakes,
    learningProgressList.map(progress => ({
      ...progress,
      title: roadmapSkills.find(skill => skill.id === progress.subSkillId)?.title || ""
    }))
  );

  // Next Best Action
  const nextActions = groundedFallbackActions({
    targetRole, resumeContext, devContext: devProfile,
    interviewContext: { ...interviewMetrics, repeatingMistakes: unresolvedMistakes }
  });

  // Fetch last persisted AI summary and check staleness against live parameters
  const experienceLevel = profile?.experienceLevel || user.experience || "Intermediate";

  let aiSummaryObj = {
    content: null,
    status: "NONE",
    generatedAt: null,
    versionNumber: 0,
    targetRole: null,
    careerGoal: null
  };

  if (latestAiSummary) {
    const isTargetRoleChanged = latestAiSummary.targetRole && latestAiSummary.targetRole !== targetRole;
    const isGoalChanged = latestAiSummary.careerGoal !== undefined && latestAiSummary.careerGoal !== careerGoal;
    const isExperienceChanged = latestAiSummary.experienceLevel && latestAiSummary.experienceLevel !== experienceLevel;

    const isStale = latestAiSummary.status === "STALE" || isTargetRoleChanged || isGoalChanged || isExperienceChanged;

    aiSummaryObj = {
      content: latestAiSummary.content,
      status: isStale ? "STALE" : "CURRENT",
      generatedAt: latestAiSummary.generatedAt || latestAiSummary.createdAt,
      versionNumber: latestAiSummary.versionNumber || 1,
      targetRole: latestAiSummary.targetRole,
      careerGoal: latestAiSummary.careerGoal
    };
  }

  const executiveSummary = aiSummaryObj.content || `The candidate is targeting the role of ${targetRole} with the stated career goal of ${careerGoal}. Verified projects, professional experience, and capability evidence are included only where available in CareerOS.\n\nNo additional professional claims are made where supporting CareerOS data is unavailable.`;

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

  // Build Career Trajectory Visual Timeline & Remove Missing Stage Fallbacks
  const currentRole = effectiveWorkExperience[0]?.position || null;

  const trajectoryTimeline = [
    educationList.length > 0 && { title: "Education", detail: `${educationList[0].degree || "Qualification"}${educationList[0].institution ? ` at ${educationList[0].institution}` : ""}` },
    skillsMatrix.languages.length > 0 && { title: "Verified capabilities", detail: skillsMatrix.languages.map(s => s.name).slice(0, 3).join(", ") },
    combinedProjects.length > 0 && { title: "Verified projects", detail: `${combinedProjects.length} project record(s)` },
    effectiveWorkExperience.length > 0 && { title: "Verified experience", detail: `${effectiveWorkExperience.length} experience record(s)` },
    interviewMetrics.completedCount > 0 && { title: "Interview validation", detail: `${interviewMetrics.completedCount} completed assessment(s)` },
    { title: "Target role", detail: careerGoal !== "Career goal not configured" ? `${targetRole} — ${careerGoal}` : targetRole }
  ].filter(Boolean);

  // Build Shareable Growth Lifecycles
  const shareableLifecycles = gapLifecycle.map(buildShareableGrowthLifecycle);

  // Compute Confidence Score using authoritative Confidence Engine
  const totalMatrixSkills = Object.values(skillsMatrix).flat().length;
  const confidenceObj = calculateConfidenceScore({
    interviewMetrics,
    projectsCount: combinedProjects.length,
    totalSkillsCount: totalMatrixSkills,
    streakDays: user.streakDays || 0
  });

  const reportDTO = {
    mode,
    userId: user._id.toString(),
    candidateName: personalInfo.name || user.name,
    candidateEmail: mode === "shareable" ? undefined : user.email,
    personalInfo: {
      githubUrl: personalInfo.githubUrl || profile?.githubUrl || user.githubUrl || "",
      linkedinUrl: personalInfo.linkedinUrl || profile?.linkedinUrl || "",
      portfolioUrl: personalInfo.portfolioUrl || profile?.portfolioUrl || ""
    },
    targetRole,
    currentRole: currentRole || "Career Context Active",
    careerGoal,
    experienceLevel: profile?.experienceLevel || user.experience || "Intermediate",
    generatedAt: new Date().toISOString(),
    reportPeriod: `${new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toLocaleDateString()} – ${new Date().toLocaleDateString()}`,

    // Core Scores
    careerScore: careerScoreObj.score,
    scoreBreakdown: mode === "private" ? careerScoreObj.breakdown : undefined,
    jobReadiness: readinessObj.jobReadiness,
    recommendationLevel: readinessObj.recommendation,
    confidence: confidenceObj.confidence,
    confidenceContributors: confidenceObj.contributors,

    // Growth
    growth: growthMetrics,

    // Sections for Shareable Report
    executiveSummary,
    aiSummary: aiSummaryObj,
    currentFocusAreas: [
      "Frontend Architecture & Modern Web UI",
      "Backend API Engineering & Database Optimization",
      "AI-Powered Application Integration",
      "Production Security & Authentication Practices"
    ],
    careerDirectionVisual: [
      "Current Development",
      (currentRole && currentRole !== "Not available" && currentRole !== "Career Context Active") ? currentRole : null,
      (targetRole && targetRole !== currentRole && targetRole !== "Not available") ? targetRole : null,
      (careerGoal && careerGoal !== "Career goal not configured" && careerGoal !== "Not available") ? careerGoal : null
    ].filter(step => step && typeof step === "string" && step.trim() !== "" && step.trim() !== "Not available" && step.trim() !== "Career goal not configured"),
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
      missingKeywords,
      identifiedSkills: [...new Set(Object.values(resumeSkills).flat().filter(skill => typeof skill === "string"))],
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

// In-memory locks to prevent concurrent duplicate AI summary generations per candidate
const activeGenerations = new Set();

/**
 * Explicitly generates a new AI Executive Summary for a candidate and persists it.
 */
async function generateAiExecutiveSummary(userId) {
  const userIdStr = userId.toString();
  if (activeGenerations.has(userIdStr)) {
    throw new Error("AI Summary generation is already in progress for this candidate.");
  }

  activeGenerations.add(userIdStr);

  try {
    const user = await User.findById(userId).select("-password");
    if (!user) throw new Error("User not found");

    const profile = await CareerProfile.findOne({ userId });
    const careerContext = await getCareerContext(userId);
    const targetRole = careerContext.targetRole;
    const careerGoal = resolveCareerGoal(profile?.careerGoal, user?.goal, targetRole);
    const experienceLevel = profile?.experienceLevel || user.experience || "Intermediate";

    const latestResume = await Resume.findOne({ userId }).sort({ uploadDate: -1 });
    let resumeVersion = null;
    if (latestResume && latestResume.versions && latestResume.versions.length > 0) {
      resumeVersion = latestResume.versions.find(v => v.versionNumber === latestResume.activeVersionId) || latestResume.versions[0];
    }
    const workExperience = resumeVersion?.workExperience || [];
    const resumeProjects = resumeVersion?.projects || [];

    const prompt = `Synthesize a professional, recruiter-facing Career Growth Summary for candidate ${user.name} targeting the role of "${targetRole}".
Candidate Goal: ${careerGoal}.
Experience Level: ${experienceLevel}.
Projects: ${resumeProjects.length > 0 ? resumeProjects.map(p => p.title || p.name).join(", ") : "No verified projects available"}
Experience: ${workExperience.length > 0 ? workExperience.map(e => `${e.position} at ${e.company}`).join(", ") : "No verified professional experience available"}

Requirements:
1. Write 2 concise, factual, highly professional paragraphs detailing: Current Career Direction -> Core Technical Focus -> Major Demonstrated Projects -> Professional Development.
2. Refer explicitly to the target role "${targetRole}".
3. Do NOT use generic AI fluff or self-praise phrases like "demonstrates proactive determination".
4. Use gender-neutral language only. Refer to the person as "the candidate" or "the professional"; never use he, his, him, she, her, or hers.
5. Do NOT make claims that are not supported by the supplied CareerOS data. If data is missing, say that it is not available.
6. Do NOT output markdown symbols like asterisks (**), headers (###), or horizontal rules (---). Plain text only.`;

    let content = await generateAiContent(
      prompt,
      "You are a Principal Executive Recruiter and Technical Architect. Write concise, factual, professional paragraphs without raw markdown tags.",
      false
    );

    if (content) {
      content = content
        .replace(/\*\*(.*?)\*\*/g, "$1")
        .replace(/\*(.*?)\*/g, "$1")
        .replace(/^#+\s*/gm, "")
        .replace(/^---\s*$/gm, "")
        .replace(/`/g, "")
        .replace(/\b(he|she|him)\b/gi, "the candidate")
        .replace(/\b(his|her|hers)\b/gi, "the candidate's")
        .trim();
    }

    if (!content || content.trim().length === 0) {
      content = `The candidate is targeting the role of ${targetRole} with the stated career goal of ${careerGoal}. Verified projects, professional experience, and capability evidence are included only where available in CareerOS.\n\nNo additional professional claims are made where supporting CareerOS data is unavailable.`;
    }

    // Mark previous summaries for this user as STALE
    await CareerAiSummary.updateMany({ userId }, { status: "STALE" });

    // Determine next version number
    const count = await CareerAiSummary.countDocuments({ userId });
    const versionNumber = count + 1;

    // Save new AI summary
    const aiSummary = new CareerAiSummary({
      userId,
      content,
      targetRole,
      careerGoal,
      experienceLevel,
      versionNumber,
      status: "CURRENT",
      generatedAt: new Date()
    });

    await aiSummary.save();

    return {
      content: aiSummary.content,
      status: "CURRENT",
      generatedAt: aiSummary.generatedAt,
      versionNumber: aiSummary.versionNumber,
      targetRole: aiSummary.targetRole,
      careerGoal: aiSummary.careerGoal
    };
  } finally {
    activeGenerations.delete(userIdStr);
  }
}

module.exports = {
  generateCareerIntelligenceReport,
  generateAiExecutiveSummary,
  createCareerReportSnapshot,
  computeSkillGapLifecycle
};

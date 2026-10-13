/**
 * Skill Gap Engine 2.0 - Evidence-Based Requirement & Gap Analysis
 */

const ROLE_REQUIREMENTS = {
  "Full Stack Developer": [
    { id: "req-ts", name: "TypeScript", category: "Technical", requiredLevel: "Intermediate", effort: "15 hours", dependencies: ["JavaScript"] },
    { id: "req-react", name: "React", category: "Technical", requiredLevel: "Advanced", effort: "20 hours", dependencies: ["JavaScript", "HTML/CSS"] },
    { id: "req-node", name: "Node.js", category: "Technical", requiredLevel: "Intermediate", effort: "15 hours", dependencies: ["JavaScript"] },
    { id: "req-express", name: "Express", category: "Technical", requiredLevel: "Intermediate", effort: "10 hours", dependencies: ["Node.js"] },
    { id: "req-rest", name: "REST APIs", category: "Technical", requiredLevel: "Advanced", effort: "10 hours", dependencies: [] },
    { id: "req-mongo", name: "MongoDB", category: "Technical", requiredLevel: "Intermediate", effort: "12 hours", dependencies: [] },
    { id: "req-sql", name: "SQL", category: "Technical", requiredLevel: "Intermediate", effort: "15 hours", dependencies: [] },
    { id: "req-docker", name: "Docker", category: "Practical", requiredLevel: "Intermediate", effort: "12 hours", dependencies: [] },
    { id: "req-testing", name: "Unit & Integration Testing", category: "Practical", requiredLevel: "Intermediate", effort: "15 hours", dependencies: [] },
    { id: "req-deploy", name: "Production Deployment & CI/CD", category: "Practical", requiredLevel: "Intermediate", effort: "10 hours", dependencies: ["Docker"] },
    { id: "req-arch", name: "System Architecture", category: "Interview", requiredLevel: "Intermediate", effort: "25 hours", dependencies: ["REST APIs", "SQL"] },
    { id: "req-dsa", name: "Data Structures & Algorithms", category: "Interview", requiredLevel: "Intermediate", effort: "30 hours", dependencies: [] },
    { id: "req-comm", name: "Technical Communication", category: "Professional", requiredLevel: "Intermediate", effort: "10 hours", dependencies: [] }
  ],
  "Frontend Developer": [
    { id: "req-js", name: "JavaScript", category: "Technical", requiredLevel: "Advanced", effort: "20 hours", dependencies: [] },
    { id: "req-ts", name: "TypeScript", category: "Technical", requiredLevel: "Advanced", effort: "15 hours", dependencies: ["JavaScript"] },
    { id: "req-react", name: "React", category: "Technical", requiredLevel: "Advanced", effort: "20 hours", dependencies: ["JavaScript"] },
    { id: "req-next", name: "Next.js", category: "Technical", requiredLevel: "Intermediate", effort: "15 hours", dependencies: ["React"] },
    { id: "req-css", name: "Tailwind CSS & Styling", category: "Technical", requiredLevel: "Advanced", effort: "10 hours", dependencies: [] },
    { id: "req-state", name: "State Management (Zustand/Redux)", category: "Technical", requiredLevel: "Intermediate", effort: "12 hours", dependencies: ["React"] },
    { id: "req-testing", name: "Frontend Testing (Jest/Cypress)", category: "Practical", requiredLevel: "Intermediate", effort: "15 hours", dependencies: ["React"] },
    { id: "req-perf", name: "Web Performance & CWV", category: "Practical", requiredLevel: "Intermediate", effort: "12 hours", dependencies: [] },
    { id: "req-comm", name: "Technical Communication", category: "Professional", requiredLevel: "Intermediate", effort: "10 hours", dependencies: [] }
  ],
  "Backend Developer": [
    { id: "req-node", name: "Node.js", category: "Technical", requiredLevel: "Advanced", effort: "20 hours", dependencies: ["JavaScript"] },
    { id: "req-express", name: "Express", category: "Technical", requiredLevel: "Advanced", effort: "12 hours", dependencies: ["Node.js"] },
    { id: "req-sql", name: "PostgreSQL / SQL", category: "Technical", requiredLevel: "Advanced", effort: "20 hours", dependencies: [] },
    { id: "req-mongo", name: "MongoDB / NoSQL", category: "Technical", requiredLevel: "Intermediate", effort: "15 hours", dependencies: [] },
    { id: "req-redis", name: "Redis Caching", category: "Technical", requiredLevel: "Intermediate", effort: "10 hours", dependencies: [] },
    { id: "req-rest", name: "REST & gRPC API Design", category: "Technical", requiredLevel: "Advanced", effort: "15 hours", dependencies: [] },
    { id: "req-docker", name: "Docker & Containerization", category: "Practical", requiredLevel: "Intermediate", effort: "15 hours", dependencies: [] },
    { id: "req-arch", name: "Distributed System Design", category: "Interview", requiredLevel: "Intermediate", effort: "30 hours", dependencies: ["SQL", "Redis"] },
    { id: "req-security", name: "API Security & Auth (JWT/OAuth)", category: "Practical", requiredLevel: "Advanced", effort: "15 hours", dependencies: [] }
  ]
};

// Fallback requirement set for custom/other roles
const DEFAULT_REQUIREMENTS = [
  { id: "req-js", name: "Core Programming Language", category: "Technical", requiredLevel: "Intermediate", effort: "15 hours", dependencies: [] },
  { id: "req-git", name: "Git & Version Control", category: "Practical", requiredLevel: "Intermediate", effort: "8 hours", dependencies: [] },
  { id: "req-api", name: "API & Data Integration", category: "Technical", requiredLevel: "Intermediate", effort: "12 hours", dependencies: [] },
  { id: "req-proj", name: "Production Project Evidence", category: "Practical", requiredLevel: "Intermediate", effort: "20 hours", dependencies: [] },
  { id: "req-comm", name: "Technical Communication", category: "Professional", requiredLevel: "Intermediate", effort: "10 hours", dependencies: [] }
];

function calculateSkillGaps(possessed, target) {
  const p = possessed || {};
  const t = target || {};

  const possessedFlat = [
    ...(p.technical || []),
    ...(p.soft || []),
    ...(p.tools || []),
    ...(p.frameworks || []),
    ...(p.languages || []),
    ...(p.cloud || []),
    ...(p.devops || [])
  ];

  const targetFlat = [
    ...(t.technical || []),
    ...(t.soft || []),
    ...(t.tools || []),
    ...(t.frameworks || []),
    ...(t.languages || []),
    ...(t.cloud || []),
    ...(t.devops || [])
  ];

  const missing = targetFlat.filter(skill => !possessedFlat.includes(skill));

  return {
    missing,
    possessedCount: possessedFlat.length,
    targetCount: targetFlat.length,
    gapRatio: targetFlat.length > 0 ? (missing.length / targetFlat.length) : 0
  };
}

/**
 * Structured Evidence-Based Gap Analysis Engine
 */
function evaluateStructuredGaps(careerContext) {
  const role = careerContext?.targetRole || "Full Stack Developer";
  const growthMode = careerContext?.growthMode || "JOB_READINESS";

  // Find matching requirement list or fallback
  const matchedRoleKey = Object.keys(ROLE_REQUIREMENTS).find(k => role.toLowerCase().includes(k.toLowerCase())) || "Full Stack Developer";
  const roleReqs = ROLE_REQUIREMENTS[matchedRoleKey] || DEFAULT_REQUIREMENTS;

  // Flatten possessed skills
  const p = careerContext?.skillsPossessed || {};
  const possessedSkills = [
    ...(p.technical || []),
    ...(p.soft || []),
    ...(p.tools || []),
    ...(p.frameworks || []),
    ...(p.languages || []),
    ...(p.cloud || []),
    ...(p.devops || [])
  ].map(s => s.toLowerCase().trim());

  // Resume identified skills
  const resumeSkills = (careerContext?.resumeContext?.identifiedSkills || []).map(s => s.toLowerCase().trim());
  const resumeMissing = (careerContext?.resumeContext?.missingKeywords || []).map(s => typeof s === "string" ? s.toLowerCase().trim() : (s.keyword || "").toLowerCase().trim());

  // GitHub evidence
  const devLangs = Object.keys(careerContext?.devContext?.languageDistribution || {}).map(l => l.toLowerCase().trim());
  const devMissingPractices = (careerContext?.devContext?.missingPractices || []).map(m => m.toLowerCase());

  // Interview mistakes
  const interviewMistakes = (careerContext?.interviewContext?.repeatingMistakes || []).map(m => (m.concept || "").toLowerCase());

  const gapAnalysisList = roleReqs.map(req => {
    const nameLower = req.name.toLowerCase();
    const evidence = [];
    let currentLevel = "None";
    let confidence = 30; // Base baseline

    // 1. Evidence evaluation
    const isPossessed = possessedSkills.some(s => s.includes(nameLower) || nameLower.includes(s));
    const isResumeVerified = resumeSkills.some(s => s.includes(nameLower) || nameLower.includes(s));
    const isGithubVerified = devLangs.some(l => l.includes(nameLower) || nameLower.includes(l));
    const hasGithubPracticeGap = devMissingPractices.some(m => m.includes(nameLower));
    const hasInterviewMistake = interviewMistakes.some(m => m.includes(nameLower));
    const isResumeMissing = resumeMissing.some(m => m.includes(nameLower));

    if (isGithubVerified) {
      evidence.push(`GitHub Evidence: Verified usage in public repository commits.`);
      confidence += 35;
      currentLevel = "Intermediate";
    }

    if (isResumeVerified) {
      evidence.push(`Resume Evidence: Extracted from candidate resume text.`);
      confidence += 25;
      if (currentLevel === "None") currentLevel = "Beginner";
      else if (currentLevel === "Intermediate") currentLevel = "Advanced";
    }

    if (isPossessed) {
      evidence.push(`Self Attestation: Listed in user profile skills inventory.`);
      confidence += 15;
      if (currentLevel === "None") currentLevel = "Beginner";
    }

    if (hasInterviewMistake) {
      evidence.push(`Mock Interview Alert: Recurring concept weakness detected during mock rounds.`);
      if (currentLevel === "Advanced") currentLevel = "Intermediate";
      else if (currentLevel === "Intermediate") currentLevel = "Beginner";
    }

    if (isResumeMissing) {
      evidence.push(`ATS Keyword Gap: Identified as missing keyword for target role.`);
    }

    if (hasGithubPracticeGap) {
      evidence.push(`Repository Practice Gap: Flagged during GitHub code structure audit.`);
    }

    // Adjust required level based on Growth Mode
    let requiredLevel = req.requiredLevel;
    if (growthMode === "CAREER_PROGRESSION" || growthMode === "INTERNSHIP_TO_FULLTIME") {
      if (req.category === "Practical" || req.category === "Professional") {
        requiredLevel = "Advanced";
      }
    }

    // Determine Gap Status
    let gapStatus = "Missing";
    if (currentLevel === "None") {
      gapStatus = "Missing";
    } else if (currentLevel === "Beginner" && (requiredLevel === "Intermediate" || requiredLevel === "Advanced")) {
      gapStatus = "Weak";
    } else if (currentLevel === "Intermediate" && requiredLevel === "Advanced") {
      gapStatus = "Developing";
    } else if (currentLevel === requiredLevel) {
      gapStatus = "Meets Requirement";
    } else {
      gapStatus = "Exceeds Requirement";
    }

    // Priority scoring
    let priority = "Medium";
    if (gapStatus === "Missing" || isResumeMissing || hasInterviewMistake) {
      priority = "High";
    } else if (gapStatus === "Meets Requirement" || gapStatus === "Exceeds Requirement") {
      priority = "Low";
    }

    return {
      requirementId: req.id,
      name: req.name,
      category: req.category,
      currentLevel,
      requiredLevel,
      gapStatus,
      priority,
      estimatedEffort: req.effort,
      dependencies: req.dependencies,
      confidence: Math.min(95, confidence),
      evidence: evidence.length > 0 ? evidence : ["Estimated from target role profile baseline."]
    };
  });

  return {
    targetRole: role,
    growthMode,
    requirements: gapAnalysisList,
    totalRequirements: gapAnalysisList.length,
    missingCount: gapAnalysisList.filter(g => g.gapStatus === "Missing").length,
    weakCount: gapAnalysisList.filter(g => g.gapStatus === "Weak").length,
    developingCount: gapAnalysisList.filter(g => g.gapStatus === "Developing").length,
    meetsCount: gapAnalysisList.filter(g => g.gapStatus === "Meets Requirement" || g.gapStatus === "Exceeds Requirement").length
  };
}

module.exports = {
  calculateSkillGaps,
  evaluateStructuredGaps,
  ROLE_REQUIREMENTS
};

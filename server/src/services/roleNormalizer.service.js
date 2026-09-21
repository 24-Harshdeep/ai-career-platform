/**
 * Role Normalizer Service
 * Categorizes software engineering titles into Role Families and Seniority levels,
 * and identifies non-technical job postings.
 */

const ROLE_FAMILIES = {
  "Frontend Engineer": [
    "frontend", "front end", "front-end", "react", "vue", "angular", "ui engineer", "web developer", "ui developer", "client engineer"
  ],
  "Backend Engineer": [
    "backend", "back end", "back-end", "node", "nodejs", "express", "python", "django", "flask", "java", "spring", "golang", "go developer", "rust", "microservices"
  ],
  "Fullstack Engineer": [
    "fullstack", "full stack", "full-stack", "mern", "mean", "web engineer", "software development engineer", "sde"
  ],
  "DevOps / SRE / Cloud": [
    "devops", "sre", "site reliability", "cloud engineer", "infrastructure", "platform engineer", "kubernetes", "aws", "azure", "gcp", "sysadmin"
  ],
  "Data / ML / AI Engineer": [
    "data engineer", "data scientist", "machine learning", "ml engineer", "ai engineer", "deep learning", "nlp", "computer vision", "llm", "data analyst"
  ],
  "Mobile Engineer": [
    "mobile", "ios", "android", "react native", "flutter", "swift", "kotlin developer"
  ],
  "QA / Test Automation": [
    "qa", "quality assurance", "sdett", "sdet", "test engineer", "automation engineer", "testing"
  ],
  "Security Engineer": [
    "security engineer", "cybersecurity", "info-sec", "infosec", "pentester", "appsec"
  ],
  "Engineering Manager / Tech Lead": [
    "engineering manager", "tech lead", "technical lead", "lead engineer", "vp engineering", "cto", "architect"
  ]
};

const NON_TECH_KEYWORDS = [
  "recruiter", "talent acquisition", "sales", "account executive", "business development",
  "hr", "human resources", "compliance", "legal", "marketing", "content writer", "financial analyst",
  "accountant", "customer support", "office manager"
];

/**
 * Classifies a job title into a standard Role Family.
 */
function normalizeRoleFamily(title = "", description = "") {
  const lowerTitle = title.toLowerCase();
  const lowerDesc = (description || "").toLowerCase().slice(0, 500);

  // First check if it's non-tech
  for (const kw of NON_TECH_KEYWORDS) {
    if (lowerTitle.includes(kw)) {
      return "Non-Tech";
    }
  }

  for (const [family, keywords] of Object.entries(ROLE_FAMILIES)) {
    for (const kw of keywords) {
      if (lowerTitle.includes(kw)) {
        return family;
      }
    }
  }

  // Fallback check in description top if title is ambiguous like "Software Developer"
  for (const [family, keywords] of Object.entries(ROLE_FAMILIES)) {
    for (const kw of keywords) {
      if (lowerDesc.includes(kw)) {
        return family;
      }
    }
  }

  return "Software Engineer";
}

/**
 * Classifies job seniority from title and description.
 */
function normalizeSeniority(title = "", description = "", yearsExperienceRequired = 0) {
  const combined = `${title} ${description}`.toLowerCase();

  if (yearsExperienceRequired >= 8 || combined.includes("staff") || combined.includes("principal") || combined.includes("architect") || combined.includes("head of") || combined.includes("vp")) {
    return "Lead / Staff / Principal";
  }
  if (yearsExperienceRequired >= 5 || combined.includes("lead") || combined.includes("senior") || combined.includes("sr.") || combined.includes("5+ years") || combined.includes("7+ years")) {
    return "Senior";
  }
  if (combined.includes("intern") || combined.includes("trainee") || combined.includes("graduate") || combined.includes("0-1 year") || combined.includes("fresher")) {
    return "Intern / Graduate";
  }
  if (yearsExperienceRequired <= 2 && (combined.includes("junior") || combined.includes("jr.") || combined.includes("associate") || combined.includes("0-2 years") || combined.includes("1-2 years"))) {
    return "Junior";
  }

  return "Mid-Level";
}

module.exports = {
  normalizeRoleFamily,
  normalizeSeniority,
  ROLE_FAMILIES,
  NON_TECH_KEYWORDS
};

const crypto = require("crypto");

// Known software engineering skill taxonomy for fast deterministic extraction
const TECH_SKILL_PATTERNS = [
  "React", "React.js", "React Native", "Next.js", "Vue", "Vue.js", "Angular", "Svelte",
  "TypeScript", "JavaScript", "ES6", "Node.js", "Express", "Express.js", "NestJS", "FastAPI",
  "Python", "Django", "Flask", "Java", "Spring Boot", "Kotlin", "Go", "Golang", "Rust", "C++", "C#", ".NET",
  "SQL", "PostgreSQL", "MySQL", "MongoDB", "Redis", "Elasticsearch", "GraphQL", "REST API", "gRPC",
  "AWS", "Amazon Web Services", "Azure", "GCP", "Google Cloud", "Docker", "Kubernetes", "Terraform",
  "CI/CD", "GitHub Actions", "Kafka", "RabbitMQ", "Microservices", "System Design", "Tailwind CSS",
  "HTML5", "CSS3", "Redux", "Zustand", "Jest", "Cypress", "Playwright", "WebSockets", "PyTorch", "TensorFlow"
];

/**
 * Extracts recognized technical skills from text.
 */
function extractSkillsFromText(text = "") {
  if (!text) return [];
  const foundSkills = new Set();
  const lowerText = ` ${text.toLowerCase()} `;

  for (const skill of TECH_SKILL_PATTERNS) {
    const escaped = skill.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
    const regex = new RegExp(`(?:^|[^a-zA-Z0-9#+.])${escaped}(?:$|[^a-zA-Z0-9#+.])`, "i");
    if (regex.test(lowerText)) {
      foundSkills.add(skill);
    }
  }

  return Array.from(foundSkills);
}

/**
 * Standardizes experience level from job title and description.
 */
function inferExperienceLevel(title = "", description = "") {
  const combined = `${title} ${description}`.toLowerCase();
  if (combined.includes("lead") || combined.includes("principal") || combined.includes("architect") || combined.includes("staff")) {
    return "Senior";
  }
  if (combined.includes("senior") || combined.includes("sr.") || combined.includes("5+ years") || combined.includes("7+ years")) {
    return "Senior";
  }
  if (combined.includes("junior") || combined.includes("entry") || combined.includes("associate") || combined.includes("intern") || combined.includes("0-2 years")) {
    return "Entry Level";
  }
  return "Mid-Level";
}

/**
 * Generates a unique deterministic content hash for a job posting.
 */
function generateJobHash(job) {
  const normalizedCompany = (job.company?.name || "").toLowerCase().trim().replace(/[^a-z0-9]/g, "");
  const normalizedTitle = (job.title || "").toLowerCase().trim().replace(/[^a-z0-9]/g, "");
  const normalizedLocation = (job.location?.raw || "").toLowerCase().trim().replace(/[^a-z0-9]/g, "");
  
  const rawHashString = `${job.provider}:${job.sourceJobId || job.externalId || job.url}:${normalizedCompany}:${normalizedTitle}:${normalizedLocation}`;
  return crypto.createHash("sha256").update(rawHashString).digest("hex");
}

/**
 * Normalizes a raw job object into the standard CareerOS Job structure.
 */
function normalizeJob(rawJob) {
  const extractedSkills = extractSkillsFromText(`${rawJob.title} ${rawJob.description}`);
  const combinedSkills = Array.from(new Set([...(rawJob.skills || []), ...extractedSkills]));

  const experienceLevel = rawJob.experienceLevel || inferExperienceLevel(rawJob.title, rawJob.description);

  const normalized = {
    provider: rawJob.provider || "external",
    externalId: String(rawJob.externalId || rawJob.sourceJobId || ""),
    sourceJobId: String(rawJob.sourceJobId || rawJob.externalId || ""),
    title: (rawJob.title || "Untitled Position").trim(),
    company: {
      name: (rawJob.company?.name || rawJob.company?.display_name || "Unknown Company").trim(),
      logo: rawJob.company?.logo || "",
      website: rawJob.company?.website || ""
    },
    location: {
      city: rawJob.location?.city || "",
      state: rawJob.location?.state || "",
      country: rawJob.location?.country || "",
      remote: Boolean(rawJob.location?.remote),
      raw: (rawJob.location?.raw || (rawJob.location?.remote ? "Remote" : "Location unspecified")).trim()
    },
    employmentType: rawJob.employmentType || "Full-time",
    experienceLevel: experienceLevel,
    description: (rawJob.description || "").trim(),
    skills: combinedSkills,
    salary: rawJob.salary || null,
    url: rawJob.url || "",
    publishedAt: rawJob.publishedAt ? new Date(rawJob.publishedAt) : null,
    fetchedAt: rawJob.fetchedAt ? new Date(rawJob.fetchedAt) : new Date(),
    expiresAt: rawJob.expiresAt ? new Date(rawJob.expiresAt) : null,
    source: rawJob.source || rawJob.provider || "External",
    sources: [rawJob.source || rawJob.provider || "External"]
  };

  normalized.hash = generateJobHash(normalized);
  return normalized;
}

module.exports = {
  extractSkillsFromText,
  inferExperienceLevel,
  generateJobHash,
  normalizeJob
};

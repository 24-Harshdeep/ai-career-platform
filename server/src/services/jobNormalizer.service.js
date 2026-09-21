const crypto = require("crypto");
const { normalizeIndiaLocation } = require("./indiaLocationNormalizer");
const { normalizeRoleFamily, normalizeSeniority } = require("./roleNormalizer.service");

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
 * Categorizes extracted skills into required vs preferred skills based on section context.
 */
function separateSkills(description = "", allSkills = []) {
  if (!allSkills || allSkills.length === 0) {
    return { requiredSkills: [], preferredSkills: [] };
  }

  const lowerDesc = description.toLowerCase();
  const preferredIndex = Math.max(
    lowerDesc.indexOf("preferred"),
    lowerDesc.indexOf("nice to have"),
    lowerDesc.indexOf("plus"),
    lowerDesc.indexOf("bonus")
  );

  if (preferredIndex === -1) {
    // All extracted skills are required
    return {
      requiredSkills: allSkills,
      preferredSkills: []
    };
  }

  const requiredText = lowerDesc.slice(0, preferredIndex);
  const preferredText = lowerDesc.slice(preferredIndex);

  const reqSkills = extractSkillsFromText(requiredText);
  const prefSkills = extractSkillsFromText(preferredText);

  // Any remaining skills not in req are placed in pref or req
  const reqSet = new Set(reqSkills);
  const prefSet = new Set(prefSkills);

  for (const skill of allSkills) {
    if (!reqSet.has(skill) && !prefSet.has(skill)) {
      reqSet.add(skill);
    }
  }

  return {
    requiredSkills: Array.from(reqSet),
    preferredSkills: Array.from(prefSet).filter(s => !reqSet.has(s))
  };
}

/**
 * Generates a unique deterministic content hash for a job posting.
 */
function generateJobHash(job) {
  const normalizedCompany = (job.companyNormalized || job.company?.name || "").toLowerCase().trim().replace(/[^a-z0-9]/g, "");
  const normalizedTitle = (job.normalizedTitle || job.title || "").toLowerCase().trim().replace(/[^a-z0-9]/g, "");
  const normalizedLocation = (job.normalizedLocation || job.location?.raw || "").toLowerCase().trim().replace(/[^a-z0-9]/g, "");
  
  const rawHashString = `${job.provider}:${job.sourceJobId || job.externalId || job.url}:${normalizedCompany}:${normalizedTitle}:${normalizedLocation}`;
  return crypto.createHash("sha256").update(rawHashString).digest("hex");
}

/**
 * Normalizes a raw job object into the standard CareerOS Job structure.
 */
function normalizeJob(rawJob) {
  const rawTitle = (rawJob.title || "Untitled Position").trim();
  const rawDesc = (rawJob.description || "").trim();
  const rawCompanyName = (rawJob.company?.name || rawJob.company?.display_name || "Unknown Company").trim();

  // Location Normalization
  const locationDetails = normalizeIndiaLocation(rawJob.location);

  // Role & Seniority Normalization
  const roleFamily = rawJob.roleFamily || normalizeRoleFamily(rawTitle, rawDesc);
  const seniority = rawJob.seniority || rawJob.experienceLevel || normalizeSeniority(rawTitle, rawDesc, rawJob.yearsExperienceRequired || 0);

  // Skill Extraction
  const extractedSkills = extractSkillsFromText(`${rawTitle} ${rawDesc}`);
  const combinedSkills = Array.from(new Set([...(rawJob.skills || []), ...extractedSkills]));
  const { requiredSkills, preferredSkills } = separateSkills(rawDesc, combinedSkills);

  const companyNormalized = rawCompanyName.toLowerCase().replace(/[^a-z0-9]/g, "");
  const normalizedTitle = rawTitle.toLowerCase().replace(/[^a-z0-9]/g, "");

  const normalized = {
    provider: rawJob.provider || "external",
    externalId: String(rawJob.externalId || rawJob.sourceJobId || ""),
    sourceJobId: String(rawJob.sourceJobId || rawJob.externalId || ""),
    title: rawTitle,
    normalizedTitle: normalizedTitle,
    company: {
      name: rawCompanyName,
      logo: rawJob.company?.logo || "",
      website: rawJob.company?.website || ""
    },
    companyNormalized: companyNormalized,
    location: {
      city: locationDetails.city || rawJob.location?.city || "",
      state: locationDetails.state || rawJob.location?.state || "",
      country: locationDetails.country || "India",
      remote: locationDetails.remoteType === "Remote",
      raw: (rawJob.location?.raw || locationDetails.normalizedLocation).trim()
    },
    normalizedLocation: locationDetails.normalizedLocation,
    country: locationDetails.country,
    remoteType: locationDetails.remoteType,
    employmentType: rawJob.employmentType || "Full-time",
    experienceLevel: seniority,
    seniority: seniority,
    roleFamily: roleFamily,
    description: rawDesc,
    skills: combinedSkills,
    requiredSkills: rawJob.requiredSkills || requiredSkills,
    preferredSkills: rawJob.preferredSkills || preferredSkills,
    salary: rawJob.salary || null,
    url: rawJob.url || "",
    publishedAt: rawJob.publishedAt ? new Date(rawJob.publishedAt) : null,
    fetchedAt: rawJob.fetchedAt ? new Date(rawJob.fetchedAt) : new Date(),
    lastSeenAt: new Date(),
    expiresAt: rawJob.expiresAt ? new Date(rawJob.expiresAt) : null,
    status: rawJob.status || "ACTIVE",
    source: rawJob.source || rawJob.provider || "External",
    sources: [rawJob.source || rawJob.provider || "External"],
    providerMetadata: rawJob.providerMetadata || {}
  };

  normalized.hash = generateJobHash(normalized);
  return normalized;
}

module.exports = {
  extractSkillsFromText,
  separateSkills,
  generateJobHash,
  normalizeJob
};

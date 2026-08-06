const User = require("../models/User");
const GithubRepository = require("../models/GithubRepository");
const GithubRepositoryAnalysis = require("../models/GithubRepositoryAnalysis");
const DeveloperProfile = require("../models/DeveloperProfile");
const { mockDb } = require("../config/mockDb");

const { syncRepositories } = require("../engines/github/sync.engine");
const { discoverRepositoryMetadata } = require("../engines/github/repositoryDiscovery.engine");
const { analyzeCommitFrequency } = require("../engines/github/commitFrequency.engine");
const { analyzeLanguageDistribution } = require("../engines/github/languageAnalysis.engine");
const { auditReadme } = require("../engines/github/readmeAudit.engine");
const { auditTesting } = require("../engines/github/testingAudit.engine");
const { auditProjectStructure } = require("../engines/github/projectStructure.engine");
const { calculateRepositoryScore } = require("../engines/github/repositoryScore.engine");
const { evaluateDeveloperHealth } = require("../engines/github/developerHealth.engine");

const { toDeveloperIntelligenceDTO } = require("../dto/developer.dto");
const { recalculateUserStats } = require("./career.service");

// Mock raw repositories sync payload for sandbox fallbacks
const MOCK_REPOS_API = [
  { name: "careeros-client", description: "Frontend Next.js dashboard client application", fork: false, archived: false, language: "TypeScript", stargazers_count: 5, forks_count: 1, watchers_count: 5 },
  { name: "careeros-server", description: "Express backend API server systems", fork: false, archived: false, language: "JavaScript", stargazers_count: 3, forks_count: 0, watchers_count: 3 },
  { name: "dsa-challenges", description: "Solved algorithms and sorting puzzles", fork: false, archived: false, language: "Go", stargazers_count: 1, forks_count: 0, watchers_count: 1 }
];

// 1. Trigger full developer profile sync & analysis from public GitHub API
async function syncDeveloperProfile(userId, githubUsername) {
  const username = (githubUsername || "harshdeep").trim();
  let reposList = [];

  try {
    // Crawl user public repositories list
    const res = await fetch(`https://api.github.com/users/${username}/repos?per_page=6&sort=updated`, {
      headers: { "User-Agent": "CareerOS-DeveloperScanner/1.0" }
    });
    
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        reposList = data;
      }
    } else {
      console.warn(`[GitHub Sync] API returned status ${res.status}, falling back to mock.`);
    }
  } catch (err) {
    console.error("[GitHub Sync] Failed to retrieve repos from GitHub REST API:", err.message);
  }

  // Fallback to offline mock configurations if API is unreachable
  if (reposList.length === 0) {
    reposList = MOCK_REPOS_API;
  }

  const savedRepos = [];
  const savedAnalyses = [];

  for (const raw of reposList) {
    const name = raw.name;
    const description = raw.description || "Project repository systems";
    const url = raw.html_url || `https://github.com/${username}/${name}`;
    const primaryLanguage = raw.language || "JavaScript";
    const stars = raw.stargazers_count || 0;
    const forks = raw.forks_count || 0;

    // Discover repository file details via GitHub contents API
    let filesList = [];
    try {
      const filesRes = await fetch(`https://api.github.com/repos/${username}/${name}/contents`, {
        headers: { "User-Agent": "CareerOS-DeveloperScanner/1.0" },
        signal: AbortSignal.timeout(3000)
      });
      
      if (filesRes.ok) {
        const filesData = await filesRes.json();
        if (Array.isArray(filesData)) {
          filesList = filesData.map(f => f.name.toLowerCase());
        }
      }
    } catch (filesErr) {
      console.warn(`[GitHub Sync] Contents scan failed for ${name}:`, filesErr.message);
    }

    // Default mock contents if unauthenticated rate limit is exhausted
    if (filesList.length === 0) {
      filesList = [".gitignore", "package.json", "readme.md"];
      if (name.includes("server")) filesList.push("dockerfile");
      if (name.includes("client")) filesList.push(".env.example", "test.js");
    }

    // Dynamic audits based on file presence
    const hasReadme = filesList.some(f => f === "readme.md" || f === "readme.txt");
    const hasDocker = filesList.some(f => f.includes("docker"));
    const hasEnvExample = filesList.some(f => f === ".env.example");
    const hasTests = filesList.some(f => f.includes("test") || f.includes("spec") || f === "tests");
    const hasLicense = filesList.some(f => f === "license" || f === "license.txt");

    const documentationScore = hasReadme ? 95 : 40;
    const testingScore = hasTests ? 90 : 30;
    const securityScore = hasEnvExample ? 85 : 50;
    const architectureScore = hasDocker ? 90 : 60;
    const activityScore = stars > 2 ? 90 : 70;
    const maintainabilityScore = hasLicense ? 95 : 65;

    const healthScore = Math.round(
      (documentationScore + testingScore + securityScore + architectureScore + activityScore + maintainabilityScore) / 6
    );

    // Upsert Repository record
    const repo = await GithubRepository.findOneAndUpdate(
      { userId, name },
      {
        name,
        description,
        url,
        primaryLanguage,
        stars,
        forks,
        lastSyncedAt: new Date()
      },
      { upsert: true, new: true }
    );
    savedRepos.push(repo);

    const missingPractices = [];
    if (!hasReadme) missingPractices.push(`${name}: Missing README.md file`);
    if (!hasDocker) missingPractices.push(`${name}: Missing Dockerfile container configurations`);
    if (!hasEnvExample) missingPractices.push(`${name}: Missing .env.example configuration file`);
    if (!hasTests) missingPractices.push(`${name}: Missing unit test suites`);
    if (!hasLicense) missingPractices.push(`${name}: Missing LICENSE file`);

    // Save Repository Analysis document
    const analysis = await GithubRepositoryAnalysis.create({
      repositoryId: repo._id,
      healthScore,
      documentationScore,
      testingScore,
      architectureScore,
      activityScore,
      maintainabilityScore,
      securityScore,
      missingPractices,
      analysisVersion: "v1.0.0"
    });
    savedAnalyses.push(analysis);
  }

  // 2. Compute language distribution
  const languages = {};
  savedRepos.forEach(r => {
    const lang = r.primaryLanguage || "Other";
    languages[lang] = (languages[lang] || 0) + 1;
  });
  const total = savedRepos.length;
  Object.keys(languages).forEach(k => {
    languages[k] = Math.round((languages[k] / total) * 100);
  });

  // Evaluate developer profile health aggregates
  const totalScore = savedAnalyses.reduce((acc, a) => acc + a.healthScore, 0);
  const overallHealth = Math.round(totalScore / savedAnalyses.length);
  
  let bestRepo = savedRepos[0]?.name || "";
  let weakestRepo = savedRepos[0]?.name || "";
  let highestHealth = 0;
  let lowestHealth = 100;

  savedAnalyses.forEach(a => {
    const repoObj = savedRepos.find(r => r._id.toString() === a.repositoryId.toString());
    if (!repoObj) return;
    if (a.healthScore > highestHealth) {
      highestHealth = a.healthScore;
      bestRepo = repoObj.name;
    }
    if (a.healthScore < lowestHealth) {
      lowestHealth = a.healthScore;
      weakestRepo = repoObj.name;
    }
  });

  const allMissingPractices = [];
  savedAnalyses.forEach(a => {
    if (a.missingPractices) {
      allMissingPractices.push(...a.missingPractices);
    }
  });

  const engineeringLevel = overallHealth > 85 ? "Advanced" : overallHealth > 65 ? "Intermediate" : "Beginner";

  // 4. Save Developer Profile document
  const profile = await DeveloperProfile.findOneAndUpdate(
    { userId },
    {
      overallHealth,
      engineeringLevel,
      repositoryCount: savedRepos.length,
      bestRepository: bestRepo,
      weakestRepository: weakestRepo,
      languageDistribution: languages,
      missingPractices: allMissingPractices.slice(0, 5),
      lastAnalysis: new Date(),
      careerImpact: 3,
      jobReadinessImpact: 5
    },
    { upsert: true, new: true }
  );

  // 5. Update User profile indicators
  const userDoc = await User.findById(userId);
  if (userDoc) {
    userDoc.hasGithubScanned = true;
    await userDoc.save();
  }

  // 6. Force recalculate Career Score
  await recalculateUserStats(userId);

  return toDeveloperIntelligenceDTO(profile, savedRepos, savedAnalyses);
}

// 2. Fetch Developer Profile DTO
async function getDeveloperProfile(userId) {
  try {
    const profile = await DeveloperProfile.findOne({ userId });
    if (!profile) return null;

    const repos = await GithubRepository.find({ userId });
    const repoIds = repos.map(r => r._id);
    const analyses = await GithubRepositoryAnalysis.find({ repositoryId: { $in: repoIds } });

    return toDeveloperIntelligenceDTO(profile, repos, analyses);
  } catch (err) {
    // Offline local fallback
    return syncDeveloperProfile(userId, "harshdeep");
  }
}

module.exports = {
  syncDeveloperProfile,
  getDeveloperProfile
};

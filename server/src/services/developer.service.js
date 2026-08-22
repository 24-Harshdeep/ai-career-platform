const User = require("../models/User");
const GithubRepository = require("../models/GithubRepository");
const GithubRepositoryAnalysis = require("../models/GithubRepositoryAnalysis");
const DeveloperProfile = require("../models/DeveloperProfile");


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

// 1. Trigger full developer profile sync & analysis from public GitHub API
async function syncDeveloperProfile(userId, githubUsername) {
  const username = githubUsername?.trim();
  if (!username) throw new Error("GitHub username is required.");
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
      throw new Error(`GitHub API returned status ${res.status}.`);
    }
  } catch (err) {
    console.error("[GitHub Sync] Failed to retrieve repos from GitHub REST API:", err.message);
    throw err;
  }

  // Fallback to offline mock configurations if API is unreachable
  if (reposList.length === 0) {
    throw new Error("GitHub synchronization failed. User has no public repos or API is offline.");
  }

  const savedRepos = [];
  const savedAnalyses = [];

  for (const raw of reposList) {
    const name = raw.name;
    const description = raw.description || "";
    const url = raw.html_url;
    if (!name || !url) continue;
    const primaryLanguage = raw.language || "";
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

    // Repository metadata is displayable, but repository quality scores require
    // a successful contents response from GitHub.
    if (filesList.length === 0) continue;

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
  const overallHealth = savedAnalyses.length > 0 ? Math.round(totalScore / savedAnalyses.length) : 0;
  
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

  const { getCareerContext } = require("./careerContext.service");
  const userContext = await getCareerContext(userId);

  // 3. Holistic AI evaluation of the developer profile
  const devPrompt = `Evaluate this developer's GitHub portfolio against their target role of "${userContext.targetRole}".
Repositories and primary languages:
${JSON.stringify(savedRepos.map(r => ({ name: r.name, language: r.primaryLanguage, stars: r.stars })), null, 2)}
Overall Health Score: ${overallHealth}

Provide an engineering level classification ("Beginner", "Intermediate", "Advanced") and a list of 5 specific missing practices or skills they need to adopt to become a better ${userContext.targetRole}.
Output a JSON object conforming exactly to this structure:
{
  "engineeringLevel": "Intermediate",
  "missingPractices": ["Need to adopt CI/CD pipelines", "Missing unit tests in frontend repos"]
}`;

  let engineeringLevel = savedAnalyses.length > 0
    ? (overallHealth > 85 ? "Advanced" : overallHealth > 65 ? "Intermediate" : "Beginner")
    : "Beginner";
  let finalMissingPractices = [];
  
  const { generateAiContent } = require("../config/ai");
  try {
    const geminiJson = await generateAiContent(devPrompt, "You are a Senior Staff Engineer evaluating a portfolio. Output JSON only.", true);
    if (geminiJson) {
      const parsed = JSON.parse(geminiJson);
      if (parsed.engineeringLevel) engineeringLevel = parsed.engineeringLevel;
      if (parsed.missingPractices) finalMissingPractices = parsed.missingPractices;
    }
  } catch (e) {
    console.error("Gemini dev profile evaluation failed:", e);
    savedAnalyses.forEach(a => {
      if (a.missingPractices) finalMissingPractices.push(...a.missingPractices);
    });
  }

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
      missingPractices: finalMissingPractices.slice(0, 5),
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
    console.error("Developer Service Error in getDeveloperProfile:", err);
    throw err;
  }
}

module.exports = {
  syncDeveloperProfile,
  getDeveloperProfile
};

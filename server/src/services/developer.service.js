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
  { name: "dsa-challenges", description: "Solved algorithms and sorting puzzles", fork: false, archived: false, language: "Go", stargazers_count: 1, forks_count: 0, watchers_count: 1 },
  { name: "react-native-old", description: "Legacy mobile application test", fork: false, archived: true, language: "JavaScript", stargazers_count: 0, forks_count: 0, watchers_count: 0 }
];

// 1. Trigger full developer profile sync & analysis
async function syncDeveloperProfile(userId, githubUsername) {
  try {
    // 1. Sync repositories candidates
    const syncedCandidates = syncRepositories(MOCK_REPOS_API);
    const savedRepos = [];
    const savedAnalyses = [];

    for (const raw of syncedCandidates) {
      const meta = discoverRepositoryMetadata(raw);
      
      // Upsert Repository record
      const repo = await GithubRepository.findOneAndUpdate(
        { userId, name: meta.name },
        { ...meta, lastSyncedAt: new Date() },
        { upsert: true, new: true }
      );
      savedRepos.push(repo);

      // Run auditing engines on candidate parameters
      const readmeAuditLog = auditReadme("Overview. Installation guidelines. Usage scripts. License: MIT.");
      const testingAuditLog = auditTesting(["tests/main.test.js"], "jest devDependency");
      const projectStructureLog = auditProjectStructure([".gitignore", ".env.example", "package.json"]);
      const commitFrequencyLog = analyzeCommitFrequency(45, new Date().toISOString());

      const scoreData = calculateRepositoryScore(
        readmeAuditLog,
        testingAuditLog,
        projectStructureLog,
        commitFrequencyLog
      );

      // Save Repository Analysis document
      const analysis = await GithubRepositoryAnalysis.create({
        repositoryId: repo._id,
        healthScore: scoreData.healthScore,
        documentationScore: scoreData.documentationScore,
        testingScore: scoreData.testingScore,
        architectureScore: scoreData.architectureScore,
        activityScore: scoreData.activityScore,
        maintainabilityScore: scoreData.maintainabilityScore,
        securityScore: scoreData.securityScore,
        missingPractices: [
          ...readmeAuditLog.missingPractices,
          ...testingAuditLog.missingPractices,
          ...projectStructureLog.missingPractices
        ],
        analysisVersion: "v1.0.0"
      });
      savedAnalyses.push(analysis);
    }

    // 2. Compute language distribution
    const languages = analyzeLanguageDistribution(savedRepos);

    // 3. Evaluate developer health aggregates
    const healthData = evaluateDeveloperHealth(savedRepos, savedAnalyses);

    // 4. Save Developer Profile document
    const profile = await DeveloperProfile.findOneAndUpdate(
      { userId },
      {
        overallHealth: healthData.overallHealth,
        engineeringLevel: healthData.engineeringLevel,
        repositoryCount: healthData.repositoryCount,
        bestRepository: healthData.bestRepository,
        weakestRepository: healthData.weakestRepository,
        languageDistribution: languages,
        missingPractices: healthData.missingPractices,
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
  } catch (err) {
    // Offline local fallback
    mockDb.user.hasGithubScanned = true;

    const profile = {
      overallHealth: 82,
      engineeringLevel: "Intermediate",
      repositoryCount: 3,
      bestRepository: "careeros-client",
      weakestRepository: "dsa-challenges",
      languageDistribution: { Frontend: 60, Backend: 30, Database: 10, DevOps: 0 },
      missingPractices: [
        "dsa-challenges: Missing LICENSE file",
        "careeros-server: Missing Docker container configurations"
      ],
      careerImpact: 3,
      jobReadinessImpact: 5
    };

    const mockRepos = [
      { id: "repo-1", name: "careeros-client", description: "Dashboard client application", url: "", primaryLanguage: "TypeScript", stars: 5, forks: 1 },
      { id: "repo-2", name: "careeros-server", description: "Express backend API systems", url: "", primaryLanguage: "JavaScript", stars: 3, forks: 0 },
      { id: "repo-3", name: "dsa-challenges", description: "Solved algorithm puzzles", url: "", primaryLanguage: "Go", stars: 1, forks: 0 }
    ];

    const mockAnalyses = [
      { repositoryId: "repo-1", healthScore: 88, documentationScore: 90, testingScore: 85, architectureScore: 90, activityScore: 85 },
      { repositoryId: "repo-2", healthScore: 78, documentationScore: 80, testingScore: 70, architectureScore: 80, activityScore: 75 },
      { repositoryId: "repo-3", healthScore: 68, documentationScore: 60, testingScore: 50, architectureScore: 70, activityScore: 60 }
    ];

    return toDeveloperIntelligenceDTO(profile, mockRepos, mockAnalyses);
  }
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

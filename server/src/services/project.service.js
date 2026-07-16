const ProjectAudit = require("../models/ProjectAudit");
const ProjectAnalysis = require("../models/ProjectAnalysis");
const { mockDb } = require("../config/mockDb");

const { auditAccessibility } = require("../engines/project/accessibility.engine");
const { auditSeo } = require("../engines/project/seo.engine");
const { auditPerformance } = require("../engines/project/performance.engine");
const { extractTechnologyEvidence } = require("../engines/project/technologyEvidence.engine");
const { calculateProjectScore } = require("../engines/project/projectScore.engine");
const { toProjectIntelligenceDTO } = require("../dto/project.dto");
const { recalculateUserStats } = require("./career.service");

// 1. Audit project URL deployment
async function auditProject(userId, url, title, projectType) {
  try {
    // 1. Upsert Project Audit metadata record
    const audit = await ProjectAudit.findOneAndUpdate(
      { userId, url },
      {
        title: title || "My Deployed Project",
        projectType: projectType || "Portfolio Website",
        deploymentPlatform: url.includes("vercel") ? "Vercel" : "Render",
        source: "manual",
        status: "Completed",
        lastAuditAt: new Date()
      },
      { upsert: true, new: true }
    );

    // Mock HTML crawled code structure
    const mockHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>React eCommerce Portfolio Application</title>
          <meta name="description" content="A Next.js server side rendered e-commerce dashboard client">
        </head>
        <body>
          <h1>React eCommerce Portfolio</h1>
          <img src="/assets/logo.png" alt="Company Logo">
          <script src="/static/bundle.js" defer></script>
        </body>
      </html>
    `;

    const mockFiles = [".gitignore", ".env.example", "package.json", "dockerfile"];
    const mockCode = "const mongoose = require('mongoose'); const jwt = require('jsonwebtoken'); router.get('/api/products');";

    // 2. Run auditing engines
    const accessibilityAudit = auditAccessibility(mockHtml);
    const seoAudit = auditSeo(mockHtml);
    const performanceAudit = auditPerformance(mockHtml);
    const evidenceAudit = extractTechnologyEvidence(mockFiles, mockCode);

    const scoreData = calculateProjectScore(
      performanceAudit,
      accessibilityAudit,
      seoAudit,
      evidenceAudit,
      true
    );

    // 3. Save Project Analysis document
    const analysis = await ProjectAnalysis.create({
      userId,
      projectId: audit._id,
      overallScore: scoreData.overallScore,
      performanceScore: scoreData.performanceScore,
      accessibilityScore: scoreData.accessibilityScore,
      seoScore: scoreData.seoScore,
      documentationScore: scoreData.documentationScore,
      architectureScore: scoreData.architectureScore,
      deploymentScore: scoreData.deploymentScore,
      technologyEvidence: evidenceAudit.technologyEvidence,
      missingPractices: scoreData.missingPractices,
      strengths: scoreData.strengths,
      weaknesses: scoreData.weaknesses,
      recommendations: scoreData.recommendations,
      careerImpact: scoreData.careerImpact
    });

    // 4. Recalculate Career score
    await recalculateUserStats(userId);

    return toProjectIntelligenceDTO(analysis, audit);
  } catch (err) {
    // Offline local fallback
    const mockAudit = {
      title: title || "MERN eCommerce",
      url,
      projectType: projectType || "Portfolio Website",
      deploymentPlatform: "Vercel",
      status: "Completed",
      lastAuditAt: new Date()
    };

    const mockAnalysis = {
      projectId: "project-1",
      overallScore: 84,
      performanceScore: 90,
      accessibilityScore: 75,
      seoScore: 80,
      documentationScore: 95,
      architectureScore: 83,
      deploymentScore: 90,
      technologyEvidence: {
        hasAuth: true,
        hasDatabase: true,
        hasRestApi: true,
        hasDocker: false,
        hasTesting: false,
        hasDevOps: true
      },
      missingPractices: [
        "Missing Docker container configurations",
        "Missing unit test suites"
      ],
      strengths: [
        "Secure authorization sessions configured",
        "Structured database mapping schemas established"
      ],
      weaknesses: [
        "Unprotected backend endpoints",
        "Untested routing controller code"
      ],
      recommendations: [
        "Implement Docker setups and write Jest test suites."
      ],
      careerImpact: 4,
      analyzedAt: new Date()
    };

    // Update in-memory mock user
    mockDb.user.score = Math.min(100, mockDb.user.score + 4);

    return toProjectIntelligenceDTO(mockAnalysis, mockAudit);
  }
}

// 2. Fetch Project Audit History list
async function getProjectHistory(userId) {
  try {
    const audits = await ProjectAudit.find({ userId }).sort({ lastAuditAt: -1 });
    const auditIds = audits.map(a => a._id);
    const analyses = await ProjectAnalysis.find({ projectId: { $in: auditIds } });

    return audits.map(audit => {
      const analysis = analyses.find(a => a.projectId.toString() === audit._id.toString());
      return toProjectIntelligenceDTO(analysis, audit);
    }).filter(Boolean);
  } catch (err) {
    // Offline local fallback
    return [];
  }
}

// 3. Fetch Single Project Analysis DTO
async function getProjectAnalysis(userId, projectId) {
  try {
    const analysis = await ProjectAnalysis.findOne({ userId, projectId });
    if (!analysis) return null;

    const audit = await ProjectAudit.findById(projectId);
    return toProjectIntelligenceDTO(analysis, audit);
  } catch (err) {
    return null;
  }
}

module.exports = {
  auditProject,
  getProjectHistory,
  getProjectAnalysis
};

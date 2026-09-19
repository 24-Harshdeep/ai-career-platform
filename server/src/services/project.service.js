const ProjectAudit = require("../models/ProjectAudit");
const ProjectAnalysis = require("../models/ProjectAnalysis");


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
    // 1. Clean and validate URL
    let targetUrl = url.trim();
    if (!targetUrl.startsWith("http://") && !targetUrl.startsWith("https://")) {
      targetUrl = "https://" + targetUrl;
    }

    // 2. Perform live HTTP crawl & measure latency safely (SSRF Protection)
    let crawledHtml = "";
    let latencyMs = 250;
    
    // Prevent SSRF attacks against localhost, internal subnets, or cloud metadata services
    const parsedUrl = new URL(targetUrl);
    const hostname = parsedUrl.hostname.toLowerCase();

    const forbiddenHosts = ["localhost", "127.0.0.1", "0.0.0.0", "::1", "169.254.169.254"];
    const isPrivateIp = /^(10\.|172\.(1[6-9]|2[0-9]|3[01])\.|192\.168\.)/.test(hostname);

    if (forbiddenHosts.includes(hostname) || isPrivateIp || hostname.endsWith(".internal") || hostname.endsWith(".local")) {
      throw new Error("Auditing private, internal, or loopback network addresses is prohibited.");
    }
    
    try {
      const start = Date.now();
      const response = await fetch(targetUrl, {
        headers: { "User-Agent": "CareerOS-ProjectAuditor/1.0" },
        signal: AbortSignal.timeout(5000) // 5-second timeout
      });
      latencyMs = Date.now() - start;
      crawledHtml = await response.text();
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} ${response.statusText}`);
      }
    } catch (fetchErr) {
      console.warn(`[Project Audit] Unreachable URL target ${targetUrl}:`, fetchErr.message);
      throw new Error(`Deployment URL is unreachable or private. Please ensure it is publicly online.`);
    }

    // 3. Upsert Project Audit record
    const audit = await ProjectAudit.findOneAndUpdate(
      { userId, url: targetUrl },
      {
        title: title || "My Deployed Project",
        projectType: projectType || "Portfolio Website",
        deploymentPlatform: targetUrl.includes("vercel") 
          ? "Vercel" 
          : targetUrl.includes("netlify") 
          ? "Netlify" 
          : "Render",
        source: "manual",
        status: "Completed",
        lastAuditAt: new Date()
      },
      { upsert: true, new: true }
    );

    // 4. Query repository analyses for this user to extract technology evidence (real sync integration)
    const GithubRepository = require("../models/GithubRepository");
    const GithubRepositoryAnalysis = require("../models/GithubRepositoryAnalysis");
    
    // Find repositories matching user and containing project title keywords
    const userRepos = await GithubRepository.find({ userId });
    let matchedRepo = null;
    if (userRepos.length > 0) {
      const matchWord = (title || "project").toLowerCase().split(" ")[0];
      matchedRepo = userRepos.find(r => r.name.toLowerCase().includes(matchWord)) || userRepos[0];
    }
    
    const repoAnalysis = matchedRepo 
      ? await GithubRepositoryAnalysis.findOne({ repositoryId: matchedRepo._id }) 
      : null;

    // 5. Gather evidence parameters
    // GitHub file evidence is intentionally not inferred from an unrelated
    // repository analysis. Only the live deployment response is authoritative.
    const sourceFiles = [];

    // Compile virtual code snippet with HTML tags and evidence
    const codeSnippet = `
      // Crawled page details
      const site = "${targetUrl}";
      ${crawledHtml.toLowerCase().includes("login") || crawledHtml.toLowerCase().includes("signup") || crawledHtml.toLowerCase().includes("password") ? "const hasAuth = true;" : ""}
      ${crawledHtml.toLowerCase().includes("/api/") || crawledHtml.toLowerCase().includes("fetch(") ? "const usesApi = true;" : ""}
    `;

    // 6. Run auditing engines
    const accessibilityAudit = auditAccessibility(crawledHtml);
    const seoAudit = auditSeo(crawledHtml);
    const performanceAudit = auditPerformance(crawledHtml, latencyMs);
    const evidenceAudit = extractTechnologyEvidence(sourceFiles, codeSnippet);

    const scoreData = calculateProjectScore(
      performanceAudit,
      accessibilityAudit,
      seoAudit,
      evidenceAudit,
      false
    );

    // 7. Save Project Analysis document
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

    // 8. Recalculate Career score
    await recalculateUserStats(userId);

    return toProjectIntelligenceDTO(analysis, audit);
  } catch (err) {
    console.error("Project Service Error in auditProject:", err);
    throw err;
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
    console.error("Project Service Error in getProjectHistory:", err);
    throw err;
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

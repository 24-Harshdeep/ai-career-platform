function toProjectIntelligenceDTO(analysis, audit) {
  if (!analysis) return null;
  return {
    projectId: analysis.projectId,
    title: audit ? audit.title : "Project Audit",
    url: audit ? audit.url : "",
    projectType: audit ? audit.projectType : "Portfolio Website",
    deploymentPlatform: audit ? audit.deploymentPlatform : "Vercel",
    status: audit ? audit.status : "Completed",
    overallScore: analysis.overallScore,
    performanceScore: analysis.performanceScore,
    accessibilityScore: analysis.accessibilityScore,
    seoScore: analysis.seoScore,
    documentationScore: analysis.documentationScore,
    architectureScore: analysis.architectureScore,
    deploymentScore: analysis.deploymentScore,
    technologyEvidence: {
      hasAuth: analysis.technologyEvidence ? (analysis.technologyEvidence.hasAuth || false) : false,
      hasDatabase: analysis.technologyEvidence ? (analysis.technologyEvidence.hasDatabase || false) : false,
      hasRestApi: analysis.technologyEvidence ? (analysis.technologyEvidence.hasRestApi || false) : false,
      hasDocker: analysis.technologyEvidence ? (analysis.technologyEvidence.hasDocker || false) : false,
      hasTesting: analysis.technologyEvidence ? (analysis.technologyEvidence.hasTesting || false) : false,
      hasDevOps: analysis.technologyEvidence ? (analysis.technologyEvidence.hasDevOps || false) : false
    },
    // Map raw missingPractices to rich structures
    missingPractices: (analysis.missingPractices || []).map(practice => {
      let priority = "Medium";
      let expectedImpact = 2;
      let evidence = "No reference files or package dependencies detected.";
      
      if (practice.toLowerCase().includes("auth")) {
        priority = "High";
        expectedImpact = 4;
        evidence = "Missing authMiddleware/JWT dependency footprints.";
      } else if (practice.toLowerCase().includes("database")) {
        priority = "High";
        expectedImpact = 3;
        evidence = "No database ORM driver configurations found.";
      } else if (practice.toLowerCase().includes("testing")) {
        priority = "Medium";
        expectedImpact = 2;
        evidence = "Missing unit testing configurations.";
      }

      return {
        gap: practice,
        evidence,
        priority,
        expectedImpact
      };
    }),
    strengths: analysis.strengths || [],
    weaknesses: analysis.weaknesses || [],
    recommendations: analysis.recommendations || [],
    careerImpact: analysis.careerImpact || 4,
    jobReadinessImpact: analysis.jobReadinessImpact || 6,
    analyzedAt: analysis.analyzedAt
  };
}

module.exports = { toProjectIntelligenceDTO };

function toResumeAnalysisDTO(analysis, resume) {
  if (!analysis) return null;
  return {
    atsScore: analysis.atsScore,
    breakdown: analysis.breakdown,
    missingKeywords: analysis.missingKeywords || [],
    suggestedImprovements: analysis.suggestedImprovements || [],
    analysisVersion: analysis.analysisVersion,
    analyzedAt: analysis.analyzedAt,
    filename: resume ? resume.filename : "resume.pdf",
    uploadDate: resume ? resume.uploadDate : null
  };
}

module.exports = { toResumeAnalysisDTO };

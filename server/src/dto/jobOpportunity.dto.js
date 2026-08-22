function toJobOpportunityDTO(opportunity, analysis) {
  if (!opportunity) return null;
  return {
    id: opportunity._id || opportunity.id,
    title: opportunity.title,
    company: opportunity.company,
    url: opportunity.url,
    location: opportunity.location,
    salaryRange: opportunity.salaryRange,
    status: opportunity.status,
    remote: opportunity.remote,
    employmentType: opportunity.employmentType,
    experienceRequired: opportunity.experienceRequired,
    skills: opportunity.skills || [],
    notes: opportunity.notes || "",
    favorite: opportunity.favorite || false,
    lastAnalyzed: opportunity.lastAnalyzed,
    
    // Analyzed sub-scores
    matchScore: analysis?.matchScore ?? null,
    resumeScore: analysis?.resumeScore ?? null,
    githubScore: analysis?.githubScore ?? null,
    portfolioScore: analysis?.portfolioScore ?? null,
    experienceGap: analysis?.experienceGap ?? null,
    salaryFit: analysis?.salaryFit ?? null,
    recommendation: analysis?.recommendation ?? null,
    nextActions: analysis ? (analysis.nextActions || []) : [],
    skillGap: analysis ? (analysis.skillGap || []) : [],
    daysToReady: analysis?.nextActions ? analysis.nextActions.length * 3 : null,
    analyzedAt: analysis ? analysis.analyzedAt : null
  };
}

module.exports = { toJobOpportunityDTO };

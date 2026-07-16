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
    matchScore: analysis ? analysis.matchScore : 80,
    resumeScore: analysis ? analysis.resumeScore : 80,
    githubScore: analysis ? analysis.githubScore : 80,
    portfolioScore: analysis ? analysis.portfolioScore : 80,
    experienceGap: analysis ? analysis.experienceGap : "Matched",
    salaryFit: analysis ? analysis.salaryFit : 100,
    recommendation: analysis ? analysis.recommendation : "Apply Now",
    nextActions: analysis ? (analysis.nextActions || []) : [],
    skillGap: analysis ? (analysis.skillGap || []) : [],
    daysToReady: analysis ? (analysis.nextActions ? analysis.nextActions.length * 3 : 0) : 0,
    analyzedAt: analysis ? analysis.analyzedAt : null
  };
}

module.exports = { toJobOpportunityDTO };

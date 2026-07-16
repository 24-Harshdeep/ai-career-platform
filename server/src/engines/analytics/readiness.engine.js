function compileReadinessScores(resumeScore, devScore, portfolioScore, interviewScore) {
  return {
    resumeReadiness: resumeScore || 80,
    developerReadiness: devScore || 80,
    portfolioReadiness: portfolioScore || 80,
    interviewReadiness: interviewScore || 75
  };
}

module.exports = { compileReadinessScores };

function compileReadinessScores(resumeScore, devScore, portfolioScore, interviewScore) {
  return {
    resumeReadiness: resumeScore ?? null,
    developerReadiness: devScore ?? null,
    portfolioReadiness: portfolioScore ?? null,
    interviewReadiness: interviewScore ?? null
  };
}

module.exports = { compileReadinessScores };

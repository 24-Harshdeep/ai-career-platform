function auditTechnicalDepth(evaluationData) {
  const score = evaluationData.score || 80;
  const conceptCount = evaluationData.matchedConcepts ? evaluationData.matchedConcepts.length : 1;
  const expectedCount = evaluationData.matchedConcepts && evaluationData.missingConcepts
    ? evaluationData.matchedConcepts.length + evaluationData.missingConcepts.length
    : 1;
  
  let depthModifier = 0;
  if (expectedCount > 0) {
    depthModifier = Math.round((conceptCount / expectedCount) * 20);
  } else {
    depthModifier = 20;
  }

  return Math.min(100, Math.max(30, (score - 20) + depthModifier));
}

module.exports = { auditTechnicalDepth };

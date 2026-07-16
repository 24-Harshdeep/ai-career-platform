function toRecommendationDTO(rec) {
  if (!rec) return null;
  return {
    actionId: rec.actionId,
    title: rec.title,
    description: rec.description,
    type: rec.type,
    priority: rec.priority,
    impact: rec.impactScore,
    estimatedTime: rec.estimatedTime,
    confidence: rec.confidence,
    reason: rec.reason,
    dependencies: rec.dependencies || [],
    careerScoreAfterCompletion: rec.careerScoreAfterCompletion,
    jobReadinessAfterCompletion: rec.jobReadinessAfterCompletion,
    status: rec.status || "Active"
  };
}

function toRecommendationListDTO(list) {
  if (!list) return [];
  return list.map(toRecommendationDTO);
}

module.exports = {
  toRecommendationDTO,
  toRecommendationListDTO
};

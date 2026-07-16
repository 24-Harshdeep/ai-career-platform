function toInterviewSessionDTO(session) {
  if (!session) return null;
  return {
    id: session._id || session.id,
    role: session.role,
    type: session.type,
    difficulty: session.difficulty,
    status: session.status,
    startedAt: session.startedAt,
    completedAt: session.completedAt,
    duration: session.duration || 0,
    overallScore: session.overallScore || 0,
    technicalScore: session.technicalScore || 0,
    communicationScore: session.communicationScore || 0,
    problemSolvingScore: session.problemSolvingScore || 0,
    confidenceScore: session.confidenceScore || 0,
    timeManagementScore: session.timeManagementScore || 0,
    readinessIncrease: session.readinessIncrease || 0,
    feedbackSummary: session.feedbackSummary || "",
    recommendations: session.recommendations || [],
    questions: (session.questions || []).map(q => ({
      questionId: q.questionId,
      answer: q.answer,
      score: q.score,
      feedback: q.feedback ? {
        strengths: q.feedback.strengths || [],
        weaknesses: q.feedback.weaknesses || [],
        missedConcepts: q.feedback.missedConcepts || [],
        idealAnswer: q.feedback.idealAnswer || "",
        improvementPlan: q.feedback.improvementPlan || "",
        resources: q.feedback.resources || []
      } : null,
      duration: q.duration || 0
    }))
  };
}

module.exports = { toInterviewSessionDTO };

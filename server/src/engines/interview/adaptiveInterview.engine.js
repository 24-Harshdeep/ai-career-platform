const { generateAiContent } = require("../../config/ai");

/**
 * Adaptive Interview Engine
 * Evaluates a candidate's live answer across 8 dimensions and determines the next adaptive interviewer action:
 * - FOLLOW_UP: Deepen understanding on incomplete/weak points
 * - CLARIFY: Candidate struggled; ask simpler probing question
 * - NEXT_QUESTION: Move to next core concept
 * - END_INTERVIEW: Complete session when target count met
 */
async function evaluateAnswerAdaptively({
  role,
  type,
  difficulty,
  currentQuestionText,
  answerText,
  verifiedContext,
  questionNumber,
  totalQuestions
}) {
  const prompt = `You are a senior technical interviewer conducting a live mock interview for a "${role}" (${type} round, ${difficulty} level).

Question Asked: "${currentQuestionText}"
Candidate's Spoken/Text Answer: "${answerText}"

Candidate Verified Career Context (DO NOT invent experience outside this):
${JSON.stringify(verifiedContext, null, 2)}

Question ${questionNumber} of ${totalQuestions}.

Evaluate the candidate's response across the 6 core criteria (0-100 score for each):
1. technicalKnowledge: Technical accuracy, depth, and mastery of concepts.
2. problemSolving: Sound engineering logic, trade-offs, and algorithmic clarity.
3. communication: Structure, articulation, vocabulary, and delivery clarity.
4. answerQuality: Completeness, detail level, and direct relevance to prompt.
5. confidence: Presentation tone, delivery assurance, and engagement.
6. roleRelevance: Specific alignment with target role (${role}) and candidate's background.

Decision Policy Rules:
- If technicalKnowledge < 60 or answerQuality < 60: Action = "FOLLOW_UP". Provide a constructive, specific follow-up question based directly on what they missed.
- If technicalKnowledge >= 80 and questionNumber < totalQuestions: Action = "NEXT_QUESTION".
- If questionNumber >= totalQuestions: Action = "END_INTERVIEW".

Respond strictly with a JSON object conforming to:
{
  "scores": {
    "technicalKnowledge": 85,
    "problemSolving": 80,
    "communication": 85,
    "answerQuality": 80,
    "confidence": 75,
    "roleRelevance": 90
  },
  "overallAnswerScore": 82,
  "action": "FOLLOW_UP" | "NEXT_QUESTION" | "END_INTERVIEW",
  "aiSpeechResponse": "Spoken interviewer response to be read aloud via TTS...",
  "strengths": ["Clear explanation of core concepts"],
  "weaknesses": ["Missed edge-case error handling"],
  "missedConcepts": ["Error boundary propagation"],
  "idealAnswer": "An ideal answer would explain...",
  "improvementPlan": "Review error handling patterns in production APIs."
}`;

  try {
    const rawJson = await generateAiContent(
      prompt,
      "You are an expert technical recruiter and lead engineer. Respond only in valid JSON format.",
      true
    );

    if (rawJson) {
      const parsed = JSON.parse(rawJson);
      const scores = {
        technicalKnowledge: parsed.scores?.technicalKnowledge ?? parsed.scores?.technicalAccuracy ?? 75,
        problemSolving: parsed.scores?.problemSolving ?? 75,
        communication: parsed.scores?.communication ?? 80,
        answerQuality: parsed.scores?.answerQuality ?? parsed.scores?.relevance ?? 75,
        confidence: parsed.scores?.confidence ?? 75,
        roleRelevance: parsed.scores?.roleRelevance ?? parsed.scores?.contextConsistency ?? 80
      };

      const scoreVals = Object.values(scores);
      const computedAvg = Math.round(scoreVals.reduce((a, b) => a + b, 0) / scoreVals.length);

      return {
        scores,
        overallAnswerScore: parsed.overallAnswerScore || computedAvg,
        action: parsed.action || (questionNumber >= totalQuestions ? "END_INTERVIEW" : "NEXT_QUESTION"),
        aiSpeechResponse: parsed.aiSpeechResponse || "Thank you for that response. Let's proceed.",
        strengths: parsed.strengths || ["Articulated main points"],
        weaknesses: parsed.weaknesses || ["Could provide deeper implementation details"],
        missedConcepts: parsed.missedConcepts || [],
        idealAnswer: parsed.idealAnswer || "Cover standard design trade-offs and edge cases.",
        improvementPlan: parsed.improvementPlan || "Practice explaining architecture trade-offs."
      };
    }
  } catch (err) {
    console.error("Adaptive Evaluation AI failed, using fallback:", err);
  }

  // Deterministic Fallback Policy
  const wordCount = (answerText || "").trim().split(/\s+/).length;
  const score = Math.min(95, Math.max(50, wordCount * 2));
  const isFinal = questionNumber >= totalQuestions;

  return {
    scores: {
      technicalAccuracy: score,
      relevance: score,
      completeness: score - 5,
      clarity: score,
      problemSolving: score,
      communication: score,
      evidence: score - 10,
      contextConsistency: 95
    },
    overallAnswerScore: score,
    action: isFinal ? "END_INTERVIEW" : "NEXT_QUESTION",
    aiSpeechResponse: isFinal
      ? "Thank you. That concludes our mock interview session."
      : "Good effort. Let's move on to the next topic.",
    strengths: ["Clear communication"],
    weaknesses: ["Could expand on practical examples"],
    missedConcepts: [],
    idealAnswer: "Cover core architectural patterns and edge case constraints.",
    improvementPlan: "Elaborate on production design decisions."
  };
}

module.exports = {
  evaluateAnswerAdaptively
};

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

Evaluate the candidate's response across 8 criteria (0-100 score for each):
1. technicalAccuracy: How technically correct is the response?
2. relevance: Does it directly address the prompt?
3. completeness: Are key sub-concepts and mechanisms mentioned?
4. clarity: Is the explanation structured and easy to follow?
5. problemSolving: Does it show sound engineering trade-off logic?
6. communication: Is tone, vocabulary, and articulation professional?
7. evidence: Did they reference real projects/examples from their verified background?
8. contextConsistency: Does their claim align with their verified background without contradiction?

Decision Policy Rules:
- If technicalAccuracy < 60 or completeness < 60: Action = "FOLLOW_UP" or "CLARIFY". Provide a constructive follow-up question.
- If technicalAccuracy >= 85 and questionNumber < totalQuestions: Action = "NEXT_QUESTION".
- If questionNumber >= totalQuestions and no major follow-up is critical: Action = "END_INTERVIEW".

Respond strictly with a JSON object conforming to:
{
  "scores": {
    "technicalAccuracy": 85,
    "relevance": 90,
    "completeness": 75,
    "clarity": 80,
    "problemSolving": 85,
    "communication": 90,
    "evidence": 80,
    "contextConsistency": 100
  },
  "overallAnswerScore": 82,
  "action": "FOLLOW_UP" | "CLARIFY" | "NEXT_QUESTION" | "END_INTERVIEW",
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
      return {
        scores: parsed.scores || {
          technicalAccuracy: 75,
          relevance: 80,
          completeness: 70,
          clarity: 75,
          problemSolving: 75,
          communication: 80,
          evidence: 70,
          contextConsistency: 90
        },
        overallAnswerScore: parsed.overallAnswerScore || 75,
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

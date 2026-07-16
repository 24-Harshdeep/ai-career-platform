function compileQuestionFeedback(questionText, evalData, techScore, commScore) {
  const strengths = [];
  const weaknesses = [];

  if (techScore >= 80) {
    strengths.push("Excellent technical coverage of required terminologies.");
  } else {
    weaknesses.push("Explanation lacked depth or critical context.");
  }

  if (commScore >= 80) {
    strengths.push("Clear and structured communication flow.");
  } else {
    weaknesses.push("Response was too brief or fragmented.");
  }

  const missedConcepts = evalData.missingConcepts || [];
  const idealAnswer = "A strong answer starts by outlining the core concept, walks through structural design layers, cites practical examples, and finishes by detailing trade-offs.";

  const improvementPlan = missedConcepts.length > 0 
    ? `Study the implementation details of ${missedConcepts.join(" and ")}. Run mock codings to solidify memory.`
    : "Your conceptual answer is excellent. Focus on whiteboarding speed.";

  const resources = missedConcepts.map(c => `MDN Guide: ${c}`);

  return {
    strengths,
    weaknesses,
    missedConcepts,
    idealAnswer,
    improvementPlan,
    resources
  };
}

module.exports = { compileQuestionFeedback };

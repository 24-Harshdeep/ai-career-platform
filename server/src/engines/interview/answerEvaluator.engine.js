function evaluateAnswerText(userAnswer, expectedKeywords, expectedConcepts) {
  const text = (userAnswer || "").toLowerCase();
  
  const matchedKeywords = (expectedKeywords || []).filter(kw => text.includes(kw.toLowerCase()));
  const matchedConcepts = (expectedConcepts || []).filter(concept => text.includes(concept.toLowerCase()));

  const keywordScore = expectedKeywords && expectedKeywords.length > 0 
    ? Math.round((matchedKeywords.length / expectedKeywords.length) * 100)
    : 80;

  const conceptScore = expectedConcepts && expectedConcepts.length > 0
    ? Math.round((matchedConcepts.length / expectedConcepts.length) * 100)
    : 80;

  const score = Math.round((keywordScore + conceptScore) / 2);

  return {
    score: Math.min(100, Math.max(30, score)),
    matchedKeywords,
    matchedConcepts,
    missingKeywords: (expectedKeywords || []).filter(kw => !matchedKeywords.includes(kw)),
    missingConcepts: (expectedConcepts || []).filter(concept => !matchedConcepts.includes(concept))
  };
}

module.exports = { evaluateAnswerText };

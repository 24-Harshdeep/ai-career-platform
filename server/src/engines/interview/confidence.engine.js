function auditConfidence(userAnswer, durationSeconds) {
  const wordCount = (userAnswer || "").split(/\s+/).filter(Boolean).length;
  if (wordCount === 0) return 30;

  const minutes = durationSeconds / 60 || 0.5;
  const wpm = wordCount / minutes;

  if (wpm < 50) return 60; 
  if (wpm > 200) return 70; 
  return 90;
}

module.exports = { auditConfidence };

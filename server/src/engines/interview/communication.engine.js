function auditCommunication(userAnswer) {
  const wordCount = (userAnswer || "").split(/\s+/).filter(Boolean).length;
  
  if (wordCount < 10) return 40;
  if (wordCount < 30) return 65;
  if (wordCount < 80) return 85;
  return 95;
}

module.exports = { auditCommunication };

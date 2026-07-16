function calculateOverallInterviewScore(technical, communication, confidence, problemSolving, timeManagement) {
  const score = Math.round(
    technical * 0.30 +
    communication * 0.20 +
    confidence * 0.20 +
    problemSolving * 0.20 +
    timeManagement * 0.10
  );

  return Math.min(100, Math.max(30, score));
}

module.exports = { calculateOverallInterviewScore };

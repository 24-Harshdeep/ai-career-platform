function auditPerformance(htmlText, latencyMs = 200) {
  const text = (htmlText || "").toLowerCase();
  
  let score = 95;
  
  // Latency-based performance scoring
  if (latencyMs < 300) {
    score -= 0; // Excellent
  } else if (latencyMs < 750) {
    score -= 10; // Good
  } else if (latencyMs < 1500) {
    score -= 25; // Slow
  } else {
    score -= 45; // Poor / Heavy Latency
  }

  if (text.includes("bundle.js") || text.includes("large-asset.png")) {
    score -= 10;
  }
  
  if (!text.includes("async") && !text.includes("defer") && text.includes("<script")) {
    score -= 5;
  }

  return {
    score: Math.max(30, score)
  };
}

module.exports = { auditPerformance };

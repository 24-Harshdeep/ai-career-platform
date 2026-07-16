function auditPerformance(htmlText) {
  const text = (htmlText || "").toLowerCase();
  
  let score = 90;
  if (text.includes("bundle.js") || text.includes("large-asset.png")) {
    score -= 15;
  }
  if (!text.includes("async") && !text.includes("defer")) {
    score -= 10;
  }

  return {
    score: Math.max(40, score)
  };
}

module.exports = { auditPerformance };

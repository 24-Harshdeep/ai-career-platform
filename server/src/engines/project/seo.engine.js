function auditSeo(htmlText) {
  const text = (htmlText || "").toLowerCase();
  
  let score = 95;
  const missing = [];
  
  if (!text.includes("<title>")) {
    score -= 20;
    missing.push("Missing title tags");
  }
  if (!text.includes("name=\"description\"")) {
    score -= 20;
    missing.push("Missing meta description keywords");
  }
  if (!text.includes("<h1")) {
    score -= 15;
    missing.push("Missing top-level header <h1> elements");
  }

  return {
    score: Math.max(30, score),
    missing
  };
}

module.exports = { auditSeo };

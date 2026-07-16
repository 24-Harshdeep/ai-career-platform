function auditAccessibility(htmlText) {
  const text = (htmlText || "").toLowerCase();
  
  let score = 90;
  const missing = [];
  
  if (!text.includes("alt=")) {
    score -= 15;
    missing.push("Missing image alt attributes");
  }
  if (!text.includes("role=")) {
    score -= 10;
    missing.push("Missing ARIA navigation roles");
  }
  if (!text.includes("lang=")) {
    score -= 5;
    missing.push("Missing document lang attribute");
  }

  return {
    score: Math.max(30, score),
    missing
  };
}

module.exports = { auditAccessibility };

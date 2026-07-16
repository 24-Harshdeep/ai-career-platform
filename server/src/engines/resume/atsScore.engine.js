function calculateAtsScore(input) {
  const { matchedCount, totalRequired, parsedText, projectsCount } = input;

  // 1. Keywords Match score
  const keywordsScore = totalRequired > 0 
    ? Math.round((matchedCount / totalRequired) * 100) 
    : 80;

  // 2. Projects Completeness score
  const projectsScore = projectsCount >= 3 ? 95 : (projectsCount === 2 ? 80 : 60);

  // 3. Formatting quality check
  const textLength = (parsedText || "").length;
  let formattingScore = 90;
  if (textLength < 500) formattingScore = 60; // too short
  if (textLength > 4000) formattingScore = 75; // too long

  // 4. Action Verbs audit
  const actionVerbs = ["built", "designed", "architected", "scaled", "optimized", "implemented", "led", "automated"];
  const textLower = (parsedText || "").toLowerCase();
  const matchedVerbs = actionVerbs.filter(verb => textLower.includes(verb));
  const actionVerbsScore = Math.min(100, Math.round((matchedVerbs.length / 5) * 100));

  // 5. Quantified Impact check (looks for numbers like %, $, or multiplier x)
  const numbersRegex = /(\d+%\s*|\$\s*\d+|\d+\s*x)/i;
  const hasImpactMet = numbersRegex.test(parsedText);
  const quantifiedImpactScore = hasImpactMet ? 85 : 50;

  // 6. Overall weighted score
  const overallAtsScore = Math.round(
    keywordsScore * 0.35 +
    projectsScore * 0.20 +
    formattingScore * 0.15 +
    actionVerbsScore * 0.15 +
    quantifiedImpactScore * 0.15
  );

  const suggestedImprovements = [];
  if (keywordsScore < 85) suggestedImprovements.push("Incorporate missing technical skills highlighted in keyword analysis.");
  if (projectsScore < 80) suggestedImprovements.push("Expand personal projects descriptions, detailing backend architectures and frameworks.");
  if (actionVerbsScore < 80) suggestedImprovements.push("Use more strong engineering action verbs (e.g. 'architected', 'scaled') instead of passive verbs.");
  if (quantifiedImpactScore < 80) suggestedImprovements.push("Add concrete metrics (e.g. 'boosted performance by 40%', 'reduced loading times') to quantify achievements.");

  return {
    atsScore: Math.min(100, overallAtsScore),
    breakdown: {
      keywords: Math.min(100, keywordsScore),
      projects: Math.min(100, projectsScore),
      skills: Math.min(100, Math.round(keywordsScore * 1.05)),
      formatting: Math.min(100, formattingScore),
      actionVerbs: Math.min(100, actionVerbsScore),
      quantifiedImpact: Math.min(100, quantifiedImpactScore)
    },
    suggestedImprovements
  };
}

module.exports = { calculateAtsScore };

/**
 * Canonical ATS Scoring Contract
 * Single source of truth for General ATS Score and Job-Specific Match Score.
 */
function calculateAtsScore({
  matchedCount = 0,
  totalRequired = 10,
  parsedText = "",
  sections = {},
  hasJd = false,
  jdMatchData = null
}) {
  const textLower = (parsedText || "").toLowerCase();
  const textLength = textLower.length;

  // 1. Keyword / Skill Coverage (35%)
  const keywordScore = totalRequired > 0
    ? Math.min(100, Math.round((matchedCount / totalRequired) * 100))
    : 75;

  // 2. Section Completeness (20%)
  const hasSummary = Boolean(sections.summary && sections.summary.length > 0);
  const hasExperience = Boolean(sections.experience && sections.experience.length > 0);
  const hasProjects = Boolean(sections.projects && sections.projects.length > 0);
  const hasEducation = Boolean(sections.education && sections.education.length > 0);
  const hasCertifications = Boolean(sections.certifications && sections.certifications.length > 0);

  let completenessScore = 0;
  if (hasSummary) completenessScore += 20;
  if (hasExperience) completenessScore += 30;
  if (hasProjects) completenessScore += 25;
  if (hasEducation) completenessScore += 15;
  if (hasCertifications) completenessScore += 10;
  completenessScore = Math.min(100, completenessScore);

  // 3. Project & Evidence Quality (20%)
  const hasLinks = textLower.includes("http://") || textLower.includes("https://") || textLower.includes("github.com");
  let evidenceScore = 60;
  if (hasProjects) evidenceScore += 20;
  if (hasLinks) evidenceScore += 20;
  evidenceScore = Math.min(100, evidenceScore);

  // 4. Action Language / Verbs (15%)
  const actionVerbs = [
    "built", "designed", "architected", "scaled", "optimized",
    "implemented", "led", "automated", "configured", "deployed",
    "engineered", "refactored", "spearheaded", "integrated"
  ];
  const matchedVerbs = actionVerbs.filter(verb => textLower.includes(verb));
  const actionVerbsScore = Math.min(100, Math.round((matchedVerbs.length / 5) * 100));

  // 5. Quantified Impact (10%)
  const numbersRegex = /(\d+%\s*|\$\s*\d+|\d+\s*x|\d+\s*ms|\d+\s*k)/i;
  const hasImpact = numbersRegex.test(parsedText);
  const quantifiedImpactScore = hasImpact ? 90 : 50;

  // Formatting / Parseability check
  let formattingScore = 90;
  if (textLength < 400) formattingScore = 55;
  if (textLength > 4500) formattingScore = 75;

  // General ATS Score Formula
  const generalAtsScore = Math.round(
    keywordScore * 0.35 +
    completenessScore * 0.20 +
    evidenceScore * 0.20 +
    actionVerbsScore * 0.15 +
    quantifiedImpactScore * 0.10
  );

  const breakdown = {
    keywords: keywordScore,
    completeness: completenessScore,
    evidence: evidenceScore,
    actionVerbs: actionVerbsScore,
    quantifiedImpact: quantifiedImpactScore,
    formatting: formattingScore
  };

  // Recommendations & Explainability
  const suggestedImprovements = [];
  const whyScoreDetails = {
    positives: [],
    improvements: []
  };

  if (keywordScore >= 80) {
    whyScoreDetails.positives.push("Strong technical skill coverage matching core target role requirements.");
  } else {
    whyScoreDetails.improvements.push("Incorporate missing core technical skills identified in the keyword analysis.");
    suggestedImprovements.push("Incorporate missing technical skills highlighted in keyword analysis.");
  }

  if (hasExperience && hasProjects) {
    whyScoreDetails.positives.push("Complete project and work experience evidence provided.");
  } else {
    whyScoreDetails.improvements.push("Expand personal project or work experience bullet points.");
    suggestedImprovements.push("Detail architectures and technical deliverables for your key projects.");
  }

  if (actionVerbsScore >= 80) {
    whyScoreDetails.positives.push("Effective use of strong engineering action verbs.");
  } else {
    whyScoreDetails.improvements.push("Use more strong engineering action verbs (e.g., 'architected', 'scaled', 'engineered').");
    suggestedImprovements.push("Use strong engineering action verbs instead of passive descriptions.");
  }

  if (hasImpact) {
    whyScoreDetails.positives.push("Quantified metrics and measurable impact present in bullets.");
  } else {
    whyScoreDetails.improvements.push("Add concrete metrics (e.g. 'boosted performance by 40%') to quantify bullet points.");
    suggestedImprovements.push("Add concrete numbers and percentages to quantify impact.");
  }

  // Job-Specific Match Score calculation (if JD provided)
  let jobMatchScore = null;
  let jdBreakdown = null;

  if (hasJd && jdMatchData) {
    const { requiredSkillMatch = 70, keywordMatch = 70, experienceAlignment = 75, educationCertMatch = 80 } = jdMatchData;
    jobMatchScore = Math.round(
      requiredSkillMatch * 0.40 +
      keywordMatch * 0.25 +
      experienceAlignment * 0.20 +
      educationCertMatch * 0.15
    );
    jdBreakdown = {
      requiredSkillMatch,
      keywordMatch,
      experienceAlignment,
      educationCertMatch
    };
  }

  return {
    atsScore: Math.min(100, Math.max(0, generalAtsScore)),
    jobMatchScore: jobMatchScore ? Math.min(100, Math.max(0, jobMatchScore)) : null,
    breakdown,
    jdBreakdown,
    suggestedImprovements,
    whyScoreDetails
  };
}

module.exports = { calculateAtsScore };

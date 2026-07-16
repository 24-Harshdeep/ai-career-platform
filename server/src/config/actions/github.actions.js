module.exports = [
  {
    id: "action-github-connect",
    title: "Connect & Scan GitHub Portfolio",
    description: "Scan commit histories, language profiles, and repository markdown configurations.",
    type: "GitHub",
    category: "General",
    prerequisites: [],
    estimatedTime: "15 mins",
    expectedImpact: 3,
    scoreReward: 3,
    xpReward: 75,
    confidence: 88,
    reason: "Hiring managers verify project credibility and coding regularity through your GitHub history."
  },
  {
    id: "action-github-readme",
    title: "Document Repository READMEs",
    description: "Structure clear deployment guidelines, schema definitions, and visual assets in project READMEs.",
    type: "GitHub",
    category: "General",
    prerequisites: ["action-github-connect"],
    estimatedTime: "1 hour",
    expectedImpact: 2,
    scoreReward: 2,
    xpReward: 60,
    confidence: 85,
    reason: "Hiring teams spend under 2 minutes reviewing profiles; professional layout increases retention."
  }
];

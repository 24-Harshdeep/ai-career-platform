module.exports = [
  {
    id: "action-roadmap-jwt",
    title: "Build API Authentication (JWT Module)",
    description: "Implement JWT sign, verify, refresh rotation, and Express route guards.",
    type: "Learning",
    category: "Backend",
    prerequisites: ["action-resume-upload"],
    estimatedTime: "2 hours",
    expectedImpact: 3,
    scoreReward: 3,
    xpReward: 150,
    confidence: 94,
    reason: "82% of target Backend developer job descriptions require secure authentication."
  },
  {
    id: "action-roadmap-indexing",
    title: "Optimize PostgreSQL Indexing Queries",
    description: "Write database indexing schemas and measure speed execution times.",
    type: "Learning",
    category: "Backend",
    prerequisites: ["action-roadmap-jwt"],
    estimatedTime: "1.5 hours",
    expectedImpact: 2,
    scoreReward: 2,
    xpReward: 100,
    confidence: 90,
    reason: "SQL optimization forms 65% of database interview evaluations for full-stack developers."
  }
];

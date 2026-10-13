const { generateAiContent } = require("../config/ai");

function groundedFallbackActions(context) {
  const actions = [];

  // 1. Check high-demand market signal gaps
  if (context.marketSignals && context.marketSignals.highDemand && context.marketSignals.highDemand.length > 0) {
    const topMarketSkill = context.marketSignals.highDemand[0];
    actions.push({
      actionId: `action-market-${topMarketSkill.name.toLowerCase().replace(/\s+/g, '-')}`,
      title: `Close Market Demand Gap: ${topMarketSkill.name}`,
      description: `'${topMarketSkill.name}' is required in ${topMarketSkill.percentage}% of active ${context.targetRole || "Full Stack"} opportunities.`,
      type: "Skill",
      priority: "High",
      impactScore: 92,
      estimatedTime: "45 mins",
      confidence: 90,
      reason: `Required in ${topMarketSkill.percentage}% of active opportunities analyzed by CareerOS market intelligence.`,
      dependencies: [],
      targetUrl: "/roadmap",
      careerScoreAfterCompletion: Math.min(100, (context.careerScore || 70) + 6),
      jobReadinessAfterCompletion: Math.min(100, (context.careerScore || 70) + 9),
      rankScore: 99
    });
  }

  // 2. Check structured skill gaps or user priorities
  if (context.structuredGaps && context.structuredGaps.requirements) {
    const highPriorityGap = context.structuredGaps.requirements.find(
      g => (g.gapStatus === "Missing" || g.gapStatus === "Weak") && g.priority === "High"
    );

    if (highPriorityGap) {
      actions.push({
        actionId: `action-skill-${highPriorityGap.name.toLowerCase().replace(/\s+/g, '-')}`,
        title: `Close Core Skill Gap: ${highPriorityGap.name}`,
        description: `Address your ${highPriorityGap.gapStatus.toLowerCase()} capability on '${highPriorityGap.name}' required for target role: "${context.targetRole || "Full Stack Developer"}".`,
        type: "Skill",
        priority: "High",
        impactScore: 90,
        estimatedTime: highPriorityGap.estimatedEffort || "45 mins",
        confidence: highPriorityGap.confidence || 85,
        reason: highPriorityGap.evidence[0] || `Core requirement missing for ${context.targetRole}`,
        dependencies: highPriorityGap.dependencies || [],
        targetUrl: "/roadmap",
        careerScoreAfterCompletion: Math.min(100, (context.careerScore || 70) + 5),
        jobReadinessAfterCompletion: Math.min(100, (context.careerScore || 70) + 8),
        rankScore: 98
      });
    }
  }

  // 2. Check Resume analysis context
  if (!context.resumeContext) {
    actions.push({
      actionId: "action-resume-upload",
      title: "Upload Your Resume",
      description: "Upload a resume so CareerOS can measure ATS alignment against your target role.",
      type: "Resume",
      priority: "High",
      impactScore: 85,
      estimatedTime: "10 mins",
      confidence: 95,
      reason: "No resume analysis is persisted for this account.",
      dependencies: [],
      targetUrl: "/resume",
      careerScoreAfterCompletion: Math.min(100, (context.careerScore || 70) + 6),
      jobReadinessAfterCompletion: Math.min(100, (context.careerScore || 70) + 10),
      rankScore: 100
    });
  } else if (context.resumeContext.missingKeywords?.length > 0) {
    actions.push({
      actionId: "action-resume-keywords",
      title: "Address Resume Skill Gaps",
      description: `Review missing resume keywords: ${context.resumeContext.missingKeywords.slice(0, 5).join(", ")}.`,
      type: "Resume",
      priority: "High",
      impactScore: 80,
      estimatedTime: "30 mins",
      confidence: 90,
      reason: "These gaps were returned by the persisted resume analysis.",
      dependencies: [],
      targetUrl: "/resume",
      careerScoreAfterCompletion: Math.min(100, (context.careerScore || 70) + 4),
      jobReadinessAfterCompletion: Math.min(100, (context.careerScore || 70) + 6),
      rankScore: 90
    });
  }

  // 3. Check GitHub developer context
  if (!context.devContext) {
    actions.push({
      actionId: "action-github-connect",
      title: "Connect GitHub Profile",
      description: "Add and synchronize a GitHub profile so repository evidence can be evaluated.",
      type: "GitHub",
      priority: "High",
      impactScore: 85,
      estimatedTime: "15 mins",
      confidence: 90,
      reason: "No persisted GitHub developer profile exists for this account.",
      dependencies: [],
      targetUrl: "/portfolio",
      careerScoreAfterCompletion: Math.min(100, (context.careerScore || 70) + 5),
      jobReadinessAfterCompletion: Math.min(100, (context.careerScore || 70) + 8),
      rankScore: 88
    });
  } else if (context.devContext.missingPractices?.length > 0) {
    actions.push({
      actionId: "action-github-practice",
      title: "Review GitHub Evidence Gaps",
      description: `Review verified repository gaps: ${context.devContext.missingPractices.slice(0, 3).join("; ")}.`,
      type: "GitHub",
      priority: "Medium",
      impactScore: 75,
      estimatedTime: "30 mins",
      confidence: 85,
      reason: "These gaps came from the persisted GitHub repository analysis.",
      dependencies: [],
      targetUrl: "/portfolio",
      careerScoreAfterCompletion: Math.min(100, (context.careerScore || 70) + 3),
      jobReadinessAfterCompletion: Math.min(100, (context.careerScore || 70) + 5),
      rankScore: 75
    });
  }

  // 4. Check Mock Interview context
  if (context.interviewContext && context.interviewContext.repeatingMistakes?.length > 0) {
    const topMistake = context.interviewContext.repeatingMistakes[0].concept;
    actions.push({
      actionId: "action-interview-weakness",
      title: `Practice ${topMistake}`,
      description: `Target your recurring mock interview weakness on '${topMistake}' to increase your readiness score.`,
      type: "Interview",
      priority: "High",
      impactScore: 85,
      estimatedTime: "20 mins",
      confidence: 90,
      reason: `Mock interviews identified recurring weakness on ${topMistake}.`,
      dependencies: [],
      targetUrl: "/interview",
      careerScoreAfterCompletion: Math.min(100, (context.careerScore || 70) + 5),
      jobReadinessAfterCompletion: Math.min(100, (context.careerScore || 70) + 8),
      rankScore: 95
    });
  } else if (!context.interviewContext || context.interviewContext.completedCount === 0) {
    actions.push({
      actionId: "action-interview-first",
      title: "Complete First Mock Interview",
      description: `Run a mock interview for your target role "${context.targetRole || "Full Stack Developer"}" to evaluate technical readiness.`,
      type: "Interview",
      priority: "High",
      impactScore: 80,
      estimatedTime: "15 mins",
      confidence: 85,
      reason: "No completed mock interviews found for this user account.",
      dependencies: [],
      targetUrl: "/interview",
      careerScoreAfterCompletion: Math.min(100, (context.careerScore || 70) + 4),
      jobReadinessAfterCompletion: Math.min(100, (context.careerScore || 70) + 7),
      rankScore: 85
    });
  }

  return actions.sort((a, b) => b.rankScore - a.rankScore).slice(0, 3);
}

async function computeNextBestAction(careerContext) {
  const prompt = `You are the CareerOS Intelligence Engine.
Analyze the following user's Career Context (including growthMode, targetOutcome, structuredGaps, and interviewContext) and determine the top 3 Next Best Actions they should take to move toward their career goal.
Do NOT output predefined actions. Think dynamically based on their specific weaknesses, strengths, active jobs, growth mode, and missing developer practices.

User Career Context:
${JSON.stringify(careerContext, null, 2)}

Output a JSON array of 3 action objects. Each object MUST conform EXACTLY to this schema:
{
  "actionId": "A unique string ID, e.g. 'action-fix-github-docker'",
  "title": "Short, actionable title (max 6 words)",
  "description": "A tailored, motivating description of what they need to do",
  "type": "One of: 'Resume', 'GitHub', 'Interview', 'Application', 'Skill', 'Project'",
  "priority": "High, Medium, or Low",
  "impactScore": "Number 1-100 indicating impact on readiness",
  "estimatedTime": "E.g. '30 mins', '2 hours'",
  "confidence": "Number 1-100",
  "reason": "A highly specific, data-backed explanation of why this action is the absolute best next step for this user right now.",
  "dependencies": ["array of prerequisite actionIds if any"],
  "targetUrl": "Optional route string like '/resume', '/portfolio', '/interview', '/roadmap'",
  "careerScoreAfterCompletion": "Projected score (Number 1-100)",
  "jobReadinessAfterCompletion": "Projected readiness (Number 1-100)",
  "rankScore": "Number 1-100 representing priority order"
}

Ensure the array is sorted by rankScore descending.`;

  try {
    const geminiJson = await generateAiContent(
      prompt,
      "You are the CareerOS Next Best Action intelligence engine. Respond ONLY with a valid JSON array.",
      true
    );

    if (!geminiJson) return groundedFallbackActions(careerContext);

    const actions = JSON.parse(geminiJson);
    return Array.isArray(actions) ? actions : [actions];
  } catch (err) {
    console.error("NBA Engine unavailable; using grounded CareerContext fallback:", err.message);
    return groundedFallbackActions(careerContext);
  }
}

module.exports = { computeNextBestAction, groundedFallbackActions };

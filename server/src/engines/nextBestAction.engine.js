const { generateAiContent } = require("../config/ai");

function groundedFallbackActions(context) {
  const actions = [];
  if (!context.resumeContext) {
    actions.push({
      actionId: "action-resume-upload",
      title: "Upload Your Resume",
      description: "Upload a resume so CareerOS can measure ATS alignment against your target role.",
      type: "Resume",
      priority: "High",
      impactScore: null,
      estimatedTime: "10 mins",
      confidence: null,
      reason: "No resume analysis is persisted for this account.",
      dependencies: [],
      careerScoreAfterCompletion: null,
      jobReadinessAfterCompletion: null,
      rankScore: 100
    });
  } else if (context.resumeContext.missingKeywords?.length > 0) {
    actions.push({
      actionId: "action-resume-keywords",
      title: "Address Resume Skill Gaps",
      description: `Review missing resume keywords: ${context.resumeContext.missingKeywords.slice(0, 5).join(", ")}.`,
      type: "Resume",
      priority: "High",
      impactScore: null,
      estimatedTime: "30 mins",
      confidence: null,
      reason: "These gaps were returned by the persisted resume analysis.",
      dependencies: [],
      careerScoreAfterCompletion: null,
      jobReadinessAfterCompletion: null,
      rankScore: 90
    });
  }

  if (!context.devContext) {
    actions.push({
      actionId: "action-github-connect",
      title: "Connect GitHub Profile",
      description: "Add and synchronize a GitHub profile so repository evidence can be evaluated.",
      type: "GitHub",
      priority: "High",
      impactScore: null,
      estimatedTime: "15 mins",
      confidence: null,
      reason: "No persisted GitHub developer profile exists for this account.",
      dependencies: [],
      careerScoreAfterCompletion: null,
      jobReadinessAfterCompletion: null,
      rankScore: 80
    });
  } else if (context.devContext.missingPractices?.length > 0) {
    actions.push({
      actionId: "action-github-practice",
      title: "Review GitHub Evidence Gaps",
      description: `Review verified repository gaps: ${context.devContext.missingPractices.slice(0, 3).join("; ")}.`,
      type: "GitHub",
      priority: "Medium",
      impactScore: null,
      estimatedTime: "30 mins",
      confidence: null,
      reason: "These gaps came from the persisted GitHub repository analysis.",
      dependencies: [],
      careerScoreAfterCompletion: null,
      jobReadinessAfterCompletion: null,
      rankScore: 70
    });
  }

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
      careerScoreAfterCompletion: null,
      jobReadinessAfterCompletion: null,
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
      careerScoreAfterCompletion: null,
      jobReadinessAfterCompletion: null,
      rankScore: 85
    });
  }

  return actions.sort((a, b) => b.rankScore - a.rankScore).slice(0, 3);
}

async function computeNextBestAction(careerContext) {
  const prompt = `You are the CareerOS Intelligence Engine.
Analyze the following user's Career Context and determine the top 3 Next Best Actions they should take to move toward their career goal.
Do NOT output predefined actions. Think dynamically based on their specific weaknesses, strengths, active jobs, and missing developer practices.

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

module.exports = { computeNextBestAction };

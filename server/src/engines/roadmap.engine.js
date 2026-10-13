const { generateAiContent } = require("../config/ai");

/**
 * Generates an interest-aware, market-aligned adaptive learning roadmap using Gemini LLM.
 *
 * @param {Object} careerContext - Unified CareerContext object
 * @returns {Promise<Object>} Generated Roadmap track structure
 */
async function generatePersonalizedRoadmap(careerContext) {
  const prompt = `You are the Senior Curriculum Architect for CareerOS, an AI Career Operating System.
Analyze the candidate's unified Career Context and generate a personalized 3-module adaptive learning track (Roadmap).

RULES FOR PERSONALIZATION:
1. MANDATORY VS INTEREST DISTINCTION:
   - Mandatory Core Role Skills (e.g., React, Node, TypeScript for Full Stack) and High Demand Market Signals MUST form the primary foundational modules.
   - USER INTERESTS (e.g. AI/ML, Automation, Cloud) MUST BE USED TO TAILOR PROJECTS, SPECIALIZATIONS, AND EXAMPLES.
   - DO NOT convert a user interest into a mandatory core requirement if the target role does not mandate it.
     Example: If Target Role = "Full Stack Developer" and Interest = "AI / ML", generate "AI API Integration & Full-Stack AI Project", NOT "Linear Algebra & Neural Networks".
2. GROWTH MODE STRATEGY:
   - "JOB_READINESS": Focus on core technical stack, ATS keywords, baseline testing, and verified project evidence.
   - "INTERNSHIP_TO_FULLTIME": Focus on engineering practices, production testing, code quality, and team collaboration evidence.
   - "CAREER_PROGRESSION": Focus on high-throughput architecture, system design, performance optimization, and distributed patterns.
3. MARKET ALIGNMENT & PRIORITIES:
   - Prioritize missing high-demand market skills (${(careerContext.marketSignals?.highDemand || []).map(s => s.name).join(", ") || "TypeScript, Docker, Testing"}).
   - Respect explicit candidate user priorities: ${(careerContext.userPriorities || []).join(", ") || "None specified"}.

Candidate Career Context:
${JSON.stringify({
  targetRole: careerContext.targetRole,
  growthMode: careerContext.growthMode,
  experienceLevel: careerContext.experienceLevel,
  interests: careerContext.interests,
  userPriorities: careerContext.userPriorities,
  userCustomGaps: careerContext.userCustomGaps,
  skillsPossessed: careerContext.skillsPossessed,
  structuredGaps: careerContext.structuredGaps?.requirements?.slice(0, 8),
  marketSignals: careerContext.marketSignals,
  activeJobs: careerContext.activeJobs?.slice(0, 3)
}, null, 2)}

Output a JSON object conforming EXACTLY to this schema:
{
  "id": "personalized-track-1",
  "title": "Adaptive [Target Role] Track",
  "reasoning": "A concise explanation of why this roadmap was generated, highlighting how market demand, gaps, and user interests were balanced.",
  "modules": [
    {
      "id": "mod-1",
      "title": "Module 1 Title (Core Role Requirements)",
      "subSkills": [
        {
          "id": "mod-1-sub-1",
          "title": "Specific concept or task title",
          "xpReward": 50,
          "time": "2 Hours",
          "prerequisite": "None",
          "unlocks": "Next Milestone",
          "explanation": "Detailed reasoning why this milestone is required based on role gaps or market demand.",
          "tip": "Actionable learning recommendation",
          "resources": ["Official Documentation / Hands-on Project"]
        }
      ]
    }
  ]
}

Ensure you ONLY output a valid JSON object without markdown formatting.`;

  try {
    const geminiJson = await generateAiContent(
      prompt,
      "You are the CareerOS personalized adaptive roadmap generator. Respond ONLY with a valid JSON object.",
      true
    );

    if (!geminiJson) {
      throw new Error("Gemini returned empty response for Roadmap generation");
    }

    const parsed = JSON.parse(geminiJson);
    return parsed;
  } catch (err) {
    console.error("[RoadmapEngine] Gemini generation error, falling back to template:", err.message);
    const { getTemplatesForGoal } = require("../config/roadmaps");
    const fallbackTemplate = getTemplatesForGoal(careerContext.targetRole)[0];
    return {
      id: fallbackTemplate.id || "personalized-track-1",
      title: fallbackTemplate.title || `Personalized ${careerContext.targetRole} Track`,
      reasoning: `Grounded fallback roadmap for ${careerContext.targetRole}.`,
      modules: fallbackTemplate.modules || []
    };
  }
}

module.exports = { generatePersonalizedRoadmap };

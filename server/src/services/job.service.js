const User = require("../models/User");
const Resume = require("../models/Resume");
const ResumeAnalysis = require("../models/ResumeAnalysis");
const DeveloperProfile = require("../models/DeveloperProfile");
const JobOpportunity = require("../models/JobOpportunity");
const JobAnalysis = require("../models/JobAnalysis");


const { extractKeywords } = require("../engines/job/keyword.engine");
const { auditResumeGaps } = require("../engines/job/resumeGap.engine");
const { auditProjectGaps } = require("../engines/job/projectGap.engine");
const { matchJobKeywords } = require("../engines/job/jobMatcher.engine");
const { calculateApplicationScore } = require("../engines/job/applicationScore.engine");

const { toJobOpportunityDTO } = require("../dto/jobOpportunity.dto");
const { recalculateUserStats } = require("./career.service");

// 1. Ingest, Match, and Save Job Opportunity
async function matchAndSaveJob(userId, jobData) {
  const { title, company, description, url, location, salaryRange, status } = jobData;

  if (!title || !company || !description || !url || !/^https?:\/\//i.test(url)) {
    throw new Error("A verified opportunity requires a title, company, description, and HTTP(S) URL.");
  }

  try {
    const userDoc = await User.findById(userId);
    const resume = await Resume.findOne({ userId }).sort({ uploadDate: -1 });
    const resumeAnalysis = resume 
      ? await ResumeAnalysis.findOne({ userId, resumeId: resume._id }) 
      : null;
    const devProfile = await DeveloperProfile.findOne({ userId });

    const { getCareerContext } = require("./careerContext.service");
    const userContext = await getCareerContext(userId);

    // 3. Match and Analyze JD using Gemini API
    const targetRole = userContext.targetRole || "the user's target role";
    const prompt = `We are matching a Job Description for a "${title}" at "${company}" against a candidate's full Career Context.
Job Description:
"${description}"

Candidate's Complete Career Context:
${JSON.stringify(userContext, null, 2)}

Analyze the job description and candidate's full profile (including their resume, github, and roadmap). Find the match scores, gaps, and next recommended actions.
Output a JSON object conforming exactly to this structure:
{
  "skills": ["React", "TypeScript", "Node.js"],
  "matchScore": 82,
  "skillGap": ["Docker", "Jest"],
  "resumeScore": 85,
  "githubScore": 80,
  "portfolioScore": 75,
  "experienceGap": "Matched",
  "salaryFit": 100,
  "recommendation": "Strong Match. Apply soon.",
  "nextActions": [
    {
      "gap": "Docker missing in Resume",
      "evidence": "Docker is requested but not found in your resume text.",
      "priority": "High",
      "expectedImpact": 4
    }
  ]
}`;

    const { generateAiContent } = require("../config/ai");
    const geminiJson = await generateAiContent(prompt, "You are a professional recruiting parser. Respond only in valid JSON.", true);
    
    let jdSkills = null;
    let scoreData = null;

    if (geminiJson) {
      try {
        const parsed = JSON.parse(geminiJson);
        jdSkills = parsed.skills || ["React", "Node.js"];
        scoreData = {
          matchScore: parsed.matchScore || 70,
          skillGap: parsed.skillGap || [],
          resumeScore: parsed.resumeScore || 70,
          githubScore: parsed.githubScore || 70,
          portfolioScore: parsed.portfolioScore || 70,
          experienceGap: parsed.experienceGap || "Matched",
          salaryFit: parsed.salaryFit || 100,
          recommendation: parsed.recommendation || "Consider applying",
          nextActions: parsed.nextActions || []
        };
      } catch (e) {
        console.error("Failed to parse Gemini JD match JSON:", e);
      }
    }

    // Local Fallback if Gemini failed
    if (!jdSkills || !scoreData) {
      jdSkills = extractKeywords(description);
      const resumeText = userContext.resumeText || resume?.parsedText || "";
      const resumeGap = auditResumeGaps(jdSkills, resumeText);
      const techEvidence = devProfile ? devProfile.languageDistribution : {
        hasAuth: resumeAnalysis ? (resumeAnalysis.breakdown?.keywords || 0) > 80 : false,
        hasDatabase: false,
        hasRestApi: false,
        hasDocker: false,
        hasTesting: false,
        hasDevOps: false
      };
      const projectGap = auditProjectGaps(jdSkills, techEvidence);
      const userSkills = userContext.skills || [];
      const keywordMatch = matchJobKeywords(jdSkills, userSkills);
      const rawScore = calculateApplicationScore(
        resumeGap,
        projectGap,
        keywordMatch,
        70,
        100
      );
      scoreData = {
        matchScore: rawScore.matchScore,
        skillGap: rawScore.skillGap,
        resumeScore: rawScore.resumeScore,
        githubScore: rawScore.githubScore,
        portfolioScore: rawScore.portfolioScore,
        experienceGap: rawScore.experienceGap,
        salaryFit: rawScore.salaryFit,
        recommendation: rawScore.recommendation,
        nextActions: rawScore.nextActions
      };
    }

    // 2. Save immutable Job Opportunity metadata
    const opportunity = await JobOpportunity.create({
      userId,
      title,
      company,
      url,
      location: location || "",
      salaryRange: salaryRange || "",
      description,
      status: status || "Saved",
      skills: jdSkills,
      lastAnalyzed: new Date()
    });

    // 4. Save Job Analysis document
    const analysis = await JobAnalysis.create({
      userId,
      jobOpportunityId: opportunity._id,
      matchScore: scoreData.matchScore,
      skillGap: scoreData.skillGap,
      resumeScore: scoreData.resumeScore,
      githubScore: scoreData.githubScore,
      portfolioScore: scoreData.portfolioScore,
      experienceGap: scoreData.experienceGap,
      salaryFit: scoreData.salaryFit,
      recommendation: scoreData.recommendation,
      nextActions: scoreData.nextActions
    });

    // 5. Force recalculate Career Score
    await recalculateUserStats(userId);

    return toJobOpportunityDTO(opportunity, analysis);
  } catch (err) {
    console.error("Job Service Error in matchAndSaveJob:", err);
    throw err;
  }
}

// 2. Fetch Active Job Opportunity Pipeline list
async function getJobPipeline(userId) {
  try {
    const opportunities = await JobOpportunity.find({ userId }).sort({ lastAnalyzed: -1 });
    const jobIds = opportunities.map(o => o._id);
    const analyses = await JobAnalysis.find({ jobOpportunityId: { $in: jobIds } });

    return opportunities.map(opp => {
      const analysis = analyses.find(a => a.jobOpportunityId.toString() === opp._id.toString());
      return toJobOpportunityDTO(opp, analysis);
    }).filter(Boolean);
  } catch (err) {
    console.error("Job Service Error in getJobPipeline:", err);
    throw err;
  }
}

// 3. Update Pipeline status stage
async function updateJobStatus(userId, opportunityId, status) {
  try {
    const opp = await JobOpportunity.findOneAndUpdate(
      { _id: opportunityId, userId },
      { status },
      { new: true }
    );
    if (!opp) return null;

    const analysis = await JobAnalysis.findOne({ jobOpportunityId: opportunityId });
    await recalculateUserStats(userId);

    return toJobOpportunityDTO(opp, analysis);
  } catch (err) {
    console.error("Job Service Error in updateJobStatus:", err);
    throw err;
  }
}

// 4. Delete opportunity
async function deleteJobOpportunity(userId, opportunityId) {
  try {
    await JobOpportunity.deleteOne({ _id: opportunityId, userId });
    await JobAnalysis.deleteOne({ jobOpportunityId: opportunityId });
    return true;
  } catch (err) {
    return false;
  }
}

module.exports = {
  matchAndSaveJob,
  getJobPipeline,
  updateJobStatus,
  deleteJobOpportunity
};

const User = require("../models/User");
const Resume = require("../models/Resume");
const ResumeAnalysis = require("../models/ResumeAnalysis");
const DeveloperProfile = require("../models/DeveloperProfile");
const JobOpportunity = require("../models/JobOpportunity");
const JobAnalysis = require("../models/JobAnalysis");
const { mockDb } = require("../config/mockDb");

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

  try {
    const userDoc = await User.findById(userId);
    const resume = await Resume.findOne({ userId }).sort({ uploadDate: -1 });
    const resumeAnalysis = resume 
      ? await ResumeAnalysis.findOne({ userId, resumeId: resume._id }) 
      : null;
    const devProfile = await DeveloperProfile.findOne({ userId });

    // 3. Match and Analyze JD using Gemini API
    const resumeText = resume ? resume.parsedText : "";
    const prompt = `We are matching a Job Description for a "${title}" at "${company}" against a candidate's profile.
Job Description:
"${description}"

Candidate's Resume Content:
"${resumeText}"

Candidate's Target Goal: "${targetRole}"
Candidate's Experience: "${userDoc ? userDoc.experience : "Intermediate"}"

Analyze the job description and candidate's details. Find the match scores, gaps, and next recommended actions.
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

    const { generateGeminiContent } = require("../config/gemini");
    const geminiJson = await generateGeminiContent(prompt, "You are a professional recruiting parser. Respond only in valid JSON.", true);
    
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
      const resumeGap = auditResumeGaps(jdSkills, resumeText);
      const techEvidence = devProfile ? devProfile.languageDistribution : {
        hasAuth: resumeAnalysis ? resumeAnalysis.breakdown.keywords > 80 : false,
        hasDatabase: true,
        hasRestApi: true,
        hasDocker: false,
        hasTesting: false,
        hasDevOps: false
      };
      const projectGap = auditProjectGaps(jdSkills, techEvidence);
      const userSkills = userDoc ? userDoc.skillsPossessed : ["React", "Express", "Node.js", "MongoDB"];
      const keywordMatch = matchJobKeywords(jdSkills, userSkills);
      const rawScore = calculateApplicationScore(
        resumeGap,
        projectGap,
        keywordMatch,
        90,
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
      title: title || "Frontend Developer",
      company: company || "Startup Inc",
      url: url || "",
      location: location || "Remote",
      salaryRange: salaryRange || "$100,000 - $120,000",
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
    // Offline local fallback
    const mockOpportunity = {
      id: `opportunity-${Date.now()}`,
      title: title || "Frontend Developer",
      company: company || "Startup Inc",
      url: url || "",
      location: location || "Remote",
      salaryRange: salaryRange || "$100k - $120k",
      status: status || "Saved",
      skills: ["React", "Node.js", "Docker", "Jest"],
      lastAnalyzed: new Date()
    };

    const mockAnalysis = {
      matchScore: 82,
      resumeScore: 90,
      githubScore: 80,
      portfolioScore: 70,
      experienceGap: "Matched",
      salaryFit: 100,
      recommendation: "Apply Now",
      nextActions: [
        { gap: "Missing Project Evidence: Docker", evidence: "No Dockerfile configurations found.", priority: "High", expectedImpact: 4 },
        { gap: "Missing Resume Keyword: Jest", evidence: "Not found in parsed resume text.", priority: "Medium", expectedImpact: 2 }
      ],
      skillGap: ["Docker", "Jest"],
      analyzedAt: new Date()
    };

    mockDb.user.score = Math.min(100, mockDb.user.score + 2);

    return toJobOpportunityDTO(mockOpportunity, mockAnalysis);
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
    // Offline local fallback
    return [];
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
    // Offline local fallback
    return null;
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

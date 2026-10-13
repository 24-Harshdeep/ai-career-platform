const Roadmap = require("../models/Roadmap");
const CareerProfile = require("../models/CareerProfile");
const LearningProgress = require("../models/LearningProgress");
const JobApplication = require("../models/JobApplication");
const Job = require("../models/Job");
const { getCareerContext } = require("./careerContext.service");
const { generatePersonalizedRoadmap } = require("../engines/roadmap.engine");
const { toRoadmapDTO } = require("../dto/roadmap.dto");

/**
 * Re-evaluates and adapts candidate's roadmap based on new career signals while preserving completed progress.
 *
 * @param {string} userId - User ObjectId string
 * @param {string} reason - Trigger reason string (e.g. 'TARGET_ROLE_CHANGED', 'RESUME_ANALYZED')
 * @returns {Promise<Array>} Array of updated Roadmap Track DTOs
 */
async function reevaluateRoadmap(userId, reason = "MANUAL_REEVALUATION") {
  try {
    const userContext = await getCareerContext(userId);
    let roadmapDoc = await Roadmap.findOne({ userId });

    // Fetch user completed progress logs to preserve completed status
    const progressLogs = await LearningProgress.find({ userId });
    const completedIds = new Set(
      progressLogs.filter((p) => p.completed).map((p) => p.subSkillId.toLowerCase().trim())
    );

    // Call Gemini LLM roadmap generator with updated CareerContext
    const generatedTrack = await generatePersonalizedRoadmap(userContext);

    // Preserve completed status for subSkills if matching concepts exist
    if (generatedTrack && generatedTrack.modules) {
      generatedTrack.modules.forEach((mod) => {
        if (mod.subSkills) {
          mod.subSkills.forEach((sub) => {
            const subTitleLower = (sub.title || "").toLowerCase().trim();
            const subIdLower = (sub.id || "").toLowerCase().trim();
            if (completedIds.has(subIdLower) || completedIds.has(subTitleLower)) {
              sub.completed = true;
            }
          });
        }
      });
    }

    if (!roadmapDoc) {
      roadmapDoc = await Roadmap.create({
        userId,
        id: generatedTrack.id || "personalized-track-1",
        title: generatedTrack.title || `Personalized ${userContext.targetRole} Track`,
        reasoning: generatedTrack.reasoning || `Tailored for ${userContext.targetRole} (${userContext.growthMode}).`,
        modules: generatedTrack.modules || [],
        versionNumber: 1,
        lastAdaptedReason: reason,
        changeHistory: [
          {
            versionNumber: 1,
            reason,
            summary: `Initial adaptive roadmap generated for ${userContext.targetRole}.`,
            timestamp: new Date()
          }
        ]
      });
    } else {
      const newVersion = (roadmapDoc.versionNumber || 1) + 1;
      const changeSummary = `Roadmap adapted (${reason}) for target role "${userContext.targetRole}". Growth mode: ${userContext.growthMode}.`;

      roadmapDoc.changeHistory.push({
        versionNumber: roadmapDoc.versionNumber || 1,
        reason: roadmapDoc.lastAdaptedReason || "INITIAL_GENERATION",
        summary: `Previous version ${roadmapDoc.versionNumber || 1} archived.`,
        timestamp: new Date()
      });

      roadmapDoc.versionNumber = newVersion;
      roadmapDoc.lastAdaptedReason = reason;
      roadmapDoc.title = generatedTrack.title || `Personalized ${userContext.targetRole} Track`;
      roadmapDoc.reasoning = generatedTrack.reasoning || `Tailored for ${userContext.targetRole} (${userContext.growthMode}).`;
      roadmapDoc.modules = generatedTrack.modules || [];

      await roadmapDoc.save();
    }

    return toRoadmapDTO([roadmapDoc], progressLogs);
  } catch (err) {
    console.error("[RoadmapAdaptationService] Error in reevaluateRoadmap:", err);
    throw err;
  }
}

/**
 * Adds job-specific missing requirements directly into candidate's custom gaps & triggers roadmap adaptation.
 *
 * @param {string} userId - Candidate ObjectId string
 * @param {string} jobId - Job ObjectId string
 * @param {Array<string>} skillsToAdd - List of missing skill names
 * @returns {Promise<Object>} Updated roadmap tracks DTO & summary
 */
async function addJobGapsToRoadmap(userId, jobId, skillsToAdd = []) {
  if (!skillsToAdd || skillsToAdd.length === 0) {
    throw new Error("No skills specified to add to roadmap.");
  }

  try {
    const profile = await CareerProfile.findOne({ userId });
    if (!profile) throw new Error("CareerProfile not found");

    let jobTitle = "Target Opportunity";
    const jobDoc = await Job.findById(jobId).lean();
    if (jobDoc) jobTitle = `${jobDoc.title} at ${jobDoc.company ? jobDoc.company.name : "Company"}`;

    const existingCustomTitles = new Set(
      (profile.userCustomGaps || []).map((g) => g.title.toLowerCase().trim())
    );

    const addedCount = [];
    skillsToAdd.forEach((skillName) => {
      const clean = skillName.trim();
      if (clean && !existingCustomTitles.has(clean.toLowerCase())) {
        profile.userCustomGaps.push({
          requirementId: `job-gap-${clean.toLowerCase().replace(/\s+/g, "-")}`,
          title: clean,
          category: "Job Requirement",
          source: `Target Job: ${jobTitle}`,
          priority: "High",
          addedAt: new Date()
        });
        addedCount.push(clean);
      }
    });

    await profile.save();

    // Mark application gap status if JobApplication exists
    await JobApplication.findOneAndUpdate(
      { userId, jobId },
      {
        $push: {
          extractedGaps: {
            $each: addedCount.map((s) => ({ skill: s, addedToRoadmap: true }))
          }
        }
      }
    );

    // Re-evaluate roadmap to inject newly added job gaps
    const updatedTracks = await reevaluateRoadmap(userId, `JOB_REQUIREMENTS_ADDED (${jobTitle})`);

    return {
      success: true,
      addedSkills: addedCount,
      jobTitle,
      roadmapTracks: updatedTracks
    };
  } catch (err) {
    console.error("[RoadmapAdaptationService] Error in addJobGapsToRoadmap:", err);
    throw err;
  }
}

module.exports = {
  reevaluateRoadmap,
  addJobGapsToRoadmap
};

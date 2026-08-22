const User = require("../models/User");
const LearningProgress = require("../models/LearningProgress");
const Recommendation = require("../models/Recommendation");


const { computeNextBestAction } = require("../engines/nextBestAction.engine");
const { toRecommendationListDTO } = require("../dto/recommendation.dto");
const { recalculateUserStats } = require("./career.service");

const { getCareerContext } = require("./careerContext.service");

// 2. Fetch Ranked Recommendations
async function getRankedRecommendations(userId) {
  const userContext = await getCareerContext(userId);
  const ranked = await computeNextBestAction(userContext);

  if (!ranked || ranked.length === 0) return [];

  const topGenerated = ranked[0];

  try {

    // Check MongoDB for active recommendation
    const activeRec = await Recommendation.findOne({ userId, status: "Active" });

    if (!activeRec || activeRec.actionId !== topGenerated.actionId) {
      // Deactivate old active recommendations
      if (activeRec) {
        activeRec.status = "Skipped";
        await activeRec.save();
      }

      // Persist the new top priority recommendation
      const newRec = await Recommendation.create({
        userId,
        actionId: topGenerated.actionId,
        title: topGenerated.title,
        description: topGenerated.description,
        type: topGenerated.type,
        priority: topGenerated.priority,
        impactScore: topGenerated.impactScore,
        estimatedTime: topGenerated.estimatedTime,
        confidence: topGenerated.confidence,
        reason: topGenerated.reason,
        dependencies: topGenerated.dependencies,
        status: "Active"
      });

      // Update the first element of ranked list with database model properties
      ranked[0] = { ...ranked[0], status: "Active" };
    } else {
      ranked[0] = { ...ranked[0], status: "Active" };
    }
    
    return toRecommendationListDTO(ranked);
  } catch (err) {
    console.error("Recommendation Service Error in getRankedRecommendations:", err);
    throw err;
  }
}

// 3. Mark recommendation as completed
async function completeRecommendation(userId, actionId) {
  try {
    const activeRec = await Recommendation.findOne({ userId, actionId, status: "Active" });
    if (activeRec) {
      activeRec.status = "Completed";
      activeRec.completedAt = new Date();
      await activeRec.save();
    }

    // Apply outcomes on user model properties
    const userDoc = await User.findById(userId);
    if (userDoc) {
      if (actionId === "action-resume-upload") userDoc.hasResumeScanned = true;
      if (actionId === "action-github-connect") userDoc.hasGithubScanned = true;
      if (actionId === "action-interview-mock") userDoc.masteredQuestionsCount += 1;
      await userDoc.save();
    }

    await recalculateUserStats(userId);
    return { success: true, message: "Recommendation resolved as completed." };
  } catch (err) {
    console.error("Recommendation Service Error in completeRecommendation:", err);
    throw err;
  }
}

// 4. Mark recommendation as skipped
async function skipRecommendation(userId, actionId) {
  try {
    const activeRec = await Recommendation.findOne({ userId, actionId, status: "Active" });
    if (activeRec) {
      activeRec.status = "Skipped";
      await activeRec.save();
    }
    return { success: true, message: "Recommendation marked as skipped." };
  } catch (err) {
    console.error("Recommendation Service Error in skipRecommendation:", err);
    throw err;
  }
}

// 5. Force recommendation regeneration
async function forceRegenerate(userId) {
  try {
    await Recommendation.updateMany({ userId, status: "Active" }, { status: "Skipped" });
    return await getRankedRecommendations(userId);
  } catch (err) {
    return await getRankedRecommendations(userId);
  }
}

module.exports = {
  getRankedRecommendations,
  completeRecommendation,
  skipRecommendation,
  forceRegenerate
};

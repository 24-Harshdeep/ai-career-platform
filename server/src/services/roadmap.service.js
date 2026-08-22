const User = require("../models/User");
const CareerProfile = require("../models/CareerProfile");
const LearningProgress = require("../models/LearningProgress");
const Achievement = require("../models/Achievement");


const { toRoadmapDTO } = require("../dto/roadmap.dto");
const { calculateMissionReward } = require("../engines/mission.engine");
const { calculateStreak } = require("../engines/streak.engine");
const { generatePersonalizedRoadmap } = require("../engines/roadmap.engine");
const { getCareerContext } = require("./careerContext.service");
const { recalculateUserStats } = require("./career.service");
const { logCareerEvent } = require("./analytics.service");
const Roadmap = require("../models/Roadmap");

// Find a sub-skill reward configuration across user templates
async function findSubSkillConfig(userId, subSkillId) {
  const track = await Roadmap.findOne({ userId });
  if (!track) return null;
  
  for (const mod of track.modules) {
    const match = mod.subSkills.find(sub => sub.id === subSkillId);
    if (match) return match;
  }
  return null;
}

// 1. Fetch User Roadmap Track DTOs
async function getUserRoadmapTracks(userId) {
  try {
    let track = await Roadmap.findOne({ userId });
    if (!track) {
      const userContext = await getCareerContext(userId);
      const generatedTrack = await generatePersonalizedRoadmap(userContext);
      
      track = await Roadmap.create({
        userId,
        id: generatedTrack.id,
        title: generatedTrack.title,
        modules: generatedTrack.modules
      });
    }

    const progressLogs = await LearningProgress.find({ userId });
    return toRoadmapDTO([track], progressLogs);
  } catch (err) {
    console.error("Roadmap Service Error in getUserRoadmapTracks:", err);
    throw err;
  }
}

// 2. Toggle Sub-Skill checklist masters
async function updateSubSkillMastery(userId, subSkillId, mastered) {
  try {
    const config = await findSubSkillConfig(userId, subSkillId);
    const xpReward = config ? config.xpReward : 50;

    // Upsert checklist record
    await LearningProgress.findOneAndUpdate(
      { userId, subSkillId },
      { 
        completed: mastered,
        completedAt: mastered ? new Date() : null,
        xpEarned: mastered ? xpReward : 0
      },
      { upsert: true, new: true }
    );

    // If mastered, award XP
    if (mastered) {
      const userDoc = await User.findById(userId);
      if (userDoc) {
        const newXp = userDoc.xp + xpReward;
        const newLevel = Math.floor(newXp / 1000) + 1;
        
        userDoc.xp = newXp;
        userDoc.level = newLevel;
        await userDoc.save();

        // Check if level achievement should unlock
        if (newLevel > 1) {
          await Achievement.findOneAndUpdate(
            { userId, achievementId: `level-${newLevel}` },
            { 
              title: `Level ${newLevel} Achieved`, 
              description: `Reached Level ${newLevel} on CareerOS!`
            },
            { upsert: true }
          );
        }
      }
    }

    // Log Activity Event for Real-Time Analytics
    await logCareerEvent(
      userId,
      `Roadmap Progress: ${subSkillId.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}`,
      "Roadmap Engine",
      5,
      { subSkillId, progress: mastered ? 100 : 0 }
    );

    // Force stats calculations updates
    await recalculateUserStats(userId);

    return await getUserRoadmapTracks(userId);
  } catch (err) {
    console.error("Roadmap Service Error in updateSubSkillMastery:", err);
    throw err;
  }
}

// 3. Complete Daily Mission checkpoints
async function completeDailyMission(userId, missionId) {
  try {
    const userDoc = await User.findById(userId);
    if (!userDoc) throw new Error("User document empty.");

    const Mission = require("../models/Mission");
    const mongoose = require("mongoose");
    let query = { userId };
    if (mongoose.Types.ObjectId.isValid(missionId)) {
      query._id = missionId;
    }

    let dbMission = null;
    if (query._id) {
      dbMission = await Mission.findOne(query);
    }

    // Fallback lookup for legacy/mock string IDs (like "m-1", "m-2")
    if (!dbMission && typeof missionId === "string" && missionId.startsWith("m-")) {
      const titles = {
        "m-1": "Build API Authentication (Complete JWT Module)",
        "m-2": "Optimize database index queries",
        "m-3": "Complete resume upload audit"
      };
      const title = titles[missionId];
      if (title) {
        dbMission = await Mission.findOne({ userId, title });
      }
    }

    if (dbMission) {
      dbMission.completed = true;
      await dbMission.save();
    }

    // Resolution values for scoring engine
    const mission = { 
      id: missionId, 
      xpReward: 50, 
      scoreReward: dbMission ? dbMission.scoreReward : 3 
    };

    // Trigger mission engine
    const rewards = calculateMissionReward(mission, userDoc.xp, userDoc.level);

    // Trigger streak engine
    const today = new Date().toISOString().split("T")[0];
    const lastActivity = userDoc.updatedAt ? userDoc.updatedAt.toISOString().split("T")[0] : today;

    const streakData = calculateStreak({
      lastActivityDate: lastActivity,
      currentStreak: userDoc.streakDays,
      longestStreak: userDoc.longestStreak || 7,
      todayDate: today
    });

    // Update User parameters
    userDoc.xp = rewards.newXp + streakData.bonusXp;
    userDoc.level = rewards.newLevel;
    userDoc.streakDays = streakData.newStreak;
    userDoc.longestStreak = streakData.newLongestStreak;
    await userDoc.save();

    // Unlock achievement triggers if streak milestones hit
    if (streakData.newStreak >= 7) {
      await Achievement.findOneAndUpdate(
        { userId, achievementId: "streak-7" },
        { title: "7-Day Streak Complete", description: "Completed study checkmarks 7 days in a row!" },
        { upsert: true }
      );
    }

    // Log Activity Event for Real-Time Analytics
    await logCareerEvent(
      userId,
      `Completed Daily Mission`,
      "Mission Control",
      10,
      { missionId }
    );

    // Recalculate dashboard stats
    await recalculateUserStats(userId);

    return {
      success: true,
      xpGained: rewards.xpGained + streakData.bonusXp,
      streak: streakData.newStreak,
      level: rewards.newLevel
    };
  } catch (err) {
    console.error("Roadmap Service Error in completeDailyMission:", err);
    throw err;
  }
}

module.exports = {
  getUserRoadmapTracks,
  updateSubSkillMastery,
  completeDailyMission
};

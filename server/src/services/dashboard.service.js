const User = require("../models/User");
const CareerProfile = require("../models/CareerProfile");
const Mission = require("../models/Mission");


const { getCareerStats } = require("./career.service");
const { getRankedRecommendations } = require("./recommendation.service");
const { toDashboardDTO } = require("../dto/dashboard.dto");

async function getDashboardData(userId) {
  try {
    let userDoc = await User.findById(userId);
    if (!userDoc) {
      throw new Error("User not found");
    }
    const profileDoc = await CareerProfile.findOne({ userId });
    
    const stats = await getCareerStats(userId);
    const recommendations = await getRankedRecommendations(userId);
    const topRecommendation = recommendations.length > 0 ? recommendations[0] : null;
    
    // Inject the Next Best Action as the dashboard focus action
    if (topRecommendation) {
      stats.nextAction = topRecommendation;
    }
    
    const roadmapService = require("./roadmap.service");
    const actualRoadmapTracks = await roadmapService.getUserRoadmapTracks(userId);

    const dashboardRoadmap = actualRoadmapTracks.map(track => {
      const skills = [];
      if (track.modules) {
        track.modules.forEach(mod => {
          if (mod.subSkills) {
            mod.subSkills.forEach(sub => {
              if (skills.length < 3) {
                skills.push(sub.title);
              }
            });
          }
        });
      }
      return {
        id: track.id,
        title: track.title,
        progress: track.progress || 0,
        skills: skills.length > 0 ? skills : ["Core Concepts"]
      };
    });

    const { generateDailyMissions } = require("../engines/mission.engine");
    const { getCareerContext } = require("./careerContext.service");

    let dbMissions = await Mission.find({ userId, completed: false });
    
    // If user has less than 3 active missions, generate new ones dynamically using Gemini
    if (dbMissions.length < 3) {
      const userContext = await getCareerContext(userId);
      const generated = await generateDailyMissions(userContext);
      
      for (const m of generated) {
        if (dbMissions.length >= 3) break;
        const newMission = await Mission.create({
          userId,
          title: m.title,
          scoreReward: m.scoreReward,
          completed: false
        });
        dbMissions.push(newMission);
      }
    }

    const formattedMissions = dbMissions.map(m => ({
      id: m._id.toString(),
      title: m.title,
      completed: m.completed,
      scoreReward: m.scoreReward
    }));

    const jobService = require("./job.service");
    const actualApplications = await jobService.getJobPipeline(userId);

    const dashboardPayload = {
      user: userDoc,
      profile: profileDoc,
      roadmap: dashboardRoadmap,
      missions: formattedMissions,
      applications: actualApplications || [],
      notifications: [],
      stats
    };

    return toDashboardDTO(dashboardPayload);
  } catch (err) {
    console.error("Dashboard Service Error:", err);
    throw err;
  }
}

module.exports = { getDashboardData };

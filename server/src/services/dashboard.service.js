const User = require("../models/User");
const CareerProfile = require("../models/CareerProfile");
const Mission = require("../models/Mission");
const { isDemoUser, isDemoEmail } = require("../utils/demoUser");


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

    const isDemo = isDemoUser(userId) || (userDoc && isDemoEmail(userDoc.email));

    let dbMissions = await Mission.find({ userId, completed: false });

    // For demo users: never call Gemini — serve static fallback missions to avoid
    // unnecessary AI spend and to keep the shared demo dataset stable.
    if (dbMissions.length < 3) {
      if (isDemo) {
        const staticMissions = [
          { title: "Practice one TypeScript advanced generics challenge", scoreReward: 3 },
          { title: "Review Kubernetes Deployment YAML configuration", scoreReward: 4 },
          { title: "Add optimistic UI update to CareerSync using useOptimistic()", scoreReward: 3 }
        ];
        for (const m of staticMissions) {
          if (dbMissions.length >= 3) break;
          const exists = await Mission.findOne({ userId, title: m.title });
          if (!exists) {
            const newMission = await Mission.create({ userId, ...m, completed: false });
            dbMissions.push(newMission);
          }
        }
      } else {
        const { generateDailyMissions } = require("../engines/mission.engine");
        const { getCareerContext } = require("./careerContext.service");
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

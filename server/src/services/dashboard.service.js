const User = require("../models/User");
const CareerProfile = require("../models/CareerProfile");
const { mockDb } = require("../config/mockDb");

const { getCareerStats } = require("./career.service");
const { getRankedRecommendations } = require("./recommendation.service");
const { toDashboardDTO } = require("../dto/dashboard.dto");

async function getDashboardData(userId) {
  try {
    const userDoc = await User.findById(userId);
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

    const dashboardPayload = {
      user: userDoc,
      profile: profileDoc,
      roadmap: dashboardRoadmap,
      missions: [
        { id: "m-1", title: "Build API Authentication (Complete JWT Module)", completed: false, scoreReward: 3 },
        { id: "m-2", title: "Optimize database index queries", completed: false, scoreReward: 2 },
        { id: "m-3", title: "Complete resume upload audit", completed: true, scoreReward: 1 }
      ],
      applications: [],
      notifications: [],
      stats
    };

    return toDashboardDTO(dashboardPayload);
  } catch (err) {
    // Offline local fallback using mockDb config parameters
    const stats = await getCareerStats(userId);
    const recommendations = await getRankedRecommendations(userId);
    const topRecommendation = recommendations.length > 0 ? recommendations[0] : null;
    
    if (topRecommendation) {
      stats.nextAction = topRecommendation;
    }
    
    const dashboardPayload = {
      user: mockDb.user,
      profile: mockDb.profile,
      roadmap: mockDb.roadmap,
      missions: mockDb.missions,
      applications: mockDb.applications,
      notifications: mockDb.notifications,
      stats
    };

    return toDashboardDTO(dashboardPayload);
  }
}

module.exports = { getDashboardData };

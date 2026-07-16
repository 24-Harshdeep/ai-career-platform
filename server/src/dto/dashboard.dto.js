const { toUserDTO } = require("./user.dto");
const { toCareerProfileDTO } = require("./careerProfile.dto");

function toDashboardDTO(data) {
  return {
    user: toUserDTO(data.user),
    profile: toCareerProfileDTO(data.profile),
    roadmap: data.roadmap || [],
    missions: data.missions || [],
    applications: data.applications || [],
    notifications: data.notifications || [],
    stats: {
      score: data.stats.score,
      breakdown: data.stats.breakdown,
      nextAction: data.stats.nextAction,
      readiness: data.stats.readiness,
      timeline: data.stats.timeline
    }
  };
}

module.exports = { toDashboardDTO };

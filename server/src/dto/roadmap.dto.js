function toRoadmapDTO(tracks, userProgress) {
  const progressList = userProgress || [];
  
  return tracks.map(track => {
    let completedSubSkills = 0;
    let totalSubSkills = 0;

    const formattedModules = track.modules.map(mod => {
      const formattedSubSkills = mod.subSkills.map(sub => {
        totalSubSkills += 1;
        const progressRecord = progressList.find(p => p.subSkillId === sub.id);
        const mastered = progressRecord ? progressRecord.completed : false;
        
        if (mastered) {
          completedSubSkills += 1;
        }

        return {
          id: sub.id,
          title: sub.title,
          xpReward: sub.xpReward,
          mastered,
          completedAt: progressRecord ? progressRecord.completedAt : null
        };
      });

      return {
        id: mod.id,
        title: mod.title,
        subSkills: formattedSubSkills
      };
    });

    const progressPercentage = totalSubSkills > 0 
      ? Math.round((completedSubSkills / totalSubSkills) * 100) 
      : 0;

    return {
      id: track.id,
      title: track.title,
      progress: progressPercentage,
      modules: formattedModules
    };
  });
}

module.exports = { toRoadmapDTO };

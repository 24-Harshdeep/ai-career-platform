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
          completedAt: progressRecord ? progressRecord.completedAt : null,
          time: sub.time || "2 Hours",
          scoreGain: sub.scoreGain || 3,
          prerequisite: sub.prerequisite || "None",
          unlocks: sub.unlocks || "Next Step",
          explanation: sub.explanation || "",
          tip: sub.tip || "",
          resources: sub.resources || []
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
      reasoning: track.reasoning || "",
      progress: progressPercentage,
      modules: formattedModules
    };
  });
}

module.exports = { toRoadmapDTO };

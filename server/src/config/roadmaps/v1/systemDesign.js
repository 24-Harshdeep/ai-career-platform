const systemDesignTrack = {
  id: "system-design-v1",
  title: "System Design & Operations Track",
  modules: [
    {
      id: "sd-m1",
      title: "Data Management Scales",
      subSkills: [
        { id: "sd-sub-1", title: "Redis memory cache policies", xpReward: 50 },
        { id: "sd-sub-2", title: "Database indexing execution plans", xpReward: 50 }
      ]
    },
    {
      id: "sd-m2",
      title: "Container & CI/CD Pipelines",
      subSkills: [
        { id: "sd-sub-3", title: "Docker multi-stage compilation builds", xpReward: 40 },
        { id: "sd-sub-4", title: "GitHub Actions automated pipelines", xpReward: 50 }
      ]
    }
  ]
};

module.exports = systemDesignTrack;

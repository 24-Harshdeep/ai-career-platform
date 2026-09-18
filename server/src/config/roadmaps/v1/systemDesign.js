const systemDesignTrack = {
  id: "system-design-v1",
  title: "System Design & Operations Track",
  reasoning: "Redis caching, database indexing execution plans, and Docker containerization build senior production engineering evidence.",
  modules: [
    {
      id: "sd-m1",
      title: "Data Management Scales",
      subSkills: [
        {
          id: "sd-sub-1",
          title: "Redis memory cache policies",
          xpReward: 50,
          time: "2 Hours",
          scoreGain: 4,
          prerequisite: "Database basics",
          unlocks: "Database indexing execution plans",
          explanation: "Redis in-memory caching intercepts intensive database read traffic, serving cached records in sub-millisecond rates.",
          tip: "Select cache eviction strategies like LRU (Least Recently Used) and enforce strict key TTL expirations.",
          resources: ["https://redis.io/docs/manual/eviction/"]
        },
        {
          id: "sd-sub-2",
          title: "Database indexing execution plans",
          xpReward: 50,
          time: "2.5 Hours",
          scoreGain: 4,
          prerequisite: "Redis memory cache",
          unlocks: "Docker multi-stage builds",
          explanation: "Query execution plans show index scans vs. table scans, pinpointing database query execution bottlenecks.",
          tip: "Always run EXPLAIN ANALYZE on slow query statements to trace the underlying scans and index coverage.",
          resources: ["https://www.postgresql.org/docs/current/using-explain.html"]
        }
      ]
    },
    {
      id: "sd-m2",
      title: "Container & CI/CD Pipelines",
      subSkills: [
        {
          id: "sd-sub-3",
          title: "Docker multi-stage compilation builds",
          xpReward: 40,
          time: "3 Hours",
          scoreGain: 4,
          prerequisite: "Database indexing",
          unlocks: "GitHub Actions automated pipelines",
          explanation: "Docker multi-stage compilation builds compile source code in builder containers, keeping target images tiny and fast.",
          tip: "Utilize distinct cache layers for dependencies to avoid slow container rebuild cycles.",
          resources: ["https://docs.docker.com/build/building/multi-stage/"]
        },
        {
          id: "sd-sub-4",
          title: "GitHub Actions automated pipelines",
          xpReward: 50,
          time: "2 Hours",
          scoreGain: 4,
          prerequisite: "Docker multi-stage builds",
          unlocks: "System Design Track Completion",
          explanation: "CI/CD pipelines automate testing, building, and deployment procedures on commit, ensuring continuous delivery.",
          tip: "Use matrices in GitHub Actions jobs to run automated test suites in parallel.",
          resources: ["https://docs.github.com/en/actions"]
        }
      ]
    }
  ]
};

module.exports = systemDesignTrack;

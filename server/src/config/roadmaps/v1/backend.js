const backendTrack = {
  id: "backend-v1",
  title: "Backend Engineering Track",
  modules: [
    {
      id: "be-m1",
      title: "API Design & Routing",
      subSkills: [
        { id: "be-sub-1", title: "Express REST Router endpoints", xpReward: 40 },
        { id: "be-sub-2", title: "Zod request schema validation", xpReward: 30 }
      ]
    },
    {
      id: "be-m2",
      title: "Authentication & Security",
      subSkills: [
        { id: "be-sub-3", title: "Bcrypt secure password hashing", xpReward: 50 },
        { id: "be-sub-4", title: "JWT token verification & middleware", xpReward: 50 },
        { id: "be-sub-5", title: "Rate limiting and Helmet headers", xpReward: 40 }
      ]
    }
  ]
};

module.exports = backendTrack;

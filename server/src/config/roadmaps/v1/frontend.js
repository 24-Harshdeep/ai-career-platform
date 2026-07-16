const frontendTrack = {
  id: "frontend-v1",
  title: "Frontend Engineering Track",
  modules: [
    {
      id: "fe-m1",
      title: "React 19 & Next.js App Router",
      subSkills: [
        { id: "fe-sub-1", title: "React Server Components rendering", xpReward: 50 },
        { id: "fe-sub-2", title: "Actions and useActionState hooks", xpReward: 40 },
        { id: "fe-sub-3", title: "Optimistic UI State updates", xpReward: 40 }
      ]
    },
    {
      id: "fe-m2",
      title: "Tailwind CSS v4 Layouts",
      subSkills: [
        { id: "fe-sub-4", title: "CSS Container Queries styling", xpReward: 30 },
        { id: "fe-sub-5", title: "View Transitions API animations", xpReward: 50 }
      ]
    }
  ]
};

module.exports = frontendTrack;

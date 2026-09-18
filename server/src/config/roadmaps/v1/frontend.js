const frontendTrack = {
  id: "frontend-v1",
  title: "Frontend Engineering Track",
  reasoning: "Target roles like Full Stack and Frontend Developer require modern React 19 App Router and Tailwind CSS layout execution.",
  modules: [
    {
      id: "fe-m1",
      title: "React 19 & Next.js App Router",
      subSkills: [
        {
          id: "fe-sub-1",
          title: "React Server Components rendering",
          xpReward: 50,
          time: "2.5 Hours",
          scoreGain: 4,
          prerequisite: "React Basics",
          unlocks: "Actions & useActionState",
          explanation: "React Server Components execute logic exclusively on the server, avoiding massive JavaScript package downloads for high speed.",
          tip: "Keep stateful operations (useState, useEffect) in separate client components to maximize RSC optimization.",
          resources: ["https://react.dev/reference/rsc/server-components", "https://nextjs.org/docs/app/building-your-application/rendering/server-components"]
        },
        {
          id: "fe-sub-2",
          title: "Actions and useActionState hooks",
          xpReward: 40,
          time: "2 Hours",
          scoreGain: 3,
          prerequisite: "React Server Components",
          unlocks: "Optimistic UI updates",
          explanation: "React 19 form actions handle asynchronous mutations and native error states natively, reducing client boilerplate code.",
          tip: "Use the new useActionState hook to manage validation states directly from form actions.",
          resources: ["https://react.dev/reference/react/useActionState", "https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations"]
        },
        {
          id: "fe-sub-3",
          title: "Optimistic UI State updates",
          xpReward: 40,
          time: "1.5 Hours",
          scoreGain: 3,
          prerequisite: "Actions & useActionState",
          unlocks: "Frontend Track Completion",
          explanation: "Optimistic UI state updates simulate successful responses instantly before network promises settle, yielding zero user latency.",
          tip: "Use the useOptimistic hook to instantly render changes during network requests.",
          resources: ["https://react.dev/reference/react/useOptimistic"]
        }
      ]
    },
    {
      id: "fe-m2",
      title: "Tailwind CSS v4 Layouts",
      subSkills: [
        {
          id: "fe-sub-4",
          title: "CSS Container Queries styling",
          xpReward: 30,
          time: "2 Hours",
          scoreGain: 3,
          prerequisite: "Basic CSS layout grid",
          unlocks: "View Transitions API",
          explanation: "Container queries apply styles based on the size of a parent element container rather than the global viewport width.",
          tip: "Use container queries with inline-size parameters to build highly reusable standalone layout components.",
          resources: ["https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_container_queries"]
        },
        {
          id: "fe-sub-5",
          title: "View Transitions API animations",
          xpReward: 50,
          time: "3 Hours",
          scoreGain: 4,
          prerequisite: "CSS Container Queries",
          unlocks: "UI animation benchmarks",
          explanation: "View Transitions API automates animations between DOM mutations, transforming standard transitions into fluid app wipes.",
          tip: "Always check document.startViewTransition compatibility and supply fallback transitions for older engines.",
          resources: ["https://developer.mozilla.org/en-US/docs/Web/API/View_Transitions_API"]
        }
      ]
    }
  ]
};

module.exports = frontendTrack;

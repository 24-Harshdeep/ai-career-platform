import { create } from "zustand";
import {
  UserProfile,
  RoadmapModule,
  Mission,
  JobApplication,
  Notification,
  ChatMessage,
} from "@/types";

interface CareerState {
  user: UserProfile;
  roadmap: RoadmapModule[];
  missions: Mission[];
  applications: JobApplication[];
  notifications: Notification[];
  chatHistory: ChatMessage[];

  // Actions
  updateGoal: (goal: string) => void;
  updateExperience: (exp: UserProfile["experience"]) => void;
  updateScore: (points: number) => void;
  completeMission: (id: string) => void;
  addApplication: (app: Omit<JobApplication, "id" | "dateApplied">) => void;
  updateApplicationStatus: (id: string, status: JobApplication["status"]) => void;
  addNotification: (message: string, type: Notification["type"]) => void;
  markNotificationsRead: () => void;
  addChatMessage: (sender: ChatMessage["sender"], text: string) => void;
}

export const useCareerStore = create<CareerState>((set) => ({
  user: {
    name: "Harshdeep",
    avatar: "",
    email: "harshdeep@careeros.dev",
    role: "Full Stack Developer",
    goal: "Full Stack Developer",
    experience: "Intermediate",
    score: 76,
    scoreTrend: 4,
  },
  roadmap: [
    {
      id: "rm-1",
      title: "Frontend Development",
      progress: 90,
      skills: ["React/Next.js", "Tailwind CSS", "TypeScript", "Performance Tuning"],
    },
    {
      id: "rm-2",
      title: "Backend Development",
      progress: 65,
      skills: ["Node.js/Express", "PostgreSQL", "JWT Authentication", "API Design"],
    },
    {
      id: "rm-3",
      title: "System Design",
      progress: 30,
      skills: ["Caching (Redis)", "Microservices", "Load Balancing", "DB Sharding"],
    },
  ],
  missions: [
    {
      id: "m-1",
      title: "Build API Authentication (Complete JWT Module)",
      completed: false,
      scoreReward: 3,
    },
    {
      id: "m-2",
      title: "Optimize database index queries",
      completed: false,
      scoreReward: 2,
    },
    {
      id: "m-3",
      title: "Complete resume upload audit",
      completed: true,
      scoreReward: 1,
    },
  ],
  applications: [
    {
      id: "app-1",
      company: "Vercel",
      role: "Frontend Engineer",
      matchScore: 92,
      status: "Applied",
      dateApplied: "2026-07-10",
    },
    {
      id: "app-2",
      company: "Stripe",
      role: "Full Stack Engineer",
      matchScore: 87,
      status: "Interview",
      dateApplied: "2026-07-08",
    },
    {
      id: "app-3",
      company: "Linear",
      role: "Product Engineer",
      matchScore: 79,
      status: "Offer",
      dateApplied: "2026-07-01",
    },
  ],
  notifications: [
    {
      id: "n-1",
      message: "7 Day Learning Streak! Keep building momentum.",
      type: "streak",
      read: false,
      createdAt: "2h ago",
    },
    {
      id: "n-2",
      message: "Resume successfully scanned! ATS Score: 82%",
      type: "success",
      read: true,
      createdAt: "1d ago",
    },
    {
      id: "n-3",
      message: "New recommended action: complete backend authentication",
      type: "info",
      read: false,
      createdAt: "3d ago",
    },
  ],
  chatHistory: [
    {
      id: "msg-1",
      sender: "coach",
      text: "Welcome Harshdeep! I am your AI Career Coach. I analyzed your profile and GitHub activity. Your frontend skills are strong, but backend architecture is your highest priority right now.",
      timestamp: "10:00 AM",
    },
    {
      id: "msg-2",
      sender: "user",
      text: "How can I improve my backend score?",
      timestamp: "10:01 AM",
    },
    {
      id: "msg-3",
      sender: "coach",
      text: "To move the needle, focus on completing the JWT Authentication module (+3 points). I also recommend tackling database index optimization. Would you like me to draft a quick Roadmap for SQL indices?",
      timestamp: "10:01 AM",
    },
  ],

  // Actions implementation
  updateGoal: (goal) =>
    set((state) => ({
      user: { ...state.user, goal },
    })),

  updateExperience: (experience) =>
    set((state) => ({
      user: { ...state.user, experience },
    })),

  updateScore: (points) =>
    set((state) => {
      const newScore = Math.min(100, Math.max(0, state.user.score + points));
      return {
        user: {
          ...state.user,
          score: newScore,
          scoreTrend: state.user.scoreTrend + (points > 0 ? points : 0),
        },
      };
    }),

  completeMission: (id) =>
    set((state) => {
      let scoreChange = 0;
      const updatedMissions = state.missions.map((m) => {
        if (m.id === id && !m.completed) {
          scoreChange = m.scoreReward;
          return { ...m, completed: true };
        }
        return m;
      });

      // Update backend progress dynamically as missions are completed
      const updatedRoadmap = state.roadmap.map((module) => {
        if (module.id === "rm-2" && id === "m-1") {
          return { ...module, progress: Math.min(100, module.progress + 10) };
        }
        return module;
      });

      if (scoreChange > 0) {
        // Trigger notification
        const newNotif: Notification = {
          id: `n-${Date.now()}`,
          message: `Mission completed! +${scoreChange} Career Score.`,
          type: "success",
          read: false,
          createdAt: "Just now",
        };

        const newScore = Math.min(100, state.user.score + scoreChange);

        return {
          missions: updatedMissions,
          roadmap: updatedRoadmap,
          user: { ...state.user, score: newScore },
          notifications: [newNotif, ...state.notifications],
        };
      }

      return { missions: updatedMissions };
    }),

  addApplication: (app) =>
    set((state) => {
      const newApp: JobApplication = {
        ...app,
        id: `app-${Date.now()}`,
        dateApplied: new Date().toISOString().split("T")[0],
      };

      const newNotif: Notification = {
        id: `n-${Date.now()}`,
        message: `Applied to ${app.company} as ${app.role}. Match Score: ${app.matchScore}%`,
        type: "info",
        read: false,
        createdAt: "Just now",
      };

      return {
        applications: [newApp, ...state.applications],
        notifications: [newNotif, ...state.notifications],
      };
    }),

  updateApplicationStatus: (id, status) =>
    set((state) => {
      const targetApp = state.applications.find((a) => a.id === id);
      const updatedApps = state.applications.map((a) =>
        a.id === id ? { ...a, status } : a
      );

      const notificationMessage = targetApp
        ? `Application status for ${targetApp.company} updated to ${status}.`
        : `Application status updated to ${status}.`;

      const isOffer = status === "Offer";

      if (isOffer && targetApp) {
        const scoreBonus = 5;
        const newNotif: Notification = {
          id: `n-${Date.now()}`,
          message: `Offer received from ${targetApp.company}! Career Score +5!`,
          type: "success",
          read: false,
          createdAt: "Just now",
        };
        return {
          applications: updatedApps,
          user: { ...state.user, score: Math.min(100, state.user.score + scoreBonus) },
          notifications: [newNotif, ...state.notifications],
        };
      }

      const newNotif: Notification = {
        id: `n-${Date.now()}`,
        message: notificationMessage,
        type: "info",
        read: false,
        createdAt: "Just now",
      };

      return {
        applications: updatedApps,
        notifications: [newNotif, ...state.notifications],
      };
    }),

  addNotification: (message, type) =>
    set((state) => ({
      notifications: [
        {
          id: `n-${Date.now()}`,
          message,
          type,
          read: false,
          createdAt: "Just now",
        },
        ...state.notifications,
      ],
    })),

  markNotificationsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
    })),

  addChatMessage: (sender, text) =>
    set((state) => {
      const newMsg: ChatMessage = {
        id: `msg-${Date.now()}`,
        sender,
        text,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      return {
        chatHistory: [...state.chatHistory, newMsg],
      };
    }),
}));

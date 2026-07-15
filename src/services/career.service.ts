import { RoadmapModule, Mission, JobApplication } from "@/types";

// Simulating network latency
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const careerService = {
  async getScoreHistory(): Promise<{ week: string; score: number }[]> {
    await delay(300);
    return [
      { week: "Week 1", score: 62 },
      { week: "Week 2", score: 64 },
      { week: "Week 3", score: 65 },
      { week: "Week 4", score: 70 },
      { week: "Week 5", score: 72 },
      { week: "Week 6", score: 76 },
    ];
  },

  async getSkillBreakdown(): Promise<{ skill: string; val: number }[]> {
    await delay(300);
    return [
      { skill: "Frontend", val: 90 },
      { skill: "Backend", val: 65 },
      { skill: "System Design", val: 30 },
      { skill: "Database", val: 70 },
      { skill: "DevOps", val: 40 },
      { skill: "Testing", val: 25 },
    ];
  },

  async getWeeklyConsistency(): Promise<{ day: string; hours: number }[]> {
    await delay(300);
    return [
      { day: "Mon", hours: 2.5 },
      { day: "Tue", hours: 1.5 },
      { day: "Wed", hours: 3.0 },
      { day: "Thu", hours: 2.0 },
      { day: "Fri", hours: 1.0 },
      { day: "Sat", hours: 4.5 },
      { day: "Sun", hours: 2.0 },
    ];
  },
};

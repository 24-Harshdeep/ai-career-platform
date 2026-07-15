export interface UserProfile {
  name: string;
  avatar: string;
  email: string;
  role: string;
  goal: string;
  experience: "Beginner" | "Intermediate" | "Advanced";
  score: number;
  scoreTrend: number;
}

export interface RoadmapModule {
  id: string;
  title: string;
  progress: number; // 0 to 100
  skills: string[];
}

export interface Mission {
  id: string;
  title: string;
  completed: boolean;
  scoreReward: number;
}

export interface JobApplication {
  id: string;
  company: string;
  role: string;
  matchScore: number; // 0 to 100
  status: "Applied" | "Interview" | "Offer" | "Rejected";
  dateApplied: string;
  logo?: string;
}

export interface Notification {
  id: string;
  message: string;
  type: "success" | "warning" | "info" | "streak";
  read: boolean;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  sender: "user" | "coach";
  text: string;
  timestamp: string;
}

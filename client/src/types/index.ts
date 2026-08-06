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

export interface SubSkill {
  id: string;
  title: string;
  xpReward: number;
  mastered: boolean;
  completedAt: string | null;
}

export interface RoadmapSubModule {
  id: string;
  title: string;
  subSkills: SubSkill[];
}

export interface UserRoadmapTrack {
  id: string;
  title: string;
  progress: number;
  modules: RoadmapSubModule[];
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

export interface SkillSet {
  technical: string[];
  soft: string[];
  tools: string[];
  frameworks: string[];
  languages: string[];
  cloud: string[];
  devops: string[];
}

export interface CareerProfile {
  name?: string;
  email?: string;
  targetRole: string;
  experienceLevel: "Beginner" | "Intermediate" | "Advanced";
  careerGoal: string;
  currentPhase: string;
  strengths: string[];
  weaknesses: string[];
  skillsPossessed: SkillSet;
  skillsTarget: SkillSet;
  preferredLearningStyle: string;
  preferredJobType: string;
  targetCompanies: string[];
  isOnboardingComplete: boolean;
  aiPersonality?: string;
  aiResponseLength?: string;
  aiRecommendationFreq?: string;
  aiTemperature?: number;
  preferredIndustry?: string;
  countryLocale?: string;
  targetSalary?: string;
  workType?: string;
  githubUrl?: string;
  themeMode?: string;
  accentColor?: string;
  primaryResume?: string;
  primaryPortfolio?: string;
  linkedinUrl?: string;
  portfolioUrl?: string;
  updatedAt?: string;
}

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
  title?: string;
  description?: string;
  url?: string;
  location?: string;
  salaryRange?: string;
  jobDescription?: string;
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

export type GrowthMode = "SKILL_GROWTH" | "JOB_READINESS" | "INTERNSHIP_TO_FULLTIME" | "CAREER_PROGRESSION" | "ROLE_TRANSITION" | "CUSTOM";

export interface TargetOutcome {
  targetRole: string;
  growthMode: GrowthMode;
  goalDescription: string;
  targetSalary?: string;
  workType?: string;
}

export interface CareerRequirementItem {
  requirementId: string;
  name: string;
  category: string;
  currentLevel: "None" | "Beginner" | "Intermediate" | "Advanced";
  requiredLevel: "Beginner" | "Intermediate" | "Advanced";
  gapStatus: "Missing" | "Weak" | "Developing" | "Meets Requirement" | "Exceeds Requirement";
  priority: "High" | "Medium" | "Low";
  estimatedEffort: string;
  dependencies: string[];
  confidence: number;
  evidence: string[];
}

export interface InterestItem {
  name: string;
  category?: string;
  priority?: number;
}

export interface MarketSignalItem {
  name: string;
  count: number;
  percentage: number;
}

export interface MarketIntelligenceData {
  sampleSize: number;
  daysWindow: number;
  targetRole: string;
  topSkills: MarketSignalItem[];
  highDemand: MarketSignalItem[];
  growingDemand: MarketSignalItem[];
}

export interface CareerProfile {
  name?: string;
  email?: string;
  targetRole: string;
  growthMode?: GrowthMode;
  targetOutcome?: TargetOutcome;
  userPriorities?: string[];
  interests?: InterestItem[];
  userCustomGaps?: any[];
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

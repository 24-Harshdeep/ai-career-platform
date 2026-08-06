import { create } from "zustand";
import {
  UserProfile,
  UserRoadmapTrack,
  Mission,
  JobApplication,
  Notification,
  ChatMessage,
  CareerProfile,
  SkillSet,
} from "@/types";

export interface CareerStats {
  score: number;
  breakdown: Record<string, number>;
  nextAction: {
    actionId: string;
    title: string;
    description: string;
    type: string;
    priority: "High" | "Medium" | "Low";
    impact: number;
    estimatedTime: string;
    confidence: number;
    reason: string;
    dependencies: string[];
    careerScoreAfterCompletion: number;
    jobReadinessAfterCompletion: number;
    status: string;
  } | null;
  readiness: {
    jobReadiness: number;
    resumeReadiness: number;
    portfolioReadiness: number;
    interviewReadiness: number;
    recommendation: string;
  };
  timeline: {
    event: string;
    status: "Completed" | "Pending";
    date: string;
  }[];
}

export interface ResumeVersionInfo {
  versionNumber: number;
  title: string;
  optimizationGoal: string;
  createdAt: string;
}

export interface ResumeVersionContent {
  personalInfo: {
    name: string;
    email: string;
    phone: string;
    location: string;
    githubUrl: string;
    linkedinUrl: string;
    portfolioUrl: string;
  };
  summary: string;
  workExperience: {
    company: string;
    position: string;
    location: string;
    startDate: string;
    endDate: string;
    description: string;
    bulletPoints: string[];
  }[];
  projects: {
    title: string;
    technologies: string[];
    description: string;
    bulletPoints: string[];
    link: string;
  }[];
  skills: {
    languages: string[];
    frontend: string[];
    backend: string[];
    database: string[];
    tools: string[];
    other: string[];
  };
  education: {
    institution: string;
    degree: string;
    major: string;
    startDate: string;
    endDate: string;
    gpa: string;
  }[];
  achievements: string[];
  certifications: string[];
}

export interface ResumeChangeLogEntry {
  section: string;
  originalText: string;
  rewrittenText: string;
  reason: string;
}

export interface ResumeAnalysisData {
  resumeId: string;
  filename: string;
  activeVersionId: number;
  versionsList: ResumeVersionInfo[];
  activeVersionContent: ResumeVersionContent;
  atsScore: number;
  aiConfidence: number;
  breakdown: {
    keywords: number;
    projects: number;
    skills: number;
    formatting: number;
    actionVerbs: number;
    quantifiedImpact: number;
  };
  missingKeywords: {
    keyword: string;
    importance: "High" | "Medium" | "Low";
    reason: string;
    expectedScoreGain: number;
    expectedReadinessGain: number;
  }[];
  suggestedImprovements: string[];
  analyzedAt?: string;
  changeLogs?: ResumeChangeLogEntry[];
}


export interface DeveloperRepoData {
  id: string;
  name: string;
  description: string;
  url: string;
  language: string;
  stars: number;
  forks: number;
  healthScore: number;
  documentationScore: number;
  testingScore: number;
  architectureScore: number;
  activityScore: number;
  maintainabilityScore: number;
  securityScore: number;
}

export interface DeveloperProfileData {
  overallHealth: number;
  engineeringLevel: "Beginner" | "Intermediate" | "Advanced";
  repositoryCount: number;
  bestRepository: string;
  weakestRepository: string;
  careerImpact: number;
  jobReadinessImpact: number;
  repositories: DeveloperRepoData[];
  languageDistribution: Record<string, number>;
  technologyCoverage: {
    Frontend: number;
    Backend: number;
    Database: number;
    DevOps: number;
  };
  missingPractices: string[];
  strengths: string[];
  weaknesses: string[];
  recommendedProjects: string[];
  nextActions: string[];
}

export interface ProjectAnalysisData {
  projectId: string;
  title: string;
  url: string;
  projectType: string;
  deploymentPlatform: string;
  status: string;
  overallScore: number;
  performanceScore: number;
  accessibilityScore: number;
  seoScore: number;
  documentationScore: number;
  architectureScore: number;
  deploymentScore: number;
  technologyEvidence: {
    hasAuth: boolean;
    hasDatabase: boolean;
    hasRestApi: boolean;
    hasDocker: boolean;
    hasTesting: boolean;
    hasDevOps: boolean;
  };
  missingPractices: {
    gap: string;
    evidence: string;
    priority: "High" | "Medium" | "Low";
    expectedImpact: number;
  }[];
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  careerImpact: number;
  jobReadinessImpact: number;
  analyzedAt: string;
}

export interface JobOpportunityData {
  id: string;
  title: string;
  company: string;
  url: string;
  location: string;
  salaryRange: string;
  status: "Saved" | "Preparing" | "Applied" | "OA" | "Interview" | "Final Round" | "Offer" | "Rejected" | "Archived";
  remote: boolean;
  employmentType: string;
  experienceRequired: string;
  skills: string[];
  notes: string;
  favorite: boolean;
  matchScore: number;
  resumeScore: number;
  githubScore: number;
  portfolioScore: number;
  experienceGap: string;
  salaryFit: number;
  recommendation: "Apply Now" | "Wait";
  nextActions: {
    gap: string;
    evidence: string;
    priority: "High" | "Medium" | "Low";
    expectedImpact: number;
  }[];
  skillGap: string[];
  daysToReady: number;
  analyzedAt: string | null;
}

export interface InterviewFeedbackData {
  strengths: string[];
  weaknesses: string[];
  missedConcepts: string[];
  idealAnswer: string;
  improvementPlan: string;
  resources: string[];
}

export interface AnsweredQuestionData {
  questionId: string;
  answer: string;
  score: number;
  feedback: InterviewFeedbackData | null;
  duration: number;
}

export interface InterviewSessionData {
  id: string;
  role: string;
  type: "Technical" | "Behavioral" | "System Design" | "HR" | "Machine Coding" | "Resume Based" | "Project Discussion" | "Custom";
  difficulty: "Junior" | "Intermediate" | "Senior";
  status: "Active" | "Completed" | "Abandoned";
  startedAt: string;
  completedAt?: string;
  duration: number;
  overallScore: number;
  technicalScore: number;
  communicationScore: number;
  problemSolvingScore: number;
  confidenceScore: number;
  timeManagementScore: number;
  readinessIncrease: number;
  questions: AnsweredQuestionData[];
  feedbackSummary: string;
  recommendations: string[];
}

export interface InterviewMistakeData {
  concept: string;
  frequency: number;
  severity: "High" | "Medium" | "Low";
  lastSeen: string;
}

export interface InterviewQuestionItem {
  id: string;
  text: string;
  hints: string[];
}
export interface SkillDistribution {
  category: string;
  rating: number;
}

export interface AchievementBadge {
  id: string;
  title: string;
  description: string;
  badgeUrl: string;
  unlockedAt: string;
}

export interface ScorePrediction {
  targetScore: number;
  daysRemaining: number;
  requiredPractice: string;
}

export interface WeeklyReportDigest {
  summary: string;
  completedTasksCount: number;
  pointsEarned: number;
  nextWeekFocus: string[];
}

export interface CareerActivityEvent {
  id: string;
  eventType: string;
  source: string;
  pointsEarned: number;
  metadata: Record<string, any>;
  createdAt: string;
}

export interface AnalyticsDashboardData {
  careerScore: number;
  resumeScore: number;
  developerScore: number;
  projectScore: number;
  roadmapScore: number;
  interviewScore: number;
  weeklyGrowth: number;
  monthlyGrowth: number;
  streakDays: number;
  heatMapDays: number[];
  skillsDistribution: SkillDistribution[];
  strongestSkill: string;
  weakestSkill: string;
  achievements: AchievementBadge[];
  prediction: ScorePrediction | null;
  weeklyReport: WeeklyReportDigest | null;
  activityTimeline: CareerActivityEvent[];
}

interface CareerState {
  user: UserProfile;
  profile: CareerProfile | null;
  roadmap: UserRoadmapTrack[];
  missions: Mission[];
  applications: JobApplication[];
  notifications: Notification[];
  chatHistory: ChatMessage[];
  stats: CareerStats;
  resumeAnalysis: ResumeAnalysisData | null;
  developerProfile: DeveloperProfileData | null;
  projectHistory: ProjectAnalysisData[];
  jobPipeline: JobOpportunityData[];
  interviewSessions: InterviewSessionData[];
  activeInterviewSession: InterviewSessionData | null;
  currentInterviewQuestion: InterviewQuestionItem | null;
  interviewReadiness: number;
  unresolvedMistakes: InterviewMistakeData[];
  analyticsData: AnalyticsDashboardData | null;

  // Career Engine states
  hasResumeScanned: boolean;
  hasGithubScanned: boolean;
  projectsCount: number;
  skillsCount: number;
  masteredQuestionsCount: number;
  streakDays: number;

  // Actions
  fetchDashboardData: () => Promise<void>;
  fetchRoadmap: () => Promise<void>;
  updateGoal: (goal: string) => Promise<void>;
  updateExperience: (exp: UserProfile["experience"]) => Promise<void>;
  updateProfileSettings: (profileData: Partial<CareerProfile>) => Promise<void>;
  updateScore: (points: number) => void;
  completeMission: (id: string) => Promise<void>;
  toggleSubSkillMastery: (subSkillId: string, mastered: boolean) => Promise<void>;
  toggleSkill: (skillName: string) => Promise<void>;
  fetchResumeAnalysis: () => Promise<void>;
  uploadResume: (fileOrFilename: File | string, text?: string) => Promise<boolean>;
  saveResumeEdits: (content: ResumeVersionContent) => Promise<void>;
  forkResumeVersion: (title: string, goal?: string) => Promise<void>;
  restoreResumeVersion: (versionNumber: number) => Promise<void>;
  getCrossSyncSuggestions: () => Promise<any[]>;
  optimizeResume: (goal: string, targetDescription?: string) => Promise<any>;
  fetchDeveloperProfile: () => Promise<void>;
  syncDeveloperProfile: (githubUsername: string) => Promise<void>;
  fetchProjectHistory: () => Promise<void>;
  auditProject: (url: string, title?: string, type?: string) => Promise<void>;
  sendCoachMessage: (text: string, activePath: string) => Promise<void>;
  fetchCoachHistory: () => Promise<void>;
  fetchJobPipeline: () => Promise<void>;
  matchJobDescription: (jdText: string, title?: string, company?: string) => Promise<JobOpportunityData | null>;
  updateJobOpportunityStatus: (id: string, status: JobOpportunityData["status"]) => Promise<void>;
  deleteJobOpportunity: (id: string) => Promise<void>;
  fetchInterviewHistory: () => Promise<void>;
  fetchInterviewReadiness: () => Promise<void>;
  startMockInterview: (role: string, type: string, difficulty: string, questionCount?: number) => Promise<void>;
  submitInterviewAnswer: (sessionId: string, answerText: string, durationSeconds: number) => Promise<void>;
  concludeMockInterview: (sessionId: string) => Promise<InterviewSessionData | null>;
  fetchAnalyticsDashboard: () => Promise<void>;
  addApplication: (app: Omit<JobApplication, "id" | "dateApplied">) => Promise<void>;
  updateApplicationStatus: (id: string, status: JobApplication["status"]) => Promise<void>;
  addNotification: (message: string, type: Notification["type"]) => void;
  markNotificationsRead: () => Promise<void>;
  fetchNotifications: () => Promise<void>;
  addChatMessage: (sender: ChatMessage["sender"], text: string) => void;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

const initialStats: CareerStats = {
  score: 82,
  breakdown: {
    resume: 15,
    github: 8,
    projects: 20,
    skills: 15,
    learning: 6,
    applications: 10,
    interview: 3,
    consistency: 5
  },
  nextAction: {
    actionId: "action-github-connect",
    title: "Connect & Scan GitHub Portfolio",
    description: "Scan commit histories, language profiles, and repository markdown configurations.",
    type: "GitHub",
    priority: "High",
    impact: 3,
    estimatedTime: "15 mins",
    confidence: 88,
    reason: "Index code metrics, project document completeness scores, and commit frequencies.",
    dependencies: [],
    careerScoreAfterCompletion: 85,
    jobReadinessAfterCompletion: 82,
    status: "Active"
  },
  readiness: {
    jobReadiness: 78,
    resumeReadiness: 82,
    portfolioReadiness: 74,
    interviewReadiness: 50,
    recommendation: "Polish Artifacts"
  },
  timeline: []
};

export const useCareerStore = create<CareerState>((set, get) => ({
  user: {
    name: "Harshdeep",
    avatar: "",
    email: "harshdeep@careeros.dev",
    role: "Full Stack Developer",
    goal: "Full Stack Developer",
    experience: "Intermediate",
    score: 82,
    scoreTrend: 4,
  },
  roadmap: [],
  missions: [],
  applications: [],
  notifications: [],
  chatHistory: [],
  stats: initialStats,
  resumeAnalysis: null,
  developerProfile: null,
  projectHistory: [],
  jobPipeline: [],
  interviewSessions: [],
  activeInterviewSession: null,
  currentInterviewQuestion: null,
  interviewReadiness: 75,
  unresolvedMistakes: [],
  analyticsData: null,
  profile: null,

  hasResumeScanned: true,
  hasGithubScanned: false,
  projectsCount: 3,
  skillsCount: 7,
  masteredQuestionsCount: 1,
  streakDays: 7,

  // Fetch unified dashboard data from Express backend
  fetchDashboardData: async () => {
    const token = localStorage.getItem("careeros_token");
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/dashboard`, {
        method: "GET",
        headers
      });

      if (res.ok) {
        const envelope = await res.json();
        const data = envelope.data;
        const existingRoadmap = get().roadmap || [];
        const mergedRoadmap = (data.roadmap || []).map((track: any) => {
          const matched = existingRoadmap.find((t: any) => t.id === track.id);
          if (matched && matched.modules) {
            return {
              ...track,
              modules: matched.modules
            };
          }
          return track;
        });

        set({
          user: data.user,
          profile: data.profile || null,
          roadmap: mergedRoadmap,
          missions: data.missions,
          applications: data.applications,
          notifications: data.notifications || [],
          stats: data.stats,
          hasResumeScanned: data.user?.hasResumeScanned || false,
          hasGithubScanned: data.user?.hasGithubScanned || false,
          projectsCount: data.user?.projectsCount || 0,
          skillsCount: data.user?.skillsCount || 0,
          masteredQuestionsCount: data.user?.masteredQuestionsCount || 0,
          streakDays: data.user?.streakDays || 0
        });
      }
    } catch (err) {
      console.error("Failed to sync backend dashboard state:", err);
    }
  },

  fetchRoadmap: async () => {
    const token = localStorage.getItem("careeros_token");
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/roadmap`, {
        method: "GET",
        headers
      });

      if (res.ok) {
        const envelope = await res.json();
        set({ roadmap: envelope.data });
      }
    } catch (err) {
      console.error("Failed to fetch full roadmap tracks:", err);
    }
  },

  updateGoal: async (goal) => {
    const token = localStorage.getItem("careeros_token");
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    // Pessimistic store update with API save
    try {
      const res = await fetch(`${API_BASE_URL}/career/profile`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ targetRole: goal })
      });

      if (res.ok) {
        await get().fetchDashboardData();
      }
    } catch (err) {
      // Local fallback
      set((state) => ({ user: { ...state.user, goal } }));
    }
  },

  updateExperience: async (experience) => {
    const token = localStorage.getItem("careeros_token");
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/career/profile`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ experienceLevel: experience })
      });

      if (res.ok) {
        await get().fetchDashboardData();
      }
    } catch (err) {
      set((state) => ({ user: { ...state.user, experience } }));
    }
  },

  updateProfileSettings: async (profileData) => {
    const token = localStorage.getItem("careeros_token");
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/career/profile`, {
        method: "PUT",
        headers,
        body: JSON.stringify(profileData)
      });

      if (res.ok) {
        await get().fetchDashboardData();
      }
    } catch (err) {
      console.error("Failed to save profile settings:", err);
      set((state) => {
        if (!state.profile) return {};
        return {
          profile: {
            ...state.profile,
            ...profileData
          }
        };
      });
    }
  },

  updateScore: (points) =>
    set((state) => {
      const newScore = Math.min(100, Math.max(0, state.stats.score + points));
      return {
        stats: {
          ...state.stats,
          score: newScore
        }
      };
    }),

  completeMission: async (id) => {
    const token = localStorage.getItem("careeros_token");
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/roadmap/missions/complete`, {
        method: "POST",
        headers,
        body: JSON.stringify({ missionId: id })
      });

      if (res.ok) {
        await get().fetchDashboardData();
      }
    } catch (err) {
      // Local fallback logic
      set((state) => {
        const updatedMissions = state.missions.map((m) =>
          m.id === id ? { ...m, completed: true } : m
        );
        return { missions: updatedMissions };
      });
    }
  },

  toggleSubSkillMastery: async (subSkillId: string, mastered: boolean) => {
    const token = localStorage.getItem("careeros_token");
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/roadmap/progress`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ subSkillId, mastered })
      });

      if (res.ok) {
        const envelope = await res.json();
        set({ roadmap: envelope.data });
        await get().fetchDashboardData();
      }
    } catch (err) {
      console.error("Error updating subskill progress on backend:", err);
    }
  },

  toggleSkill: async (skillName: string) => {
    const profile = get().profile;
    if (!profile) return;

    const SKILL_CATEGORY_MAP: Record<string, keyof SkillSet> = {
      "React": "frameworks",
      "Next.js": "frameworks",
      "Tailwind CSS": "frameworks",
      "Node.js": "frameworks",
      "SQL": "languages",
      "Redis": "cloud",
      "Git": "tools",
      "Testing": "technical",
      "Docker": "tools",
      "AWS": "cloud"
    };

    const category = SKILL_CATEGORY_MAP[skillName];
    if (!category) return;

    const currentPossessed = profile.skillsPossessed || {
      technical: [], soft: [], tools: [], frameworks: [], languages: [], cloud: [], devops: []
    };

    const currentList = currentPossessed[category] || [];
    let newList: string[];
    if (currentList.includes(skillName)) {
      newList = currentList.filter((s) => s !== skillName);
    } else {
      newList = [...currentList, skillName];
    }

    const updatedPossessed = {
      ...currentPossessed,
      [category]: newList
    };

    const token = localStorage.getItem("careeros_token");
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const getSkillsCount = (skillsObj: any) => {
      if (!skillsObj) return 0;
      return [
        ...(skillsObj.technical || []),
        ...(skillsObj.soft || []),
        ...(skillsObj.tools || []),
        ...(skillsObj.frameworks || []),
        ...(skillsObj.languages || []),
        ...(skillsObj.cloud || []),
        ...(skillsObj.devops || [])
      ].length;
    };
    const newCount = getSkillsCount(updatedPossessed);

    try {
      const res = await fetch(`${API_BASE_URL}/career/skills`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ possessed: updatedPossessed })
      });

      if (res.ok) {
        await get().fetchDashboardData();
      } else {
        // Fallback update
        set((state) => {
          if (!state.profile) return {};
          return {
            profile: {
              ...state.profile,
              skillsPossessed: updatedPossessed
            },
            user: {
              ...state.user,
              skillsCount: newCount
            }
          };
        });
      }
    } catch (err) {
      // Fallback update
      set((state) => {
        if (!state.profile) return {};
        return {
          profile: {
            ...state.profile,
            skillsPossessed: updatedPossessed
          },
          user: {
            ...state.user,
            skillsCount: newCount
          }
        };
      });
    }
  },

  fetchResumeAnalysis: async () => {
    const token = localStorage.getItem("careeros_token");
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/resume/analysis`, {
        method: "GET",
        headers
      });

      if (res.ok) {
        const envelope = await res.json();
        set({ resumeAnalysis: envelope.data });
      }
    } catch (err) {
      console.error("Failed to fetch resume analysis details:", err);
    }
  },

  uploadResume: async (fileOrFilename: File | string, text?: string) => {
    const token = localStorage.getItem("careeros_token");
    const headers: Record<string, string> = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    try {
      let body: any;
      if (fileOrFilename instanceof File) {
        const formData = new FormData();
        formData.append("file", fileOrFilename);
        body = formData;
      } else {
        headers["Content-Type"] = "application/json";
        body = JSON.stringify({ filename: fileOrFilename, parsedText: text });
      }

      const res = await fetch(`${API_BASE_URL}/resume/upload`, {
        method: "POST",
        headers,
        body
      });

      if (res.ok) {
        const envelope = await res.json();
        set({ resumeAnalysis: envelope.data });
        await get().fetchDashboardData();
        return true;
      } else {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Failed to analyze resume.");
      }
    } catch (err) {
      console.error("Failed to upload resume document:", err);
      return false;
    }
  },

  saveResumeEdits: async (content) => {
    const token = localStorage.getItem("careeros_token");
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/resume/content`, {
        method: "PUT",
        headers,
        body: JSON.stringify(content)
      });

      if (res.ok) {
        const envelope = await res.json();
        set({ resumeAnalysis: envelope.data });
        await get().fetchDashboardData();
      }
    } catch (err) {
      console.error("Failed to save resume edits:", err);
    }
  },

  forkResumeVersion: async (title, goal = "ATS Optimization") => {
    const token = localStorage.getItem("careeros_token");
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/resume/versions/fork`, {
        method: "POST",
        headers,
        body: JSON.stringify({ title, goal })
      });

      if (res.ok) {
        const envelope = await res.json();
        set({ resumeAnalysis: envelope.data });
      }
    } catch (err) {
      console.error("Failed to fork resume version:", err);
    }
  },

  restoreResumeVersion: async (versionNumber) => {
    const token = localStorage.getItem("careeros_token");
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/resume/versions/restore`, {
        method: "POST",
        headers,
        body: JSON.stringify({ versionNumber })
      });

      if (res.ok) {
        const envelope = await res.json();
        set({ resumeAnalysis: envelope.data });
        await get().fetchDashboardData();
      }
    } catch (err) {
      console.error("Failed to restore resume version:", err);
    }
  },

  getCrossSyncSuggestions: async () => {
    const token = localStorage.getItem("careeros_token");
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/resume/cross-sync`, {
        method: "GET",
        headers
      });

      if (res.ok) {
        const envelope = await res.json();
        return envelope.data || [];
      }
    } catch (err) {
      console.error("Failed to fetch cross-sync suggestions:", err);
    }
    return [];
  },

  optimizeResume: async (goal, targetDescription) => {
    const token = localStorage.getItem("careeros_token");
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/resume/optimize`, {
        method: "POST",
        headers,
        body: JSON.stringify({ goal, targetDescription })
      });

      if (res.ok) {
        const envelope = await res.json();
        set({ resumeAnalysis: envelope.data });
        await get().fetchDashboardData();
        return envelope.data;
      }
    } catch (err) {
      console.error("Failed to optimize resume content:", err);
    }
    return null;
  },

  fetchDeveloperProfile: async () => {
    const token = localStorage.getItem("careeros_token");
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/developer/profile`, {
        method: "GET",
        headers
      });

      if (res.ok) {
        const envelope = await res.json();
        set({ developerProfile: envelope.data });
      }
    } catch (err) {
      console.error("Failed to fetch developer profile data:", err);
    }
  },

  syncDeveloperProfile: async (githubUsername) => {
    const token = localStorage.getItem("careeros_token");
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/developer/github/sync`, {
        method: "POST",
        headers,
        body: JSON.stringify({ username: githubUsername })
      });

      if (res.ok) {
        const envelope = await res.json();
        set({ developerProfile: envelope.data });
        await get().fetchDashboardData();
      }
    } catch (err) {
      console.error("Failed to sync developer repositories:", err);
    }
  },

  fetchProjectHistory: async () => {
    const token = localStorage.getItem("careeros_token");
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/project/history`, {
        method: "GET",
        headers
      });

      if (res.ok) {
        const envelope = await res.json();
        set({ projectHistory: envelope.data });
      }
    } catch (err) {
      console.error("Failed to fetch project audits history:", err);
    }
  },

  auditProject: async (url, title, type) => {
    const token = localStorage.getItem("careeros_token");
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/project/audit`, {
        method: "POST",
        headers,
        body: JSON.stringify({ url, title, projectType: type })
      });

      if (res.ok) {
        const envelope = await res.json();
        set((state) => {
          const updatedHistory = [envelope.data, ...state.projectHistory.filter(p => p.url !== url)];
          return { projectHistory: updatedHistory };
        });
        await get().fetchDashboardData();
      }
    } catch (err) {
      console.error("Failed to audit project URL:", err);
    }
  },

  sendCoachMessage: async (text, activePath) => {
    const token = localStorage.getItem("careeros_token");
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    // 1. Instantly append User's message locally
    get().addChatMessage("user", text);

    try {
      const res = await fetch(`${API_BASE_URL}/coach/chat`, {
        method: "POST",
        headers,
        body: JSON.stringify({ message: text, activePath })
      });

      if (res.status === 401) {
        localStorage.removeItem("careeros_token");
        window.location.reload(); // Wipes memory state and triggers AuthGuard login
        return;
      }

      if (!res.ok) {
        let errorMessage = `status ${res.status}`;
        try {
          const errorBody = await res.json();
          errorMessage = errorBody?.message || errorBody?.error || errorMessage;
        } catch (parseError) {
          const textBody = await res.text();
          if (textBody) errorMessage = textBody;
        }

        console.error("AI Coach backend error:", errorMessage);
        get().addChatMessage(
          "coach",
          `I'm sorry, I couldn't get a response from the AI coach (${errorMessage}). Please try again.`
        );
        return;
      }

      const envelope = await res.json();
      const coachReply = envelope?.data?.reply;
      if (coachReply) {
        // 2. Append Coach's reply locally
        get().addChatMessage("coach", coachReply);
      } else {
        console.warn("AI Coach returned an empty reply:", envelope);
        get().addChatMessage(
          "coach",
          "I'm sorry, the AI coach did not return a response. Please try again."
        );
      }
    } catch (err) {
      console.error("AI Coach failed to reply:", err);
      get().addChatMessage("coach", "I'm sorry, I encountered a connection error. Please try again.");
    }
  },

  fetchCoachHistory: async () => {
    const token = localStorage.getItem("careeros_token");
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/coach/history`, {
        method: "GET",
        headers
      });

      if (res.ok) {
        const envelope = await res.json();
        set({ chatHistory: envelope.data || [] });
      }
    } catch (err) {
      console.error("Failed to fetch coach chat history:", err);
    }
  },

  fetchJobPipeline: async () => {
    const token = localStorage.getItem("careeros_token");
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/job/pipeline`, {
        method: "GET",
        headers
      });

      if (res.ok) {
        const envelope = await res.json();
        set({ jobPipeline: envelope.data });
      }
    } catch (err) {
      console.error("Failed to fetch hiring pipeline:", err);
    }
  },

  matchJobDescription: async (jdText, title, company) => {
    const token = localStorage.getItem("careeros_token");
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/job/match`, {
        method: "POST",
        headers,
        body: JSON.stringify({ description: jdText, title, company })
      });

      if (res.ok) {
        const envelope = await res.json();
        const opportunity = envelope.data;
        set((state) => {
          const updatedPipeline = [opportunity, ...state.jobPipeline.filter(j => j.id !== opportunity.id)];
          return { jobPipeline: updatedPipeline };
        });
        await get().fetchDashboardData();
        return opportunity;
      }
    } catch (err) {
      console.error("Failed to scan and match job description:", err);
    }
    return null;
  },

  updateJobOpportunityStatus: async (id, status) => {
    const token = localStorage.getItem("careeros_token");
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/job/status`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ opportunityId: id, status })
      });

      if (res.ok) {
        await get().fetchJobPipeline();
        await get().fetchDashboardData();
      }
    } catch (err) {
      console.error("Failed to update pipeline stage:", err);
    }
  },

  deleteJobOpportunity: async (id) => {
    const token = localStorage.getItem("careeros_token");
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/job/${id}`, {
        method: "DELETE",
        headers
      });

      if (res.ok) {
        set((state) => ({
          jobPipeline: state.jobPipeline.filter((j) => j.id !== id)
        }));
        await get().fetchDashboardData();
      }
    } catch (err) {
      console.error("Failed to delete job opportunity:", err);
    }
  },

  fetchInterviewHistory: async () => {
    const token = localStorage.getItem("careeros_token");
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/interview/history`, {
        method: "GET",
        headers
      });

      if (res.ok) {
        const envelope = await res.json();
        set({ interviewSessions: envelope.data });
      }
    } catch (err) {
      console.error("Failed to fetch interview history:", err);
    }
  },

  fetchInterviewReadiness: async () => {
    const token = localStorage.getItem("careeros_token");
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/interview/readiness`, {
        method: "GET",
        headers
      });

      if (res.ok) {
        const envelope = await res.json();
        set({
          interviewReadiness: envelope.data.interviewReadiness,
          unresolvedMistakes: envelope.data.unresolvedMistakes
        });
      }
    } catch (err) {
      console.error("Failed to fetch interview readiness stats:", err);
    }
  },

  startMockInterview: async (role, type, difficulty, questionCount) => {
    const token = localStorage.getItem("careeros_token");
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/interview/start`, {
        method: "POST",
        headers,
        body: JSON.stringify({ role, type, difficulty, questionCount })
      });

      if (res.ok) {
        const envelope = await res.json();
        set({
          activeInterviewSession: envelope.data.session,
          currentInterviewQuestion: envelope.data.currentQuestion
        });
      }
    } catch (err) {
      console.error("Failed to start mock interview session:", err);
    }
  },

  submitInterviewAnswer: async (sessionId, answerText, durationSeconds) => {
    const token = localStorage.getItem("careeros_token");
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/interview/answer`, {
        method: "POST",
        headers,
        body: JSON.stringify({ sessionId, answer: answerText, duration: durationSeconds })
      });

      if (res.ok) {
        const envelope = await res.json();
        set({
          activeInterviewSession: envelope.data.session,
          currentInterviewQuestion: envelope.data.nextQuestion
        });
      }
    } catch (err) {
      console.error("Failed to submit mock interview answer:", err);
    }
  },

  concludeMockInterview: async (sessionId) => {
    const token = localStorage.getItem("careeros_token");
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/interview/finish`, {
        method: "POST",
        headers,
        body: JSON.stringify({ sessionId })
      });

      if (res.ok) {
        const envelope = await res.json();
        const completedSession = envelope.data;
        set({
          activeInterviewSession: null,
          currentInterviewQuestion: null
        });
        await get().fetchInterviewHistory();
        await get().fetchInterviewReadiness();
        await get().fetchDashboardData();
        return completedSession;
      }
    } catch (err) {
      console.error("Failed to conclude mock interview round:", err);
    }
    return null;
  },

  fetchAnalyticsDashboard: async () => {
    const token = localStorage.getItem("careeros_token");
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/analytics/dashboard`, {
        method: "GET",
        headers
      });

      if (res.ok) {
        const envelope = await res.json();
        set({ analyticsData: envelope.data });
      }
    } catch (err) {
      console.error("Failed to fetch consolidated analytics dashboard:", err);
    }
  },

  addApplication: async (app) => {
    const token = localStorage.getItem("careeros_token");
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/applications`, {
        method: "POST",
        headers,
        body: JSON.stringify(app)
      });

      if (res.ok) {
        await get().fetchDashboardData();
      }
    } catch (err) {
      set((state) => {
        const newApp: JobApplication = {
          ...app,
          id: `app-${Date.now()}`,
          dateApplied: new Date().toISOString().split("T")[0]
        };
        return { applications: [newApp, ...state.applications] };
      });
    }
  },

  updateApplicationStatus: async (id, status) => {
    const token = localStorage.getItem("careeros_token");
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/applications/status`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ id, status })
      });

      if (res.ok) {
        await get().fetchDashboardData();
      }
    } catch (err) {
      set((state) => {
        const updatedApps = state.applications.map((a) =>
          a.id === id ? { ...a, status } : a
        );
        return { applications: updatedApps };
      });
    }
  },

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

  markNotificationsRead: async () => {
    const token = localStorage.getItem("careeros_token");
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/notifications/all/read`, {
        method: "PUT",
        headers
      });

      if (res.ok) {
        await get().fetchNotifications();
      }
    } catch (err) {
      console.error("Failed to mark notifications as read:", err);
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, read: true })),
      }));
    }
  },

  fetchNotifications: async () => {
    const token = localStorage.getItem("careeros_token");
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/notifications`, {
        method: "GET",
        headers
      });

      if (res.ok) {
        const envelope = await res.json();
        set({ notifications: envelope.data });
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  },

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

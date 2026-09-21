import { API_BASE_URL, apiFetch, safeParseJson } from "@/lib/api";

export interface SkillGapItem {
  skill: string;
  status: "NEW" | "IN_PROGRESS" | "IMPROVING" | "RESOLVED" | "RECURRING";
  isPossessed: boolean;
  isResumeGap: boolean;
  isInterviewMistake: boolean;
  evidence: string;
}

export interface ShareableGrowthLifecycle {
  skill: string;
  identified: string;
  actionTaken: string;
  evidence: string;
  currentState: string;
  nextMilestone: string;
}

export interface SkillMatrixItem {
  name: string;
  level: string;
  evidence: string[];
}

export interface SkillMatrixGroup {
  frontend: SkillMatrixItem[];
  backend: SkillMatrixItem[];
  engineering: SkillMatrixItem[];
  database: SkillMatrixItem[];
  languages: SkillMatrixItem[];
}

export interface ProjectPortfolioItem {
  name: string;
  role: string;
  techStack: string[];
  description: string;
  bulletPoints: string[];
  githubUrl: string;
  liveUrl: string;
  evidence: string;
}

export interface WorkExperienceItem {
  company: string;
  position: string;
  startDate: string;
  endDate: string;
  location?: string;
  description?: string;
  bulletPoints?: string[];
}

export interface TrajectoryTimelineStep {
  title: string;
  detail: string;
}

export interface NextBestActionItem {
  actionId: string;
  title: string;
  description: string;
  type: string;
  priority: string;
  impactScore: number | null;
  estimatedTime: string;
  reason: string;
}

export interface CareerReportDTO {
  mode: "shareable" | "private";
  userId: string;
  candidateName: string;
  candidateEmail?: string;
  personalInfo?: {
    githubUrl?: string;
    linkedinUrl?: string;
    portfolioUrl?: string;
  };
  targetRole: string;
  currentRole?: string;
  careerGoal: string;
  experienceLevel: string;
  generatedAt: string;
  reportPeriod?: string;
  careerScore: number;
  scoreBreakdown?: Record<string, number>;
  jobReadiness: number;
  recommendationLevel: string;
  confidence: number;
  confidenceContributors?: {
    interviewPerformance: number;
    projectEvidence: number;
    skillEvidence: number;
    learningConsistency: number;
  };
  growth: {
    previousScore: number | null;
    currentScore: number;
    weeklyGrowth: number;
    monthlyGrowth: number;
    growthText: string;
  };

  // Shareable Specific Fields
  executiveSummary: string;
  currentFocusAreas?: string[];
  careerDirectionVisual?: string[];
  skillsMatrix?: SkillMatrixGroup;
  projects?: ProjectPortfolioItem[];
  workExperience?: WorkExperienceItem[];
  education?: Array<{ degree?: string; institution?: string; year?: string }>;
  certifications?: Array<{ name: string; issuer?: string; date?: string }>;
  shareableLifecycles?: ShareableGrowthLifecycle[];
  trajectoryTimeline?: TrajectoryTimelineStep[];

  // Private Specific Diagnostics
  skillGapLifecycle: SkillGapItem[];
  resumeIntelligence: {
    atsScore: number;
    missingKeywords: string[];
    identifiedSkills: string[];
    statusText: string;
  };
  interviewIntelligence: {
    completedCount: number;
    averageScore: number | null;
    latestScore: number | null;
    technicalScore: number | null;
    communicationScore: number | null;
    problemSolvingScore: number | null;
    confidenceScore: number | null;
    repeatingMistakes: string[];
    topicsCovered?: string[];
    statusText: string;
  };
  roadmapIntelligence: {
    hasRoadmap: boolean;
    completionPercentage: number;
    completedModulesCount: number;
    totalModulesCount: number;
    streak: number;
  };
  projectIntelligence: {
    count: number;
    overallHealth: number;
    missingPractices: string[];
    languages: Record<string, number>;
  };
  nextBestActions: NextBestActionItem[];
}

export interface ReportSummaryDTO {
  targetRole: string;
  careerGoal: string;
  careerScore: number;
  jobReadiness: number;
  confidence: number;
  growthText: string;
  weeklyGrowth: number;
  activeGaps: number;
  resolvedGaps: number;
  generatedAt: string;
  nextBestAction: string | null;
}

export interface ReportSnapshotItem {
  _id: string;
  versionNumber: number;
  mode: "shareable" | "private";
  title: string;
  targetRole: string;
  careerGoal: string;
  careerScore: number;
  jobReadiness: number;
  generatedAt: string;
}

export const reportService = {
  async getCareerReport(mode: "shareable" | "private" = "shareable", snapshotId?: string): Promise<{ report: CareerReportDTO; isSnapshot: boolean; versionNumber?: number }> {
    let url = `${API_BASE_URL}/career/report?mode=${mode}`;
    if (snapshotId) {
      url += `&snapshotId=${snapshotId}`;
    }
    const res = await apiFetch(url);
    if (!res.ok) {
      throw new Error(`Failed to fetch report (${res.status})`);
    }
    const data = await safeParseJson<{ success: boolean; report: CareerReportDTO; isSnapshot: boolean; versionNumber?: number }>(res);
    return { report: data.report, isSnapshot: data.isSnapshot, versionNumber: data.versionNumber };
  },

  async getReportSummary(): Promise<ReportSummaryDTO> {
    const res = await apiFetch(`${API_BASE_URL}/career/report/summary`);
    if (!res.ok) {
      throw new Error(`Failed to fetch report summary (${res.status})`);
    }
    const data = await safeParseJson<{ success: boolean; summary: ReportSummaryDTO }>(res);
    return data.summary;
  },

  async downloadReportPdf(mode: "shareable" | "private" = "shareable", targetRole: string = "Career", snapshotId?: string): Promise<void> {
    let url = `${API_BASE_URL}/career/report/pdf?mode=${mode}`;
    if (snapshotId) {
      url += `&snapshotId=${snapshotId}`;
    }
    const res = await apiFetch(url);
    if (!res.ok) {
      throw new Error(`Failed to download PDF (${res.status})`);
    }
    const blob = await res.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    const safeRole = targetRole.replace(/[^a-zA-Z0-9_-]/g, "_");
    const modeTag = mode === "private" ? "Private" : "Growth_Profile";
    a.download = `CareerOS_Report_${modeTag}_${safeRole}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(blobUrl);
  },

  async getSnapshots(): Promise<ReportSnapshotItem[]> {
    const res = await apiFetch(`${API_BASE_URL}/career/report/snapshots`);
    if (!res.ok) {
      throw new Error(`Failed to fetch snapshots (${res.status})`);
    }
    const data = await safeParseJson<{ success: boolean; snapshots: ReportSnapshotItem[] }>(res);
    return Array.isArray(data?.snapshots) ? data.snapshots : [];
  },

  async createSnapshot(mode: "shareable" | "private" = "shareable", title: string = ""): Promise<ReportSnapshotItem> {
    const res = await apiFetch(`${API_BASE_URL}/career/report/snapshot`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode, title })
    });
    if (!res.ok) {
      throw new Error(`Failed to create snapshot (${res.status})`);
    }
    const data = await safeParseJson<{ success: boolean; snapshot: ReportSnapshotItem }>(res);
    return data.snapshot;
  }
};

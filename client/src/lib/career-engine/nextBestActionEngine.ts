export interface ActionInput {
  hasResumeScanned?: boolean;
  hasGithubScanned?: boolean;
  targetGoal?: string;
  skillGaps?: string[];
  projectsCount?: number;
  masteredQuestionsCount?: number;
  applicationsCount?: number;
  readinessScore?: number;
  structuredGaps?: any;
}

export interface NextBestAction {
  actionId?: string;
  title: string;
  impact: number;
  duration: string;
  reason: string;
  priority: "High" | "Medium" | "Low";
  targetUrl: string;
  careerScoreAfterCompletion?: number;
  jobReadinessAfterCompletion?: number;
  confidence?: number;
}

/**
 * Client-Side Next Best Action Helper - Formats and guarantees targetUrl mapping for Backend NBA DTOs
 */
export function formatNextBestAction(backendAction: any, defaultGoal = "Full Stack Developer"): NextBestAction {
  if (!backendAction) {
    return {
      actionId: "action_resume_scan",
      title: "Upload & Scan Resume ATS Alignment",
      impact: 15,
      duration: "10 mins",
      reason: `Upload your resume to evaluate keyword alignment and ATS scoring against target role: "${defaultGoal}".`,
      priority: "High",
      targetUrl: "/resume"
    };
  }

  const type = (backendAction.type || "").toLowerCase();
  const title = (backendAction.title || "").toLowerCase();

  const targetUrl = backendAction.targetUrl || (
    type === "resume" || title.includes("resume") ? "/resume"
      : type === "github" || type === "project" || type === "portfolio" || title.includes("github") || title.includes("portfolio") || title.includes("project") ? "/portfolio"
      : type === "interview" || title.includes("interview") ? "/interview"
      : type === "roadmap" || type === "skill" || title.includes("roadmap") || title.includes("skill") || title.includes("gap") ? "/roadmap"
      : type === "application" || type === "applications" || title.includes("application") || title.includes("job") ? "/resume?step=4"
      : "/dna"
  );

  return {
    actionId: backendAction.actionId || "action_primary",
    title: backendAction.title || "Execute High-Impact Career Action",
    impact: backendAction.impactScore || backendAction.impact || 10,
    duration: backendAction.estimatedTime || backendAction.duration || "20 mins",
    reason: backendAction.reason || "Recommended by CareerOS intelligence engine.",
    priority: backendAction.priority || "High",
    targetUrl,
    careerScoreAfterCompletion: backendAction.careerScoreAfterCompletion,
    jobReadinessAfterCompletion: backendAction.jobReadinessAfterCompletion,
    confidence: backendAction.confidence || 90
  };
}

// Backward-compatible export
export function computeNextBestAction(input: ActionInput): NextBestAction {
  return formatNextBestAction(null, input.targetGoal);
}

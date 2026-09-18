export interface ActionInput {
  hasResumeScanned?: boolean;
  hasGithubScanned?: boolean;
  targetGoal?: string;
  skillGaps?: string[];
  projectsCount?: number;
  masteredQuestionsCount?: number;
  applicationsCount?: number;
  readinessScore?: number;
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
}

export function computeNextBestAction(input: ActionInput): NextBestAction {
  const goal = input.targetGoal || "Full Stack Developer";

  // Priority 1: Optimize Resume if not scanned
  if (!input.hasResumeScanned) {
    return {
      actionId: "action_resume_scan",
      title: "Upload & Scan Resume ATS Alignment",
      impact: 15,
      duration: "10 mins",
      reason: `Upload your resume to evaluate keyword alignment and ATS scoring against target role: "${goal}".`,
      priority: "High",
      targetUrl: "/resume"
    };
  }

  // Priority 2: Sync GitHub / Portfolio if not connected
  if (!input.hasGithubScanned) {
    return {
      actionId: "action_github_sync",
      title: "Connect & Index GitHub Repositories",
      impact: 15,
      duration: "15 mins",
      reason: `Link GitHub to verify code quality, commit activity, and technology evidence for ${goal} projects.`,
      priority: "High",
      targetUrl: "/portfolio"
    };
  }

  // Priority 3: Skill gap targeted action based on goal
  if (input.skillGaps && input.skillGaps.length > 0) {
    const primaryGap = input.skillGaps[0];
    return {
      actionId: `action_gap_${primaryGap.toLowerCase().replace(/\s+/g, '_')}`,
      title: `Close Core Skill Gap: ${primaryGap}`,
      impact: 12,
      duration: "45 mins",
      reason: `"${primaryGap}" is a core requirement missing from your target role profile for ${goal}.`,
      priority: "High",
      targetUrl: "/roadmap"
    };
  }

  // Priority 4: Audit Project Evidence if < 3 projects
  if ((input.projectsCount ?? 0) < 3) {
    return {
      actionId: "action_audit_project",
      title: "Audit & Deploy Portfolio Project",
      impact: 10,
      duration: "30 mins",
      reason: "Auditing live projects verifies REST API, database, and authentication architecture evidence.",
      priority: "Medium",
      targetUrl: "/portfolio"
    };
  }

  // Priority 5: Mock interview practice if < 3 questions mastered
  if ((input.masteredQuestionsCount ?? 0) < 3) {
    return {
      actionId: "action_mock_interview",
      title: `Conduct ${goal} Mock Interview Round`,
      impact: 10,
      duration: "25 mins",
      reason: `Simulate technical and behavioral interview rounds to build readiness for ${goal} applications.`,
      priority: "Medium",
      targetUrl: "/interview"
    };
  }

  // Priority 6: Track active job applications
  if ((input.applicationsCount ?? 0) === 0) {
    return {
      actionId: "action_track_job",
      title: "Save & Track Your First Job Application",
      impact: 8,
      duration: "10 mins",
      reason: "Track target job opportunities and monitor your application conversion funnel.",
      priority: "Low",
      targetUrl: "/applications"
    };
  }

  // Default polish action
  return {
    actionId: "action_review_analytics",
    title: "Review Career Analytics & Weekly Goal",
    impact: 5,
    duration: "5 mins",
    reason: "Track your week-over-week career score growth and skill mastery progression.",
    priority: "Low",
    targetUrl: "/analytics"
  };
}


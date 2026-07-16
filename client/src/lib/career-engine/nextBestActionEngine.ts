export interface ActionInput {
  hasResumeScanned: boolean;
  hasGithubScanned: boolean;
  hasCompletedM1: boolean; // JWT authentication mission
  hasCompletedM2: boolean; // Index optimization mission
  targetGoal: string;
}

export interface NextBestAction {
  title: string;
  impact: number;
  duration: string;
  reason: string;
  priority: "High" | "Medium" | "Low";
}

export function computeNextBestAction(input: ActionInput): NextBestAction {
  // Priority 1: Optimize Resume if not scanned
  if (!input.hasResumeScanned) {
    return {
      title: "Analyze & Optimize Resume ATS",
      impact: 2,
      duration: "10 mins",
      reason: "Missing key ATS qualifiers. Optimizing matches your target goal in 100% of screenings.",
      priority: "High",
    };
  }

  // Priority 2: Sync GitHub if not connected
  if (!input.hasGithubScanned) {
    return {
      title: "Connect & Scan GitHub Portfolio",
      impact: 3,
      duration: "15 mins",
      reason: "Index code metrics, project document completeness scores, and commit frequencies.",
      priority: "High",
    };
  }

  // Priority 3: Complete Backend JWT auth mission
  if (!input.hasCompletedM1) {
    return {
      title: "Build API Authentication (JWT Module)",
      impact: 3,
      duration: "2 hours",
      reason: "Authentication architecture is present in 78% of target developer job descriptions.",
      priority: "High",
    };
  }

  // Priority 4: Complete Database Indexing mission
  if (!input.hasCompletedM2) {
    return {
      title: "Optimize PostgreSQL Database Index Queries",
      impact: 2,
      duration: "1 hour",
      reason: "Database optimization is a core Backend skill gap identified in your Career DNA profile.",
      priority: "Medium",
    };
  }

  // Priority 5: Conduct Mock Interviews if everything else is done
  return {
    title: "Conduct AI Mock Interview Practice",
    impact: 2,
    duration: "45 mins",
    reason: "Prepare behavioral and technical responses. Ready for target job applications.",
    priority: "Medium",
  };
}

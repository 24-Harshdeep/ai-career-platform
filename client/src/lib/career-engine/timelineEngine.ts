export interface TimelineInput {
  isOnboardingComplete?: boolean;
  hasResumeScanned: boolean;
  hasGithubScanned: boolean;
  roadmapAverageProgress: number;
  hasOfferSecured: boolean;
  updatedAt?: string;
}

export interface TimelineEvent {
  event: string;
  status: "Completed" | "Pending";
  date: string;
}

export function generateTimeline(input: TimelineInput): TimelineEvent[] {
  const currentDate = new Date().toISOString().split("T")[0];

  const events: TimelineEvent[] = [
    {
      event: "Career DNA Profile Setup",
      status: input.isOnboardingComplete ? "Completed" : "Pending",
      date: input.isOnboardingComplete ? (input.updatedAt ? input.updatedAt.split("T")[0] : currentDate) : "Pending Setup",
    },
    {
      event: "Perform ATS Resume Scanner Audit",
      status: input.hasResumeScanned ? "Completed" : "Pending",
      date: input.hasResumeScanned ? "Completed" : "Target: Next Action",
    },
    {
      event: "Sync & Scan GitHub Repositories",
      status: input.hasGithubScanned ? "Completed" : "Pending",
      date: input.hasGithubScanned ? "Completed" : "Target: Next Action",
    },
    {
      event: "Reach 80% Roadmap Track Competency",
      status: input.roadmapAverageProgress >= 80 ? "Completed" : "Pending",
      date: input.roadmapAverageProgress >= 80 ? "Achieved" : `${Math.round(input.roadmapAverageProgress)}% Progress`,
    },
    {
      event: "Secure Target Career Offer",
      status: input.hasOfferSecured ? "Completed" : "Pending",
      date: input.hasOfferSecured ? "Secured" : "Future Milestone",
    },
  ];

  return events;
}


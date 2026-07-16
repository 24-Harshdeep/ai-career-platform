export interface TimelineInput {
  hasResumeScanned: boolean;
  hasGithubScanned: boolean;
  roadmapAverageProgress: number;
  hasOfferSecured: boolean;
}

export interface TimelineEvent {
  event: string;
  status: "Completed" | "Pending";
  date: string;
}

export function generateTimeline(input: TimelineInput): TimelineEvent[] {
  const events: TimelineEvent[] = [
    {
      event: "Started HTML/CSS fundamentals",
      status: "Completed",
      date: "2026-06-01",
    },
    {
      event: "Sync & Scan GitHub repositories",
      status: input.hasGithubScanned ? "Completed" : "Pending",
      date: input.hasGithubScanned ? "2026-07-14" : "Target: Next Action",
    },
    {
      event: "Perform ATS resume scanner audit",
      status: input.hasResumeScanned ? "Completed" : "Pending",
      date: input.hasResumeScanned ? "2026-07-12" : "Target: Next Action",
    },
    {
      event: "Reach 80% roadmap track competency",
      status: input.roadmapAverageProgress >= 80 ? "Completed" : "Pending",
      date: input.roadmapAverageProgress >= 80 ? "2026-07-15" : "In Progress",
    },
    {
      event: "Secure primary engineering offer",
      status: input.hasOfferSecured ? "Completed" : "Pending",
      date: input.hasOfferSecured ? "Just now" : "Future Milestone",
    },
  ];

  return events;
}

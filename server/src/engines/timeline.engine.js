function generateTimeline(input) {
  return [
    {
      event: "Started HTML/CSS fundamentals",
      status: "Completed",
      date: "Completed"
    },
    {
      event: "Sync & Scan GitHub repositories",
      status: input.hasGithubScanned ? "Completed" : "Pending",
      date: input.hasGithubScanned ? "Completed" : "Target: Next Action"
    },
    {
      event: "Perform ATS resume scanner audit",
      status: input.hasResumeScanned ? "Completed" : "Pending",
      date: input.hasResumeScanned ? "Completed" : "Target: Next Action"
    },
    {
      event: "Reach 80% roadmap track competency",
      status: input.roadmapAverageProgress >= 80 ? "Completed" : "Pending",
      date: input.roadmapAverageProgress >= 80 ? "Completed" : "In Progress"
    },
    {
      event: "Secure primary engineering offer",
      status: input.hasOfferSecured ? "Completed" : "Pending",
      date: input.hasOfferSecured ? "Just now" : "Future Milestone"
    }
  ];
}

module.exports = { generateTimeline };

// AI Service for simulated AI coach conversations
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const aiService = {
  async generateCoachResponse(userMessage: string): Promise<string> {
    await delay(1000); // Simulate API loading delay

    const msg = userMessage.toLowerCase();

    if (msg.includes("resume") || msg.includes("cv")) {
      return "I've reviewed your resume and matched it against target Full Stack roles. Your current score is 82%. You have a strong frontend baseline, but you are missing critical backend terms. Adding 'Docker', 'Jest/Cypress Testing', and 'AWS/Cloud' will improve ATS visibility and increase your interview match rate. Would you like me to write bullet points for your project section including these?";
    }

    if (msg.includes("roadmap") || msg.includes("study") || msg.includes("learn")) {
      return "Your roadmap indicates you are 90% complete with Frontend but only 65% on Backend. Your highest multiplier right now is to finish the JWT Authentication module (+3 score). Once that is complete, I'll unlock the 'Docker & Containerization' roadmap module for you.";
    }

    if (msg.includes("github") || msg.includes("code") || msg.includes("git")) {
      return "Your GitHub metrics show active commits on React repositories but minimal backend contributions. I recommend creating a new repository for a MERN/PERN application featuring secure authentication and unit testing, and linking it to your dashboard. This will raise your Career Score by +4 points.";
    }

    if (msg.includes("interview") || msg.includes("prep") || msg.includes("question")) {
      return "For intermediate Full Stack roles, prepare for these key topics:\n1. JWT authentication lifecycle and token storage security.\n2. SQL performance (indexing, joins, query optimization).\n3. Next.js App Router vs Pages Router rendering strategies.\nLet's start a mock interview! Type 'start mock interview' when you are ready.";
    }

    return "That's an interesting point! Focus on completing your active mission 'Build API Authentication' first. It is the most direct path to elevating your Career Score from 76 to 79 and building backend competency.";
  },
};

const mongoose = require("mongoose");
const { connectDB } = require("./src/config/db");
const Resume = require("./src/models/Resume");

const userId = "6a61b63cef17153ab4d465a3";

async function run() {
  await connectDB();
  const resume = await Resume.findOne({ userId });
  if (!resume) {
    console.error("No resume found!");
    process.exit(1);
  }

  const activeIdx = resume.versions.findIndex(v => v.versionNumber === resume.activeVersionId);
  if (activeIdx === -1) {
    console.error("No active version found!");
    process.exit(1);
  }

  const newProject = {
    title: "CommitPulse",
    technologies: ["TypeScript", "React", "Git", "GitHub API"],
    description: "Interactive git activity visualizer and commit auditing tool.",
    bulletPoints: [
      "Designed and implemented an interactive Git activity heatmap visualization dashboard using React and TypeScript.",
      "Optimized timeline data processing filters for real-time code update indexing, accelerating load speeds.",
      "Integrated GitHub REST API queries to fetch, sort, and analyze repository details dynamically."
    ],
    link: "https://github.com/24-Harshdeep/commitpulse"
  };

  const exists = resume.versions[activeIdx].projects.some(p => p.title === "CommitPulse");
  if (!exists) {
    resume.versions[activeIdx].projects.push(newProject);
    resume.markModified("versions");
    await resume.save();
    console.log("Successfully added CommitPulse project to active resume version!");
  } else {
    console.log("CommitPulse project already exists in active resume version.");
  }

  process.exit(0);
}

run();

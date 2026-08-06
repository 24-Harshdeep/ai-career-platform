const rawText = `HARSHDEEP KAUR
Developed a dynamic React application allowing users to search, view, and add recipes using a public API.
Implemented React Router for navigation, deployed publicly on Netlify.
WORK EXPERIENCE
ZaikaHub 
Frontend Developer | Personal Projects
Building practical frontend skills with React
PROFESSIONAL SUMMARY
I’m an aspiring Frontend Developer passionate about creating web projects with HTML, CSS, JavaScript,
and React. Excited to learn backend integration and APIs, I’m eager to contribute to real-world projects and
grow as a developer through hands-on experience.
Address: Bhawanipur Road , Dergaon , Assam 
785614
Phone: +91 6003280603
Email: harshdeepkaur1208@gmail.com
CONTACT
EDUCATION
Building practical frontend and full-stack
skills using JavaScript, HTML, CSS,
React, Node.js, and MongoDB.
Strengthening foundational programming
knowledge in Python.
Bachelor’s of Computer Applications
Eternal University | 2025-2027
CERTIFICATION
Prompt Engineering for ChatGPT – Vanderbilt
University via Coursera
Adaptive ChatBot
Adaptive Chatbot — an AI-driven virtual assistant built to manage your tasks and organize your workflow. It
helps you stay productive and in control through smart, adaptive task management.
Learned to craft effective prompts for AI
models like ChatGPT. View Certificate
Introduction to Git and GitHub – Google via
Coursera
Gained foundational Git skills, including  repository
management and collaboration. View Certificate
Version Control – Meta via Coursera
Learned version control best practices
and collaborative workflows. View
Certificate
MongoDB & Backend Learning – Self-
paced /Online.View Certificate
MongoDB
SKILLS
Frontend Development: React,
HTML,CSS, JavaScript
React Ecosystem: React Router,
React Icons, Component-based
design
Tools & Version Control: Git, GitHub.
Soft Skills: Independent project
delivery
problem-solving, time management,`;

function parseResumeText(rawText) {
  const text = rawText || "";
  const lines = text.split("\n").map(line => line.trim()).filter(Boolean);

  const sections = {
    summary: [],
    projects: [],
    skills: [],
    experience: [],
    education: [],
    certifications: []
  };

  let currentSection = "summary"; // Default to summary to capture headerless intro lines

  const isHeader = (line) => {
    const s = line.toLowerCase().replace(/[^a-z\s]/g, "").trim();
    if (line.length > 30) return false;

    const headerKeywords = [
      "summary", "professional summary", "about me", "profile",
      "work experience", "experience", "employment", "employment history", "work history", "practical experience",
      "projects", "personal projects", "academic projects", "key projects",
      "skills", "technical skills", "technologies", "languages", "skills inventory",
      "education", "academic profile", "academic history", "university",
      "certifications", "certification", "courses", "licenses", "credentials"
    ];

    return headerKeywords.includes(s) || (line === line.toUpperCase() && headerKeywords.some(kw => s === kw));
  };

  for (const line of lines) {
    const s = line.toLowerCase().trim();
    
    if (isHeader(line)) {
      const clean = s.replace(/[^a-z\s]/g, "").trim();
      if (clean.includes("summary") || clean === "profile" || clean === "about me") {
        currentSection = "summary";
      } else if (clean.includes("experience") || clean.includes("employment") || clean.includes("work history")) {
        currentSection = "experience";
      } else if (clean.includes("project")) {
        currentSection = "projects";
      } else if (clean.includes("skill") || clean.includes("technologies") || clean.includes("languages")) {
        currentSection = "skills";
      } else if (clean.includes("education") || clean.includes("university")) {
        currentSection = "education";
      } else if (clean.includes("certif") || clean.includes("course") || clean.includes("license") || clean.includes("credential")) {
        currentSection = "certifications";
      }
      continue;
    }

    if (currentSection) {
      sections[currentSection].push(line);
    }
  }

  return sections;
}

const localSections = parseResumeText(rawText);

const isContactLine = (l) => {
  const s = l.toLowerCase();
  return s.includes("phone:") || s.includes("email:") || s.includes("address:") || s.includes("github:") || s.includes("linkedin:") || s.includes("contact") || s.includes("+91") || s.includes("gmail.com") || s.includes("mail.com") || s.includes("portfolio") || s.match(/^\+?\d[\d\s\-]{8,}$/);
};

const experienceLines = (localSections.experience || []).filter(l => !isContactLine(l));
const projectLines = (localSections.projects || []).filter(l => !isContactLine(l));
const educationLines = (localSections.education || []).filter(l => !isContactLine(l));
const certificationsLines = (localSections.certifications || []).filter(l => !isContactLine(l));

let parsedProjectsList = [...projectLines];
let cleanSummaryLines = (localSections.summary || []).filter(l => !isContactLine(l));

if (parsedProjectsList.length === 0) {
  const projectActionVerbs = ["developed", "implemented", "built", "created", "designed", "configured", "deployed"];
  const projectCandidates = cleanSummaryLines.filter(l => {
    const firstWord = l.toLowerCase().split(/\s+/)[0];
    return projectActionVerbs.includes(firstWord);
  });
  if (projectCandidates.length > 0) {
    parsedProjectsList = projectCandidates;
    cleanSummaryLines = cleanSummaryLines.filter(l => !projectCandidates.includes(l));
  }
}

console.log("Clean Summary Lines:", cleanSummaryLines);
console.log("Experience Lines:", experienceLines);
console.log("Projects List:", parsedProjectsList);
console.log("Certifications Lines:", certificationsLines);
console.log("Education Lines:", educationLines);

function parseResumeText(rawText) {
  const text = rawText || "";
  const lines = text.split("\n").map(line => line.trim()).filter(Boolean);

  const sections = {
    projects: [],
    skills: [],
    experience: [],
    education: []
  };

  let currentSection = null;

  for (const line of lines) {
    const lowerLine = line.toLowerCase();
    
    // Section header detection
    if (lowerLine.includes("projects") || lowerLine.includes("personal work")) {
      currentSection = "projects";
      continue;
    } else if (lowerLine.includes("skills") || lowerLine.includes("technologies") || lowerLine.includes("languages")) {
      currentSection = "skills";
      continue;
    } else if (lowerLine.includes("experience") || lowerLine.includes("employment") || lowerLine.includes("work history")) {
      currentSection = "experience";
      continue;
    } else if (lowerLine.includes("education") || lowerLine.includes("university") || lowerLine.includes("credentials")) {
      currentSection = "education";
      continue;
    }

    if (currentSection) {
      sections[currentSection].push(line);
    }
  }

  // Fallbacks if formatting parsing yielded empty sections
  if (sections.skills.length === 0) {
    // Regex scan fallback to look for common tech terms
    const techWords = ["react", "node", "express", "javascript", "typescript", "mongodb", "postgresql", "aws", "docker"];
    sections.skills = techWords.filter(word => text.toLowerCase().includes(word));
  }

  return sections;
}

module.exports = { parseResumeText };

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
    if (line.length > 30) return false; // Headings are usually short

    const headerKeywords = [
      "summary", "professional summary", "about me", "profile",
      "work experience", "experience", "employment", "employment history", "work history", "practical experience",
      "projects", "personal projects", "academic projects", "key projects",
      "skills", "technical skills", "technologies", "languages", "skills inventory",
      "education", "academic profile", "academic history", "university", "education and training",
      "certifications", "certification", "courses", "licenses", "credentials", "certifications and training"
    ];

    // Check for exact match or matches that are dominant in the line
    return headerKeywords.includes(s) || (line === line.toUpperCase() && headerKeywords.some(kw => s === kw));
  };

  for (const line of lines) {
    const s = line.toLowerCase().trim();
    
    // Check if line is a header
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

module.exports = { parseResumeText };

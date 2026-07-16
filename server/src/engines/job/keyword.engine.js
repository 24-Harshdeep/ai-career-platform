function extractKeywords(descriptionText) {
  const text = (descriptionText || "").toLowerCase();
  
  // List of keywords to scan for
  const skillsList = [
    "React", "Next.js", "Express", "Node.js", "JavaScript", "TypeScript", 
    "MongoDB", "PostgreSQL", "Docker", "Kubernetes", "AWS", "CI/CD", 
    "Redux", "GraphQL", "Tailwind CSS", "Jest", "Cypress", "Git"
  ];

  const matched = skillsList.filter(skill => text.includes(skill.toLowerCase()));

  // Fallback defaults if text is too generic
  if (matched.length === 0) {
    return ["React", "Node.js", "Express", "MongoDB", "TypeScript"];
  }

  return matched;
}

module.exports = { extractKeywords };

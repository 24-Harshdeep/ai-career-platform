const MOCK_QUESTIONS = [
  {
    question: "Explain the difference between a SQL join and an index scan. How do you optimize query speeds in MongoDB?",
    category: "Technical",
    role: "Backend Developer",
    difficulty: "Intermediate",
    expectedConcepts: ["indexing", "join", "lookup"],
    expectedKeywords: ["index", "join", "lookup", "explain", "compound"],
    hints: ["Mention compound indexes.", "Compare SQL Joins to MongoDB $lookup."],
    solutionOutline: "An index scan checks a b-tree/index tree instead of checking the whole collection. Optimize with index creation and analysis of explain plan.",
    tags: ["Databases", "MongoDB"]
  },
  {
    question: "How does JWT authentication work, and how do you secure user credentials before storing them in database?",
    category: "Technical",
    role: "Backend Developer",
    difficulty: "Intermediate",
    expectedConcepts: ["hashing", "jwt sign", "bcrypt"],
    expectedKeywords: ["jwt", "hashing", "bcrypt", "salt", "token", "payload"],
    hints: ["Mention bcrypt.hash.", "Explain JWT header, payload, and signature components."],
    solutionOutline: "Use bcrypt to salt and hash passwords. Issue signed JWTs upon successful verification.",
    tags: ["Security", "Authentication"]
  },
  {
    question: "Explain how React's Virtual DOM works. What is the role of useEffect's cleanup function?",
    category: "Technical",
    role: "Frontend Developer",
    difficulty: "Intermediate",
    expectedConcepts: ["virtual dom", "reconciliation", "cleanup"],
    expectedKeywords: ["reconciliation", "diffing", "cleanup", "unmount", "dependency"],
    hints: ["Discuss reconciliation algorithms.", "Explain when memory leak cleanups execute."],
    solutionOutline: "React diffs Virtual DOM trees. UseEffect cleanups unsubscribe event listeners on component unmount.",
    tags: ["React", "DOM"]
  },
  {
    question: "Tell me about a time when you had to resolve a severe bug in production. How did you communicate with stakeholders?",
    category: "Behavioral",
    role: "Backend Developer",
    difficulty: "Intermediate",
    expectedConcepts: ["star method", "incident response"],
    expectedKeywords: ["situation", "task", "action", "result", "communication", "monitoring"],
    hints: ["Use the STAR method.", "Mention post-mortem logs."],
    solutionOutline: "Explain the situation, the impact, the monitoring checks deployed, and lessons learned.",
    tags: ["Behavioral", "STAR"]
  }
];

function selectQuestions(type, role, difficulty, dbQuestions = []) {
  // Filter database questions if they exist
  let pool = dbQuestions.length > 0 ? dbQuestions : MOCK_QUESTIONS;
  
  let filtered = pool.filter(q => {
    const qCategory = (q.category || "").toLowerCase();
    const qType = (type || "").toLowerCase();
    
    if (qType === "technical" && qCategory !== "technical") return false;
    if (qType === "behavioral" && qCategory !== "behavioral") return false;
    return true;
  });

  if (filtered.length === 0) {
    filtered = pool;
  }

  // Return up to 3 questions
  return filtered.slice(0, 3);
}

module.exports = { selectQuestions, MOCK_QUESTIONS };

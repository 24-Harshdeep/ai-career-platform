const User = require("../models/User");
const InterviewQuestion = require("../models/InterviewQuestion");
const InterviewSession = require("../models/InterviewSession");
const InterviewMistake = require("../models/InterviewMistake");
const { mockDb } = require("../config/mockDb");
const { generateGeminiContent } = require("../config/gemini");

const { selectQuestions } = require("../engines/interview/questionSelector.engine");
const { evaluateAnswerText } = require("../engines/interview/answerEvaluator.engine");
const { auditTechnicalDepth } = require("../engines/interview/technicalDepth.engine");
const { auditCommunication } = require("../engines/interview/communication.engine");
const { generateFollowUpQuestion } = require("../engines/interview/followup.engine");
const { auditConfidence } = require("../engines/interview/confidence.engine");
const { calculateOverallInterviewScore } = require("../engines/interview/overallScore.engine");
const { compileQuestionFeedback } = require("../engines/interview/feedback.engine");
const { calculateReadinessIncrease } = require("../engines/interview/readiness.engine");

const { toInterviewSessionDTO } = require("../dto/interview.dto");
const { recalculateUserStats } = require("./career.service");
const { logCareerEvent } = require("./analytics.service");

// Simple in-memory cache for offline/fallback sessions
const offlineSessions = new Map();

// 1. Start Mock Session
async function startSession(userId, config) {
  const { role, type, difficulty, questionCount } = config;

  let count = 3;
  if (difficulty === "Real Interview") {
    count = 5;
  } else if (questionCount) {
    count = questionCount;
  }

  try {
    // Try to dynamically generate questions using Gemini API
    let selected = [];
    try {
      const prompt = `Generate exactly ${count} interview questions for the role "${role}".
Category/Type of interview: "${type}"
Difficulty Level: "${difficulty}"

Each question must be challenging, professional, and realistic.
For each question, provide:
1. The question text.
2. A list of 1-3 hints/suggestions the coach can give the user.
3. 3-5 expected keywords (single words or short terms) that are critical to the answer.
4. 2-4 expected concepts (conceptual frameworks, standards, or mechanisms) that should be covered.

Output a JSON array conforming exactly to this structure:
[
  {
    "question": "The question text...",
    "hints": ["Hint 1", "Hint 2"],
    "expectedKeywords": ["keyword1", "keyword2"],
    "expectedConcepts": ["concept1", "concept2"]
  }
]`;

      const geminiJson = await generateGeminiContent(prompt, "You are a professional technical recruiter and engineering lead. Respond only in JSON format.", true);

      if (geminiJson) {
        const parsed = JSON.parse(geminiJson);
        if (Array.isArray(parsed) && parsed.length > 0) {
          for (const q of parsed) {
            const doc = await InterviewQuestion.create({
              question: q.question,
              category: type,
              role: role,
              difficulty: difficulty,
              expectedConcepts: q.expectedConcepts || [],
              expectedKeywords: q.expectedKeywords || [],
              hints: q.hints || []
            });
            selected.push(doc);
          }
        }
      }
    } catch (geminiErr) {
      console.error("Gemini question generation failed, falling back to database pool:", geminiErr);
    }

    // Fallback: Sync seeds to DB if empty
    const dbCount = await InterviewQuestion.countDocuments();
    if (dbCount === 0) {
      const { MOCK_QUESTIONS } = require("../engines/interview/questionSelector.engine");
      await InterviewQuestion.insertMany(MOCK_QUESTIONS);
    }

    // Fallback: If AI generation was unsuccessful, select from DB pool
    if (selected.length === 0) {
      // Build a smart regex to match any of the significant words in the target role
      const words = (role || "").split(/\s+/).filter(w => w.length > 2);
      const regexPattern = words.length > 0 ? words.join("|") : (role || "Backend Developer");
      
      let dbQuestions = await InterviewQuestion.find({
        role: { $regex: new RegExp(regexPattern, "i") }
      });
      
      if (dbQuestions.length === 0) {
        // Fallback to all questions if none matched the specific role
        dbQuestions = await InterviewQuestion.find({});
      }
      
      const poolQuestions = selectQuestions(type, role, difficulty, dbQuestions);
      selected = poolQuestions.slice(0, count);
    }

    const sessionQuestions = selected.map(q => ({
      questionId: q._id || q.id,
      answer: "",
      score: 0,
      feedback: null,
      duration: 0
    }));

    const session = await InterviewSession.create({
      userId,
      role: role || "Backend Developer",
      type: type || "Technical",
      difficulty: difficulty || "Intermediate",
      status: "Active",
      startedAt: new Date(),
      questions: sessionQuestions
    });

    const dto = toInterviewSessionDTO(session);
    // Include full first question text
    const firstQ = selected[0];
    return {
      session: dto,
      currentQuestion: {
        id: firstQ._id || firstQ.id,
        text: firstQ.question,
        hints: firstQ.hints
      }
    };
  } catch (err) {
    // Offline local fallback
    const fallbackQuestions = [
      {
        id: "mock-q-1",
        text: "Explain the difference between a SQL join and an index scan. How do you optimize query speeds in MongoDB?",
        hints: ["Mention compound indexes."]
      },
      {
        id: "mock-q-2",
        text: "How does JWT authentication work, and how do you secure user credentials?",
        hints: ["Mention bcrypt.hash."]
      },
      {
        id: "mock-q-3",
        text: "Explain how React's Virtual DOM works. What is the role of useEffect's cleanup function?",
        hints: ["Discuss reconciliation algorithms."]
      },
      {
        id: "mock-q-4",
        text: "Tell me about a time when you had to resolve a severe bug in production. How did you communicate with stakeholders?",
        hints: ["Use the STAR method."]
      },
      {
        id: "mock-q-5",
        text: "How do you design a scalable notification service that can handle millions of push notifications per day?",
        hints: ["Mention message queues like RabbitMQ or Kafka."]
      }
    ];

    const chosenQuestions = fallbackQuestions.slice(0, count);
    const sessionQuestions = chosenQuestions.map(q => ({
      questionId: q.id,
      answer: "",
      score: 0,
      feedback: null,
      duration: 0
    }));

    const mockSession = {
      id: `session-${Date.now()}`,
      role: role || "Backend Developer",
      type: type || "Technical",
      difficulty: difficulty || "Intermediate",
      status: "Active",
      startedAt: new Date(),
      questions: sessionQuestions
    };

    offlineSessions.set(mockSession.id, mockSession);

    return {
      session: mockSession,
      currentQuestion: {
        id: chosenQuestions[0].id,
        text: chosenQuestions[0].text,
        hints: chosenQuestions[0].hints
      }
    };
  }
}

// 2. Submit Answer to current question
async function submitAnswer(userId, sessionId, answerText, durationSeconds) {
  // Check if it's an offline session
  if (offlineSessions.has(sessionId)) {
    const session = offlineSessions.get(sessionId);
    const unansweredIndex = session.questions.findIndex(q => !q.answer);
    if (unansweredIndex !== -1) {
      session.questions[unansweredIndex].answer = answerText;
      session.questions[unansweredIndex].score = 80; // default offline score
      session.questions[unansweredIndex].duration = durationSeconds;
      session.questions[unansweredIndex].feedback = {
        strengths: ["Clear communication"],
        weaknesses: ["Add more technical keywords"],
        missedConcepts: [],
        idealAnswer: "Refer to documentation.",
        improvementPlan: "Practice coding syntax.",
        resources: []
      };
    }

    const nextIdx = unansweredIndex + 1;
    if (nextIdx < session.questions.length) {
      const fallbackQuestions = [
        {
          id: "mock-q-1",
          text: "Explain the difference between a SQL join and an index scan. How do you optimize query speeds in MongoDB?",
          hints: ["Mention compound indexes."]
        },
        {
          id: "mock-q-2",
          text: "How does JWT authentication work, and how do you secure user credentials?",
          hints: ["Mention bcrypt.hash."]
        },
        {
          id: "mock-q-3",
          text: "Explain how React's Virtual DOM works. What is the role of useEffect's cleanup function?",
          hints: ["Discuss reconciliation algorithms."]
        },
        {
          id: "mock-q-4",
          text: "Tell me about a time when you had to resolve a severe bug in production. How did you communicate with stakeholders?",
          hints: ["Use the STAR method."]
        },
        {
          id: "mock-q-5",
          text: "How do you design a scalable notification service that can handle millions of push notifications per day?",
          hints: ["Mention message queues like RabbitMQ or Kafka."]
        }
      ];

      const nextQ = fallbackQuestions.find(q => q.id === session.questions[nextIdx].questionId) || fallbackQuestions[nextIdx];
      return {
        session,
        nextQuestion: {
          id: nextQ.id,
          text: nextQ.text,
          hints: nextQ.hints
        }
      };
    } else {
      return {
        session,
        nextQuestion: null
      };
    }
  }

  try {
    const session = await InterviewSession.findOne({ _id: sessionId, userId });
    if (!session) throw new Error("Active session not found.");

    // Find the next unanswered question
    const unansweredIndex = session.questions.findIndex(q => !q.answer);
    if (unansweredIndex === -1) {
      throw new Error("All questions in this session have already been answered.");
    }

    const currentItem = session.questions[unansweredIndex];
    const questionDoc = await InterviewQuestion.findById(currentItem.questionId);
    if (!questionDoc) throw new Error("Question details missing in catalog.");

    // 2. Call Gemini API to evaluate answer
    const prompt = `Question: "${questionDoc.question}"
Expected Keywords: "${(questionDoc.expectedKeywords || []).join(", ")}"
Expected Concepts: "${(questionDoc.expectedConcepts || []).join(", ")}"
User's Answer: "${answerText}"

Grade the user's response out of 100. Evaluate technical depth, keywords, and concept coverage.
Output a JSON object conforming exactly to this structure:
{
  "score": 85,
  "missingConcepts": ["compound indexing", "read performance"],
  "feedback": {
    "strengths": ["Clear definition of indexes"],
    "weaknesses": ["Missed compound index patterns"],
    "missedConcepts": ["compound indexing"],
    "idealAnswer": "An ideal answer should cover...",
    "improvementPlan": "Review indexing logs and explain checks.",
    "resources": ["https://mongodb.com/docs/indexes"]
  }
}`;

    const geminiJson = await generateGeminiContent(prompt, "You are a professional technical interviewer. Respond only in valid JSON.", true);
    
    let evalData = null;
    let feedbackData = null;

    if (geminiJson) {
      try {
        const parsed = JSON.parse(geminiJson);
        evalData = {
          score: parsed.score || 70,
          missingConcepts: parsed.missingConcepts || []
        };
        feedbackData = parsed.feedback || {
          strengths: ["Submitted answer"],
          weaknesses: ["Needs detail"],
          missedConcepts: parsed.missingConcepts || [],
          idealAnswer: "Cover key index structures.",
          improvementPlan: "Practice technical descriptions.",
          resources: []
        };
      } catch (e) {
        console.error("Failed to parse Gemini interview answer JSON:", e);
      }
    }

    // Local Fallback if Gemini failed
    if (!evalData || !feedbackData) {
      const rawEval = evaluateAnswerText(
        answerText, 
        questionDoc.expectedKeywords, 
        questionDoc.expectedConcepts
      );
      const techScore = auditTechnicalDepth(rawEval);
      const commScore = auditCommunication(answerText);
      feedbackData = compileQuestionFeedback(
        questionDoc.question,
        rawEval,
        techScore,
        commScore
      );
      evalData = {
        score: rawEval.score,
        missingConcepts: rawEval.missingConcepts || []
      };
    }

    // Save answer & scores
    session.questions[unansweredIndex].answer = answerText;
    session.questions[unansweredIndex].score = evalData.score;
    session.questions[unansweredIndex].feedback = feedbackData;
    session.questions[unansweredIndex].duration = durationSeconds;

    // Log missed concepts to InterviewMistakes
    if (evalData.missingConcepts && evalData.missingConcepts.length > 0) {
      for (const concept of evalData.missingConcepts) {
        await InterviewMistake.findOneAndUpdate(
          { userId, concept },
          { 
            $inc: { frequency: 1 }, 
            $set: { lastSeen: new Date(), severity: "High", resolved: false } 
          },
          { upsert: true }
        );
      }
    }

    await session.save();

    // Check if next question exists
    const nextIdx = unansweredIndex + 1;
    if (nextIdx < session.questions.length) {
      const nextQ = await InterviewQuestion.findById(session.questions[nextIdx].questionId);
      return {
        session: toInterviewSessionDTO(session),
        nextQuestion: {
          id: nextQ._id,
          text: nextQ.question,
          hints: nextQ.hints
        }
      };
    } else {
      // Completed all questions
      return {
        session: toInterviewSessionDTO(session),
        nextQuestion: null
      };
    }
  } catch (err) {
    // Offline local fallback
    return {
      session: { id: sessionId, status: "Active" },
      nextQuestion: {
        id: "mock-q-2",
        text: "How does JWT authentication work, and how do you secure user credentials?",
        hints: ["Mention bcrypt.hash."]
      }
    };
  }
}

// 3. Conclude mock session and generate reports
async function finishSession(userId, sessionId) {
  if (offlineSessions.has(sessionId)) {
    const session = offlineSessions.get(sessionId);
    let totalScore = 0;
    session.questions.forEach(q => {
      totalScore += q.score || 80;
    });
    const averageScore = Math.round(totalScore / session.questions.length) || 75;

    const mockCompleted = {
      id: sessionId,
      role: session.role || "Backend Developer",
      type: session.type || "Technical",
      difficulty: session.difficulty || "Intermediate",
      status: "Completed",
      startedAt: session.startedAt,
      completedAt: new Date(),
      duration: 15,
      overallScore: averageScore,
      technicalScore: averageScore,
      communicationScore: Math.max(0, averageScore - 5),
      problemSolvingScore: averageScore,
      confidenceScore: 85,
      timeManagementScore: 90,
      readinessIncrease: calculateReadinessIncrease(averageScore),
      feedbackSummary: "Offline session concluded. Solid technical descriptions.",
      recommendations: ["Review compound indexing schema files."],
      questions: session.questions
    };

    mockDb.user.score = Math.min(100, mockDb.user.score + mockCompleted.readinessIncrease);
    offlineSessions.delete(sessionId);
    return mockCompleted;
  }

  try {
    const session = await InterviewSession.findOne({ _id: sessionId, userId });
    if (!session) throw new Error("Session not found.");

    // Compute average scores
    let totalScore = 0;
    let questionsCount = session.questions.length;

    session.questions.forEach(q => {
      totalScore += q.score;
    });

    const averageScore = Math.round(totalScore / questionsCount) || 75;

    session.status = "Completed";
    session.completedAt = new Date();
    session.duration = 15; // total minutes

    session.overallScore = averageScore;
    session.technicalScore = Math.min(100, averageScore + 5);
    session.communicationScore = Math.min(100, averageScore - 5);
    session.problemSolvingScore = averageScore;
    session.confidenceScore = 85;
    session.timeManagementScore = 90;

    const gain = calculateReadinessIncrease(averageScore);
    session.readinessIncrease = gain;

    // Generate overall review summary using Gemini API
    const sessionDetails = session.questions.map((q, idx) => `Q${idx+1}: "${q.answer}" (Score: ${q.score})`).join("\n");
    const summaryPrompt = `We just completed a mock interview session for a candidate aiming to be a "${session.role}".
Below are the answers and grades from the session:
${sessionDetails}

Generate a professional, structured feedback report.
Output a JSON object conforming exactly to this structure:
{
  "feedbackSummary": "A concise summary of their overall performance, highlighting strengths and major gaps.",
  "recommendations": [
    "A concrete suggestion for improvement",
    "Another concrete suggestion"
  ]
}`;

    const geminiSummaryJson = await generateGeminiContent(summaryPrompt, "You are a senior tech lead reviewing a candidate mock interview. Respond only in valid JSON.", true);
    let summaryData = null;

    if (geminiSummaryJson) {
      try {
        const parsedSummary = JSON.parse(geminiSummaryJson);
        summaryData = {
          feedbackSummary: parsedSummary.feedbackSummary,
          recommendations: parsedSummary.recommendations
        };
      } catch (e) {
        console.error("Failed to parse Gemini interview session summary JSON:", e);
      }
    }

    if (summaryData) {
      session.feedbackSummary = summaryData.feedbackSummary;
      session.recommendations = summaryData.recommendations;
    } else {
      session.feedbackSummary = `Completed ${session.type} Interview simulation. Solid articulation on architectural patterns with minor gaps in deployment credentials configurations.`;
      session.recommendations = [
        "Improve database compound indexing explain check patterns.",
        "Incorporate bcrypt salt rounds validation into server authentication middlewares."
      ];
    }

    await session.save();

    // Increment mastered questions count for the user
    const userDoc = await User.findById(userId);
    if (userDoc) {
      userDoc.masteredQuestionsCount = (userDoc.masteredQuestionsCount || 0) + 1;
      await userDoc.save();
    }

    // Log Activity Event for Real-Time Analytics
    await logCareerEvent(
      userId,
      `Mock Interview Completed (${session.type})`,
      "Interview Coach",
      10,
      { sessionId: session._id, overallScore: session.overallScore }
    );

    // Force recalculate Career Score
    await recalculateUserStats(userId);

    return toInterviewSessionDTO(session);
  } catch (err) {
    console.error("finishSession error caught:", err);
    // Offline local fallback
    const mockCompleted = {
      id: sessionId,
      role: "Backend Developer",
      type: "Technical",
      difficulty: "Intermediate",
      status: "Completed",
      startedAt: new Date(),
      completedAt: new Date(),
      duration: 15,
      overallScore: 82,
      technicalScore: 85,
      communicationScore: 80,
      problemSolvingScore: 82,
      confidenceScore: 85,
      timeManagementScore: 90,
      readinessIncrease: 4,
      feedbackSummary: "Offline session concluded. Solid technical descriptions.",
      recommendations: ["Review compound indexing schema files."],
      questions: []
    };

    mockDb.user.score = Math.min(100, mockDb.user.score + 3);

    return mockCompleted;
  }
}

// 4. Fetch session history log
async function getSessionHistory(userId) {
  try {
    const sessions = await InterviewSession.find({ userId }).sort({ completedAt: -1 });
    return sessions.map(toInterviewSessionDTO).filter(Boolean);
  } catch (err) {
    return [];
  }
}

// 5. Fetch mistake aggregates and readiness metrics
async function getReadinessSummary(userId) {
  try {
    const mistakes = await InterviewMistake.find({ userId, resolved: false }).sort({ frequency: -1 });
    const history = await InterviewSession.find({ userId, status: "Completed" }).sort({ completedAt: -1 });

    const avgScore = history.length > 0
      ? Math.round(history.reduce((acc, curr) => acc + curr.overallScore, 0) / history.length)
      : 75;

    return {
      interviewReadiness: avgScore,
      unresolvedMistakes: mistakes.map(m => ({
        concept: m.concept,
        frequency: m.frequency,
        severity: m.severity,
        lastSeen: m.lastSeen
      }))
    };
  } catch (err) {
    return {
      interviewReadiness: 75,
      unresolvedMistakes: []
    };
  }
}

module.exports = {
  startSession,
  submitAnswer,
  finishSession,
  getSessionHistory,
  getReadinessSummary
};

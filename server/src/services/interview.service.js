const User = require("../models/User");
const InterviewQuestion = require("../models/InterviewQuestion");
const InterviewSession = require("../models/InterviewSession");
const InterviewMistake = require("../models/InterviewMistake");

const { generateAiContent } = require("../config/ai");

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
    const { getCareerContext } = require("./careerContext.service");
    const userContext = await getCareerContext(userId);
    const effectiveRole = (role && role.trim().length > 0) ? role.trim() : (userContext.targetRole || "Full Stack Developer");
    
    // Try to dynamically generate questions using Gemini API
    let selected = [];
    try {
      const prompt = `Generate exactly ${count} interview questions for the role "${effectiveRole}".
Category/Type of interview: "${type}"
Difficulty Level: "${difficulty}"

Candidate Career Context:
Target Role: "${effectiveRole}"
Experience Level: "${userContext.experienceLevel || "Intermediate"}"
Skills possessed: ${JSON.stringify(userContext.skillsPossessed)}
Resume Identified Skills: ${JSON.stringify(userContext.resumeContext?.identifiedSkills || [])}
Resume Missing Keywords: ${JSON.stringify(userContext.resumeContext?.missingKeywords || [])}
Weaknesses / Concept Mistakes: ${JSON.stringify(userContext.interviewContext?.repeatingMistakes || userContext.weaknesses || [])}

Each question must be challenging, professional, and realistic. Tailor the questions directly to the target role "${effectiveRole}" and their specific skills/weaknesses.
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

      const geminiJson = await generateAiContent(prompt, "You are a professional technical recruiter and engineering lead. Respond only in JSON format.", true);

      if (geminiJson) {
        const parsed = JSON.parse(geminiJson);
        if (Array.isArray(parsed) && parsed.length > 0) {
          for (const q of parsed) {
            const doc = await InterviewQuestion.create({
              question: q.question,
              category: type,
              role: effectiveRole,
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

    // If AI generation was unsuccessful, use only questions already persisted
    if (selected.length === 0) {
      const words = (effectiveRole || "").split(/\s+/).filter(w => w.length > 2);
      const regexPattern = words.length > 0 ? words.join("|") : (effectiveRole || "Full Stack Developer");
      
      let dbQuestions = await InterviewQuestion.find({
        role: { $regex: new RegExp(regexPattern, "i") }
      });
      
      if (dbQuestions.length === 0) {
        dbQuestions = await InterviewQuestion.find({});
      }

      if (dbQuestions.length === 0) {
        // Seed standard interview questions fallback
        const defaultQ1 = await InterviewQuestion.create({
          question: `Explain how you design RESTful APIs and architecture for a modern ${effectiveRole} application.`,
          category: type || "Technical",
          role: effectiveRole,
          difficulty: difficulty || "Intermediate",
          expectedConcepts: ["API Architecture", "Design Tradeoffs", "Authentication", "Validation"],
          expectedKeywords: ["GET", "POST", "JWT", "JSON", "middleware"],
          hints: ["Discuss resource naming, status codes, and stateless JWT auth."]
        });
        const defaultQ2 = await InterviewQuestion.create({
          question: `How do you handle state management and async data fetching in ${effectiveRole} applications?`,
          category: type || "Technical",
          role: effectiveRole,
          difficulty: difficulty || "Intermediate",
          expectedConcepts: ["State Management", "Immutability", "Async Operations", "Caching"],
          expectedKeywords: ["Zustand", "Redux", "Hooks", "useEffect", "fetch"],
          hints: ["Talk about local vs global state, side-effect hooks, and error handling."]
        });
        dbQuestions = [defaultQ1, defaultQ2];
      }
      
      const poolQuestions = selectQuestions(type, effectiveRole, difficulty, dbQuestions);
      selected = (poolQuestions && poolQuestions.length > 0 ? poolQuestions : dbQuestions).slice(0, count);
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
      role: effectiveRole,
      type: type || "Technical",
      difficulty: difficulty || "Intermediate",
      formatMode: config.formatMode || "voice_video",
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
    console.error("Interview Service Error in startSession:", err);
    throw err;
  }
}

// 2. Submit Answer to current question
async function submitAnswer(userId, sessionId, answerText, durationSeconds) {


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

    const geminiJson = await generateAiContent(prompt, "You are a professional technical interviewer. Respond only in valid JSON.", true);
    
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
    console.error("Interview Service Error in submitAnswer:", err);
    throw err;
  }
}

// 3. Conclude mock session and generate reports
async function finishSession(userId, sessionId) {


  try {
    const session = await InterviewSession.findOne({ _id: sessionId, userId });
    if (!session) throw new Error("Session not found.");

    // Filter answered questions or evaluate based on completed questions
    const answeredQuestions = session.questions.filter(q => q.answer && q.answer.trim().length > 0);
    const questionsCount = answeredQuestions.length > 0 ? answeredQuestions.length : session.questions.length;

    let totalScore = 0;
    session.questions.forEach(q => {
      totalScore += (q.score || 0);
    });

    // Compute centralized 6 dimension ratings across evaluations
    const evaluations = session.evaluations || [];
    let techSum = 0, probSum = 0, commSum = 0, qualSum = 0, confSum = 0, relSum = 0;
    const evalCount = evaluations.length || 1;

    evaluations.forEach((ev) => {
      const s = ev.scores || {};
      techSum += s.technicalKnowledge ?? s.technicalAccuracy ?? 70;
      probSum += s.problemSolving ?? 70;
      commSum += s.communication ?? 75;
      qualSum += s.answerQuality ?? s.relevance ?? 75;
      confSum += s.confidence ?? 75;
      relSum += s.roleRelevance ?? s.contextConsistency ?? 80;
    });

    const ratings = {
      technicalKnowledge: Math.round(techSum / evalCount),
      problemSolving: Math.round(probSum / evalCount),
      communication: Math.round(commSum / evalCount),
      answerQuality: Math.round(qualSum / evalCount),
      confidence: Math.round(confSum / evalCount),
      roleRelevance: Math.round(relSum / evalCount)
    };

    const ratingVals = Object.values(ratings);
    const averageScore = Math.round(ratingVals.reduce((a, b) => a + b, 0) / ratingVals.length);

    session.status = "Completed";
    session.completedAt = new Date();
    session.duration = 15; // total minutes

    session.ratings = ratings;
    session.overallScore = averageScore;
    session.technicalScore = ratings.technicalKnowledge;
    session.communicationScore = ratings.communication;
    session.problemSolvingScore = ratings.problemSolving;
    session.confidenceScore = ratings.confidence;
    session.timeManagementScore = ratings.answerQuality;

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

    const geminiSummaryJson = await generateAiContent(summaryPrompt, "You are a senior tech lead reviewing a candidate mock interview. Respond only in valid JSON.", true);
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
      session.feedbackSummary = null;
      session.recommendations = [];
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

    // Persist InterviewReport model document
    const InterviewReport = require("../models/InterviewReport");
    const qaAnalysis = session.questions.map((q) => ({
      question: q.questionText || "Interview Question",
      answer: q.answer || "No response",
      score: q.score || 0,
      strengths: q.feedback?.strengths || [],
      weaknesses: q.feedback?.weaknesses || [],
      idealAnswer: q.feedback?.idealAnswer || "",
      coachAdvice: q.feedback?.improvementPlan || ""
    }));

    let report = await InterviewReport.findOne({ sessionId: session._id });
    if (!report) {
      report = await InterviewReport.create({
        sessionId: session._id,
        userId,
        role: session.role,
        type: session.type,
        difficulty: session.difficulty,
        formatMode: session.formatMode || "voice_video",
        overallScore: session.overallScore,
        subscores: session.ratings,
        strengths: session.questions.flatMap(q => q.feedback?.strengths || []).slice(0, 5),
        weakAreas: session.questions.flatMap(q => q.feedback?.missedConcepts || []).slice(0, 5),
        repeatedMistakes: session.questions.flatMap(q => q.feedback?.weaknesses || []).slice(0, 5),
        qaAnalysis,
        recommendedTopics: session.recommendations || [],
        recommendedPractice: ["Practice architectural trade-offs", "Implement production error handling"],
        nextBestAction: `Revise concepts in ${session.role} interview focus areas.`
      });
      session.reportId = report._id;
      await session.save();
    }

    const dto = toInterviewSessionDTO(session);
    dto.reportId = report._id;
    return dto;
  } catch (err) {
    console.error("Interview Service Error in finishSession:", err);
    throw err;
  }
}

// 4. Fetch session details by ID for Live Room recovery
async function getInterviewSession(userId, sessionId) {
  const session = await InterviewSession.findOne({ _id: sessionId, userId });
  if (!session) return null;
  return toInterviewSessionDTO(session);
}

// 5. Submit live answer with adaptive AI policy evaluation
async function submitLiveAnswer(userId, sessionId, answerText, durationSeconds = 30) {
  const session = await InterviewSession.findOne({ _id: sessionId, userId });
  if (!session) throw new Error("Interview session not found.");

  const { evaluateAnswerAdaptively } = require("../engines/interview/adaptiveInterview.engine");
  const { getVerifiedCandidateContext } = require("../engines/interview/contextVerifier.engine");

  const verifiedContext = await getVerifiedCandidateContext(userId);
  const currentIdx = session.currentQuestionIndex || 0;
  const currentQObj = session.questions[currentIdx] || session.questions[0];

  const currentQText = currentQObj?.questionText || "Technical Question";

  // Evaluate answer adaptively
  const evalResult = await evaluateAnswerAdaptively({
    role: session.role,
    type: session.type,
    difficulty: session.difficulty,
    currentQuestionText: currentQText,
    answerText,
    verifiedContext,
    questionNumber: currentIdx + 1,
    totalQuestions: session.questions.length || session.totalQuestions || 3
  });

  // Log user answer into conversation & question object
  session.conversation.push({
    role: "user",
    text: answerText,
    timestamp: new Date(),
    questionId: currentQObj?.questionId ? String(currentQObj.questionId) : ""
  });

  if (session.questions[currentIdx]) {
    session.questions[currentIdx].answer = answerText;
    session.questions[currentIdx].score = evalResult.overallAnswerScore;
    session.questions[currentIdx].duration = durationSeconds;
    session.questions[currentIdx].feedback = {
      strengths: evalResult.strengths,
      weaknesses: evalResult.weaknesses,
      missedConcepts: evalResult.missedConcepts,
      idealAnswer: evalResult.idealAnswer,
      improvementPlan: evalResult.improvementPlan,
      resources: []
    };
  }

  // Push evaluation details
  session.evaluations.push({
    questionText: currentQText,
    answerText,
    scores: evalResult.scores,
    actionTaken: evalResult.action,
    strengths: evalResult.strengths,
    weaknesses: evalResult.weaknesses,
    missedConcepts: evalResult.missedConcepts,
    idealAnswer: evalResult.idealAnswer,
    improvementPlan: evalResult.improvementPlan
  });

  // Log missed concepts to InterviewMistake
  if (evalResult.missedConcepts && evalResult.missedConcepts.length > 0) {
    for (const concept of evalResult.missedConcepts) {
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

  // Handle action
  if (evalResult.action === "END_INTERVIEW" || currentIdx + 1 >= session.questions.length) {
    session.status = "Completed";
    await session.save();
    return await finishSession(userId, sessionId);
  } else {
    session.currentQuestionIndex = currentIdx + 1;
    const nextQ = session.questions[session.currentQuestionIndex];
    
    // Log AI follow-up or next question in conversation
    session.conversation.push({
      role: "ai",
      text: evalResult.aiSpeechResponse,
      timestamp: new Date(),
      questionId: nextQ?.questionId ? String(nextQ.questionId) : ""
    });

    await session.save();

    return {
      session: toInterviewSessionDTO(session),
      action: evalResult.action,
      aiSpeechResponse: evalResult.aiSpeechResponse,
      nextQuestion: {
        id: nextQ?.questionId || session.currentQuestionIndex,
        text: nextQ?.questionText || evalResult.aiSpeechResponse,
        hints: []
      },
      evaluation: evalResult
    };
  }
}

// 6. Fetch Report details by sessionId or reportId
async function getInterviewReport(userId, sessionId) {
  const InterviewReport = require("../models/InterviewReport");
  const mongoose = require("mongoose");
  const isObjectId = mongoose.Types.ObjectId.isValid(sessionId);

  if (!isObjectId) return null;

  const report = await InterviewReport.findOne({
    $or: [{ sessionId }, { _id: sessionId }],
    userId
  });
  if (report) return report;

  // Fallback: search session by ID
  const session = await InterviewSession.findOne({ _id: sessionId, userId });
  if (!session) return null;

  return {
    sessionId: session._id,
    userId: session.userId,
    role: session.role,
    type: session.type,
    difficulty: session.difficulty,
    formatMode: session.formatMode || "voice_video",
    overallScore: session.overallScore,
    subscores: session.ratings || {
      technicalKnowledge: session.technicalScore || session.overallScore || 0,
      problemSolving: session.problemSolvingScore || session.overallScore || 0,
      communication: session.communicationScore || session.overallScore || 0,
      answerQuality: session.overallScore || 0,
      confidence: session.confidenceScore || session.overallScore || 0,
      roleRelevance: session.overallScore || 0
    },
    strengths: session.questions.flatMap(q => q.feedback?.strengths || []).filter(Boolean).slice(0, 5),
    weakAreas: session.questions.flatMap(q => q.feedback?.missedConcepts || []).filter(Boolean).slice(0, 5),
    repeatedMistakes: session.questions.flatMap(q => q.feedback?.weaknesses || []).filter(Boolean).slice(0, 5),
    qaAnalysis: session.questions.map((q, idx) => ({
      question: q.questionText || `Question ${idx + 1}`,
      candidateAnswer: q.answer || "No response provided",
      score: q.score || 0,
      evaluation: {
        technicalKnowledge: q.score || 0,
        problemSolving: q.score || 0,
        communication: q.score || 0,
        answerQuality: q.score || 0,
        confidence: q.score || 0,
        roleRelevance: q.score || 0
      },
      strengths: q.feedback?.strengths || [],
      weaknesses: q.feedback?.weaknesses || [],
      idealAnswer: q.feedback?.idealAnswer || "",
      coachAdvice: q.feedback?.improvementPlan || ""
    })),
    recommendedTopics: session.recommendations || [],
    recommendedPractice: ["System Architecture Design", "Core Concepts Review"],
    nextBestAction: `Revise missed concepts from your ${session.role} mock round.`
  };
}

// 7. Fetch session history log
async function getSessionHistory(userId) {
  try {
    const sessions = await InterviewSession.find({ userId }).sort({ completedAt: -1 });
    return sessions.map(toInterviewSessionDTO).filter(Boolean);
  } catch (err) {
    return [];
  }
}

// 8. Fetch mistake aggregates and readiness metrics from MongoDB
async function getReadinessSummary(userId) {
  try {
    let history = await InterviewSession.find({
      userId,
      $or: [
        { status: "Completed" },
        { overallScore: { $gt: 0 } },
        { "questions.0": { $exists: true } }
      ]
    }).sort({ completedAt: -1, createdAt: -1 });

    if (!history || history.length === 0) {
      history = await InterviewSession.find({ userId }).sort({ completedAt: -1, createdAt: -1 });
    }

    let mistakes = [];
    try {
      mistakes = await InterviewMistake.find({ userId, resolved: false }).sort({ frequency: -1, lastSeen: -1 });
    } catch (e) {
      mistakes = [];
    }

    // Fallback: If InterviewMistake collection is empty, aggregate missed concepts & weaknesses dynamically from sessions
    if ((!mistakes || mistakes.length === 0) && history.length > 0) {
      const conceptMap = new Map();
      history.forEach(s => {
        const concepts = [];
        if (Array.isArray(s.questions)) {
          s.questions.forEach(q => {
            if (q?.feedback?.missedConcepts) {
              if (Array.isArray(q.feedback.missedConcepts)) concepts.push(...q.feedback.missedConcepts);
              else if (typeof q.feedback.missedConcepts === "string") concepts.push(q.feedback.missedConcepts);
            }
            if (q?.feedback?.weaknesses) {
              if (Array.isArray(q.feedback.weaknesses)) concepts.push(...q.feedback.weaknesses);
              else if (typeof q.feedback.weaknesses === "string") concepts.push(q.feedback.weaknesses);
            }
          });
        }
        if (Array.isArray(s.evaluations)) {
          s.evaluations.forEach(e => {
            if (e?.missedConcepts) {
              if (Array.isArray(e.missedConcepts)) concepts.push(...e.missedConcepts);
              else if (typeof e.missedConcepts === "string") concepts.push(e.missedConcepts);
            }
            if (e?.weaknesses) {
              if (Array.isArray(e.weaknesses)) concepts.push(...e.weaknesses);
              else if (typeof e.weaknesses === "string") concepts.push(e.weaknesses);
            }
          });
        }
        concepts.forEach(c => {
          if (!c || typeof c !== "string" || c.trim().length < 3) return;
          const trimmed = c.trim();
          const existing = conceptMap.get(trimmed) || { concept: trimmed, frequency: 0, lastSeen: s.updatedAt || s.createdAt || new Date() };
          existing.frequency += 1;
          conceptMap.set(trimmed, existing);
        });
      });
      mistakes = Array.from(conceptMap.values()).sort((a, b) => b.frequency - a.frequency);
    }

    if (!history || history.length === 0) {
      return {
        interviewReadiness: null,
        dimensions: null,
        recentInterviews: [],
        weakAreas: (mistakes || []).slice(0, 10).map(m => ({
          concept: m.concept,
          frequency: m.frequency,
          severity: m.frequency > 1 ? "High" : m.severity || "Medium",
          isRepeating: m.frequency > 1,
          lastSeen: m.lastSeen
        })),
        performanceTrend: [],
        completedCount: 0
      };
    }

    // Ensure every session in history has a computed overallScore if missing
    history.forEach(s => {
      if (!s.overallScore || s.overallScore === 0) {
        if (Array.isArray(s.questions) && s.questions.length > 0) {
          const scoredQs = s.questions.filter(q => q && q.score > 0);
          if (scoredQs.length > 0) {
            s.overallScore = Math.round(scoredQs.reduce((acc, q) => acc + q.score, 0) / scoredQs.length);
          }
        }
      }
    });

    const scoredHistory = history.filter(s => (s.overallScore || 0) > 0);
    const targetHistory = scoredHistory.length > 0 ? scoredHistory : history;

    const avgScore = Math.round(
      targetHistory.reduce((acc, curr) => acc + (curr.overallScore || 0), 0) / targetHistory.length
    );

    let techSum = 0, probSum = 0, commSum = 0, qualSum = 0, confSum = 0, relSum = 0;
    targetHistory.forEach(s => {
      const r = s.ratings || {};
      techSum += r.technicalKnowledge ?? s.technicalScore ?? s.overallScore ?? 70;
      probSum += r.problemSolving ?? s.problemSolvingScore ?? s.overallScore ?? 70;
      commSum += r.communication ?? s.communicationScore ?? s.overallScore ?? 75;
      qualSum += r.answerQuality ?? s.overallScore ?? 75;
      confSum += r.confidence ?? s.confidenceScore ?? s.overallScore ?? 75;
      relSum += r.roleRelevance ?? s.overallScore ?? 80;
    });

    const hLen = targetHistory.length;
    const dimensions = {
      technicalKnowledge: Math.round(techSum / hLen),
      problemSolving: Math.round(probSum / hLen),
      communication: Math.round(commSum / hLen),
      answerQuality: Math.round(qualSum / hLen),
      confidence: Math.round(confSum / hLen),
      roleRelevance: Math.round(relSum / hLen)
    };

    const performanceTrend = [...targetHistory].reverse().map(s => ({
      date: s.completedAt || s.createdAt || new Date(),
      score: s.overallScore || 0,
      role: s.role || "Developer"
    }));

    return {
      interviewReadiness: avgScore,
      dimensions,
      recentInterviews: history.slice(0, 5).map(toInterviewSessionDTO).filter(Boolean),
      weakAreas: (mistakes || []).map(m => ({
        concept: m.concept,
        frequency: m.frequency,
        severity: m.frequency > 1 ? "High" : m.severity || "Medium",
        isRepeating: m.frequency > 1,
        lastSeen: m.lastSeen
      })),
      performanceTrend,
      completedCount: history.length
    };
  } catch (err) {
    console.error("Error in getReadinessSummary:", err);
    return {
      interviewReadiness: null,
      dimensions: null,
      recentInterviews: [],
      weakAreas: [],
      performanceTrend: [],
      completedCount: 0
    };
  }
}

module.exports = {
  startSession,
  submitAnswer,
  submitLiveAnswer,
  finishSession,
  getInterviewSession,
  getInterviewReport,
  getSessionHistory,
  getReadinessSummary
};

"use client";

import { useRouter } from "next/navigation";
import React, { useState, useEffect, useRef, useMemo } from "react";
import { useCareerStore, InterviewSessionData } from "@/store/careerStore";
import Card from "@/components/ui/Card/Card";
import Button from "@/components/ui/Button/Button";
import Badge from "@/components/ui/Badge/Badge";
import { PageTransition, StaggerItem } from "@/components/ui/PageTransition";
import PageHeader from "@/components/ui/PageHeader";
import AudioVisualizer from "@/components/interview/AudioVisualizer";
import LiveTranscript, { ConversationMessage } from "@/components/interview/LiveTranscript";
import { sttService } from "@/lib/speech/speechToText.service";
import { ttsService } from "@/lib/speech/textToSpeech.service";
import {
  GraduationCap,
  Sparkles,
  Play,
  Send,
  AlertOctagon,
  Clock,
  Award,
  ChevronRight,
  TrendingUp,
  Brain,
  X,
  ExternalLink,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Volume2,
  VolumeX,
  Square,
  ShieldCheck,
  Activity,
  ArrowLeft,
  UserCheck,
  FileText
} from "lucide-react";

export type InterviewRoomState = "setup" | "starting" | "live" | "processing" | "completed";

export default function InterviewPrepPage() {
  const router = useRouter();
  const activeSession = useCareerStore((state) => state.activeInterviewSession);
  const currentQuestion = useCareerStore((state) => state.currentInterviewQuestion);
  const history = useCareerStore((state) => state.interviewSessions);
  const readiness = useCareerStore((state) => state.interviewReadiness);
  const mistakes = useCareerStore((state) => state.unresolvedMistakes);
  const dimensions = useCareerStore((state) => state.interviewDimensions);
  const performanceTrend = useCareerStore((state) => state.interviewPerformanceTrend);
  const profile = useCareerStore((state) => state.profile);
  const user = useCareerStore((state) => state.user);
  const fetchDashboardData = useCareerStore((state) => state.fetchDashboardData);

  const fetchHistory = useCareerStore((state) => state.fetchInterviewHistory);
  const fetchReadiness = useCareerStore((state) => state.fetchInterviewReadiness);
  const startMockInterview = useCareerStore((state) => state.startMockInterview);
  const createInterviewSession = useCareerStore((state) => state.createInterviewSession);
  const submitLiveAnswer = useCareerStore((state) => state.submitLiveAnswer);
  const submitInterviewAnswer = useCareerStore((state) => state.submitInterviewAnswer);
  const concludeMockInterview = useCareerStore((state) => state.concludeMockInterview);
  const addNotification = useCareerStore((state) => state.addNotification);

  // Core Room State Machine & 3 Format Modes
  const [roomState, setRoomState] = useState<InterviewRoomState>("setup");
  // Voice interviews are microphone-only by default. Webcam access is opt-in.
  const [selectedMode, setSelectedMode] = useState<"quiz" | "voice_only" | "voice_video">("voice_only");
  const [showInlineQuiz, setShowInlineQuiz] = useState(false);

  // Form Inputs - Synchronized to canonical user targetRole
  const [roleInput, setRoleInput] = useState<string>("Full Stack Developer");
  const [typeInput, setTypeInput] = useState<any>("Technical");
  const [difficultyInput, setDifficultyInput] = useState<any>("Intermediate");
  const [questionCountInput, setQuestionCountInput] = useState(3);

  // Live Interview Room Media & Voice Controls
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isMicOn, setIsMicOn] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [cameraPermissionError, setCameraPermissionError] = useState(false);

  // Session Data & Transcript
  const [currentQuestionText, setCurrentQuestionText] = useState<string>("");
  const [currentQuestionNumber, setCurrentQuestionNumber] = useState<number>(1);
  const [totalQuestions, setTotalQuestions] = useState<number>(3);
  const [conversation, setConversation] = useState<ConversationMessage[]>([]);
  const [answerText, setAnswerText] = useState("");
  const [finalTranscript, setFinalTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [activeReport, setActiveReport] = useState<InterviewSessionData | null>(null);
  const [expandedQuestionIdx, setExpandedQuestionIdx] = useState<number | null>(null);

  // Timers
  const [seconds, setSeconds] = useState(0);
  const timerRef = useRef<any>(null);
  const [loading, setLoading] = useState(false);

  // Integrity & Anti-Cheating Monitoring System
  const [integrityScore, setIntegrityScore] = useState<number>(100);
  const [integrityWarnings, setIntegrityWarnings] = useState<
    { type: string; message: string; timestamp: Date }[]
  >([]);
  const [activeWarningBanner, setActiveWarningBanner] = useState<string | null>(null);
  const warningTimerRef = useRef<any>(null);

  const triggerIntegrityWarning = (type: string, message: string, scoreDeduction: number = 10) => {
    setIntegrityScore((prev) => Math.max(0, prev - scoreDeduction));
    setIntegrityWarnings((prev) => [
      ...prev,
      { type, message, timestamp: new Date() }
    ]);
    setActiveWarningBanner(message);

    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    warningTimerRef.current = setTimeout(() => {
      setActiveWarningBanner(null);
    }, 6000);
  };

  // Window Focus Loss & Gaze Shift Integrity Monitoring (Strictly scoped to Voice + Webcam Proctored Mode)
  useEffect(() => {
    if (roomState !== "live" || selectedMode !== "voice_video") return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        triggerIntegrityWarning(
          "tab_switch",
          "⚠️ Integrity Warning: Tab switch / focus loss detected! Please stay focused on the interview screen.",
          15
        );
      }
    };

    const handleWindowBlur = () => {
      triggerIntegrityWarning(
        "window_blur",
        "⚠️ Integrity Warning: Window lost focus. Avoid looking away or viewing external notes.",
        10
      );
    };

    const handleCopyPaste = (e: ClipboardEvent) => {
      triggerIntegrityWarning(
        "copy_paste",
        "⚠️ Integrity Warning: External text paste detected! Please speak or type your own response.",
        10
      );
    };

    window.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleWindowBlur);
    window.addEventListener("paste", handleCopyPaste);

    return () => {
      window.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleWindowBlur);
      window.removeEventListener("paste", handleCopyPaste);
    };
  }, [roomState, selectedMode]);

  // Real-Time Canvas Video Frame Head/Gaze Displacement Sampling Loop
  useEffect(() => {
    if (roomState !== "live" || selectedMode !== "voice_video" || !isCameraOn) return;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d", { willReadFrequently: true });

    const interval = setInterval(() => {
      if (!videoRef.current || videoRef.current.paused || videoRef.current.ended) return;
      const video = videoRef.current;
      if (video.videoWidth === 0 || video.videoHeight === 0) return;

      canvas.width = 160;
      canvas.height = 120;
      if (!ctx) return;
      
      try {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const frameData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = frameData.data;

        let leftMass = 0;
        let centerMass = 0;
        let rightMass = 0;

        for (let y = 0; y < canvas.height; y += 4) {
          for (let x = 0; x < canvas.width; x += 4) {
            const idx = (y * canvas.width + x) * 4;
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];

            // Skin tone / brightness mass heuristic (R > 50, G > 30, B > 15, R > G)
            if (r > 50 && g > 30 && b > 15 && r > g) {
              if (x < canvas.width * 0.33) leftMass++;
              else if (x > canvas.width * 0.67) rightMass++;
              else centerMass++;
            }
          }
        }

        const totalMass = leftMass + centerMass + rightMass;
        if (totalMass > 80) {
          const leftRatio = leftMass / totalMass;
          const rightRatio = rightMass / totalMass;

          // If face/head mass shifts significantly to left or right margin (> 46% of mass on one side)
          if (leftRatio > 0.46 || rightRatio > 0.46) {
            triggerIntegrityWarning(
              "side_gaze",
              "⚠️ Integrity Alert: Head/Eye orientation shifted sideways. Please face the camera directly.",
              8
            );
          }
        }
      } catch (err) {
        // Ignore canvas read errors if stream reloads
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [roomState, selectedMode, isCameraOn]);

  const focusSkills = useMemo(() => {
    const roleLower = roleInput.toLowerCase();
    if (typeInput === "Behavioral") return "STAR Framework, Communication, Delivery";
    if (typeInput === "HR") return "Core Values, Collaboration, Salary Fit";
    if (typeInput === "System Design") return "Scalability, Database Indexing, Caching";
    
    if (roleLower.includes("backend")) {
      return "REST APIs, JWT Auth, MongoDB, Express";
    }
    if (roleLower.includes("frontend") || roleLower.includes("react")) {
      return "React 19, TypeScript, Next.js, Styling";
    }
    if (roleLower.includes("devops") || roleLower.includes("cloud")) {
      return "Docker, GitHub Actions, AWS Stack, CI/CD";
    }
    return "Data Structures, Logic flow, Clean code";
  }, [roleInput, typeInput]);

  const aiRecommendation = useMemo(() => {
    if (typeInput === "Behavioral") {
      return "Focus on structuring your scenarios with clear Situation, Task, Action, and Result indicators.";
    }
    if (typeInput === "HR") {
      return "Be ready to communicate career goals, motivators, and alignment with corporate culture values.";
    }
    if (typeInput === "System Design") {
      return "Focus on describing trade-offs (e.g. read/write database tuning, memory caching bottlenecks).";
    }
    return `Based on your Resume, Career DNA, and Roadmap, we'll evaluate backend authentication, modular coding logic, and schema indexing.`;
  }, [typeInput]);

  const sessionMistakes = useMemo(() => {
    if (!activeReport || !activeReport.questions) return [];
    const set = new Set<string>();
    activeReport.questions.forEach((q) => {
      if (q.feedback && q.feedback.missedConcepts) {
        q.feedback.missedConcepts.forEach((c) => set.add(c));
      }
    });
    return Array.from(set);
  }, [activeReport]);

  const computedReadiness = useMemo(() => {
    if (readiness !== null && readiness !== undefined) return readiness;
    if (!history || history.length === 0) return null;
    const scored = history.filter((h) => (h.overallScore || 0) > 0);
    const target = scored.length > 0 ? scored : history;
    return Math.round(target.reduce((acc, h) => acc + (h.overallScore || 0), 0) / target.length);
  }, [readiness, history]);

  const effectiveMistakes = useMemo(() => {
    let list: any[] = [];
    if (mistakes && mistakes.length > 0) {
      list = [...mistakes];
    } else if (history && history.length > 0) {
      const conceptMap = new Map<string, { concept: string; frequency: number; severity?: string; lastSeen?: any }>();
      history.forEach((s) => {
        const concepts: string[] = [];
        if (Array.isArray(s.questions)) {
          s.questions.forEach((q) => {
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
        concepts.forEach((c) => {
          if (!c || typeof c !== "string" || c.trim().length < 3) return;
          const trimmed = c.trim();
          const existing = conceptMap.get(trimmed) || { concept: trimmed, frequency: 0, severity: "Medium" };
          existing.frequency += 1;
          if (existing.frequency > 1) existing.severity = "High";
          conceptMap.set(trimmed, existing);
        });
      });
      list = Array.from(conceptMap.values());
    }

    // Sort: highest frequency / repeating first, capped at 10 max
    return list
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 10);
  }, [mistakes, history]);

  const effectiveTrend = useMemo(() => {
    if (performanceTrend && performanceTrend.length > 0) return performanceTrend;
    if (!history || history.length === 0) return [];
    return [...history].reverse().map((h) => ({
      date: h.completedAt || h.startedAt || new Date().toISOString(),
      score: h.overallScore || 0,
      role: h.role || "Developer"
    }));
  }, [performanceTrend, history]);

  const trendMetrics = useMemo(() => {
    if (!effectiveTrend || effectiveTrend.length === 0) {
      return { avgScore: 0, maxScore: 0, minScore: 0, latestScore: 0, delta: 0 };
    }
    const scores = effectiveTrend.map((t: any) => t.score || 0);
    const avgScore = Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length);
    const maxScore = Math.max(...scores);
    const minScore = Math.min(...scores);
    const latestScore = scores[scores.length - 1] || 0;
    const firstScore = scores[0] || 0;
    const delta = latestScore - firstScore;
    return { avgScore, maxScore, minScore, latestScore, delta };
  }, [effectiveTrend]);

  const svgTrendData = useMemo(() => {
    if (!effectiveTrend || effectiveTrend.length === 0) return { linePath: "", areaPath: "", points: [] };

    const width = 800;
    const height = 150;
    const padTop = 20;
    const padBottom = 30;
    const padLeft = 40;
    const padRight = 20;

    const usableWidth = width - padLeft - padRight;
    const usableHeight = height - padTop - padBottom;
    const count = effectiveTrend.length;

    const points = effectiveTrend.map((pt: any, i: number) => {
      const score = Math.min(100, Math.max(0, pt.score || 0));
      const x = count === 1 ? width / 2 : padLeft + (i / (count - 1)) * usableWidth;
      const y = padTop + usableHeight - (score / 100) * usableHeight;
      return { x, y, score, date: pt.date, role: pt.role, round: i + 1 };
    });

    if (points.length === 1) {
      const p = points[0];
      return {
        linePath: `M ${p.x - 30} ${p.y} L ${p.x + 30} ${p.y}`,
        areaPath: `M ${p.x - 30} ${p.y} L ${p.x + 30} ${p.y} L ${p.x + 30} ${height - padBottom} L ${p.x - 30} ${height - padBottom} Z`,
        points
      };
    }

    let linePath = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const cx = ((p0.x + p1.x) / 2).toFixed(1);
      linePath += ` C ${cx} ${p0.y.toFixed(1)}, ${cx} ${p1.y.toFixed(1)}, ${p1.x.toFixed(1)} ${p1.y.toFixed(1)}`;
    }

    const first = points[0];
    const last = points[points.length - 1];
    const areaPath = `${linePath} L ${last.x.toFixed(1)} ${height - padBottom} L ${first.x.toFixed(1)} ${height - padBottom} Z`;

    return { linePath, areaPath, points };
  }, [effectiveTrend]);

  const getQuestionText = (q: any) => {
    if (q.questionText) return q.questionText;
    if (typeof q.questionId === "object" && q.questionId !== null && q.questionId.question) {
      return q.questionId.question;
    }
    
    const map: Record<string, string> = {
      "mock-q-1": "Explain the difference between a SQL join and an index scan. How do you optimize query speeds in MongoDB?",
      "mock-q-2": "How does JWT authentication work, and how do you secure user credentials?",
      "mock-q-3": "Explain how React's Virtual DOM works. What is the role of useEffect's cleanup function?",
      "mock-q-4": "Tell me about a time when you had to resolve a severe bug in production. How did you communicate with stakeholders?",
      "mock-q-5": "How do you design a scalable notification service that can handle millions of push notifications per day?"
    };
    return map[q.questionId] || "Explain your technical approach and architectural choices for this question.";
  };

  useEffect(() => {
    fetchDashboardData();
    fetchHistory();
    fetchReadiness();
  }, [fetchDashboardData, fetchHistory, fetchReadiness]);

  // Synchronize roleInput whenever canonical profile or user targetRole updates
  useEffect(() => {
    const canonicalRole = profile?.targetRole || user?.goal;
    if (canonicalRole) {
      setRoleInput(canonicalRole);
    }
  }, [profile?.targetRole, user?.goal]);

  // Session timer
  useEffect(() => {
    if (roomState === "live" || roomState === "processing" || showInlineQuiz) {
      if (!timerRef.current) {
        timerRef.current = setInterval(() => {
          setSeconds((prev) => prev + 1);
        }, 1000);
      }
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [roomState, showInlineQuiz]);

  // Bind candidate video stream whenever roomState enters 'live' and in voice_video mode
  useEffect(() => {
    if (roomState === "live" && selectedMode === "voice_video" && mediaStreamRef.current && videoRef.current && isCameraOn) {
      videoRef.current.srcObject = mediaStreamRef.current;
      videoRef.current.play().catch((err) => console.warn("Video element play error:", err));
    }
  }, [roomState, selectedMode, isCameraOn]);

  const stopAllMediaTracks = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    sttService.stop();
    ttsService.stop();
    setIsRecording(false);
    setIsMicOn(false);
  };

  // Cleanup Media Stream on unmount
  useEffect(() => {
    return () => {
      stopAllMediaTracks();
    };
  }, []);

  // Mode 3: Initiate Voice & Webcam AI Session (Video + Audio)
  const handleInitiateVoiceVideoSession = async () => {
    setRoomState("starting");
    setSeconds(0);
    setIsCameraOn(true);
    setIsMicOn(false);
    setIsRecording(false);

    const actualCount = difficultyInput === "Real Interview" ? 5 : questionCountInput;
    const sessionId = await createInterviewSession(roleInput, typeInput, difficultyInput, actualCount, "voice_video");

    if (!sessionId) {
      addNotification("Failed to initialize session.", "warning");
      setRoomState("setup");
      return;
    }

    // Initialize media stream for candidate video & microphone
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        mediaStreamRef.current = stream;
        setCameraPermissionError(false);
      }
    } catch (err) {
      console.warn("Camera/microphone permission error:", err);
      setCameraPermissionError(true);
    }

    const initialQ = currentQuestion?.text || `Explain your technical experience and architectural approach as a ${roleInput}.`;
    setCurrentQuestionText(initialQ);
    setCurrentQuestionNumber(1);
    setTotalQuestions(actualCount);

    setConversation([
      { role: "ai", text: `Welcome to your live voice & webcam interview for ${roleInput} (${typeInput} round, ${difficultyInput} level).` },
      { role: "ai", text: `Question 1: ${initialQ}` }
    ]);

    setRoomState("live");
    setIsAISpeaking(true);

    if (!isAudioMuted && ttsService.isSupported()) {
      ttsService.speak(initialQ, () => {
        setIsAISpeaking(false);
      });
    } else {
      setIsAISpeaking(false);
    }
  };

  // Mode 2: Initiate Speech-to-Speech Voice AI Session (AUDIO ONLY — MUST NOT CALL VIDEO)
  const handleInitiateVoiceOnlySession = async () => {
    // If a previous webcam session was open, release its camera before starting audio-only mode.
    stopAllMediaTracks();
    setRoomState("starting");
    setSeconds(0);
    setIsCameraOn(false);
    setIsMicOn(false);
    setIsRecording(false);

    const actualCount = difficultyInput === "Real Interview" ? 5 : questionCountInput;
    const sessionId = await createInterviewSession(roleInput, typeInput, difficultyInput, actualCount, "voice_only");

    if (!sessionId) {
      addNotification("Failed to initialize speech session.", "warning");
      setRoomState("setup");
      return;
    }

    // Request AUDIO ONLY — never call video: true
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        mediaStreamRef.current = stream;
      }
    } catch (err) {
      console.warn("Audio permission error:", err);
      addNotification("Microphone permission denied. Please allow audio access to test.", "warning");
    }

    const initialQ = currentQuestion?.text || `Explain your technical experience and architectural approach as a ${roleInput}.`;
    setCurrentQuestionText(initialQ);
    setCurrentQuestionNumber(1);
    setTotalQuestions(actualCount);

    setConversation([
      { role: "ai", text: `Welcome to your speech-to-speech voice interview for ${roleInput} (${typeInput} round, ${difficultyInput} level).` },
      { role: "ai", text: `Question 1: ${initialQ}` }
    ]);

    setRoomState("live");
    setIsAISpeaking(true);

    if (!isAudioMuted && ttsService.isSupported()) {
      ttsService.speak(initialQ, () => {
        setIsAISpeaking(false);
      });
    } else {
      setIsAISpeaking(false);
    }
  };

  // Mode 1: Start Written Quiz Session (NO MEDIA REQUESTED)
  const handleStartQuizSession = async () => {
    setLoading(true);
    const actualDifficulty = difficultyInput;
    const actualCount = difficultyInput === "Real Interview" ? 5 : questionCountInput;
    await startMockInterview(roleInput, typeInput, actualDifficulty, actualCount, "written");
    setShowInlineQuiz(true);
    addNotification("Written Quiz Round initialized.", "info");
    setLoading(false);
  };

  // Explicit Candidate Speaking Lifecycle
  const startSpeaking = () => {
    if (isAISpeaking || roomState === "processing") return;
    setIsMicOn(true);
    setIsRecording(true);

    if (sttService.isSupported()) {
      sttService.start(answerText, {
        onTranscriptChange: (displayedTotal, committedFinal, interim) => {
          setAnswerText(displayedTotal);
          setFinalTranscript(committedFinal);
          setInterimTranscript(interim);
        },
        onError: (err) => {
          console.warn("Speech recognition error:", err);
          // Chrome emits these during normal silence/reconnects. The STT
          // service retries them while the user is still speaking.
          if (["not-allowed", "service-not-allowed", "audio-capture"].includes(err)) {
            setIsRecording(false);
            setIsMicOn(false);
          }
        }
      });
    }
  };

  const stopSpeaking = () => {
    setIsRecording(false);
    setIsMicOn(false);
    sttService.stop();
    setInterimTranscript("");
  };

  // Toggle Camera
  const toggleCamera = () => {
    if (mediaStreamRef.current) {
      const videoTrack = mediaStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsCameraOn(videoTrack.enabled);
      } else {
        setIsCameraOn(!isCameraOn);
      }
    } else {
      setIsCameraOn(!isCameraOn);
    }
  };

  // Toggle Microphone
  const toggleMic = () => {
    if (isRecording) {
      stopSpeaking();
    } else {
      startSpeaking();
    }
  };

  // Submit Answer to Backend AI Engine in Live Room
  const handleAnswerSubmit = async () => {
    if (!answerText.trim() || !activeSession || roomState === "processing") return;

    stopSpeaking();
    ttsService.stop();
    setRoomState("processing");

    const submittedText = answerText.trim();
    setAnswerText("");
    setFinalTranscript("");
    setInterimTranscript("");
    sttService.resetAccumulated();

    setConversation((prev) => [
      ...prev,
      { role: "user", text: submittedText, timestamp: new Date() }
    ]);

    try {
      const result = await submitLiveAnswer(activeSession.id, submittedText, seconds);

      if (result) {
        if (result.status === "Completed" || !result.nextQuestion) {
          // Finish session
          const report = await concludeMockInterview(activeSession.id);
          stopAllMediaTracks();
          if (report) {
            setActiveReport(report);
            setRoomState("completed");
            router.push(`/interview/report/${report.id || activeSession.id}`);
          } else {
            setRoomState("completed");
          }
          addNotification("Mock interview completed! Scorecard generated.", "success");
        } else {
          // Next question or follow-up question
          const nextQText = result.nextQuestion?.text || result.aiSpeechResponse || "Let's move to the next question.";
          setCurrentQuestionText(nextQText);
          setCurrentQuestionNumber((prev) => prev + 1);

          setConversation((prev) => [
            ...prev,
            { role: "ai", text: nextQText, timestamp: new Date() }
          ]);

          setRoomState("live");
          setIsAISpeaking(true);

          if (!isAudioMuted && ttsService.isSupported()) {
            ttsService.speak(nextQText, () => {
              setIsAISpeaking(false);
            });
          } else {
            setIsAISpeaking(false);
          }
        }
      } else {
        setRoomState("live");
      }
    } catch (err) {
      console.error("Error submitting answer:", err);
      setRoomState("live");
    }
  };

  // Submit Answer for Written Quiz Mode
  const handleSubmitQuizAnswer = async () => {
    if (!answerText.trim() || !activeSession || loading) return;
    setLoading(true);
    await submitInterviewAnswer(activeSession.id, answerText, seconds);
    setAnswerText("");
    setLoading(false);
  };

  // Finish Written Quiz Session
  const handleFinishQuizSession = async () => {
    if (!activeSession) return;
    setLoading(true);
    const completed = await concludeMockInterview(activeSession.id);
    if (completed) {
      setActiveReport(completed);
      setShowInlineQuiz(false);
      setRoomState("completed");
      router.push(`/interview/report/${completed.id || activeSession.id}`);
      addNotification("Written quiz completed! Dynamic scorecard generated.", "success");
    }
    setLoading(false);
  };

  // End Live Interview Session
  const handleEndInterview = async () => {
    stopAllMediaTracks();

    if (activeSession) {
      setRoomState("processing");
      const report = await concludeMockInterview(activeSession.id);
      if (report) {
        setActiveReport(report);
        setRoomState("completed");
        router.push(`/interview/report/${report.id || activeSession.id}`);
      } else {
        setRoomState("setup");
      }
      addNotification("Interview session ended.", "info");
    } else {
      setRoomState("setup");
    }
  };

  const formatTime = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <PageTransition className="space-y-6 pb-12">
      <StaggerItem>
        <PageHeader 
          icon={GraduationCap}
          title="Interview Intelligence"
          description="Simulate mock rounds, receive analysis audits, and review recurring mistake logs."
        />
      </StaggerItem>

      {/* SETUP STATE VIEW */}
      {roomState === "setup" && !showInlineQuiz && (
        <div className="space-y-6">
          {/* TIER 1: START NEW INTERVIEW (DOMINANT CTA CARD) */}
          <Card className="p-6 space-y-6 border-primary/20 bg-card">
            <div className="flex items-center space-x-2 border-b border-border pb-3">
              <Play className="w-5 h-5 text-primary" />
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Start New Interview</h3>
            </div>

            {/* 1. Format Mode Selector: 3 Options */}
            <div className="space-y-2">
              <label className="text-[10px] text-muted font-bold uppercase tracking-wider block">
                Select Interview Format Mode
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Option 1: Written Quiz */}
                <div
                  onClick={() => setSelectedMode("quiz")}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between space-y-2 ${
                    selectedMode === "quiz"
                      ? "border-info bg-info/10 shadow-md shadow-info/10"
                      : "border-border/60 bg-accent/5 hover:bg-accent/15"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="p-2 rounded-xl bg-info/20 text-info">
                      <FileText className="w-5 h-5" />
                    </div>
                    <Badge variant={selectedMode === "quiz" ? "info" : "muted"} className="text-[9px] font-bold">
                      Written
                    </Badge>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-foreground">Written Quiz 📝</h4>
                    <p className="text-[10px] text-muted mt-0.5 leading-tight">
                      Text questions & STAR framework answers.
                    </p>
                  </div>
                </div>

                {/* Option 2: Speech-to-Speech Voice AI */}
                <div
                  onClick={() => setSelectedMode("voice_only")}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between space-y-2 ${
                    selectedMode === "voice_only"
                      ? "border-amber-400 bg-amber-400/10 shadow-md shadow-amber-400/10"
                      : "border-border/60 bg-accent/5 hover:bg-accent/15"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="p-2 rounded-xl bg-amber-400/20 text-amber-400">
                      <Mic className="w-5 h-5" />
                    </div>
                    <Badge variant={selectedMode === "voice_only" ? "warning" : "muted"} className="text-[9px] font-bold">
                      Voice AI
                    </Badge>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-foreground">Voice AI Room 🎙️</h4>
                    <p className="text-[10px] text-muted mt-0.5 leading-tight">
                      Real-time STT / TTS audio conversation.
                    </p>
                  </div>
                </div>

                {/* Option 3: Voice & Webcam AI */}
                <div
                  onClick={() => setSelectedMode("voice_video")}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between space-y-2 ${
                    selectedMode === "voice_video"
                      ? "border-primary bg-primary/10 shadow-md shadow-primary/10"
                      : "border-border/60 bg-accent/5 hover:bg-accent/15"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="p-2 rounded-xl bg-primary/20 text-primary flex items-center gap-1">
                      <Video className="w-4 h-4" />
                      <Mic className="w-4 h-4" />
                    </div>
                    <Badge variant={selectedMode === "voice_video" ? "primary" : "muted"} className="text-[9px] font-bold">
                      Voice + Webcam
                    </Badge>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-foreground">Voice & Webcam 🎥🎙️</h4>
                    <p className="text-[10px] text-muted mt-0.5 leading-tight">
                      Full live video feed & speech proctoring.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Configuration Parameters & AI Overview Grid */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              <div className="md:col-span-8 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] text-muted font-bold uppercase">Target Role</label>
                    <input
                      type="text"
                      value={roleInput}
                      onChange={(e) => setRoleInput(e.target.value)}
                      placeholder="e.g. Full Stack Developer"
                      className="w-full bg-accent/15 border border-border outline-none rounded-xl p-2.5 text-xs text-foreground focus:border-primary/50 focus:ring-1 focus:ring-primary/30"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-muted font-bold uppercase">Interview Category</label>
                    <select
                      value={typeInput}
                      onChange={(e) => setTypeInput(e.target.value)}
                      className="w-full bg-accent/15 border border-border outline-none rounded-xl p-2.5 text-xs text-foreground focus:border-primary/50"
                    >
                      <option value="Technical">Technical Coding</option>
                      <option value="Behavioral">Behavioral (STAR)</option>
                      <option value="System Design">System Design</option>
                      <option value="HR">HR Standard</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-muted font-bold uppercase">Complexity Level</label>
                    <select
                      value={difficultyInput}
                      onChange={(e) => setDifficultyInput(e.target.value)}
                      className="w-full bg-accent/15 border border-border outline-none rounded-xl p-2.5 text-xs text-foreground focus:border-primary/50"
                    >
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                      <option value="Real Interview">Real Interview</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-muted font-bold uppercase">No. of Questions</label>
                    <select
                      value={difficultyInput === "Real Interview" ? "5" : questionCountInput.toString()}
                      onChange={(e) => setQuestionCountInput(parseInt(e.target.value, 10))}
                      disabled={difficultyInput === "Real Interview"}
                      className="w-full bg-accent/15 border border-border outline-none rounded-xl p-2.5 text-xs text-foreground focus:border-primary/50 disabled:opacity-50"
                    >
                      {difficultyInput === "Real Interview" ? (
                        <option value="5">5 (Fixed)</option>
                      ) : (
                        [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                          <option key={num} value={num.toString()}>
                            {num}
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                </div>

                {/* Dynamic Action CTA Button */}
                {selectedMode === "quiz" ? (
                  <Button
                    variant="primary"
                    onClick={handleStartQuizSession}
                    className="w-full text-sm font-bold py-3.5"
                    isLoading={loading}
                  >
                    <FileText className="w-4 h-4 mr-2" /> Start Written Quiz Round 📝
                  </Button>
                ) : selectedMode === "voice_only" ? (
                  <Button
                    variant="ai"
                    onClick={handleInitiateVoiceOnlySession}
                    className="w-full text-sm font-bold py-3.5"
                  >
                    <Mic className="w-4 h-4 mr-2" /> Initiate Speech-to-Speech Voice AI Room 🎙️
                  </Button>
                ) : (
                  <Button
                    variant="ai"
                    onClick={handleInitiateVoiceVideoSession}
                    className="w-full text-sm font-bold animate-pulse py-3.5"
                  >
                    <Video className="w-4 h-4 mr-2" /> Initiate Voice & Webcam AI Room 🎥🎙️
                  </Button>
                )}
              </div>

              {/* AI Interview Overview Box */}
              <div className="md:col-span-4 bg-primary/5 border border-primary/20 rounded-2xl p-4 flex flex-col justify-between space-y-3">
                <div className="space-y-2.5">
                  <div className="flex items-center space-x-1.5 border-b border-primary/10 pb-2">
                    <Sparkles className="w-4 h-4 text-primary shrink-0 animate-pulse" />
                    <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">AI Interview Setup</h4>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted">Target Role</span>
                      <span className="font-bold text-foreground truncate max-w-[120px]" title={roleInput}>{roleInput || "General"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted">Questions</span>
                      <span className="font-bold text-foreground">{difficultyInput === "Real Interview" ? "5 (Adaptive)" : questionCountInput}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted">Est. Duration</span>
                      <span className="font-bold text-foreground">{difficultyInput === "Real Interview" ? 30 : questionCountInput * 6} min</span>
                    </div>
                  </div>
                </div>

                <div className="bg-card/60 border border-border/40 rounded-xl p-2.5 text-[10px] text-muted">
                  <span className="font-bold text-primary uppercase block mb-0.5">Focus Areas</span>
                  <p className="line-clamp-2 leading-relaxed">{focusSkills}</p>
                </div>
              </div>
            </div>
          </Card>

          {/* TIER 2: YOUR INTERVIEW PERFORMANCE ANALYTICS */}
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center space-x-2">
                <Award className="w-5 h-5 text-primary" />
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Your Interview Performance</h3>
              </div>
              <Badge variant="muted" className="text-[10px]">
                {history.length} Completed Session{history.length === 1 ? "" : "s"}
              </Badge>
            </div>

            {computedReadiness === null || history.length === 0 ? (
              <div className="py-8 text-center space-y-2 bg-accent/5 rounded-2xl border border-dashed border-border/60">
                <Brain className="w-8 h-8 text-muted mx-auto" />
                <p className="text-xs font-bold text-foreground">No completed interviews yet.</p>
                <p className="text-[11px] text-muted max-w-sm mx-auto">
                  Complete your first mock interview to generate your readiness score and performance breakdown.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-primary/10 border border-primary/20 rounded-2xl">
                  <div>
                    <span className="text-2xl font-black text-foreground">{computedReadiness}%</span>
                    <p className="text-[10px] text-muted font-bold uppercase tracking-wider">Overall Readiness Index</p>
                  </div>
                  <Badge variant="primary" className="text-xs font-bold">
                    {computedReadiness >= 80 ? "Interview Ready" : computedReadiness >= 60 ? "Developing" : "Needs Practice"}
                  </Badge>
                </div>

                {/* 6 Dimension Subscores */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  <div className="p-3 bg-accent/5 border border-border rounded-xl text-center space-y-1">
                    <span className="text-[9px] font-bold text-muted uppercase">Technical</span>
                    <p className="text-base font-black text-foreground">{dimensions?.technicalKnowledge ?? computedReadiness}%</p>
                  </div>
                  <div className="p-3 bg-accent/5 border border-border rounded-xl text-center space-y-1">
                    <span className="text-[9px] font-bold text-muted uppercase">Problem Solving</span>
                    <p className="text-base font-black text-foreground">{dimensions?.problemSolving ?? computedReadiness}%</p>
                  </div>
                  <div className="p-3 bg-accent/5 border border-border rounded-xl text-center space-y-1">
                    <span className="text-[9px] font-bold text-muted uppercase">Communication</span>
                    <p className="text-base font-black text-foreground">{dimensions?.communication ?? computedReadiness}%</p>
                  </div>
                  <div className="p-3 bg-accent/5 border border-border rounded-xl text-center space-y-1">
                    <span className="text-[9px] font-bold text-muted uppercase">Answer Quality</span>
                    <p className="text-base font-black text-foreground">{dimensions?.answerQuality ?? computedReadiness}%</p>
                  </div>
                  <div className="p-3 bg-accent/5 border border-border rounded-xl text-center space-y-1">
                    <span className="text-[9px] font-bold text-muted uppercase">Confidence</span>
                    <p className="text-base font-black text-foreground">{dimensions?.confidence ?? computedReadiness}%</p>
                  </div>
                  <div className="p-3 bg-accent/5 border border-border rounded-xl text-center space-y-1">
                    <span className="text-[9px] font-bold text-muted uppercase">Role Relevance</span>
                    <p className="text-base font-black text-foreground">{dimensions?.roleRelevance ?? computedReadiness}%</p>
                  </div>
                </div>
              </div>
            )}
          </Card>

          {/* TIER 3: RECENT INTERVIEWS HISTORY (PAST 5) & REPEATING WEAK AREAS GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Recent Interviews History (Past 5) */}
            <div className="lg:col-span-7 space-y-4">
              <Card className="p-6 space-y-4 h-full">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-primary" /> Past 5 Interviews
                  </h3>
                  <Badge variant="muted" className="text-[10px]">
                    Showing {Math.min(5, history.length)} of {history.length}
                  </Badge>
                </div>

                {history.length === 0 ? (
                  <p className="text-xs text-muted text-center py-6">
                    No completed interviews yet.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {history.slice(0, 5).map((sess) => (
                      <div
                        key={sess.id}
                        className="p-3.5 bg-accent/5 hover:bg-accent/15 border border-border rounded-xl flex items-center justify-between text-xs transition-all"
                      >
                        <div className="space-y-0.5">
                          <p className="font-bold text-foreground">{sess.role}</p>
                          <p className="text-[10px] text-muted">
                            {sess.type} • {sess.difficulty} • {sess.formatMode === "voice_video" ? "Voice + Webcam" : sess.formatMode === "voice_only" ? "Voice AI" : "Written Quiz"}
                          </p>
                        </div>

                        <div className="flex items-center space-x-3">
                          <span className="font-black text-success text-sm">{sess.overallScore}/100</span>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => router.push(`/interview/report/${sess.id}`)}
                            className="text-[10px] font-bold px-2.5 py-1"
                          >
                            View Report <ChevronRight className="w-3 h-3 ml-0.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>

            {/* Repeating Weak Areas & Concept Mistakes */}
            <div className="lg:col-span-5 space-y-4 flex flex-col">
              <Card className="p-6 space-y-4 h-full flex flex-col justify-between border-border/80">
                <div>
                  <div className="flex items-center justify-between border-b border-border pb-3 mb-3">
                    <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <AlertOctagon className="w-4 h-4 text-warning" /> Repeating Weak Points
                    </h3>
                    <div className="flex items-center gap-1.5">
                      {effectiveMistakes.filter((m) => m.frequency > 1).length > 0 && (
                        <Badge variant="warning" className="text-[9px] font-bold">
                          {effectiveMistakes.filter((m) => m.frequency > 1).length} Repeating
                        </Badge>
                      )}
                      <Badge variant="muted" className="text-[9px] font-bold">
                        Top {effectiveMistakes.length}
                      </Badge>
                    </div>
                  </div>

                  {effectiveMistakes.length === 0 ? (
                    <div className="py-10 text-center space-y-2 bg-accent/5 rounded-2xl border border-dashed border-border/60">
                      <AlertOctagon className="w-6 h-6 text-muted mx-auto" />
                      <p className="text-xs text-muted">
                        No recurring weak areas yet. Complete more interviews to identify patterns.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-border">
                      {effectiveMistakes.map((mis, idx) => {
                        const isRepeating = mis.frequency > 1;
                        return (
                          <div
                            key={idx}
                            className={`p-3 rounded-xl border flex items-center justify-between text-xs transition-all ${
                              isRepeating
                                ? "bg-warning/10 border-warning/30 hover:border-warning/50"
                                : "bg-accent/5 hover:bg-accent/10 border-border/60"
                            }`}
                          >
                            <div className="flex items-start gap-2.5 max-w-[75%]">
                              <span
                                className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                                  isRepeating ? "bg-warning animate-pulse" : "bg-muted/40"
                                }`}
                              />
                              <div>
                                <p className="font-semibold text-foreground text-xs leading-snug line-clamp-2">
                                  {mis.concept}
                                </p>
                                <p className="text-[10px] text-muted font-medium mt-0.5">
                                  {isRepeating ? `Appeared in ${mis.frequency} interviews` : "Logged in 1 round"}
                                </p>
                              </div>
                            </div>
                            <Badge
                              variant={isRepeating ? "warning" : "muted"}
                              className="text-[9px] font-bold shrink-0 ml-2"
                            >
                              {isRepeating ? `Repeating (${mis.frequency}x)` : "Logged"}
                            </Badge>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </div>

          {/* TIER 4: PERFORMANCE TREND */}
          <Card className="p-6 space-y-5 border-border/80 relative overflow-hidden">
            {/* Ambient Background Glow */}
            <div className="absolute -top-24 -right-24 w-72 h-72 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
              <div>
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-primary" /> Performance Trend & Progression
                </h3>
                <p className="text-[11px] text-muted mt-0.5">
                  Historical score trajectory across completed interview rounds
                </p>
              </div>

              {/* Summary Stats Badges */}
              {effectiveTrend.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="px-2.5 py-1 bg-accent/10 border border-border rounded-lg flex items-center gap-1.5 text-[11px]">
                    <span className="text-muted font-medium">Average:</span>
                    <span className="font-extrabold text-foreground">{trendMetrics.avgScore}%</span>
                  </div>
                  <div className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center gap-1.5 text-[11px]">
                    <span className="text-emerald-400 font-medium">Peak:</span>
                    <span className="font-extrabold text-emerald-400">{trendMetrics.maxScore}%</span>
                  </div>
                  <Badge variant="primary" className="text-[10px] font-bold px-2.5 py-1">
                    {effectiveTrend.length} Round{effectiveTrend.length === 1 ? "" : "s"}
                  </Badge>
                </div>
              )}
            </div>

            {effectiveTrend.length === 0 ? (
              <div className="py-12 text-center space-y-2 bg-accent/5 rounded-2xl border border-dashed border-border/60">
                <Brain className="w-6 h-6 text-muted mx-auto" />
                <p className="text-xs text-muted">
                  Complete your first interview to track your performance trend over time.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* SVG Curve Chart + Grid Overlay */}
                <div className="relative bg-accent/5 rounded-2xl border border-border/50 p-4 overflow-hidden">
                  <svg viewBox="0 0 800 150" className="w-full h-48 overflow-visible">
                    <defs>
                      <linearGradient id="trendAreaGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.45" />
                        <stop offset="50%" stopColor="#6366f1" stopOpacity="0.18" />
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.02" />
                      </linearGradient>
                      <linearGradient id="trendLineGrad" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#a855f7" />
                        <stop offset="50%" stopColor="#6366f1" />
                        <stop offset="100%" stopColor="#10b981" />
                      </linearGradient>
                      <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="3" result="blur" />
                        <feMerge>
                          <feMergeNode in="blur" />
                          <feMergeNode in="SourceGraphic" />
                        </feMerge>
                      </filter>
                    </defs>

                    {/* Y-Axis Grid Lines & Labels */}
                    {[100, 75, 50, 25, 0].map((val) => {
                      const yPos = 20 + (120 - 30) * (1 - val / 100);
                      return (
                        <g key={val}>
                          <line
                            x1="40"
                            y1={yPos}
                            x2="780"
                            y2={yPos}
                            stroke="currentColor"
                            strokeOpacity="0.08"
                            strokeDasharray="4 4"
                          />
                          <text
                            x="32"
                            y={yPos + 3}
                            textAnchor="end"
                            className="text-[9px] fill-muted font-mono font-medium"
                          >
                            {val}%
                          </text>
                        </g>
                      );
                    })}

                    {/* Gradient Area Fill */}
                    {svgTrendData.areaPath && (
                      <path d={svgTrendData.areaPath} fill="url(#trendAreaGrad)" />
                    )}

                    {/* Smooth Spline Curve Line */}
                    {svgTrendData.linePath && (
                      <path
                        d={svgTrendData.linePath}
                        fill="none"
                        stroke="url(#trendLineGrad)"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        filter="url(#glow)"
                      />
                    )}

                    {/* Interactive Data Points */}
                    {svgTrendData.points.map((pt: any, idx: number) => (
                      <g key={idx} className="group/pt cursor-pointer">
                        {/* Outer Glow Halo on Hover */}
                        <circle
                          cx={pt.x}
                          cy={pt.y}
                          r="9"
                          className="fill-primary/20 opacity-0 group-hover/pt:opacity-100 transition-opacity"
                        />
                        {/* Core Point Circle */}
                        <circle
                          cx={pt.x}
                          cy={pt.y}
                          r="4.5"
                          className="fill-background stroke-primary stroke-[2.5] group-hover/pt:r-6 transition-all"
                        />
                        {/* Score Label above point */}
                        <text
                          x={pt.x}
                          y={pt.y - 10}
                          textAnchor="middle"
                          className="text-[9px] font-extrabold fill-foreground opacity-80 group-hover/pt:opacity-100 transition-opacity"
                        >
                          {pt.score}%
                        </text>
                        {/* X-Axis Date Label */}
                        <text
                          x={pt.x}
                          y="142"
                          textAnchor="middle"
                          className="text-[9px] fill-muted font-medium"
                        >
                          {pt.date ? new Date(pt.date).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : `R${pt.round}`}
                        </text>
                      </g>
                    ))}
                  </svg>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* WRITTEN QUIZ MODE SOLVER VIEW */}
      {showInlineQuiz && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-6">
            <Card className="p-6 space-y-5 border-primary/20">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowInlineQuiz(false)}
                  className="text-xs text-muted hover:text-foreground"
                >
                  <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back to Setup
                </Button>
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-1.5 text-xs font-bold text-foreground">
                    <Clock className="w-4 h-4 text-warning" />
                    <span>{formatTime(seconds)}</span>
                  </div>
                  {activeSession && <Badge variant="warning">{activeSession.type}</Badge>}
                </div>
              </div>

              {currentQuestion ? (
                <div className="space-y-4">
                  <div className="bg-accent/10 border border-border p-4 rounded-2xl">
                    <p className="text-xs text-muted uppercase font-bold tracking-wider mb-1 flex items-center gap-1">
                      <Brain className="w-3.5 h-3.5 text-primary" />
                      <span>Current Written Question</span>
                    </p>
                    <p className="text-sm font-semibold text-foreground leading-relaxed">
                      {currentQuestion.text}
                    </p>
                  </div>

                  {currentQuestion.hints && currentQuestion.hints.length > 0 && (
                    <div className="text-[11px] text-muted leading-relaxed italic bg-card p-3 border border-border rounded-xl">
                      <strong>Coach Hint:</strong> {currentQuestion.hints[0]}
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-[10px] text-muted font-bold uppercase">Formulate Answer</label>
                    <textarea
                      rows={5}
                      value={answerText}
                      onChange={(e) => setAnswerText(e.target.value)}
                      placeholder="Type your coding explanation or STAR behavioral answer here..."
                      className="w-full bg-accent/15 border border-border outline-none rounded-2xl p-3 text-xs text-foreground focus:border-primary/50 focus:ring-1 focus:ring-primary/30"
                    />
                  </div>

                  <Button
                    variant="ai"
                    onClick={handleSubmitQuizAnswer}
                    disabled={!answerText.trim() || loading}
                    className="w-full text-sm font-semibold"
                    isLoading={loading}
                  >
                    Submit Answer
                  </Button>
                </div>
              ) : (
                <div className="text-center py-6 space-y-4">
                  <p className="text-sm font-semibold text-foreground">
                    All questions in this round have been answered. Get ready for your scorecard!
                  </p>
                  <Button
                    variant="primary"
                    onClick={handleFinishQuizSession}
                    className="px-8 text-sm font-bold"
                    isLoading={loading}
                  >
                    Generate Interview Report
                  </Button>
                </div>
              )}
            </Card>
          </div>

          <div className="lg:col-span-4 space-y-6">
            <Card variant="insight" className="p-6 text-center space-y-3">
              <Award className="w-10 h-10 text-primary mx-auto" />
              <div>
                <span className="text-2xl font-extrabold text-foreground">{readiness}%</span>
                <p className="text-[10px] text-muted uppercase tracking-wider font-bold mt-0.5">Readiness Index</p>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* STARTING STATE VIEW */}
      {roomState === "starting" && (
        <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
          <Sparkles className="w-10 h-10 text-primary animate-spin" />
          <p className="text-sm font-bold text-foreground">Initializing Live AI Interview Room...</p>
          <p className="text-xs text-muted">Requesting media permissions & loading context...</p>
        </div>
      )}

      {/* LIVE & PROCESSING ROOM STATE VIEW */}
      {(roomState === "live" || roomState === "processing") && (
        <div className="space-y-6">
          {/* Header Status Bar */}
          <div className="flex items-center justify-between bg-card/60 border border-border/80 rounded-2xl p-4">
            <div className="flex items-center space-x-3">
              <Badge variant="primary" className="text-[10px] font-bold uppercase tracking-wider">
                {roomState === "processing" ? "EVALUATING" : selectedMode === "voice_video" ? "LIVE VOICE & WEBCAM ROOM" : "SPEECH-TO-SPEECH VOICE ROOM"}
              </Badge>
              <h3 className="text-sm font-bold text-foreground">{roleInput} • {typeInput}</h3>
            </div>

            <div className="flex items-center space-x-4 text-xs font-bold">
              {/* Live Proctoring & Focus Integrity Score (Webcam Mode Only) */}
              {selectedMode === "voice_video" && (
                <div className="flex items-center space-x-1.5 bg-accent/10 px-3 py-1 rounded-xl">
                  <ShieldCheck className={`w-4 h-4 ${integrityScore >= 80 ? "text-success" : integrityScore >= 50 ? "text-warning" : "text-danger animate-pulse"}`} />
                  <span>
                    Focus Integrity: <span className={integrityScore >= 80 ? "text-success" : integrityScore >= 50 ? "text-warning" : "text-danger font-black"}>{integrityScore}%</span>
                  </span>
                </div>
              )}

              <div className="flex items-center space-x-1.5 bg-accent/10 px-3 py-1 rounded-xl">
                <Clock className="w-4 h-4 text-warning" />
                <span>{formatTime(seconds)}</span>
              </div>
              <span className="text-muted">Q{currentQuestionNumber}/{totalQuestions}</span>
            </div>
          </div>

          {/* Active Integrity Warning Banner Overlay (Webcam Mode Only) */}
          {selectedMode === "voice_video" && activeWarningBanner && (
            <div className="bg-danger/90 border border-danger text-white p-3 rounded-2xl shadow-xl flex items-center justify-between animate-bounce">
              <div className="flex items-center space-x-2 text-xs font-bold">
                <AlertOctagon className="w-5 h-5 shrink-0 text-amber-300" />
                <span>{activeWarningBanner}</span>
              </div>
              <button
                onClick={() => setActiveWarningBanner(null)}
                className="text-white/80 hover:text-white text-xs font-black px-2 py-0.5 rounded bg-black/20"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* DEDICATED LAYOUTS: Mode 2 (Speech-to-Speech Voice Stage) vs Mode 3 (Voice & Webcam Grid) */}
          {selectedMode === "voice_only" ? (
            /* Dedicated Speech-to-Speech Voice Room Stage */
            <Card className="p-8 space-y-6 border-amber-400/30 bg-gradient-to-b from-amber-400/10 via-card to-card text-center relative overflow-hidden rounded-3xl shadow-xl">
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 rounded-xl bg-amber-400/20 text-amber-400">
                    <Mic className="w-4 h-4 animate-pulse" />
                  </div>
                  <span className="text-xs font-bold text-foreground">Speech-to-Speech Audio Stage</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="warning" className="text-[10px] font-bold">Pure Audio STT/TTS</Badge>
                  <span className="text-[10px] text-success font-bold flex items-center gap-1 bg-success/10 px-2 py-0.5 rounded-lg border border-success/30">
                    <Activity className="w-3 h-3 animate-pulse" /> Voice Active
                  </span>
                </div>
              </div>

              {/* Central Glowing AI Orb Visualizer */}
              <div className="py-2 flex justify-center">
                <AudioVisualizer state={roomState === "processing" ? "PROCESSING" : isMicOn ? "USER_SPEAKING" : "AI_SPEAKING"} />
              </div>

              {/* Centered Question Box */}
              <div className="bg-accent/10 border border-border p-5 rounded-2xl space-y-2 text-left max-w-3xl mx-auto">
                <div className="flex items-center justify-between text-[10px] font-bold text-muted uppercase">
                  <span className="flex items-center gap-1.5">
                    <Brain className="w-4 h-4 text-primary" />
                    <span>Current AI Question Prompt</span>
                  </span>
                  <span>Q{currentQuestionNumber}/{totalQuestions}</span>
                </div>
                <p className="text-sm font-semibold text-foreground leading-relaxed">
                  {currentQuestionText}
                </p>
              </div>
            </Card>
          ) : (
            /* Mode 3: Voice & Webcam 2-Column Grid */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* LEFT: Candidate Preview Panel */}
              <div className="lg:col-span-5 space-y-4">
                <Card
                  className="p-4 space-y-3 border-primary/20 relative overflow-hidden bg-black/40"
                  onMouseLeave={() => {
                    if (selectedMode === "voice_video" && isCameraOn) {
                      triggerIntegrityWarning(
                        "side_gaze",
                        "⚠️ Integrity Warning: Eye contact shifted sideways. Avoid looking away or consulting external notes.",
                        10
                      );
                    }
                  }}
                >
                  <div className="flex items-center justify-between border-b border-border/40 pb-2">
                    <div className="flex items-center space-x-1.5 text-xs font-bold text-foreground">
                      <UserCheck className="w-4 h-4 text-primary" />
                      <span>Candidate Live Video Feed</span>
                    </div>
                    <Badge variant={isCameraOn ? "success" : "muted"} className="text-[9px]">
                      {isCameraOn ? "Camera Active" : "Camera Off"}
                    </Badge>
                  </div>

                  {/* Candidate Video Stream Container */}
                  <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-accent/20 border border-border/60 flex items-center justify-center">
                    {isCameraOn ? (
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover block"
                      />
                    ) : (
                      <div className="flex flex-col items-center space-y-2 p-4 text-center">
                        <VideoOff className="w-10 h-10 text-muted" />
                        <span className="text-xs font-bold text-foreground">Camera Disabled</span>
                      </div>
                    )}

                    {cameraPermissionError && (
                      <div className="absolute inset-0 bg-card/90 p-4 flex flex-col items-center justify-center text-center space-y-2">
                        <AlertOctagon className="w-8 h-8 text-warning" />
                        <p className="text-xs font-bold text-foreground">Camera Access Restricted</p>
                        <p className="text-[10px] text-muted leading-tight">Check browser video permissions.</p>
                      </div>
                    )}
                  </div>

                  {/* Observable Signals Status */}
                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <div className="p-2 bg-accent/10 rounded-lg flex items-center justify-between">
                      <span className="text-muted">Mic Stream</span>
                      <span className={`font-bold ${isMicOn ? "text-success" : "text-amber-400"}`}>
                        {isMicOn ? "Listening" : "Muted"}
                      </span>
                    </div>
                    <div className="p-2 bg-accent/10 rounded-lg flex items-center justify-between">
                      <span className="text-muted">Gaze Tracking</span>
                      <span className={`font-bold ${integrityScore >= 80 ? "text-success" : "text-warning"}`}>
                        {integrityScore >= 80 ? "Centered" : "Deviated"}
                      </span>
                    </div>
                  </div>
                </Card>
              </div>

              {/* RIGHT: AI Interviewer Panel & Current Question */}
              <div className="lg:col-span-7 space-y-4">
                <Card className="p-6 space-y-5 border-primary/20 flex flex-col justify-between h-full">
                  <AudioVisualizer state={roomState === "processing" ? "PROCESSING" : isMicOn ? "USER_SPEAKING" : "AI_SPEAKING"} />

                  <div className="bg-accent/10 border border-border p-4 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between text-[10px] font-bold text-muted uppercase">
                      <span className="flex items-center gap-1.5">
                        <Brain className="w-4 h-4 text-primary" />
                        <span>Current AI Question Prompt</span>
                      </span>
                      <span>Q{currentQuestionNumber}/{totalQuestions}</span>
                    </div>
                    <p className="text-sm font-semibold text-foreground leading-relaxed">
                      {currentQuestionText}
                    </p>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {/* BOTTOM: Transcript & Room Controls */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Live Transcript Panel */}
            <div className="lg:col-span-8 space-y-4">
              <Card className="p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-primary" /> Speech-to-Speech Transcript
                  </h3>
                  <Badge variant="info" className="text-[9px]">Real-Time STT/TTS</Badge>
                </div>

                <LiveTranscript
                  conversation={conversation}
                  interimTranscript={interimTranscript}
                />

                {/* Explicit Candidate Answer Lifecycle Controls */}
                <div className="space-y-3 pt-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center space-x-2">
                      <label className="text-[10px] text-muted font-bold uppercase block">
                        Candidate Speech Transcript / Editable Answer Box
                      </label>
                      {/* Microphone & Transcript Status Badge */}
                      {isAISpeaking ? (
                        <Badge variant="warning" className="text-[9px] animate-pulse py-0.5 px-2">
                          🔊 AI Speaking
                        </Badge>
                      ) : roomState === "processing" ? (
                        <Badge variant="info" className="text-[9px] animate-pulse py-0.5 px-2">
                          ⚙️ Evaluating Answer...
                        </Badge>
                      ) : isRecording ? (
                        <Badge variant="warning" className="text-[9px] animate-pulse py-0.5 px-2">
                          ● Listening
                        </Badge>
                      ) : answerText.trim() ? (
                        <Badge variant="warning" className="text-[9px] py-0.5 px-2">
                          ● Paused (Transcript Preserved)
                        </Badge>
                      ) : (
                        <Badge variant="success" className="text-[9px] py-0.5 px-2">
                          ● Ready
                        </Badge>
                      )}
                    </div>

                    {/* Explicit Speaking Control Button */}
                    {isAISpeaking ? (
                      <Badge variant="warning" className="text-[10px] animate-pulse py-1 px-3">
                        🔊 AI is speaking question...
                      </Badge>
                    ) : isRecording ? (
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={stopSpeaking}
                        className="text-xs font-bold px-3 py-1.5 animate-pulse"
                      >
                        <Square className="w-3.5 h-3.5 mr-1" /> ⏹ Stop Speaking
                      </Button>
                    ) : (
                      <Button
                        variant="ai"
                        size="sm"
                        onClick={startSpeaking}
                        disabled={roomState === "processing"}
                        className="text-xs font-bold px-3 py-1.5"
                      >
                        <Mic className="w-3.5 h-3.5 mr-1" /> 🎙 Start Speaking
                      </Button>
                    )}
                  </div>

                  <div className="space-y-2">
                    <textarea
                      rows={4}
                      value={answerText}
                      onChange={(e) => {
                        const val = e.target.value;
                        setAnswerText(val);
                        setFinalTranscript(val);
                        sttService.setAccumulatedText(val);
                      }}
                      placeholder={
                        isRecording
                          ? "Listening to your voice... Speak your response now."
                          : "Click 'Start Speaking' or type your response here before submitting..."
                      }
                      className="w-full bg-accent/10 border border-border outline-none rounded-xl p-3 text-xs text-foreground resize-none focus:border-primary/50"
                    />
                    <div className="flex justify-between items-center text-[10px] text-muted">
                      <span>{answerText.length} characters captured</span>
                      <Button
                        variant="primary"
                        onClick={handleAnswerSubmit}
                        disabled={!answerText.trim() || roomState === "processing" || isAISpeaking}
                        isLoading={roomState === "processing"}
                        className="px-6 py-2.5 text-xs font-bold"
                      >
                        <Send className="w-4 h-4 mr-1.5" /> Submit Answer
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Room Controls Panel */}
            <div className="lg:col-span-4 space-y-4">
              <Card className="p-6 space-y-4 border-primary/20 flex flex-col justify-between">
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider border-b border-border pb-3">
                  Room Media Controls
                </h3>

                <div className="space-y-3">
                  <Button
                    variant={isRecording ? "danger" : "secondary"}
                    onClick={toggleMic}
                    disabled={isAISpeaking || roomState === "processing"}
                    className="w-full justify-start text-xs font-bold"
                  >
                    {isRecording ? <Square className="w-4 h-4 mr-2" /> : <Mic className="w-4 h-4 mr-2 text-success" />}
                    {isRecording ? "Stop Speaking (Mic)" : "Start Speaking (Mic)"}
                  </Button>

                  {selectedMode === "voice_video" && (
                    <Button
                      variant={isCameraOn ? "secondary" : "danger"}
                      onClick={toggleCamera}
                      className="w-full justify-start text-xs font-bold"
                    >
                      {isCameraOn ? <Video className="w-4 h-4 mr-2 text-primary" /> : <VideoOff className="w-4 h-4 mr-2" />}
                      {isCameraOn ? "Disable Camera" : "Enable Camera"}
                    </Button>
                  )}

                  <Button
                    variant="ghost"
                    onClick={() => setIsAudioMuted(!isAudioMuted)}
                    className="w-full justify-start text-xs font-bold"
                  >
                    {isAudioMuted ? <VolumeX className="w-4 h-4 mr-2 text-amber-400" /> : <Volume2 className="w-4 h-4 mr-2 text-primary" />}
                    {isAudioMuted ? "Unmute AI Voice (TTS)" : "Mute AI Voice (TTS)"}
                  </Button>
                </div>

                <div className="pt-4 border-t border-border">
                  <Button
                    variant="danger"
                    onClick={handleEndInterview}
                    className="w-full text-xs font-bold py-2.5"
                  >
                    <Square className="w-4 h-4 mr-2" /> End Interview Session
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* COMPLETED SCORECARD STATE VIEW */}
      {roomState === "completed" && activeReport && (
        <Card className="p-6 space-y-6 relative border-success/35">
          <button
            onClick={() => setRoomState("setup")}
            className="absolute right-4 top-4 text-muted hover:text-foreground cursor-pointer p-1 rounded-lg hover:bg-accent/15"
            title="Return to Dashboard Setup"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-start justify-between border-b border-border pb-4">
            <div>
              <h3 className="text-base font-black text-foreground leading-tight">Mock Evaluation Scorecard</h3>
              <p className="text-xs text-muted mt-1 font-bold">{activeReport.role} • {activeReport.type} ({activeReport.difficulty})</p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-success">{activeReport.overallScore}%</span>
              <p className="text-[9px] text-muted uppercase tracking-wider font-extrabold">Overall Rating</p>
            </div>
          </div>

          {/* Subscores Grid */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 border-b border-border pb-4">
            <div className="bg-accent/5 p-3 rounded-xl text-center">
              <p className="text-[9px] text-muted uppercase font-bold">Overall</p>
              <p className="font-black text-foreground mt-1 text-base">{activeReport.overallScore}%</p>
            </div>
            <div className="bg-accent/5 p-3 rounded-xl text-center">
              <p className="text-[9px] text-muted uppercase font-bold">Technical</p>
              <p className="font-black text-foreground mt-1 text-base">{activeReport.technicalScore}%</p>
            </div>
            <div className="bg-accent/5 p-3 rounded-xl text-center">
              <p className="text-[9px] text-muted uppercase font-bold">Communication</p>
              <p className="font-black text-foreground mt-1 text-base">{activeReport.communicationScore}%</p>
            </div>
            <div className="bg-accent/5 p-3 rounded-xl text-center">
              <p className="text-[9px] text-muted uppercase font-bold">Problem Solving</p>
              <p className="font-black text-foreground mt-1 text-base">{activeReport.problemSolvingScore}%</p>
            </div>
            <div className="bg-accent/5 p-3 rounded-xl text-center">
              <p className="text-[9px] text-muted uppercase font-bold">Code Quality</p>
              <p className="font-black text-foreground mt-1 text-base">{activeReport.timeManagementScore}%</p>
            </div>
          </div>

          {/* AI Expert Review Summary */}
          <div className="space-y-3">
            <div className="flex items-center space-x-1.5 text-xs font-bold text-primary uppercase">
              <Sparkles className="w-4 h-4" />
              <span>AI Expert Review Summary</span>
            </div>
            <p className="text-xs text-foreground/80 leading-relaxed bg-accent/10 p-3.5 border border-border rounded-xl">
              {activeReport.feedbackSummary}
            </p>
          </div>

          {/* Proctoring & Focus Integrity Audit Card */}
          <div className={`p-4 rounded-2xl border space-y-2 text-xs ${
            integrityScore >= 80
              ? "bg-success/5 border-success/30"
              : integrityScore >= 50
              ? "bg-amber-400/5 border-amber-400/30"
              : "bg-danger/10 border-danger/40"
          }`}>
            <div className="flex items-center justify-between">
              <span className="font-bold text-foreground flex items-center gap-1.5 uppercase text-[11px]">
                <ShieldCheck className={`w-4 h-4 ${integrityScore >= 80 ? "text-success" : "text-amber-400"}`} />
                Proctoring & Focus Integrity Audit
              </span>
              <Badge variant={integrityScore >= 80 ? "success" : "warning"} className="text-[10px]">
                Focus Score: {integrityScore}% ({integrityWarnings.length} Flags)
              </Badge>
            </div>
            {integrityWarnings.length === 0 ? (
              <p className="text-[11px] text-muted">
                ✅ Excellent focus maintained! No tab switching, window blur, or side gaze displacement detected during your session.
              </p>
            ) : (
              <div className="space-y-1 pt-1 border-t border-border/40">
                {integrityWarnings.map((w, idx) => (
                  <div key={idx} className="flex justify-between items-center text-[10px] py-0.5">
                    <span className="text-foreground/90 font-medium">{w.message}</span>
                    <span className="text-muted text-[9px] shrink-0 ml-2">{new Date(w.timestamp).toLocaleTimeString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Missed Concepts & Gaps logs */}
          {sessionMistakes.length > 0 && (
            <div className="space-y-2">
              <span className="text-[10px] text-muted font-bold uppercase tracking-wider block">Detected Mistakes & Concept Gaps</span>
              <div className="flex flex-wrap gap-1.5">
                {sessionMistakes.map((mis, idx) => (
                  <Badge key={idx} variant="warning" className="text-[10px]">
                    {mis}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Suggested Learning Modules */}
          {activeReport.recommendations.length > 0 && (
            <div className="space-y-3">
              <span className="text-[10px] text-muted font-bold uppercase tracking-wider block">Suggested learning modules</span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {activeReport.recommendations.map((rec, i) => (
                  <div key={i} className="p-3 bg-accent/10 border border-border/60 rounded-xl text-xs flex items-center space-x-2">
                    <TrendingUp className="w-4.5 h-4.5 text-primary shrink-0" />
                    <span className="text-foreground font-semibold">{rec}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-border flex justify-between items-center">
            <Button variant="secondary" size="sm" onClick={() => setRoomState("setup")}>
              <ArrowLeft className="w-4 h-4 mr-1" /> Return to Dashboard Setup
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={() => router.push(`/interview/report/${activeReport.id}`)}
            >
              <ExternalLink className="w-4 h-4 mr-1" /> View Full Report Page
            </Button>
          </div>
        </Card>
      )}
    </PageTransition>
  );
}

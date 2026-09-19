"use client";

import React, { useState, useEffect, useRef, use } from "react";
import { useRouter } from "next/navigation";
import { useCareerStore, InterviewSessionData } from "@/store/careerStore";
import Card from "@/components/ui/Card/Card";
import Button from "@/components/ui/Button/Button";
import Badge from "@/components/ui/Badge/Badge";
import { PageTransition, StaggerItem } from "@/components/ui/PageTransition";
import PageHeader from "@/components/ui/PageHeader";
import AudioVisualizer from "@/components/interview/AudioVisualizer";
import LiveTranscript, { ConversationMessage } from "@/components/interview/LiveTranscript";
import { speechService, VoiceState } from "@/lib/voice/speechService";
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Send,
  Square,
  Clock,
  Brain,
  Sparkles,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  RefreshCw
} from "lucide-react";

type RoomState =
  | "INIT"
  | "AI_SPEAKING"
  | "USER_LISTENING"
  | "USER_SPEAKING"
  | "PROCESSING"
  | "AI_THINKING"
  | "FOLLOW_UP"
  | "NEXT_QUESTION"
  | "COMPLETED"
  | "ERROR";

export default function LiveInterviewSessionPage({
  params
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const resolvedParams = use(params);
  const sessionId = resolvedParams.sessionId;
  const router = useRouter();

  const fetchSessionById = useCareerStore((state) => state.fetchSessionById);
  const submitLiveAnswer = useCareerStore((state) => state.submitLiveAnswer);
  const concludeMockInterview = useCareerStore((state) => state.concludeMockInterview);
  const addNotification = useCareerStore((state) => state.addNotification);

  // Session Data
  const [session, setSession] = useState<InterviewSessionData | null>(null);
  const [currentQuestionText, setCurrentQuestionText] = useState<string>("");
  const [currentQuestionNumber, setCurrentQuestionNumber] = useState<number>(1);
  const [totalQuestions, setTotalQuestions] = useState<number>(3);

  // State Machine
  const [roomState, setRoomState] = useState<RoomState>("INIT");

  // Transcript & Voice State
  const [conversation, setConversation] = useState<ConversationMessage[]>([]);
  const [answerText, setAnswerText] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [isMuted, setIsMuted] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(true);

  // Timers
  const [seconds, setSeconds] = useState(0);
  const timerRef = useRef<any>(null);

  // 1. Initial Load Session
  useEffect(() => {
    async function load() {
      if (!sessionId) return;
      setRoomState("INIT");
      const data = await fetchSessionById(sessionId);
      if (data) {
        setSession(data);
        setTotalQuestions(data.questions?.length || 3);
        const unansweredIdx = data.questions?.findIndex(q => !q.answer);
        const currentIdx = unansweredIdx !== undefined && unansweredIdx !== -1 ? unansweredIdx : 0;
        setCurrentQuestionNumber(currentIdx + 1);

        const activeQ = data.questions?.[currentIdx];
        const qText = (activeQ as any)?.questionText || `Explain your experience as a ${data.role}.`;
        setCurrentQuestionText(qText);

        const initialMsgs: ConversationMessage[] = [
          {
            role: "ai",
            text: `Welcome to your live mock interview for ${data.role} (${data.type}, ${data.difficulty} level). Let's begin.`
          },
          {
            role: "ai",
            text: `Question ${currentIdx + 1}: ${qText}`
          }
        ];
        setConversation(initialMsgs);

        // Speak initial greeting
        setRoomState("AI_SPEAKING");
        speechService.speak(initialMsgs[1].text, () => {
          setRoomState("USER_LISTENING");
        });
      } else {
        setRoomState("ERROR");
      }
    }
    load();
  }, [sessionId, fetchSessionById]);

  // 2. Setup Speech Recognition
  useEffect(() => {
    setVoiceSupported(speechService.isSupported());

    speechService.registerCallbacks({
      onTranscriptChange: (text, isFinal) => {
        setAnswerText(text);
        if (!isFinal) {
          setInterimTranscript(text);
        } else {
          setInterimTranscript("");
        }
      },
      onStateChange: (vState) => {
        if (vState === "LISTENING") {
          setRoomState("USER_SPEAKING");
        }
      },
      onError: (err) => {
        console.warn("Speech service error:", err);
      }
    });

    return () => {
      speechService.stopListening();
      speechService.stopSpeaking();
    };
  }, []);

  // 3. Question Timer
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Mic Toggle Action
  const toggleMic = () => {
    if (roomState === "USER_SPEAKING") {
      speechService.stopListening();
      setRoomState("USER_LISTENING");
    } else {
      speechService.startListening();
      setRoomState("USER_SPEAKING");
    }
  };

  // Submit Answer Action
  const handleAnswerSubmit = async () => {
    if (!answerText.trim() || !sessionId) return;

    speechService.stopListening();
    setRoomState("PROCESSING");

    const submittedText = answerText;
    setAnswerText("");
    setInterimTranscript("");

    // Add user response to conversation feed
    setConversation((prev) => [
      ...prev,
      { role: "user", text: submittedText, timestamp: new Date() }
    ]);

    try {
      setRoomState("AI_THINKING");
      const result = await submitLiveAnswer(sessionId, submittedText, seconds);

      if (result) {
        if (result.status === "Completed" || result.reportId || !result.nextQuestion) {
          // Completed
          setRoomState("COMPLETED");
          addNotification("Interview completed! Generating report...", "success");
          const reportId = result.reportId || result.id || sessionId;
          setTimeout(() => {
            router.push(`/interview/report/${sessionId}`);
          }, 1500);
        } else {
          // Next adaptive question or follow-up
          const nextQText = result.nextQuestion?.text || result.aiSpeechResponse || "Next question...";
          setCurrentQuestionText(nextQText);
          setCurrentQuestionNumber((prev) => prev + 1);

          setConversation((prev) => [
            ...prev,
            { role: "ai", text: nextQText, timestamp: new Date() }
          ]);

          setRoomState("AI_SPEAKING");
          if (!isMuted) {
            speechService.speak(nextQText, () => {
              setRoomState("USER_LISTENING");
            });
          } else {
            setRoomState("USER_LISTENING");
          }
        }
      }
    } catch (err) {
      console.error("Failed to submit live answer:", err);
      setRoomState("ERROR");
    }
  };

  // Force End Interview
  const handleEndInterview = async () => {
    speechService.stopListening();
    speechService.stopSpeaking();
    setRoomState("PROCESSING");

    const report = await concludeMockInterview(sessionId);
    addNotification("Interview session ended. Navigating to report...", "info");
    router.push(`/interview/report/${sessionId}`);
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  if (roomState === "INIT" || !session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Sparkles className="w-10 h-10 text-primary animate-spin" />
        <p className="text-sm font-bold text-foreground">Initializing Live AI Interview Room...</p>
        <p className="text-xs text-muted">Loading verified candidate context & session state...</p>
      </div>
    );
  }

  return (
    <PageTransition className="space-y-6 pb-12 max-w-5xl mx-auto">
      {/* Top Session Header Bar */}
      <StaggerItem>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
          <PageHeader
            icon={Brain}
            title={`Live Mock Interview: ${session.role}`}
            description={`${session.type} Round • ${session.difficulty} Difficulty • Question ${currentQuestionNumber} of ${totalQuestions}`}
          />

          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center space-x-2 bg-accent/10 border border-border px-3.5 py-1.5 rounded-xl text-xs font-bold">
              <Clock className="w-4 h-4 text-warning" />
              <span>{formatTime(seconds)}</span>
            </div>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsMuted(!isMuted)}
              title={isMuted ? "Unmute AI TTS" : "Mute AI TTS"}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-primary" />}
            </Button>

            <Button variant="danger" size="sm" onClick={handleEndInterview}>
              <Square className="w-3.5 h-3.5 mr-1" /> End Round
            </Button>
          </div>
        </div>
      </StaggerItem>

      {/* Main Grid: Visualizer / Question Box & Live Transcript */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: AI Visualizer & Current Question */}
        <div className="lg:col-span-6 space-y-6">
          <Card className="p-6 space-y-6 border-primary/20 relative overflow-hidden">
            {/* Visualizer Header */}
            <div className="flex items-center justify-between border-b border-border pb-3">
              <Badge variant="primary" className="text-[10px] font-bold uppercase tracking-wider">
                {roomState}
              </Badge>
              <span className="text-[10px] font-mono text-muted">Adaptive Mode: Active</span>
            </div>

            {/* Audio Wave Visualizer */}
            <AudioVisualizer state={roomState} />

            {/* Current Question Display */}
            <div className="bg-accent/10 border border-border p-4 rounded-2xl space-y-2">
              <div className="flex justify-between items-center text-[10px] font-bold text-muted uppercase">
                <span className="flex items-center gap-1">
                  <Brain className="w-3.5 h-3.5 text-primary" />
                  <span>Question Prompt</span>
                </span>
                <span>
                  Q{currentQuestionNumber}/{totalQuestions}
                </span>
              </div>
              <p className="text-sm font-semibold text-foreground leading-relaxed">
                {currentQuestionText}
              </p>
            </div>

            {/* Microphone & Answer Controls */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-3">
                <Button
                  variant={roomState === "USER_SPEAKING" ? "danger" : "primary"}
                  size="md"
                  onClick={toggleMic}
                  disabled={!voiceSupported || roomState === "PROCESSING" || roomState === "AI_THINKING"}
                  className="flex-1 font-bold"
                >
                  {roomState === "USER_SPEAKING" ? (
                    <>
                      <MicOff className="w-4 h-4 mr-1.5 animate-pulse" /> Stop Recording
                    </>
                  ) : (
                    <>
                      <Mic className="w-4 h-4 mr-1.5" /> Start Speaking Answer
                    </>
                  )}
                </Button>

                <Button
                  variant="ai"
                  size="md"
                  onClick={handleAnswerSubmit}
                  disabled={!answerText.trim() || roomState === "PROCESSING" || roomState === "AI_THINKING"}
                  isLoading={roomState === "PROCESSING" || roomState === "AI_THINKING"}
                  className="shrink-0"
                >
                  <Send className="w-4 h-4 mr-1" /> Submit Answer
                </Button>
              </div>

              {!voiceSupported && (
                <p className="text-[10px] text-amber-400 italic text-center">
                  Speech recognition is not supported in this browser. Please use manual text input below.
                </p>
              )}
            </div>
          </Card>

          {/* Manual Text Fallback Area */}
          <Card className="p-4 space-y-2">
            <label className="text-[10px] text-muted font-bold uppercase block">
              Answer Input / Edit Speech Transcript
            </label>
            <textarea
              rows={3}
              value={answerText}
              onChange={(e) => setAnswerText(e.target.value)}
              placeholder="Your answer speech transcript will appear here. You can also edit or type manually..."
              className="w-full bg-accent/10 border border-border outline-none rounded-xl p-3 text-xs text-foreground resize-y"
            />
          </Card>
        </div>

        {/* Right Column: Live Rolling Transcript & Verified Context */}
        <div className="lg:col-span-6 space-y-6">
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-primary" /> Live Interview Transcript
              </h3>
              <Badge variant="info" className="text-[9px]">
                Real-Time STT/TTS Feed
              </Badge>
            </div>

            <LiveTranscript
              conversation={conversation}
              interimTranscript={interimTranscript}
            />
          </Card>

          <Card className="p-4 bg-primary/5 border border-primary/20 space-y-2 text-xs">
            <div className="flex items-center gap-1.5 text-primary font-bold">
              <ShieldCheck className="w-4 h-4" />
              <span>Verified Candidate Context Active</span>
            </div>
            <p className="text-[11px] text-muted leading-relaxed">
              The AI interviewer evaluates your answer against your verified Resume, Career DNA, and verified projects.
            </p>
          </Card>
        </div>
      </div>
    </PageTransition>
  );
}

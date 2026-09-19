"use client";

export interface SpeechToTextCallbacks {
  onTranscriptChange?: (displayedText: string, finalCapturedText: string, interimText: string) => void;
  onError?: (error: string) => void;
}

export class SpeechToTextService {
  private recognition: any = null;
  private isListening = false;
  private shouldContinueRecognition = false;
  private callbacks: SpeechToTextCallbacks = {};
  
  // 1. finalBaseText: Accumulated finalized text from prior sessions/user edits
  private finalBaseText = "";
  // 2. sessionFinalText: Finalized text in the current Web Speech API recognition session
  private sessionFinalText = "";

  constructor() {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = "en-US";
        this.recognition.maxAlternatives = 1;

        this.recognition.onresult = (event: any) => {
          let newFinal = "";
          let interim = "";

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              newFinal += `${transcript} `;
            } else {
              interim += transcript;
            }
          }

          if (newFinal.trim()) {
            this.sessionFinalText = [this.sessionFinalText, newFinal]
              .filter(Boolean)
              .join(" ")
              .replace(/\s+/g, " ")
              .trim();
          }

          const committedFinal = [this.finalBaseText, this.sessionFinalText]
            .filter(Boolean)
            .join(" ")
            .replace(/\s+/g, " ")
            .trim();

          const displayedTotal = [committedFinal, interim.trim()]
            .filter(Boolean)
            .join(" ")
            .replace(/\s+/g, " ")
            .trim();

          if (this?.callbacks?.onTranscriptChange) {
            try {
              this.callbacks.onTranscriptChange(displayedTotal, committedFinal, interim.trim());
            } catch (err) {
              console.warn("[STT] Callback onTranscriptChange error:", err);
            }
          }
        };

        this.recognition.onerror = (event: any) => {
          console.warn("[STT] Speech recognition error:", event.error);
          if (this?.callbacks?.onError) {
            try {
              this.callbacks.onError(event.error);
            } catch (err) {
              console.warn("[STT] Callback onError error:", err);
            }
          }
        };

        this.recognition.onend = () => {
          // Commit session final text into finalBaseText
          if (this.sessionFinalText) {
            this.finalBaseText = [this.finalBaseText, this.sessionFinalText]
              .filter(Boolean)
              .join(" ")
              .replace(/\s+/g, " ")
              .trim();
            this.sessionFinalText = "";
          }

          // If candidate has not clicked "Stop Speaking", automatically restart recognition after silence/timeout
          if (this.isListening && this.shouldContinueRecognition) {
            window.setTimeout(() => {
              if (!this?.isListening || !this?.shouldContinueRecognition) return;
              try {
                this.recognition.start();
              } catch (e) {
                // Ignore restart collision error; the next onend retries.
              }
            }, 120);
          }
        };
      }
    }
  }

  public isSupported = (): boolean => {
    return typeof window !== "undefined" && Boolean(
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    );
  };

  public start = (existingAnswerText: string, callbacks: SpeechToTextCallbacks) => {
    this.callbacks = callbacks || {};
    this.shouldContinueRecognition = true;
    this.finalBaseText = (existingAnswerText || "").trim();
    this.sessionFinalText = "";
    this.isListening = true;

    if (!this.recognition) return;
    try {
      this.recognition.start();
    } catch (e) {
      // If already started, ignore collision
    }
  };

  public stop = () => {
    this.shouldContinueRecognition = false;
    this.isListening = false;

    if (this.sessionFinalText) {
      this.finalBaseText = [this.finalBaseText, this.sessionFinalText]
        .filter(Boolean)
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();
      this.sessionFinalText = "";
    }

    if (this?.callbacks?.onTranscriptChange) {
      try {
        this.callbacks.onTranscriptChange(this.finalBaseText, this.finalBaseText, "");
      } catch (err) {
        console.warn("[STT] Callback onTranscriptChange error during stop:", err);
      }
    }

    if (!this.recognition) return;
    try {
      this.recognition.stop();
    } catch (e) {
      console.warn("[STT] Speech recognition stop error:", e);
    }
  };

  public resetAccumulated = () => {
    this.finalBaseText = "";
    this.sessionFinalText = "";
    this.shouldContinueRecognition = false;
    this.isListening = false;
  };

  public setAccumulatedText = (text: string) => {
    this.finalBaseText = (text || "").trim();
    this.sessionFinalText = "";
  };
}

export const sttService = new SpeechToTextService();

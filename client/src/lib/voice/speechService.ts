"use client";

export type VoiceState = "IDLE" | "LISTENING" | "SPEAKING" | "PROCESSING" | "ERROR";

export interface SpeechCallbacks {
  onTranscriptChange?: (text: string, isFinal: boolean) => void;
  onStateChange?: (state: VoiceState) => void;
  onError?: (error: string) => void;
}

class SpeechService {
  private recognition: any = null;
  private isListening = false;
  private state: VoiceState = "IDLE";
  private callbacks: SpeechCallbacks = {};

  constructor() {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = "en-US";

        this.recognition.onresult = (event: any) => {
          let interimTranscript = "";
          let finalTranscript = "";

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            } else {
              interimTranscript += event.results[i][0].transcript;
            }
          }

          const currentText = finalTranscript || interimTranscript;
          if (this.callbacks.onTranscriptChange) {
            this.callbacks.onTranscriptChange(currentText, Boolean(finalTranscript));
          }
        };

        this.recognition.onerror = (event: any) => {
          console.warn("Speech recognition error:", event.error);
          this.setState("ERROR");
          if (this.callbacks.onError) {
            this.callbacks.onError(event.error);
          }
        };

        this.recognition.onend = () => {
          if (this.isListening) {
            try {
              this.recognition.start();
            } catch (e) {
              this.setState("IDLE");
            }
          } else {
            this.setState("IDLE");
          }
        };
      }
    }
  }

  public registerCallbacks(callbacks: SpeechCallbacks) {
    this.callbacks = callbacks;
  }

  private setState(newState: VoiceState) {
    this.state = newState;
    if (this.callbacks.onStateChange) {
      this.callbacks.onStateChange(newState);
    }
  }

  public getState(): VoiceState {
    return this.state;
  }

  public isSupported(): boolean {
    return typeof window !== "undefined" && Boolean(
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    );
  }

  public startListening() {
    if (!this.recognition) return;
    try {
      this.isListening = true;
      this.setState("LISTENING");
      this.recognition.start();
    } catch (e) {
      console.warn("Speech recognition start failed:", e);
    }
  }

  public stopListening() {
    if (!this.recognition) return;
    try {
      this.isListening = false;
      this.recognition.stop();
      this.setState("IDLE");
    } catch (e) {
      console.warn("Speech recognition stop error:", e);
    }
  }

  public speak(text: string, onEnd?: () => void) {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      if (onEnd) onEnd();
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;

    this.setState("SPEAKING");

    utterance.onend = () => {
      this.setState("IDLE");
      if (onEnd) onEnd();
    };

    utterance.onerror = () => {
      this.setState("IDLE");
      if (onEnd) onEnd();
    };

    window.speechSynthesis.speak(utterance);
  }

  public stopSpeaking() {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      this.setState("IDLE");
    }
  }
}

export const speechService = new SpeechService();

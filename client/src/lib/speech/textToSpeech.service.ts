"use client";

export class TextToSpeechService {
  public isSupported(): boolean {
    return typeof window !== "undefined" && "speechSynthesis" in window;
  }

  public speak(text: string, onEnd?: () => void, onError?: (err: any) => void) {
    if (!this.isSupported()) {
      if (onEnd) onEnd();
      return;
    }

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.pitch = 1.0;

      utterance.onend = () => {
        if (onEnd) onEnd();
      };

      utterance.onerror = (e) => {
        console.warn("[TTS] Speech synthesis error:", e);
        if (onError) onError(e);
        if (onEnd) onEnd();
      };

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn("[TTS] Failed to initialize utterance:", e);
      if (onEnd) onEnd();
    }
  }

  public stop() {
    if (this.isSupported()) {
      window.speechSynthesis.cancel();
    }
  }
}

export const ttsService = new TextToSpeechService();

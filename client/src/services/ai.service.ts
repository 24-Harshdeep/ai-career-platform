// Real AI Coach Service delegating requests to backend express router
import { API_BASE_URL } from "@/lib/api";

export const aiService = {
  async generateCoachResponse(userMessage: string, activePath: string = "/dashboard"): Promise<string> {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("careeros_token") : null;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE_URL}/coach/chat`, {
        method: "POST",
        headers,
        body: JSON.stringify({ message: userMessage, activePath })
      });

      if (res.ok) {
        const envelope = await res.json();
        return envelope.data?.reply || envelope.data?.response || "I am evaluating your request against your CareerContext.";
      }
      return "Unable to connect to AI Coach service. Please ensure your API keys or server connection are active.";
    } catch (err) {
      console.warn("Client AI Coach fetch error:", err);
      return "AI Coach service unavailable. Please check server connectivity.";
    }
  },
};

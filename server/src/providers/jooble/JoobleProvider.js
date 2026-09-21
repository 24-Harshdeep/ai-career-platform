const JobProvider = require("../JobProvider");

class JoobleProvider extends JobProvider {
  constructor() {
    super("jooble");
  }

  async healthCheck() {
    const apiKey = process.env.JOOBLE_API_KEY;
    if (!apiKey) {
      return {
        provider: this.name,
        status: "UNCONFIGURED",
        reason: "JOOBLE_API_KEY environment variable is not configured."
      };
    }
    return {
      provider: this.name,
      status: "HEALTHY",
      reason: "API key configured."
    };
  }

  async searchJobs(query = {}) {
    const apiKey = process.env.JOOBLE_API_KEY;
    if (!apiKey) {
      return [];
    }

    const { q = "developer", location = "India", page = 1 } = query;
    const url = `https://jooble.org/api/${apiKey}`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 7000);

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keywords: q,
          location: location || "India",
          page: String(page)
        }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        return [];
      }

      const data = await response.json();
      if (!data || !Array.isArray(data.jobs)) {
        return [];
      }

      return data.jobs.map((raw) => this.normalizeJooblePayload(raw));
    } catch (err) {
      return [];
    }
  }

  normalizeJooblePayload(raw) {
    const rawLoc = raw.location || "";
    const isRemote = rawLoc.toLowerCase().includes("remote") || (raw.title || "").toLowerCase().includes("remote");
    const publishedAt = raw.updated ? new Date(raw.updated) : null;

    return {
      provider: "jooble",
      externalId: String(raw.id || ""),
      sourceJobId: String(raw.id || ""),
      title: (raw.title || "Developer Position").trim(),
      company: {
        name: (raw.company || "Company").trim(),
        logo: "",
        website: ""
      },
      location: {
        city: "",
        state: "",
        country: "IN",
        remote: isRemote,
        raw: rawLoc || (isRemote ? "Remote India" : "India")
      },
      employmentType: raw.type || "Full-time",
      experienceLevel: "Mid-Level",
      description: (raw.snippet || raw.title || "").replace(/<[^>]+>/g, " ").trim(),
      salary: raw.salary ? {
        min: null,
        max: null,
        currency: "INR",
        period: "year"
      } : null,
      url: raw.link || "https://jooble.org",
      publishedAt: publishedAt && !isNaN(publishedAt.getTime()) ? publishedAt : null,
      fetchedAt: new Date(),
      source: "Jooble"
    };
  }
}

module.exports = JoobleProvider;

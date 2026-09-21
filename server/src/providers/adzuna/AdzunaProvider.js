const JobProvider = require("../JobProvider");

class AdzunaProvider extends JobProvider {
  constructor() {
    super("adzuna");
  }

  async healthCheck() {
    const appId = process.env.ADZUNA_APP_ID;
    const appKey = process.env.ADZUNA_APP_KEY;
    if (!appId || !appKey) {
      return {
        provider: this.name,
        status: "UNCONFIGURED",
        reason: "ADZUNA_APP_ID or ADZUNA_APP_KEY environment variable is not configured."
      };
    }
    return {
      provider: this.name,
      status: "HEALTHY",
      reason: "Credentials configured."
    };
  }

  /**
   * Search Adzuna API
   */
  async searchJobs(query = {}) {
    const appId = process.env.ADZUNA_APP_ID;
    const appKey = process.env.ADZUNA_APP_KEY;

    if (!appId || !appKey) {
      console.warn("[AdzunaProvider] ADZUNA_APP_ID or ADZUNA_APP_KEY is not configured. Returning empty results.");
      return [];
    }

    const { q = "developer", location = "", remote = false, page = 1, limit = 20 } = query;
    const country = this.resolveCountry(location);

    const params = new URLSearchParams({
      app_id: appId,
      app_key: appKey,
      results_per_page: Math.min(limit, 50).toString(),
      what: q,
      "content-type": "application/json"
    });

    if (location) {
      params.append("where", location);
    }

    const url = `https://api.adzuna.com/v1/api/jobs/${country}/search/${page}?${params.toString()}`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!response.ok) {
        console.error(`[AdzunaProvider] API returned status ${response.status}`);
        return [];
      }

      const data = await response.json();
      if (!data || !Array.isArray(data.results)) {
        return [];
      }

      return data.results.map((rawJob) => this.normalizeAdzunaJob(rawJob, country));
    } catch (err) {
      console.error("[AdzunaProvider] Error fetching jobs:", err.message);
      return [];
    }
  }

  resolveCountry(location = "") {
    const locLower = location.toLowerCase();
    if (locLower.includes("india") || locLower.includes("in")) return "in";
    if (locLower.includes("uk") || locLower.includes("united kingdom") || locLower.includes("london")) return "gb";
    if (locLower.includes("canada") || locLower.includes("ca")) return "ca";
    if (locLower.includes("germany") || locLower.includes("de")) return "de";
    return "us";
  }

  normalizeAdzunaJob(raw, country) {
    const isRemote = (raw.title || "").toLowerCase().includes("remote") || 
                     (raw.description || "").toLowerCase().includes("remote") ||
                     (raw.location?.display_name || "").toLowerCase().includes("remote");

    const publishedAt = raw.created ? new Date(raw.created) : null;
    const isPublishedValid = publishedAt && !isNaN(publishedAt.getTime());

    return {
      provider: "adzuna",
      externalId: String(raw.id || ""),
      sourceJobId: String(raw.id || ""),
      title: raw.title ? raw.title.replace(/<\/?[^>]+(>|$)/g, "").trim() : "Untitled Position",
      company: {
        name: raw.company?.display_name || "Unknown Company",
        logo: "",
        website: ""
      },
      location: {
        city: raw.location?.area?.[2] || "",
        state: raw.location?.area?.[1] || "",
        country: raw.location?.area?.[0] || country.toUpperCase(),
        remote: Boolean(isRemote),
        raw: raw.location?.display_name || (isRemote ? "Remote" : "")
      },
      employmentType: raw.contract_type === "permanent" ? "Full-time" : (raw.contract_type || "Full-time"),
      experienceLevel: "Mid-Level",
      description: raw.description ? raw.description.replace(/<\/?[^>]+(>|$)/g, "").trim() : "",
      salary: (raw.salary_min || raw.salary_max) ? {
        min: raw.salary_min || null,
        max: raw.salary_max || null,
        currency: country === "in" ? "INR" : (country === "gb" ? "GBP" : "USD"),
        period: "year"
      } : null,
      url: raw.redirect_url || "",
      publishedAt: isPublishedValid ? publishedAt : null,
      fetchedAt: new Date(),
      source: "Adzuna"
    };
  }
}

module.exports = AdzunaProvider;

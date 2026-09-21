const JobProvider = require("../JobProvider");

class IndianApiProvider extends JobProvider {
  constructor() {
    super("indianapi");
  }

  async healthCheck() {
    const apiKey = process.env.INDIANAPI_API_KEY;
    if (!apiKey) {
      return {
        provider: this.name,
        status: "UNCONFIGURED",
        reason: "INDIANAPI_API_KEY environment variable is not configured."
      };
    }
    return {
      provider: this.name,
      status: "HEALTHY",
      reason: "API key configured."
    };
  }

  async searchJobs(query = {}) {
    const apiKey = process.env.INDIANAPI_API_KEY;
    if (!apiKey) {
      return [];
    }

    const { q = "developer", location = "India", page = 1, limit = 20 } = query;
    const params = new URLSearchParams({
      keyword: q,
      location,
      page: String(page),
      pageSize: String(limit)
    });

    const url = `https://indianapi.in/api/v1/jobs?${params.toString()}`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 7000);

      const response = await fetch(url, {
        headers: {
          "x-api-key": apiKey,
          "Content-Type": "application/json"
        },
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        return [];
      }

      const data = await response.json();
      const results = Array.isArray(data) ? data : (data?.data || data?.results || []);

      return results.map((raw) => this.normalizeIndianApiPayload(raw));
    } catch (err) {
      return [];
    }
  }

  normalizeIndianApiPayload(raw) {
    const rawLoc = raw.location || raw.jobLocation || "";
    const isRemote = Boolean(raw.isRemote) || rawLoc.toLowerCase().includes("remote");
    const publishedAt = raw.postedDate || raw.createdDate ? new Date(raw.postedDate || raw.createdDate) : null;

    return {
      provider: "indianapi",
      externalId: String(raw.id || raw.job_id || ""),
      sourceJobId: String(raw.id || raw.job_id || ""),
      title: (raw.title || raw.jobTitle || "Software Engineer").trim(),
      company: {
        name: (raw.company || raw.companyName || "India Tech").trim(),
        logo: raw.companyLogo || "",
        website: raw.companyUrl || ""
      },
      location: {
        city: raw.city || "",
        state: raw.state || "",
        country: "IN",
        remote: isRemote,
        raw: rawLoc || (isRemote ? "Remote India" : "Bengaluru, India")
      },
      employmentType: raw.jobType || "Full-time",
      experienceLevel: raw.experience || "Mid-Level",
      description: (raw.description || raw.summary || "").trim(),
      skills: Array.isArray(raw.skills) ? raw.skills : [],
      salary: raw.salary ? {
        min: raw.salary.min || null,
        max: raw.salary.max || null,
        currency: "INR",
        period: "year"
      } : null,
      url: raw.applyLink || raw.url || "https://indianapi.in",
      publishedAt: publishedAt && !isNaN(publishedAt.getTime()) ? publishedAt : null,
      fetchedAt: new Date(),
      source: "IndianAPI"
    };
  }
}

module.exports = IndianApiProvider;

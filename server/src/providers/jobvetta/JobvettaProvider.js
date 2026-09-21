const JobProvider = require("../JobProvider");

class JobvettaProvider extends JobProvider {
  constructor() {
    super("jobvetta");
  }

  async healthCheck() {
    const apiKey = process.env.JOBVETTA_API_KEY;
    if (!apiKey) {
      return {
        provider: this.name,
        status: "UNCONFIGURED",
        reason: "JOBVETTA_API_KEY environment variable is not configured."
      };
    }
    return {
      provider: this.name,
      status: "HEALTHY",
      reason: "API key configured."
    };
  }

  async searchJobs(query = {}) {
    const apiKey = process.env.JOBVETTA_API_KEY;
    if (!apiKey) {
      return [];
    }

    const { q = "developer", location = "India", page = 1, limit = 20 } = query;
    const params = new URLSearchParams({
      query: q,
      location,
      page: String(page),
      limit: String(limit)
    });

    const url = `https://api.jobvetta.com/v1/jobs/search?${params.toString()}`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 7000);

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
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

      return data.jobs.map((raw) => this.normalizeJobvettaPayload(raw));
    } catch (err) {
      return [];
    }
  }

  normalizeJobvettaPayload(raw) {
    const isRemote = Boolean(raw.isRemote) || (raw.location || "").toLowerCase().includes("remote");
    const publishedAt = raw.postedAt ? new Date(raw.postedAt) : null;

    return {
      provider: "jobvetta",
      externalId: String(raw.id || raw.jobId || ""),
      sourceJobId: String(raw.id || raw.jobId || ""),
      title: (raw.title || "Software Opportunity").trim(),
      company: {
        name: (raw.companyName || raw.company?.name || "Tech Employer").trim(),
        logo: raw.companyLogo || "",
        website: raw.companyWebsite || ""
      },
      location: {
        city: raw.city || "",
        state: raw.state || "",
        country: "IN",
        remote: isRemote,
        raw: raw.location || (isRemote ? "Remote India" : "India")
      },
      employmentType: raw.jobType || "Full-time",
      experienceLevel: raw.experienceLevel || "Mid-Level",
      description: (raw.description || raw.title || "").trim(),
      salary: raw.salaryMin ? {
        min: raw.salaryMin,
        max: raw.salaryMax || raw.salaryMin,
        currency: "INR",
        period: "year"
      } : null,
      url: raw.applyUrl || raw.url || "https://jobvetta.com",
      publishedAt: publishedAt && !isNaN(publishedAt.getTime()) ? publishedAt : null,
      fetchedAt: new Date(),
      source: "Jobvetta"
    };
  }
}

module.exports = JobvettaProvider;

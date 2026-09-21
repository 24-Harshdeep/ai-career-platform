const JobProvider = require("../JobProvider");

const PUBLIC_ASHBY_COMPANIES = [
  { slug: "linear", name: "Linear" },
  { slug: "replit", name: "Replit" },
  { slug: "notion", name: "Notion" }
];

class AshbyProvider extends JobProvider {
  constructor() {
    super("ashby");
  }

  async searchJobs(query = {}) {
    const { q = "", location = "", remote = false, limit = 20 } = query;
    const lowerQuery = q.toLowerCase();
    const lowerLoc = location.toLowerCase();

    const fetchPromises = PUBLIC_ASHBY_COMPANIES.map(async (company) => {
      try {
        const url = `https://api.ashbyhq.com/posting-api/job-board/${company.slug}`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);

        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (!res.ok) return [];

        const data = await res.json();
        if (!data || !Array.isArray(data.jobs)) return [];

        return data.jobs
          .map((raw) => this.normalizeAshbyJob(raw, company))
          .filter((job) => {
            if (lowerQuery && !job.title.toLowerCase().includes(lowerQuery) && !job.description.toLowerCase().includes(lowerQuery)) {
              return false;
            }
            if (lowerLoc && !job.location.raw.toLowerCase().includes(lowerLoc)) {
              return false;
            }
            if (remote && !job.location.remote) {
              return false;
            }
            return true;
          });
      } catch (err) {
        return [];
      }
    });

    const resultsArray = await Promise.all(fetchPromises);
    const flattened = resultsArray.flat();
    return flattened.slice(0, limit);
  }

  normalizeAshbyJob(raw, company) {
    const rawLoc = raw.locationName || raw.location || "";
    const isRemote = Boolean(raw.isRemote) ||
                     rawLoc.toLowerCase().includes("remote") ||
                     (raw.title || "").toLowerCase().includes("remote");

    const publishedAt = raw.publishedAt ? new Date(raw.publishedAt) : null;
    const isPublishedValid = publishedAt && !isNaN(publishedAt.getTime());

    const cleanDesc = raw.descriptionHtml
      ? raw.descriptionHtml.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
                           .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
                           .replace(/<[^>]+>/g, " ")
                           .replace(/\s+/g, " ")
                           .trim()
      : raw.descriptionPlain || raw.title || "";

    return {
      provider: "ashby",
      externalId: String(raw.id || ""),
      sourceJobId: String(raw.id || ""),
      title: raw.title ? raw.title.trim() : "Software Role",
      company: {
        name: company.name,
        logo: "",
        website: `https://jobs.ashbyhq.com/${company.slug}`
      },
      location: {
        city: "",
        state: "",
        country: "",
        remote: Boolean(isRemote),
        raw: rawLoc || (isRemote ? "Remote" : "Global")
      },
      employmentType: raw.employmentType === "FullTime" ? "Full-time" : (raw.employmentType || "Full-time"),
      experienceLevel: "Mid-Level",
      description: cleanDesc,
      salary: null,
      url: raw.jobUrl || `https://jobs.ashbyhq.com/${company.slug}/${raw.id}`,
      publishedAt: isPublishedValid ? publishedAt : null,
      fetchedAt: new Date(),
      source: "Ashby"
    };
  }
}

module.exports = AshbyProvider;

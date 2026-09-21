const JobProvider = require("../JobProvider");

// Top public Greenhouse company boards for active software engineering roles
const PUBLIC_GREENHOUSE_BOARDS = [
  { slug: "stripe", name: "Stripe" },
  { slug: "figma", name: "Figma" },
  { slug: "cloudflare", name: "Cloudflare" },
  { slug: "airbnb", name: "Airbnb" },
  { slug: "gitlab", name: "GitLab" },
  { slug: "datadog", name: "Datadog" }
];

class GreenhouseProvider extends JobProvider {
  constructor() {
    super("greenhouse");
  }

  /**
   * Search jobs across public Greenhouse company boards
   */
  async searchJobs(query = {}) {
    const { q = "", location = "", remote = false, limit = 20 } = query;
    const lowerQuery = q.toLowerCase();
    const lowerLoc = location.toLowerCase();

    const fetchPromises = PUBLIC_GREENHOUSE_BOARDS.map(async (company) => {
      try {
        const url = `https://boards-api.greenhouse.io/v1/boards/${company.slug}/jobs?content=true`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);

        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (!res.ok) return [];

        const data = await res.json();
        if (!data || !Array.isArray(data.jobs)) return [];

        return data.jobs
          .map((raw) => this.normalizeGreenhouseJob(raw, company))
          .filter((job) => {
            if (lowerLoc && !job.location.raw.toLowerCase().includes(lowerLoc)) {
              return false;
            }
            if (remote && !job.location.remote) {
              return false;
            }
            return this.isJobMatch(job, q);
          });
      } catch (err) {
        // Log diagnosis silently, isolated from other providers
        return [];
      }
    });

    const resultsArray = await Promise.all(fetchPromises);
    const flattened = resultsArray.flat();
    return flattened.slice(0, limit);
  }

  isJobMatch(job, queryStr) {
    if (!queryStr || !queryStr.trim()) return true;
    const qLower = queryStr.toLowerCase().trim();
    const titleLower = (job.title || "").toLowerCase();

    // Exclude non-tech / non-engineering positions
    const nonTechExclusions = ["recruiter", "account executive", "sales", "compliance", "legal", "hr ", "human resources", "marketing manager", "office manager", "accountant", "advisor", "hunter", "partner"];
    if (nonTechExclusions.some(ex => titleLower.includes(ex))) {
      return false;
    }

    if (titleLower.includes(qLower)) return true;

    const normQ = qLower.replace(/full\s*stack/g, "fullstack");
    const normTitle = titleLower.replace(/full\s*stack/g, "fullstack");
    if (normTitle.includes(normQ)) return true;

    const techWords = qLower.replace(/[-\/]/g, " ").split(/\s+/).filter(w => w.length > 2 && w !== "full");
    if (techWords.length > 0 && techWords.some(w => titleLower.includes(w))) {
      return true;
    }

    if (qLower.includes("developer") || qLower.includes("engineer") || qLower.includes("software") || qLower.includes("full")) {
      if (titleLower.includes("engineer") || titleLower.includes("developer") || titleLower.includes("architect") || titleLower.includes("fullstack") || titleLower.includes("frontend") || titleLower.includes("backend")) {
        return true;
      }
    }

    return false;
  }

  normalizeGreenhouseJob(raw, company) {
    const rawLoc = raw.location?.name || "";
    const isRemote = rawLoc.toLowerCase().includes("remote") ||
                     raw.title.toLowerCase().includes("remote");

    const publishedAt = raw.updated_at ? new Date(raw.updated_at) : null;
    const isPublishedValid = publishedAt && !isNaN(publishedAt.getTime());

    // Clean HTML tags from content
    const cleanDesc = raw.content 
      ? raw.content.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
                   .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
                   .replace(/<[^>]+>/g, " ")
                   .replace(/\s+/g, " ")
                   .trim()
      : raw.title;

    return {
      provider: "greenhouse",
      externalId: String(raw.id || ""),
      sourceJobId: String(raw.id || ""),
      title: raw.title ? raw.title.trim() : "Software Position",
      company: {
        name: company.name,
        logo: "",
        website: `https://boards.greenhouse.io/${company.slug}`
      },
      location: {
        city: "",
        state: "",
        country: "",
        remote: Boolean(isRemote),
        raw: rawLoc || (isRemote ? "Remote" : "Global")
      },
      employmentType: "Full-time",
      experienceLevel: "Mid-Level",
      description: cleanDesc,
      salary: null,
      url: raw.absolute_url || `https://boards.greenhouse.io/${company.slug}/jobs/${raw.id}`,
      publishedAt: isPublishedValid ? publishedAt : null,
      fetchedAt: new Date(),
      source: "Greenhouse"
    };
  }
}

module.exports = GreenhouseProvider;

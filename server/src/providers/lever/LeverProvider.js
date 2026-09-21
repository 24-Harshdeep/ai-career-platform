const JobProvider = require("../JobProvider");

const PUBLIC_LEVER_COMPANIES = [
  { slug: "postman", name: "Postman" },
  { slug: "vercel", name: "Vercel" },
  { slug: "ramp", name: "Ramp" },
  { slug: "canva", name: "Canva" },
  { slug: "spotify", name: "Spotify" }
];

class LeverProvider extends JobProvider {
  constructor() {
    super("lever");
  }

  async searchJobs(query = {}) {
    const { q = "", location = "", remote = false, limit = 20 } = query;
    const lowerQuery = q.toLowerCase();
    const lowerLoc = location.toLowerCase();

    const fetchPromises = PUBLIC_LEVER_COMPANIES.map(async (company) => {
      try {
        const url = `https://api.lever.co/v0/postings/${company.slug}?mode=json`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);

        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (!res.ok) return [];

        const data = await res.json();
        if (!Array.isArray(data)) return [];

        return data
          .map((raw) => this.normalizeLeverJob(raw, company))
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

  normalizeLeverJob(raw, company) {
    const rawLoc = raw.categories?.location || "";
    const isRemote = rawLoc.toLowerCase().includes("remote") ||
                     (raw.text || "").toLowerCase().includes("remote") ||
                     (raw.workplaceType || "").toLowerCase() === "remote";

    const publishedAt = raw.createdAt ? new Date(raw.createdAt) : null;
    const isPublishedValid = publishedAt && !isNaN(publishedAt.getTime());

    const description = raw.descriptionPlain || 
                        (raw.description ? raw.description.replace(/<[^>]+>/g, " ").trim() : raw.text || "");

    return {
      provider: "lever",
      externalId: String(raw.id || ""),
      sourceJobId: String(raw.id || ""),
      title: raw.text ? raw.text.trim() : "Software Engineer",
      company: {
        name: company.name,
        logo: "",
        website: `https://jobs.lever.co/${company.slug}`
      },
      location: {
        city: "",
        state: "",
        country: "",
        remote: Boolean(isRemote),
        raw: rawLoc || (isRemote ? "Remote" : "Global")
      },
      employmentType: raw.categories?.commitment || "Full-time",
      experienceLevel: "Mid-Level",
      description: description.replace(/\s+/g, " ").trim(),
      salary: null,
      url: raw.hostedUrl || raw.applyUrl || `https://jobs.lever.co/${company.slug}/${raw.id}`,
      publishedAt: isPublishedValid ? publishedAt : null,
      fetchedAt: new Date(),
      source: "Lever"
    };
  }
}

module.exports = LeverProvider;

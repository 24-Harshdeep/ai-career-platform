import { API_BASE_URL, apiFetch } from "@/lib/api";

export interface Company {
  name: string;
  logo?: string;
  website?: string;
}

export interface Location {
  city?: string;
  state?: string;
  country?: string;
  remote?: boolean;
  raw?: string;
}

export interface Salary {
  min?: number;
  max?: number;
  currency?: string;
  period?: string;
}

export interface SkillGapItem {
  skill: string;
  roadmapStatus?: "Completed" | "In Progress" | "Not Started";
  reason: string;
  recommendation: string;
}

export interface MatchSubscores {
  role: number;
  seniority: number;
  requiredSkills: number;
  experience: number;
  location: number;
  freshness: number;
  trajectory: number;
  seniorityPenalty?: number;
}

export interface JobMatchReasoning {
  matchScore: number; // 0 - 100
  subscores?: MatchSubscores;
  matchedSkills: string[];
  missingSkills: string[];
  preferredSkills?: string[];
  roleMatch: boolean;
  experienceMatch: boolean;
  locationMatch: boolean;
  reasons: string[];
  skillGaps: SkillGapItem[];
  roadmapSkillStatus?: Record<string, "Completed" | "In Progress" | "Not Started">;
}

export interface JobItem {
  id: string;
  _id?: string;
  provider: string;
  externalId?: string;
  title: string;
  normalizedTitle?: string;
  company: Company;
  location: Location;
  normalizedLocation?: string;
  remoteType?: "Remote" | "Hybrid" | "Onsite";
  country?: string;
  employmentType: string;
  experienceLevel: string;
  seniority?: string;
  roleFamily?: string;
  description: string;
  skills: string[];
  requiredSkills?: string[];
  preferredSkills?: string[];
  salary?: Salary | null;
  url: string;
  publishedAt?: string | null;
  fetchedAt: string;
  source: string;
  sources?: string[];
  category?: string;
  match: JobMatchReasoning;
  isSaved?: boolean;
  applicationStatus?: "Saved" | "Applied" | "Interview" | "Offer" | "Rejected" | null;
  savedAt?: string | null;
  notes?: string;
}

export interface JobSearchParams {
  q?: string;
  location?: string;
  remote?: boolean;
  experienceLevel?: string;
  employmentType?: string;
  provider?: string;
  postedWithin?: "24h" | "3d" | "7d" | "14d" | "30d" | "";
  category?: string;
  page?: number;
  limit?: number;
  sort?: "newest" | "relevance" | "match";
}

export interface ProviderHealth {
  name: string;
  status: "HEALTHY" | "DEGRADED" | "UNCONFIGURED" | "DISABLED";
  lastCheckTime?: string;
  responseTimeMs?: number;
  failureCount?: number;
  errorMessage?: string;
}

export interface JobSearchResponse {
  jobs: JobItem[];
  counts?: {
    recommended: number;
    goodMatch: number;
    stretch: number;
    recent: number;
    all: number;
  };
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  providersStatus: Record<string, "success" | "failed">;
}

async function safeJsonParse(res: Response): Promise<any> {
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return await res.json();
  }
  const text = await res.text();
  throw new Error(`Server returned non-JSON response (${res.status} ${res.statusText}). Check if API backend is running.`);
}

export async function fetchProviderHealth(): Promise<Record<string, ProviderHealth>> {
  const fallbackHealth: Record<string, ProviderHealth> = {
    jobvetta: { name: "jobvetta", status: "HEALTHY" },
    indianapi: { name: "indianapi", status: "HEALTHY" },
    jooble: { name: "jooble", status: "HEALTHY" },
    adzuna: { name: "adzuna", status: "HEALTHY" },
    greenhouse: { name: "greenhouse", status: "HEALTHY" },
    lever: { name: "lever", status: "HEALTHY" },
    ashby: { name: "ashby", status: "HEALTHY" }
  };

  try {
    const res = await apiFetch(`${API_BASE_URL}/jobs/health`);
    if (!res.ok) {
      console.warn(`[JobsService] Health check endpoint returned status ${res.status}. Using default provider health map.`);
      return fallbackHealth;
    }
    const json = await safeJsonParse(res);
    if (json && json.success && json.data) {
      return json.data;
    }
  } catch (err: any) {
    console.warn("[JobsService] Provider health check warning:", err.message);
  }

  return fallbackHealth;
}

export async function fetchJobs(params: JobSearchParams = {}): Promise<JobSearchResponse> {
  const query = new URLSearchParams();
  if (params.q) query.set("q", params.q);
  if (params.location) query.set("location", params.location);
  if (params.remote !== undefined) query.set("remote", String(params.remote));
  if (params.experienceLevel) query.set("experienceLevel", params.experienceLevel);
  if (params.employmentType) query.set("employmentType", params.employmentType);
  if (params.provider) query.set("provider", params.provider);
  if (params.postedWithin) query.set("postedWithin", params.postedWithin);
  if (params.category) query.set("category", params.category);
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));
  if (params.sort) query.set("sort", params.sort);

  const res = await apiFetch(`${API_BASE_URL}/jobs?${query.toString()}`);
  const json = await safeJsonParse(res);
  if (!json.success) {
    throw new Error(json.message || "Failed to fetch jobs");
  }
  return json.data;
}

export async function fetchJobById(id: string): Promise<JobItem> {
  const res = await apiFetch(`${API_BASE_URL}/jobs/${id}`);
  const json = await safeJsonParse(res);
  if (!json.success) {
    throw new Error(json.message || "Failed to fetch job details");
  }
  return json.data;
}

export async function saveJob(id: string): Promise<void> {
  const res = await apiFetch(`${API_BASE_URL}/jobs/${id}/save`, { method: "POST" });
  const json = await safeJsonParse(res);
  if (!json.success) {
    throw new Error(json.message || "Failed to save job");
  }
}

export async function unsaveJob(id: string): Promise<void> {
  const res = await apiFetch(`${API_BASE_URL}/jobs/${id}/save`, { method: "DELETE" });
  const json = await safeJsonParse(res);
  if (!json.success) {
    throw new Error(json.message || "Failed to unsave job");
  }
}

export async function fetchSavedJobs(): Promise<JobItem[]> {
  const res = await apiFetch(`${API_BASE_URL}/jobs/saved`);
  const json = await safeJsonParse(res);
  if (!json.success) {
    throw new Error(json.message || "Failed to fetch saved jobs");
  }
  return json.data;
}

export async function updateApplicationStatus(
  id: string,
  status: "Saved" | "Applied" | "Interview" | "Offer" | "Rejected",
  notes: string = ""
): Promise<void> {
  const res = await apiFetch(`${API_BASE_URL}/jobs/${id}/application`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status, notes })
  });
  const json = await safeJsonParse(res);
  if (!json.success) {
    throw new Error(json.message || "Failed to update application status");
  }
}

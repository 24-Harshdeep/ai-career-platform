/**
 * Indian Location Normalizer Service
 * Resolves city aliases, standardizes state/country, detects India-based locations,
 * and categorizes remote types (Remote, Hybrid, Onsite).
 */

const INDIA_CITY_ALIASES = {
  bangalore: "Bengaluru",
  bengaluru: "Bengaluru",
  gurgaon: "Gurugram",
  gurugram: "Gurugram",
  noida: "Noida",
  "greater noida": "Noida",
  delhi: "Delhi NCR",
  "new delhi": "Delhi NCR",
  "delhi ncr": "Delhi NCR",
  ghaziabad: "Delhi NCR",
  faridabad: "Delhi NCR",
  mumbai: "Mumbai",
  bombay: "Mumbai",
  navi_mumbai: "Mumbai",
  "navi mumbai": "Mumbai",
  thane: "Mumbai",
  pune: "Pune",
  hyderabad: "Hyderabad",
  secunderabad: "Hyderabad",
  chennai: "Chennai",
  madras: "Chennai",
  kolkata: "Kolkata",
  calcutta: "Kolkata",
  ahmedabad: "Ahmedabad",
  surat: "Surat",
  mohali: "Mohali",
  chandigarh: "Chandigarh",
  panchkula: "Chandigarh",
  thiruvananthapuram: "Thiruvananthapuram",
  trivandrum: "Thiruvananthapuram",
  kochi: "Kochi",
  cochin: "Kochi",
  indore: "Indore",
  jaipur: "Jaipur",
  coimbatore: "Coimbatore",
  nagpur: "Nagpur",
  vadodara: "Vadodara",
  bhubaneswar: "Bhubaneswar"
};

const STATE_MAPPINGS = {
  Bengaluru: "Karnataka",
  Gurugram: "Haryana",
  Noida: "Uttar Pradesh",
  "Delhi NCR": "Delhi",
  Mumbai: "Maharashtra",
  Pune: "Maharashtra",
  Hyderabad: "Telangana",
  Chennai: "Tamil Nadu",
  Kolkata: "West Bengal",
  Ahmedabad: "Gujarat",
  Mohali: "Punjab",
  Chandigarh: "Chandigarh",
  Thiruvananthapuram: "Kerala",
  Kochi: "Kerala",
  Indore: "Madhya Pradesh",
  Jaipur: "Rajasthan",
  Coimbatore: "Tamil Nadu",
  Nagpur: "Maharashtra",
  Vadodara: "Gujarat",
  Bhubaneswar: "Odisha"
};

/**
 * Normalizes any location string or object into standard Indian location structure.
 * 
 * @param {string|object} rawLocation 
 * @returns {object} { city, state, country, remoteType, normalizedLocation, isIndia }
 */
function normalizeIndiaLocation(rawLocation) {
  let locationStr = "";
  let isRemoteInput = false;

  if (typeof rawLocation === "string") {
    locationStr = rawLocation.trim();
  } else if (rawLocation && typeof rawLocation === "object") {
    isRemoteInput = Boolean(rawLocation.remote);
    locationStr = (rawLocation.raw || rawLocation.city || rawLocation.country || "").trim();
  }

  const lower = locationStr.toLowerCase();

  // Detect Remote / Hybrid / Onsite
  let remoteType = "Onsite";
  if (isRemoteInput || lower.includes("remote") || lower.includes("work from home") || lower.includes("wfh")) {
    remoteType = "Remote";
  } else if (lower.includes("hybrid")) {
    remoteType = "Hybrid";
  }

  // Detect India context
  let isIndia = lower.includes("india") || lower.includes("in") || remoteType === "Remote";
  let city = "";
  let state = "";
  let country = isIndia ? "India" : "International";

  for (const [alias, canonicalCity] of Object.entries(INDIA_CITY_ALIASES)) {
    // Exact or boundary match for city alias
    const regex = new RegExp(`(?:^|[^a-zA-Z0-9])${alias.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&")}(?:$|[^a-zA-Z0-9])`, "i");
    if (regex.test(lower)) {
      city = canonicalCity;
      state = STATE_MAPPINGS[canonicalCity] || "";
      isIndia = true;
      country = "India";
      break;
    }
  }

  if (!isIndia && (lower.includes("india") || lower.includes(", in") || lower.endsWith(" in"))) {
    isIndia = true;
    country = "India";
  }

  let normalizedLocation = "India (Remote)";
  if (remoteType === "Remote") {
    normalizedLocation = city ? `${city}, India (Remote)` : "India (Remote)";
  } else if (remoteType === "Hybrid") {
    normalizedLocation = city ? `${city}, India (Hybrid)` : "India (Hybrid)";
  } else if (city) {
    normalizedLocation = `${city}, ${state ? state + ", " : ""}India`;
  } else if (locationStr) {
    normalizedLocation = locationStr;
  }

  return {
    city,
    state,
    country,
    remoteType,
    normalizedLocation,
    isIndia
  };
}

module.exports = {
  normalizeIndiaLocation,
  INDIA_CITY_ALIASES,
  STATE_MAPPINGS
};

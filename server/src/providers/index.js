const AdzunaProvider = require("./adzuna/AdzunaProvider");
const GreenhouseProvider = require("./greenhouse/GreenhouseProvider");
const LeverProvider = require("./lever/LeverProvider");
const AshbyProvider = require("./ashby/AshbyProvider");
const JobvettaProvider = require("./jobvetta/JobvettaProvider");
const IndianApiProvider = require("./indianapi/IndianApiProvider");
const JoobleProvider = require("./jooble/JoobleProvider");

/**
 * Returns instantiated JobProvider instances for all enabled providers.
 */
function getEnabledProviders() {
  const providers = [];

  const adzunaEnabled = process.env.JOB_PROVIDER_ADZUNA_ENABLED !== "false";
  const greenhouseEnabled = process.env.JOB_PROVIDER_GREENHOUSE_ENABLED !== "false";
  const leverEnabled = process.env.JOB_PROVIDER_LEVER_ENABLED !== "false";
  const ashbyEnabled = process.env.JOB_PROVIDER_ASHBY_ENABLED !== "false";
  const jobvettaEnabled = process.env.JOB_PROVIDER_JOBVETTA_ENABLED !== "false";
  const indianapiEnabled = process.env.JOB_PROVIDER_INDIANAPI_ENABLED !== "false";
  const joobleEnabled = process.env.JOB_PROVIDER_JOOBLE_ENABLED !== "false";

  if (jobvettaEnabled) providers.push(new JobvettaProvider());
  if (indianapiEnabled) providers.push(new IndianApiProvider());
  if (joobleEnabled) providers.push(new JoobleProvider());
  if (adzunaEnabled) providers.push(new AdzunaProvider());
  if (greenhouseEnabled) providers.push(new GreenhouseProvider());
  if (leverEnabled) providers.push(new LeverProvider());
  if (ashbyEnabled) providers.push(new AshbyProvider());

  return providers;
}

/**
 * Checks and reports live status for all job providers
 */
async function getProvidersHealth() {
  const providers = getEnabledProviders();
  const healthResults = [];
  const healthMap = {};

  for (const p of providers) {
    try {
      if (typeof p.healthCheck === "function") {
        const h = await p.healthCheck();
        const resObj = { name: p.name, provider: p.name, ...h };
        healthResults.push(resObj);
        healthMap[p.name.toLowerCase()] = resObj;
      } else {
        const resObj = {
          name: p.name,
          provider: p.name,
          status: "HEALTHY",
          reason: "Provider active."
        };
        healthResults.push(resObj);
        healthMap[p.name.toLowerCase()] = resObj;
      }
    } catch (err) {
      const resObj = {
        name: p.name,
        provider: p.name,
        status: "DEGRADED",
        reason: err.message
      };
      healthResults.push(resObj);
      healthMap[p.name.toLowerCase()] = resObj;
    }
  }

  const activeCount = healthResults.filter((h) => h.status === "HEALTHY").length;
  return {
    activeCount,
    totalProviders: healthResults.length,
    providers: healthResults,
    ...healthMap
  };
}

module.exports = {
  getEnabledProviders,
  getProvidersHealth,
  AdzunaProvider,
  GreenhouseProvider,
  LeverProvider,
  AshbyProvider,
  JobvettaProvider,
  IndianApiProvider,
  JoobleProvider
};

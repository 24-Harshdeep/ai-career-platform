const AdzunaProvider = require("./adzuna/AdzunaProvider");
const GreenhouseProvider = require("./greenhouse/GreenhouseProvider");
const LeverProvider = require("./lever/LeverProvider");
const AshbyProvider = require("./ashby/AshbyProvider");

/**
 * Returns instantiated JobProvider instances for all currently enabled providers.
 */
function getEnabledProviders() {
  const providers = [];

  const adzunaEnabled = process.env.JOB_PROVIDER_ADZUNA_ENABLED !== "false";
  const greenhouseEnabled = process.env.JOB_PROVIDER_GREENHOUSE_ENABLED !== "false";
  const leverEnabled = process.env.JOB_PROVIDER_LEVER_ENABLED !== "false";
  const ashbyEnabled = process.env.JOB_PROVIDER_ASHBY_ENABLED !== "false";

  if (adzunaEnabled) {
    providers.push(new AdzunaProvider());
  }
  if (greenhouseEnabled) {
    providers.push(new GreenhouseProvider());
  }
  if (leverEnabled) {
    providers.push(new LeverProvider());
  }
  if (ashbyEnabled) {
    providers.push(new AshbyProvider());
  }

  return providers;
}

module.exports = {
  getEnabledProviders,
  AdzunaProvider,
  GreenhouseProvider,
  LeverProvider,
  AshbyProvider
};

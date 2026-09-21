/**
 * Provider-agnostic abstract base class for Job Intelligence sources.
 * Every provider implementation must extend JobProvider and return normalized jobs.
 */
class JobProvider {
  /**
   * @param {string} name - Unique provider identifier (e.g. 'adzuna', 'greenhouse', 'lever', 'ashby')
   */
  constructor(name) {
    if (!name) {
      throw new Error("JobProvider must be instantiated with a valid provider name.");
    }
    this.name = name;
  }

  /**
   * Search jobs from external source
   * @param {Object} query - Search parameters
   * @param {string} [query.q] - Keyword search
   * @param {string} [query.location] - Location query
   * @param {boolean} [query.remote] - Remote work filter
   * @param {number} [query.page] - Page number (1-indexed)
   * @param {number} [query.limit] - Results per page
   * @returns {Promise<Array>} Array of raw or normalized job objects
   */
  async searchJobs(query) {
    throw new Error(`Method 'searchJobs()' must be implemented by provider '${this.name}'.`);
  }
}

module.exports = JobProvider;

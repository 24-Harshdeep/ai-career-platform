/**
 * CareerOS — Demo User Identity Utilities
 *
 * Primary identity check: DEMO_USER_ID env var (stable DB ObjectId).
 * Fallback identity check: known demo email (alex@careeros.dev).
 * Fail-closed: if DEMO_USER_ID is not configured, the email fallback
 * still protects the public demo account from mutations.
 */

const DEMO_USER_EMAIL = "alex@careeros.dev";
const DEMO_USER_ID = process.env.DEMO_USER_ID || null;

/**
 * Check if a given userId (string or ObjectId) belongs to the demo account.
 * Requires DEMO_USER_ID to be configured in the environment.
 */
function isDemoUser(userId) {
  if (!userId || !DEMO_USER_ID) return false;
  return userId.toString() === DEMO_USER_ID;
}

/**
 * Check if a given email belongs to the demo account.
 * Used as a fallback when DEMO_USER_ID is not configured.
 */
function isDemoEmail(email) {
  if (!email) return false;
  return email.toLowerCase() === DEMO_USER_EMAIL;
}

module.exports = {
  isDemoUser,
  isDemoEmail,
  DEMO_USER_EMAIL,
  DEMO_USER_ID
};

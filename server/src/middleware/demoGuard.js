/**
 * CareerOS — Centralized Demo Guard Middleware
 *
 * Mounted globally in index.js via:
 *   app.use("/api", demoGuard);
 *
 * Design:
 * - Decodes the JWT to identify the demo user WITHOUT a DB round-trip.
 *   (authMiddleware already verified the signature for data-access paths.)
 * - Primary identity: decoded.id === DEMO_USER_ID  (stable DB ObjectId, env-configured)
 * - Fallback identity: decoded.email === DEMO_USER_EMAIL  (fail-closed when ID not set)
 * - Blocks ALL mutating HTTP methods (POST, PUT, PATCH, DELETE) for the demo account,
 *   except the explicitly allowed auth paths below.
 * - Returns HTTP 403 with { demoRestricted: true } for blocked requests.
 * - Never blocks GET requests — visitors can freely browse all read paths.
 *
 * Startup validation:
 *   Call validateDemoConfig() once at server startup to log configuration state.
 */

const jwt = require("jsonwebtoken");
const { DEMO_USER_EMAIL, DEMO_USER_ID } = require("../utils/demoUser");

// HTTP methods that mutate server-side state
const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

// Paths always allowed for demo users regardless of HTTP method
const DEMO_ALLOWED_URL_PREFIXES = [
  "/api/auth/login",
  "/api/auth/register"
];

/**
 * Decode the JWT from the Authorization header and determine if the
 * request originates from the demo account.
 * Uses jwt.decode() (not jwt.verify()) since authMiddleware already verified
 * the signature for authenticated routes — here we only need the payload claims.
 */
function isRequestFromDemoUser(req) {
  const authHeader = req.header("Authorization");
  if (!authHeader) return false;

  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : authHeader;
  if (!token) return false;

  try {
    const decoded = jwt.decode(token);
    if (!decoded || typeof decoded !== "object") return false;

    // Primary: stable database ObjectId check
    if (DEMO_USER_ID && decoded.id && decoded.id.toString() === DEMO_USER_ID) {
      return true;
    }

    // Fallback: email-based check (always active, fail-closed when DEMO_USER_ID absent)
    if (decoded.email && decoded.email.toLowerCase() === DEMO_USER_EMAIL) {
      return true;
    }

    return false;
  } catch {
    return false;
  }
}

/**
 * Express middleware. Mount with:  app.use("/api", demoGuard);
 */
function demoGuard(req, res, next) {
  // Only intercept mutating methods
  if (!MUTATING_METHODS.has(req.method)) return next();

  // Allow explicitly whitelisted paths (auth login, register)
  const url = req.originalUrl || req.url || "";
  if (DEMO_ALLOWED_URL_PREFIXES.some((prefix) => url.startsWith(prefix))) {
    return next();
  }

  // Allow if this is not a demo account request
  if (!isRequestFromDemoUser(req)) return next();

  // Block mutation — return friendly demo-mode rejection
  return res.status(403).json({
    success: false,
    demoRestricted: true,
    message:
      "This action is not available in demo mode. " +
      "Create a free account to save your progress and unlock full access.",
    cta: "Sign up free"
  });
}

/**
 * Call once at server startup to log demo guard configuration.
 * Emits a WARNING if DEMO_USER_ID is absent (email fallback active).
 */
function validateDemoConfig() {
  if (!DEMO_USER_ID) {
    console.warn(
      "[CareerOS Demo Guard] WARNING: DEMO_USER_ID is not set in environment variables. " +
      "Demo protection is active via email fallback (alex@careeros.dev). " +
      "For stronger isolation, set DEMO_USER_ID after running: node seedDemoAccount.js"
    );
  } else {
    console.log(
      `[CareerOS Demo Guard] Active — demo mutations blocked for user ID: ${DEMO_USER_ID}`
    );
  }
}

module.exports = { demoGuard, validateDemoConfig };

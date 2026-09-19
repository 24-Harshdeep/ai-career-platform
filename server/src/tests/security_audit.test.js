const assert = require("assert");
const jwt = require("jsonwebtoken");
const authMiddleware = require("../middleware/auth");
const { auditProject } = require("../services/project.service");
const { deleteJobOpportunity } = require("../services/job.service");

async function runSecurityTests() {
  console.log("==================================================");
  console.log("CAREEROS SECURITY AUTOMATED TEST SUITE RUNNING");
  console.log("==================================================\n");

  let passed = 0;
  let failed = 0;

  function logPass(testName) {
    console.log(`[PASS] ${testName}`);
    passed++;
  }

  function logFail(testName, err) {
    console.error(`[FAIL] ${testName}:`, err.message);
    failed++;
  }

  // TEST 1: Auth Middleware - No Auth Header
  try {
    const req = { header: () => null };
    let statusSet = null;
    let jsonSent = null;
    const res = {
      status: (code) => {
        statusSet = code;
        return {
          json: (data) => { jsonSent = data; }
        };
      }
    };

    await authMiddleware(req, res, () => {});
    assert.strictEqual(statusSet, 401, "Should return HTTP 401");
    assert.ok(jsonSent.error.includes("No authorization header"), "Expected header error message");
    logPass("Auth Middleware - Rejects request with missing Authorization header");
  } catch (err) {
    logFail("Auth Middleware - Rejects request with missing Authorization header", err);
  }

  // TEST 2: Auth Middleware - Invalid JWT Token
  try {
    const req = { header: () => "Bearer invalid.jwt.token.string" };
    let statusSet = null;
    let jsonSent = null;
    const res = {
      status: (code) => {
        statusSet = code;
        return {
          json: (data) => { jsonSent = data; }
        };
      }
    };

    await authMiddleware(req, res, () => {});
    assert.strictEqual(statusSet, 401, "Should return HTTP 401");
    assert.ok(jsonSent.error.includes("Invalid token"), "Expected invalid token message");
    logPass("Auth Middleware - Rejects invalid JWT signature");
  } catch (err) {
    logFail("Auth Middleware - Rejects invalid JWT signature", err);
  }

  // TEST 3: Auth Middleware - Expired JWT Token
  try {
    const secret = "careeros-development-secret-key-3289";
    const expiredToken = jwt.sign({ id: "507f1f77bcf86cd799439011" }, secret, { expiresIn: "-1s" });
    const req = { header: () => `Bearer ${expiredToken}` };
    let statusSet = null;
    let jsonSent = null;
    const res = {
      status: (code) => {
        statusSet = code;
        return {
          json: (data) => { jsonSent = data; }
        };
      }
    };

    await authMiddleware(req, res, () => {});
    assert.strictEqual(statusSet, 401, "Should return HTTP 401");
    assert.ok(jsonSent.error.includes("expired"), "Expected expired token error message");
    logPass("Auth Middleware - Rejects expired JWT token");
  } catch (err) {
    logFail("Auth Middleware - Rejects expired JWT token", err);
  }

  // TEST 4: SSRF Protection - Loopback Address Rejection
  try {
    let errorThrown = false;
    try {
      await auditProject("507f1f77bcf86cd799439011", "http://127.0.0.1:5000/internal", "Test Project", "Portfolio");
    } catch (err) {
      errorThrown = true;
      assert.ok(err.message.includes("prohibited") || err.message.includes("unreachable"), "Expected SSRF prohibition message");
    }
    assert.strictEqual(errorThrown, true, "Should have thrown SSRF protection error");
    logPass("SSRF Defense - Rejects loopback address (127.0.0.1)");
  } catch (err) {
    logFail("SSRF Defense - Rejects loopback address (127.0.0.1)", err);
  }

  // TEST 5: SSRF Protection - Cloud Metadata Endpoint Rejection
  try {
    let errorThrown = false;
    try {
      await auditProject("507f1f77bcf86cd799439011", "http://169.254.169.254/latest/meta-data/", "Test Project", "Portfolio");
    } catch (err) {
      errorThrown = true;
      assert.ok(err.message.includes("prohibited") || err.message.includes("unreachable"), "Expected SSRF prohibition message");
    }
    assert.strictEqual(errorThrown, true, "Should have thrown SSRF protection error");
    logPass("SSRF Defense - Rejects AWS/Cloud Metadata IP (169.254.169.254)");
  } catch (err) {
    logFail("SSRF Defense - Rejects AWS/Cloud Metadata IP (169.254.169.254)", err);
  }

  console.log("\n==================================================");
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log("==================================================");
  
  process.exit(failed > 0 ? 1 : 0);
}

runSecurityTests();

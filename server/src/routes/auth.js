const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const authMiddleware = require("../middleware/auth");

const JWT_SECRET = process.env.JWT_SECRET || (process.env.NODE_ENV === "production" ? null : "careeros-development-secret-key-3289");
if (process.env.NODE_ENV === "production" && !process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET must be configured in production.");
}

// Register Account
router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  if (
    typeof name !== "string" ||
    typeof email !== "string" ||
    typeof password !== "string" ||
    !name.trim() ||
    !email.trim() ||
    !password
  ) {
    return res.status(400).json({ error: "Missing required registration parameters." });
  }

  const normalizedName = name.trim();
  const normalizedEmail = email.trim().toLowerCase();
  if (normalizedName.length > 120 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    return res.status(400).json({ error: "Enter a valid name and email address." });
  }
  if (password.length < 8 || Buffer.byteLength(password, "utf8") > 72) {
    return res.status(400).json({ error: "Password must be at least 8 characters and no more than 72 bytes." });
  }

  try {
    // 1. Encrypt raw password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    let newUser = null;

    try {
      const escapedEmail = normalizedEmail.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const existingUser = await User.findOne({
        email: { $regex: `^${escapedEmail}$`, $options: "i" }
      });
      if (existingUser) {
        return res.status(409).json({ error: "Email registration already exists." });
      }

      // Create document in database
      newUser = await User.create({
        name: normalizedName,
        email: normalizedEmail,
        passwordHash
      });
    } catch (dbErr) {
      if (dbErr.code === 11000) {
        return res.status(409).json({ error: "Email registration already exists." });
      }
      return res.status(503).json({ error: "Account storage is unavailable." });
    }

    // 2. Sign JWT Session Token
    const token = jwt.sign(
      { id: newUser._id, email: newUser.email, name: newUser.name },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role || "",
        goal: newUser.goal || ""
      }
    });
  } catch (err) {
    console.error("Register Error:", err);
    res.status(500).json({ error: "An unexpected error occurred during account registration." });
  }
});

// Login Session
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (typeof email !== "string" || typeof password !== "string" || !email.trim() || !password) {
    return res.status(400).json({ error: "Missing login parameters." });
  }
  if (email.length > 254 || Buffer.byteLength(password, "utf8") > 72) {
    return res.status(400).json({ error: "Invalid email or password." });
  }
  const enteredEmail = email.trim();
  const normalizedEmail = email.trim().toLowerCase();

  try {
    let matchedUser = null;
    let isMatch = false;

    try {
      // Query database
      matchedUser = await User.findOne({ email: enteredEmail });
      if (!matchedUser && normalizedEmail !== enteredEmail) {
        matchedUser = await User.findOne({ email: normalizedEmail });
      }

      if (matchedUser) {
        if (matchedUser.passwordHash) {
          isMatch = await bcrypt.compare(password, matchedUser.passwordHash);
        }
      }
    } catch (dbErr) {
      return res.status(503).json({ error: "Account storage is unavailable." });
    }

    if (!matchedUser || !isMatch) {
      return res.status(401).json({ error: "Invalid email or password combination." });
    }

    // Sign JWT Session Token
    const token = jwt.sign(
      { id: matchedUser._id, email: matchedUser.email, name: matchedUser.name },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      token,
      user: {
        id: matchedUser._id,
        name: matchedUser.name,
        email: matchedUser.email,
        role: matchedUser.role || "",
        goal: matchedUser.goal || ""
      }
    });
  } catch (err) {
    console.error("Authentication request failed:", err.message);
    res.status(500).json({ error: "An unexpected authentication error occurred." });
  }
});


// Validate Session Token & Return Active Profile
router.get("/me", authMiddleware, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;

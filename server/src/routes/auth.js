const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const authMiddleware = require("../middleware/auth");

const JWT_SECRET = process.env.JWT_SECRET || "careeros-secret-key";

// Local in-memory users cache fallback for sandboxes without Mongo
const localUserCache = [];

// Enforce default mock credentials
const DEFAULT_USER = {
  email: "harshdeep@careeros.dev",
  passwordHash: bcrypt.hashSync("password", 10),
  name: "Harshdeep"
};
localUserCache.push(DEFAULT_USER);

// Register Account
router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({ error: "Missing required registration parameters." });
  }

  try {
    // 1. Encrypt raw password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    let newUser = null;

    try {
      // Check if email already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ error: "Email registration already exists." });
      }

      // Create document in database
      newUser = await User.create({
        name,
        email,
        passwordHash
      });
    } catch (dbErr) {
      // Offline Local Cache Fallback
      const cacheExists = localUserCache.some(u => u.email === email);
      if (cacheExists) {
        return res.status(400).json({ error: "Email registration already exists." });
      }
      newUser = {
        _id: `mock-id-${Date.now()}`,
        name,
        email,
        passwordHash
      };
      localUserCache.push(newUser);
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
        role: "Full Stack Developer",
        goal: "Full Stack Developer"
      }
    });
  } catch (err) {
    res.status(500).json({ error: `Internal registry failure: ${err.message}` });
  }
});

// Login Session
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Missing login parameters." });
  }

  try {
    let matchedUser = null;
    let isMatch = false;

    try {
      // Query database
      matchedUser = await User.findOne({ email });
      if (matchedUser) {
        isMatch = await bcrypt.compare(password, matchedUser.passwordHash);
      }
    } catch (dbErr) {
      // Offline fallback lookup
      matchedUser = localUserCache.find(u => u.email === email);
      if (matchedUser) {
        isMatch = await bcrypt.compare(password, matchedUser.passwordHash);
      }
    }

    if (!matchedUser || !isMatch) {
      return res.status(400).json({ error: "Invalid email or password combination." });
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
        role: matchedUser.role || "Full Stack Developer",
        goal: matchedUser.goal || "Full Stack Developer"
      }
    });
  } catch (err) {
    res.status(500).json({ error: `Internal auth failure: ${err.message}` });
  }
});

// Validate Session Token & Return Active Profile
router.get("/me", authMiddleware, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;

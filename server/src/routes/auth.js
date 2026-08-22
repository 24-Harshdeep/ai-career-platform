const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const authMiddleware = require("../middleware/auth");

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error("JWT_SECRET must be configured.");

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
        if (!matchedUser.passwordHash || matchedUser.passwordHash === "undefined") {
          // Self-healing migration: set the first entered password as the hash
          const salt = await bcrypt.genSalt(10);
          matchedUser.passwordHash = await bcrypt.hash(password, salt);
          await matchedUser.save();
          isMatch = true;
        } else {
          isMatch = await bcrypt.compare(password, matchedUser.passwordHash);
        }
      }
    } catch (dbErr) {
      return res.status(503).json({ error: "Account storage is unavailable." });
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
        role: matchedUser.role || "",
        goal: matchedUser.goal || ""
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

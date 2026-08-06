const jwt = require("jsonwebtoken");
const User = require("../models/User");

// JWT secret key configuration
const JWT_SECRET = process.env.JWT_SECRET || "careeros-secret-key";

const authMiddleware = async (req, res, next) => {
  const authHeader = req.header("Authorization");
  
  if (!authHeader) {
    return res.status(401).json({ error: "Access denied. No authorization header provided." });
  }

  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : authHeader;

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Attempt database retrieval if MongoDB is connected, else use mock placeholder user
    let user = null;
    try {
      user = await User.findById(decoded.id).select("-passwordHash");
      
      if (user) {
        const today = new Date();
        const lastActive = user.lastActivityDate || user.createdAt || new Date();
        
        // Normalize both dates to midnight (00:00:00.000) to compute true calendar days difference
        const d1 = new Date(lastActive.getFullYear(), lastActive.getMonth(), lastActive.getDate());
        const d2 = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        
        const diffTime = d2 - d1;
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
        
        let updated = false;
        if (diffDays === 1) {
          // Consecutive day: increment streak
          user.streakDays = (user.streakDays || 0) + 1;
          user.longestStreak = Math.max(user.longestStreak || 0, user.streakDays);
          user.lastActivityDate = today;
          updated = true;
        } else if (diffDays > 1) {
          // Streak broken: reset to 1
          user.streakDays = 1;
          user.lastActivityDate = today;
          updated = true;
        } else if (!user.lastActivityDate) {
          // First activity tracking: initialize lastActivityDate
          user.lastActivityDate = today;
          updated = true;
        }
        
        if (updated) {
          await user.save();
        }
      }
    } catch (dbErr) {
      // Offline fallback mode
    }

    if (!user) {
      // Mock user fallback if database query is empty or offline
      user = {
        _id: decoded.id || "mock-user-id",
        name: decoded.name || "Harshdeep",
        email: decoded.email || "harshdeep@careeros.dev",
        role: "Full Stack Developer",
        goal: "Full Stack Developer"
      };
    }

    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid token. Session has expired." });
  }
};

module.exports = authMiddleware;

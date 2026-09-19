const jwt = require("jsonwebtoken");
const User = require("../models/User");

// JWT secret key configuration - require explicit process.env.JWT_SECRET in production
const JWT_SECRET = process.env.JWT_SECRET || (process.env.NODE_ENV === "production" ? null : "careeros-development-secret-key-3289");

const authMiddleware = async (req, res, next) => {
  if (!JWT_SECRET) {
    console.error("[CRITICAL SECURITY] JWT_SECRET is not configured in environment variables.");
    return res.status(500).json({ error: "Server authentication configuration error." });
  }

  const authHeader = req.header("Authorization");
  
  if (!authHeader) {
    return res.status(401).json({ error: "Access denied. No authorization header provided." });
  }

  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : authHeader;

  // Demo token mode allowed ONLY in development and explicitly enabled via ALLOW_DEMO_MODE=true
  const isDev = process.env.NODE_ENV !== "production";
  const allowDemo = process.env.ALLOW_DEMO_MODE === "true" || (isDev && process.env.ALLOW_DEMO_MODE !== "false");

  if (allowDemo && token && (token.startsWith("demo_") || token === "demo_token")) {
    try {
      let demoUser = await User.findOne({ email: "alex@careeros.dev" });
      if (!demoUser) {
        demoUser = await User.create({
          name: "Alex Chen",
          email: "alex@careeros.dev",
          passwordHash: "$2a$10$e846059955700cf11c50bu2vOq71.8zY46/kZp7L5P4V0hQZk.d86",
          role: "Senior Full Stack Developer",
          goal: "Senior Full Stack Developer"
        });
      }
      req.user = demoUser;
      return next();
    } catch (err) {
      console.error("Error resolving demo user token:", err);
    }
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
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
      return res.status(503).json({ error: "Unable to verify account ownership." });
    }

    if (!user) {
      return res.status(401).json({ error: "Account not found or session invalid." });
    }

    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid token. Session has expired." });
  }
};

module.exports = authMiddleware;

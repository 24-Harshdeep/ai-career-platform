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

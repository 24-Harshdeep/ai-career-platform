function toUserDTO(user) {
  if (!user) return null;
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    goal: user.goal,
    experience: user.experience,
    score: user.score,
    scoreTrend: user.scoreTrend,
    streakDays: user.streakDays || 0,
    longestStreak: user.longestStreak || 0,
    xp: user.xp || 0,
    level: user.level || 0
  };
}

module.exports = { toUserDTO };

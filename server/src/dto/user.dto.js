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
    scoreTrend: user.scoreTrend
  };
}

module.exports = { toUserDTO };

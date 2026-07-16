function calculateStreak(input) {
  const { lastActivityDate, currentStreak, longestStreak, todayDate } = input;

  if (!lastActivityDate) {
    return {
      newStreak: 1,
      newLongestStreak: Math.max(1, longestStreak),
      broken: false,
      bonusXp: 0
    };
  }

  const lastDate = new Date(lastActivityDate);
  const today = new Date(todayDate);
  
  // Calculate difference in days
  const diffTime = Math.abs(today - lastDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  let newStreak = currentStreak;
  let broken = false;
  let bonusXp = 0;

  if (diffDays === 0) {
    // Already active today
    newStreak = currentStreak;
  } else if (diffDays === 1) {
    // Consecutive day
    newStreak = currentStreak + 1;
    // Award streak multiplier bonus (e.g. every 7 days)
    if (newStreak % 7 === 0) {
      bonusXp = 100;
    }
  } else {
    // Broke streak
    newStreak = 1;
    broken = true;
  }

  const newLongest = Math.max(newStreak, longestStreak);

  return {
    newStreak,
    newLongestStreak: newLongest,
    broken,
    bonusXp
  };
}

module.exports = { calculateStreak };

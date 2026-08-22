function compileConsistencyActivity(events = []) {
  const heatMapDays = [0, 0, 0, 0, 0, 0, 0];
  const now = new Date();
  
  events.forEach(evt => {
    const diff = Math.floor((now.getTime() - new Date(evt.createdAt).getTime()) / (1000 * 60 * 60 * 24));
    if (diff >= 0 && diff < 7) {
      heatMapDays[6 - diff] += 1;
    }
  });

  return {
    streakDays: Math.min(7, events.length),
    heatMapDays
  };
}

module.exports = { compileConsistencyActivity };

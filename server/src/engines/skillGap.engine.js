function calculateSkillGaps(possessed, target) {
  const p = possessed || {};
  const t = target || {};

  const possessedFlat = [
    ...(p.technical || []),
    ...(p.soft || []),
    ...(p.tools || []),
    ...(p.frameworks || []),
    ...(p.languages || []),
    ...(p.cloud || []),
    ...(p.devops || [])
  ];

  const targetFlat = [
    ...(t.technical || []),
    ...(t.soft || []),
    ...(t.tools || []),
    ...(t.frameworks || []),
    ...(t.languages || []),
    ...(t.cloud || []),
    ...(t.devops || [])
  ];

  const missing = targetFlat.filter(skill => !possessedFlat.includes(skill));

  return {
    missing,
    possessedCount: possessedFlat.length,
    targetCount: targetFlat.length,
    gapRatio: targetFlat.length > 0 ? (missing.length / targetFlat.length) : 0
  };
}

module.exports = { calculateSkillGaps };

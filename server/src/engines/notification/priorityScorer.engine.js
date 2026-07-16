function scoreAlertPriority(type, source) {
  if (type === "error") return "High";
  if (source === "advisor" && type === "warning") return "High";
  return "Medium";
}

module.exports = { scoreAlertPriority };

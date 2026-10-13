function getErrorMessage(err, fallback) {
  if (process.env.NODE_ENV === "production") {
    return fallback;
  }

  const detail = err instanceof Error ? err.message : "";
  return detail ? `${fallback}: ${detail}` : fallback;
}

module.exports = { getErrorMessage };

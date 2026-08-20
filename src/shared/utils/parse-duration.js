const parseDurationMs = (str) => {
  const unit = str.slice(-1);
  const value = parseInt(str.slice(0, -1), 10);
  if (unit === 's') return value * 1000;
  if (unit === 'm') return value * 60 * 1000;
  if (unit === 'h') return value * 60 * 60 * 1000;
  if (unit === 'd') return value * 24 * 60 * 60 * 1000;
  return value * 1000; // fallback: treat as seconds
};

module.exports = { parseDurationMs };

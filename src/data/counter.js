export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function percent(correct, total) {
  if (!total) return 0;
  return clamp(Math.round((correct / total) * 100), 0, 100);
}
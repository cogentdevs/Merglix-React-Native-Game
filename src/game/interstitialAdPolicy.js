const AD_RANGES = [
  {start: 1, end: 50, every: 5},
  {start: 51, end: 100, every: 4},
  {start: 101, end: 150, every: 3},
  {start: 151, end: 200, every: 2},
  {start: 201, end: Infinity, every: 1},
];

/** Returns whether a completed level should display a non-rewarding full-screen ad. */
export function shouldShowInterstitialAfterLevel(level) {
  const safeLevel = Math.floor(Number(level));
  if (!Number.isFinite(safeLevel) || safeLevel < 1) return false;

  const range = AD_RANGES.find(candidate =>
    safeLevel >= candidate.start && safeLevel <= candidate.end,
  );
  if (!range) return false;

  return (safeLevel - range.start + 1) % range.every === 0;
}

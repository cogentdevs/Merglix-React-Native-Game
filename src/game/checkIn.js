export const CHECK_IN_SCHEMA_VERSION = 2;
export const CHECK_IN_BASE_COINS = 20;
export const CHECK_IN_INCREMENT = 5;
export const CHECK_IN_MAX_REWARD_DAY = 30;
export const CHECK_IN_MAX_COINS = 165;
export const CHECK_IN_COOLDOWN_MS = 24 * 60 * 60 * 1000;
export const CHECK_IN_STREAK_EXPIRY_MS = 48 * 60 * 60 * 1000;

export const INITIAL_CHECK_IN = {
  schemaVersion: CHECK_IN_SCHEMA_VERSION,
  streakDay: 0,
  lastClaimAt: null,
  migrationBlockedUntilDate: null,
  lifetimeClaims: 0,
};

export function getLocalDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getNextLocalDateKey(dateKey) {
  const [year, month, day] = dateKey.split('-').map(Number);
  return getLocalDateKey(new Date(year, month - 1, day + 1));
}

export function getCheckInReward(day) {
  const effectiveDay = Math.min(
    Math.max(1, Math.floor(Number(day) || 1)),
    CHECK_IN_MAX_REWARD_DAY,
  );
  return CHECK_IN_BASE_COINS + (effectiveDay - 1) * CHECK_IN_INCREMENT;
}

export function normalizeCheckIn(checkIn) {
  return {...INITIAL_CHECK_IN, ...(checkIn ?? {})};
}

/**
 * Converts legacy calendar-cycle state without granting or removing coins.
 * A legacy claim on the migration day stays unavailable until the next local day.
 */
export function migrateDailyCheckIn(checkIn, now = Date.now()) {
  const current = checkIn ?? {};
  if (current.schemaVersion >= CHECK_IN_SCHEMA_VERSION) {
    return normalizeCheckIn(current);
  }

  const today = getLocalDateKey(new Date(now));
  const legacyDate = typeof current.lastClaimDate === 'string'
    ? current.lastClaimDate
    : null;
  const hasUncertainLegacyProgress = Boolean(
    current.currentDayIndex ||
    current.lastClaimedDayIndex != null ||
    current.cycleLocked,
  );
  const migrationBlockedUntilDate = legacyDate && legacyDate >= today
    ? getNextLocalDateKey(legacyDate)
    : !legacyDate && hasUncertainLegacyProgress
      ? getNextLocalDateKey(today)
      : null;

  return {
    ...INITIAL_CHECK_IN,
    lifetimeClaims: Math.max(0, current.lifetimeClaims ?? 0),
    migrationBlockedUntilDate,
  };
}

export function getNextAvailableAt(checkIn) {
  const {lastClaimAt} = normalizeCheckIn(checkIn);
  return Number.isFinite(lastClaimAt) ? lastClaimAt + CHECK_IN_COOLDOWN_MS : null;
}

export function getStreakExpiresAt(checkIn) {
  const {lastClaimAt} = normalizeCheckIn(checkIn);
  return Number.isFinite(lastClaimAt) ? lastClaimAt + CHECK_IN_STREAK_EXPIRY_MS : null;
}

export function getCheckInStatus(checkIn, now = Date.now()) {
  const state = normalizeCheckIn(checkIn);
  const localDate = getLocalDateKey(new Date(now));
  if (
    state.migrationBlockedUntilDate &&
    localDate < state.migrationBlockedUntilDate
  ) {
    return 'migrationLocked';
  }

  const nextAvailableAt = getNextAvailableAt(state);
  const streakExpiresAt = getStreakExpiresAt(state);
  if (!nextAvailableAt || !streakExpiresAt) return 'available';
  if (now < nextAvailableAt) return 'locked';
  if (now >= streakExpiresAt) return 'expired';
  return 'available';
}

export function getNextCheckInDay(checkIn, now = Date.now()) {
  const state = normalizeCheckIn(checkIn);
  return getCheckInStatus(state, now) === 'expired' ? 1 : state.streakDay + 1;
}

export function getCooldownRemaining(checkIn, now = Date.now()) {
  const nextAvailableAt = getNextAvailableAt(checkIn);
  return Math.max(0, (nextAvailableAt ?? now) - now);
}

export function applyDailyCheckInClaim(progress, now = Date.now()) {
  const checkIn = normalizeCheckIn(progress.dailyCheckIn);
  const status = getCheckInStatus(checkIn, now);
  if (status !== 'available' && status !== 'expired') return progress;

  const streakDay = status === 'expired' ? 1 : checkIn.streakDay + 1;
  const reward = getCheckInReward(streakDay);
  return {
    ...progress,
    coins: Math.max(0, (progress.coins ?? 0) + reward),
    dailyCheckIn: {
      ...checkIn,
      schemaVersion: CHECK_IN_SCHEMA_VERSION,
      streakDay,
      lastClaimAt: now,
      migrationBlockedUntilDate: null,
      lifetimeClaims: checkIn.lifetimeClaims + 1,
    },
  };
}

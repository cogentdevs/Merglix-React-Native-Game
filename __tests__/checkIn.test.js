import {
  CHECK_IN_MAX_COINS,
  CHECK_IN_SCHEMA_VERSION,
  CHECK_IN_STREAK_EXPIRY_MS,
  CHECK_IN_COOLDOWN_MS,
  INITIAL_CHECK_IN,
  applyDailyCheckInClaim,
  getCheckInReward,
  getCheckInStatus,
  getNextAvailableAt,
  getStreakExpiresAt,
  migrateDailyCheckIn,
  normalizeCheckIn,
} from '../src/game/checkIn';

const HOUR = 60 * 60 * 1000;
const CLAIMED_AT = new Date(2026, 0, 10, 10, 0, 0).getTime();

function progress(overrides = {}) {
  return {
    coins: 0,
    level: 42,
    levelStars: {41: 3},
    dailyCheckIn: {...INITIAL_CHECK_IN},
    ...overrides,
  };
}

test('uses the approved progressive reward calculation with a 165-coin cap', () => {
  expect(getCheckInReward(1)).toBe(20);
  expect(getCheckInReward(2)).toBe(25);
  expect(getCheckInReward(7)).toBe(50);
  expect(getCheckInReward(17)).toBe(100);
  expect(getCheckInReward(29)).toBe(160);
  expect(getCheckInReward(30)).toBe(165);
  expect(getCheckInReward(31)).toBe(165);
  expect(getCheckInReward(100)).toBe(165);
  expect(CHECK_IN_MAX_COINS).toBe(165);
});

test('a first claim awards Day 1 and immediately starts a 24-hour cooldown', () => {
  const claimed = applyDailyCheckInClaim(progress(), CLAIMED_AT);
  expect(claimed.coins).toBe(20);
  expect(claimed.dailyCheckIn.streakDay).toBe(1);
  expect(claimed.dailyCheckIn.lastClaimAt).toBe(CLAIMED_AT);
  expect(getNextAvailableAt(claimed.dailyCheckIn)).toBe(CLAIMED_AT + CHECK_IN_COOLDOWN_MS);
  expect(getStreakExpiresAt(claimed.dailyCheckIn)).toBe(CLAIMED_AT + CHECK_IN_STREAK_EXPIRY_MS);
  expect(getCheckInStatus(claimed.dailyCheckIn, CLAIMED_AT + 23 * HOUR + 59)).toBe('locked');
  expect(applyDailyCheckInClaim(claimed, CLAIMED_AT + HOUR)).toBe(claimed);
});

test('the 24-to-48-hour window continues the streak', () => {
  const first = applyDailyCheckInClaim(progress(), CLAIMED_AT);
  expect(getCheckInStatus(first.dailyCheckIn, CLAIMED_AT + 24 * HOUR)).toBe('available');

  const second = applyDailyCheckInClaim(first, CLAIMED_AT + 25 * HOUR);
  expect(second.coins).toBe(45);
  expect(second.dailyCheckIn.streakDay).toBe(2);
  expect(second.dailyCheckIn.lastClaimAt).toBe(CLAIMED_AT + 25 * HOUR);
});

test('the streak expires at exactly 48 hours and restarts at Day 1 without deducting coins', () => {
  const claimed = progress({
    coins: 700,
    dailyCheckIn: {...INITIAL_CHECK_IN, streakDay: 17, lastClaimAt: CLAIMED_AT},
  });
  expect(getCheckInStatus(claimed.dailyCheckIn, CLAIMED_AT + 48 * HOUR - 1)).toBe('available');
  expect(getCheckInStatus(claimed.dailyCheckIn, CLAIMED_AT + 48 * HOUR)).toBe('expired');

  const restarted = applyDailyCheckInClaim(claimed, CLAIMED_AT + 48 * HOUR);
  expect(restarted.coins).toBe(720);
  expect(restarted.dailyCheckIn.streakDay).toBe(1);
  expect(restarted.level).toBe(42);
  expect(restarted.levelStars).toEqual({41: 3});
});

test('the streak level can continue past Day 30 while its reward stays capped', () => {
  const dayThirty = progress({
    dailyCheckIn: {...INITIAL_CHECK_IN, streakDay: 29, lastClaimAt: CLAIMED_AT},
  });
  const claimedThirty = applyDailyCheckInClaim(dayThirty, CLAIMED_AT + 24 * HOUR);
  expect(claimedThirty.coins).toBe(165);
  expect(claimedThirty.dailyCheckIn.streakDay).toBe(30);

  const dayHundred = progress({
    dailyCheckIn: {...INITIAL_CHECK_IN, streakDay: 99, lastClaimAt: CLAIMED_AT},
  });
  const claimedHundred = applyDailyCheckInClaim(dayHundred, CLAIMED_AT + 24 * HOUR);
  expect(claimedHundred.coins).toBe(165);
  expect(claimedHundred.dailyCheckIn.streakDay).toBe(100);
});

test('legacy users who claimed on migration day are deferred without a duplicate wallet credit', () => {
  const today = getLocalDate(CLAIMED_AT);
  const legacy = {
    currentDayIndex: 6,
    lastClaimedDayIndex: 5,
    lastClaimDate: today,
    cycleLocked: false,
    lifetimeClaims: 6,
  };
  const migrated = migrateDailyCheckIn(legacy, CLAIMED_AT);
  expect(migrated.schemaVersion).toBe(CHECK_IN_SCHEMA_VERSION);
  expect(migrated.streakDay).toBe(0);
  expect(migrated.migrationBlockedUntilDate).toBe('2026-01-11');
  expect(getCheckInStatus(migrated, CLAIMED_AT)).toBe('migrationLocked');
  expect(applyDailyCheckInClaim(progress({coins: 400, dailyCheckIn: migrated}), CLAIMED_AT).coins)
    .toBe(400);
  expect(getCheckInStatus(migrated, new Date(2026, 0, 11, 0, 1).getTime())).toBe('available');
});

test('migration is idempotent and preserves unrelated progress data', () => {
  const legacy = {lastClaimDate: '2026-01-08', currentDayIndex: 4, lifetimeClaims: 4};
  const once = migrateDailyCheckIn(legacy, CLAIMED_AT);
  const twice = migrateDailyCheckIn(once, CLAIMED_AT + HOUR);
  expect(twice).toEqual(once);

  const saved = progress({coins: 321, dailyCheckIn: once});
  expect(normalizeCheckIn(saved.dailyCheckIn)).toEqual(once);
  expect(saved.coins).toBe(321);
  expect(saved.level).toBe(42);
});

test('a legacy Day 7 locked user safely transitions to a new available Day 1 streak', () => {
  const migrated = migrateDailyCheckIn({
    currentDayIndex: 6,
    lastClaimedDayIndex: 6,
    lastClaimDate: '2026-01-09',
    cycleLocked: true,
    gameplayCoinsSinceCycle: 30,
  }, CLAIMED_AT);
  expect(getCheckInStatus(migrated, CLAIMED_AT)).toBe('available');
  const claimed = applyDailyCheckInClaim(progress({dailyCheckIn: migrated}), CLAIMED_AT);
  expect(claimed.coins).toBe(20);
  expect(claimed.dailyCheckIn.streakDay).toBe(1);
});

test('persisted timestamp state remains locked after an app restart and calendar midnight does not reset it', () => {
  const claimed = applyDailyCheckInClaim(progress(), CLAIMED_AT);
  const restored = normalizeCheckIn(JSON.parse(JSON.stringify(claimed.dailyCheckIn)));
  expect(getCheckInStatus(restored, CLAIMED_AT + 8 * HOUR)).toBe('locked');
  expect(getCheckInStatus(restored, CLAIMED_AT + 24 * HOUR)).toBe('available');
  expect(applyDailyCheckInClaim(claimed, CLAIMED_AT + 2 * HOUR)).toBe(claimed);
});

function getLocalDate(timestamp) {
  const date = new Date(timestamp);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

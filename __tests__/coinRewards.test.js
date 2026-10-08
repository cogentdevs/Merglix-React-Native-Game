import {
  MATCH_REWARD,
  applyGameplayMatchClaim,
  applyRewardCenterClaim,
  applyRewardedAdClaim,
  getLevelCompletionReward,
  getRewardBreakdown,
} from '../src/game/coinRewards';

test('a level-complete rewarded ad doubles that attempt reward only once', () => {
  const progress = {
    coins: 40,
    rewardClaims: ['level-1-attempt'],
    completionRewards: {'level-1-attempt': 40},
    rewardedAdClaims: {},
  };

  const rewarded = applyRewardedAdClaim(progress, 'level-1-attempt', 1234);
  expect(rewarded.coins).toBe(80);
  expect(rewarded.rewardedAdClaims['level-1-attempt']).toEqual({
    reward: 40,
    claimedAt: 1234,
  });
  expect(applyRewardedAdClaim(rewarded, 'level-1-attempt')).toBe(rewarded);
});

test('a reward-center ad grants its configured daily reward only once', () => {
  const progress = {coins: 5, rewardCenterClaims: {}};
  const rewarded = applyRewardCenterClaim(progress, '2026-09-10:bonus-30', 30, 5678);
  expect(rewarded.coins).toBe(35);
  expect(rewarded.rewardCenterClaims['2026-09-10:bonus-30']).toEqual({
    reward: 30,
    claimedAt: 5678,
  });
  expect(applyRewardCenterClaim(rewarded, '2026-09-10:bonus-30', 30)).toBe(rewarded);
});

test('reward-center rejects an amount that is not configured', () => {
  const progress = {coins: 0, rewardCenterClaims: {}};
  expect(applyRewardCenterClaim(progress, 'invalid', 999)).toBe(progress);
});

test('an uncompleted or unknown attempt cannot claim ad coins', () => {
  const progress = {
    coins: 0,
    rewardClaims: [],
    completionRewards: {},
    rewardedAdClaims: {},
  };

  expect(applyRewardedAdClaim(progress, 'unknown')).toBe(progress);
});

test('match coins are saved immediately, gate-aware, and duplicate-safe', () => {
  const progress = {
    coins: 10,
    matchRewardClaims: [],
    dailyCheckIn: {cycleLocked: true, gameplayCoinsSinceCycle: 20},
  };
  const rewarded = applyGameplayMatchClaim(progress, 'attempt-1:match:1', 5);
  expect(rewarded.coins).toBe(15);
  expect(rewarded.dailyCheckIn.gameplayCoinsSinceCycle).toBe(25);
  expect(applyGameplayMatchClaim(rewarded, 'attempt-1:match:1', 5)).toBe(rewarded);
});

describe('coin rewards', () => {
  test('awards five coins for every confirmed match group', () => {
    expect(MATCH_REWARD).toBe(5);
    expect(getRewardBreakdown({level: 1, matchGroups: 4})).toEqual({
      matchCoins: 20,
      completionCoins: 25,
      totalCoins: 45,
    });
  });

  test('uses the approved completion reward plan through Level 200', () => {
    expect(getLevelCompletionReward(10)).toBe(25);
    expect(getLevelCompletionReward(11)).toBe(30);
    expect(getLevelCompletionReward(21)).toBe(35);
    expect(getLevelCompletionReward(31)).toBe(40);
    expect(getLevelCompletionReward(41)).toBe(45);
    expect(getLevelCompletionReward(51)).toBe(50);
    expect(getLevelCompletionReward(61)).toBe(55);
    expect(getLevelCompletionReward(71)).toBe(60);
    expect(getLevelCompletionReward(81)).toBe(65);
    expect(getLevelCompletionReward(91)).toBe(70);
    expect(getLevelCompletionReward(100)).toBe(70);
    expect(getLevelCompletionReward(101)).toBe(75);
    expect(getLevelCompletionReward(111)).toBe(80);
    expect(getLevelCompletionReward(121)).toBe(85);
    expect(getLevelCompletionReward(131)).toBe(90);
    expect(getLevelCompletionReward(141)).toBe(95);
    expect(getLevelCompletionReward(151)).toBe(100);
    expect(getLevelCompletionReward(161)).toBe(105);
    expect(getLevelCompletionReward(171)).toBe(110);
    expect(getLevelCompletionReward(181)).toBe(115);
    expect(getLevelCompletionReward(191)).toBe(120);
    expect(getLevelCompletionReward(200)).toBe(120);
  });

  test('halves only the completion bonus on replay', () => {
    expect(getRewardBreakdown({level: 1, matchGroups: 4, replay: true})).toEqual({
      matchCoins: 20,
      completionCoins: 12,
      totalCoins: 32,
    });
  });
});

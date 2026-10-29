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

test('match coins are saved immediately, do not affect check-in state, and are duplicate-safe', () => {
  const progress = {
    coins: 10,
    matchRewardClaims: [],
    dailyCheckIn: {cycleLocked: true, gameplayCoinsSinceCycle: 20},
  };
  const rewarded = applyGameplayMatchClaim(progress, 'attempt-1:match:1', 5);
  expect(rewarded.coins).toBe(15);
  expect(rewarded.dailyCheckIn.gameplayCoinsSinceCycle).toBe(20);
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
    expect(getLevelCompletionReward(201)).toBe(125);
    expect(getLevelCompletionReward(210)).toBe(125);
    expect(getLevelCompletionReward(211)).toBe(130);
    expect(getLevelCompletionReward(221)).toBe(135);
    expect(getLevelCompletionReward(230)).toBe(135);
    expect(getLevelCompletionReward(231)).toBe(140);
    expect(getLevelCompletionReward(240)).toBe(140);
    expect(getLevelCompletionReward(241)).toBe(145);
    expect(getLevelCompletionReward(251)).toBe(150);
    expect(getLevelCompletionReward(260)).toBe(150);
    expect(getLevelCompletionReward(261)).toBe(155);
    expect(getLevelCompletionReward(270)).toBe(155);
    expect(getLevelCompletionReward(271)).toBe(160);
    expect(getLevelCompletionReward(280)).toBe(160);
    expect(getLevelCompletionReward(281)).toBe(165);
    expect(getLevelCompletionReward(290)).toBe(165);
    expect(getLevelCompletionReward(291)).toBe(170);
    expect(getLevelCompletionReward(300)).toBe(170);
    expect(getLevelCompletionReward(301)).toBe(175);
    expect(getLevelCompletionReward(308)).toBe(175);
    expect(getLevelCompletionReward(310)).toBe(175);
    expect(getLevelCompletionReward(311)).toBe(180);
    expect(getLevelCompletionReward(312)).toBe(180);
    expect(getLevelCompletionReward(316)).toBe(180);
    expect(getLevelCompletionReward(320)).toBe(180);
    expect(getLevelCompletionReward(321)).toBe(185);
    expect(getLevelCompletionReward(324)).toBe(185);
    expect(getLevelCompletionReward(328)).toBe(185);
    expect(getLevelCompletionReward(330)).toBe(185);
    expect(getLevelCompletionReward(331)).toBe(190);
    expect(getLevelCompletionReward(332)).toBe(190);
    expect(getLevelCompletionReward(336)).toBe(190);
    expect(getLevelCompletionReward(340)).toBe(190);
    expect(getLevelCompletionReward(341)).toBe(195);
    expect(getLevelCompletionReward(350)).toBe(195);
    expect(getLevelCompletionReward(351)).toBe(200);
    expect(getLevelCompletionReward(360)).toBe(200);
    expect(getLevelCompletionReward(361)).toBe(205);
    expect(getLevelCompletionReward(370)).toBe(205);
    expect(getLevelCompletionReward(371)).toBe(210);
    expect(getLevelCompletionReward(375)).toBe(210);
    expect(getLevelCompletionReward(381)).toBe(215);
    expect(getLevelCompletionReward(385)).toBe(215);
    expect(getLevelCompletionReward(391)).toBe(220);
    expect(getLevelCompletionReward(395)).toBe(220);
    expect(getLevelCompletionReward(400)).toBe(220);
    expect(getLevelCompletionReward(401)).toBe(225);
    expect(getLevelCompletionReward(410)).toBe(225);
    expect(getLevelCompletionReward(411)).toBe(230);
    expect(getLevelCompletionReward(420)).toBe(230);
  });

  test('halves only the completion bonus on replay', () => {
    expect(getRewardBreakdown({level: 1, matchGroups: 4, replay: true})).toEqual({
      matchCoins: 20,
      completionCoins: 12,
      totalCoins: 32,
    });
  });
});

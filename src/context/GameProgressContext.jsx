import React, {createContext, useCallback, useContext, useEffect, useState} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {INITIAL_BOOSTERS} from '../game/boosterConfig';
import {applyGameplayMatchClaim, applyRewardCenterClaim, applyRewardedAdClaim, getRewardBreakdown} from '../game/coinRewards';
import {applyDailyCheckInClaim, INITIAL_CHECK_IN, migrateDailyCheckIn} from '../game/checkIn';
import {applyCompletedRewardAd, INITIAL_HOURLY_AD_REWARD} from '../game/hourlyAdRewards';
import {applySuccessfulBoosterUse, INITIAL_BOOSTER_STATE, markBoosterUnlockSeen} from '../game/boosterEconomy';

const STORAGE_KEY = '@merglix/game-progress';
const INITIAL_SETTINGS = {sound: true, music: true, vibration: true};
const INITIAL_PROGRESS = {
  coins: 0,
  level: 1,
  levelStars: {},
  levelScores: {},
  rewardClaims: [],
  matchRewardClaims: [],
  completionRewards: {},
  adRewardClaims: [],
  rewardedAdClaims: {},
  rewardCenterClaims: {},
  dailyCheckIn: INITIAL_CHECK_IN,
  hourlyAdReward: INITIAL_HOURLY_AD_REWARD,
  boosters: INITIAL_BOOSTERS,
  boosterState: INITIAL_BOOSTER_STATE,
  settings: INITIAL_SETTINGS,
};
const GameProgressContext = createContext(null);

export function GameProgressProvider({children}) {
  const [progress, setProgress] = useState(INITIAL_PROGRESS);
  const [isRewardedAdShowing, setRewardedAdShowing] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then(value => {
        if (value) {
          const saved = JSON.parse(value);
          const completedLevels = Object.entries(saved.levelStars ?? {})
            .filter(([, stars]) => stars > 0)
            .map(([levelNumber]) => Number(levelNumber));
          const unlockedFromStars = completedLevels.length > 0
            ? Math.max(...completedLevels) + 1
            : 1;
          const dailyCheckIn = migrateDailyCheckIn(saved.dailyCheckIn);
          const hydratedProgress = {
            ...INITIAL_PROGRESS,
            ...saved,
            level: Math.max(saved.level ?? 1, unlockedFromStars),
            boosters: {...INITIAL_BOOSTERS, ...saved.boosters},
            boosterState: {...INITIAL_BOOSTER_STATE, ...saved.boosterState},
            settings: {...INITIAL_SETTINGS, ...saved.settings},
            dailyCheckIn,
            hourlyAdReward: {...INITIAL_HOURLY_AD_REWARD, ...saved.hourlyAdReward},
          };
          setProgress(hydratedProgress);
          AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(hydratedProgress)).catch(() => {});
        }
      })
      .catch(() => {});
  }, []);

  const updateProgress = useCallback(updater => {
    setProgress(current => {
      const next = typeof updater === 'function' ? updater(current) : updater;
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const addCoins = useCallback(
    amount => updateProgress(current => ({...current, coins: current.coins + amount})),
    [updateProgress],
  );

  const saveLevelStars = useCallback(
    (levelNumber, stars) =>
      updateProgress(current => ({
        ...current,
        levelStars: {
          ...current.levelStars,
          [levelNumber]: Math.max(current.levelStars?.[levelNumber] ?? 0, stars),
        },
        level: Math.max(current.level, levelNumber + 1),
      })),
    [updateProgress],
  );

  const completeLevel = useCallback(
    ({attemptId, level, matchGroups, score, stars}) => {
      updateProgress(current => {
        if (current.rewardClaims?.includes(attemptId)) {
          return current;
        }

        const replay = Boolean(current.levelStars?.[level]);
        const reward = getRewardBreakdown({level, matchGroups, replay});
        const rewardClaims = [...(current.rewardClaims ?? []), attemptId].slice(-100);
        const completionRewards = Object.fromEntries(
          rewardClaims.map(id => [
            id,
            id === attemptId
              ? reward.totalCoins
              : current.completionRewards?.[id] ?? 0,
          ]),
        );

        const completedProgress = {
          ...current,
          coins: Math.max(0, current.coins + reward.completionCoins),
          level: Math.max(current.level, level + 1),
          levelStars: {
            ...current.levelStars,
            [level]: Math.max(current.levelStars?.[level] ?? 0, stars),
          },
          levelScores: {
            ...(current.levelScores ?? {}),
            [level]: Math.max(current.levelScores?.[level] ?? 0, score ?? 0),
          },
          rewardClaims,
          completionRewards,
        };
        return completedProgress;
      });
    },
    [updateProgress],
  );

  const awardMatchCoins = useCallback(
    ({attemptId, matchSequence, amount}) => {
      updateProgress(current => {
        const claimId = `${attemptId}:match:${matchSequence}`;
        return applyGameplayMatchClaim(current, claimId, amount);
      });
    },
    [updateProgress],
  );

  const claimRewardedAd = useCallback(
    attemptId => {
      updateProgress(current => applyRewardedAdClaim(current, attemptId));
    },
    [updateProgress],
  );

  const claimRewardCenterAd = useCallback(
    (claimId, amount) => {
      updateProgress(current => applyRewardCenterClaim(current, claimId, amount));
    },
    [updateProgress],
  );

  const claimDailyCheckIn = useCallback(
    now => updateProgress(current => applyDailyCheckInClaim(current, now)),
    [updateProgress],
  );

  const completeHourlyRewardAd = useCallback(
    (completedAt = Date.now()) =>
      updateProgress(current => applyCompletedRewardAd(current, completedAt)),
    [updateProgress],
  );

  const updateSettings = useCallback(
    values => updateProgress(current => ({...current, settings: {...current.settings, ...values}})),
    [updateProgress],
  );

  const consumeBooster = useCallback(
    name => updateProgress(current => {
      const quantity = current.boosters?.[name] ?? 0;
      if (quantity <= 0) return current;
      return {
        ...current,
        boosters: {...current.boosters, [name]: quantity - 1},
      };
    }),
    [updateProgress],
  );

  const recordSuccessfulBoosterUse = useCallback(
    name => updateProgress(current => applySuccessfulBoosterUse(current, name)),
    [updateProgress],
  );

  const dismissBoosterUnlock = useCallback(
    name => updateProgress(current => markBoosterUnlockSeen(current, name)),
    [updateProgress],
  );

  return (
    <GameProgressContext.Provider value={{...progress, addCoins, awardMatchCoins, claimDailyCheckIn, claimRewardCenterAd, claimRewardedAd, completeHourlyRewardAd, completeLevel, consumeBooster, dismissBoosterUnlock, isRewardedAdShowing, recordSuccessfulBoosterUse, saveLevelStars, setRewardedAdShowing, updateProgress, updateSettings}}>
      {children}
    </GameProgressContext.Provider>
  );
}

export function useGameProgress() {
  const context = useContext(GameProgressContext);
  if (!context) {
    throw new Error('useGameProgress must be used inside GameProgressProvider');
  }
  return context;
}

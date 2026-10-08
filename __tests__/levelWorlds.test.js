import {
  getWorldLevels,
  isLevelCompleted,
  isWorldCompleted,
  LEVELS_PER_WORLD,
} from '../src/game/levelWorlds';

describe('level worlds', () => {
  test('each world contains exactly 50 sequential levels', () => {
    expect(LEVELS_PER_WORLD).toBe(50);
    expect(getWorldLevels(1)).toEqual(Array.from({length: 50}, (_, index) => index + 1));
    expect(getWorldLevels(2)).toEqual(Array.from({length: 50}, (_, index) => index + 51));
    expect(getWorldLevels(3)).toEqual(Array.from({length: 50}, (_, index) => index + 101));
    expect(getWorldLevels(4)).toEqual(Array.from({length: 50}, (_, index) => index + 151));
  });

  test('World 1 remains incomplete until every one of its 50 levels is complete', () => {
    const incomplete = Object.fromEntries(
      Array.from({length: 49}, (_, index) => [index + 1, 3]),
    );
    expect(isWorldCompleted(incomplete, 1)).toBe(false);

    const complete = {...incomplete, 50: 1};
    expect(isWorldCompleted(complete, 1)).toBe(true);
  });

  test('only levels with a saved completion star count as completed', () => {
    expect(isLevelCompleted({1: 3}, 1)).toBe(true);
    expect(isLevelCompleted({1: 0}, 1)).toBe(false);
    expect(isLevelCompleted({}, 1)).toBe(false);
  });
});

import {shouldShowInterstitialAfterLevel} from '../src/game/interstitialAdPolicy';

describe('automatic interstitial level policy', () => {
  test.each([
    [0, false], [-1, false], ['invalid', false],
    [4, false], [5, true], [50, true], [51, false], [54, true], [98, true], [99, false], [100, false],
    [101, false], [103, true], [148, true], [149, false], [150, false],
    [151, false], [152, true], [200, true], [201, true], [500, true],
  ])('level %p returns %p', (level, expected) => {
    expect(shouldShowInterstitialAfterLevel(level)).toBe(expected);
  });
});

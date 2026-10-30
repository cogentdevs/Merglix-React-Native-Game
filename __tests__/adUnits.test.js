import {TestIds} from 'react-native-google-mobile-ads';
import {resolveGameplayBannerAdUnitId, resolveInterstitialAdUnitId} from '../src/config/adUnits';

describe('gameplay banner ad unit', () => {
  test('uses Google test banner inventory in development', () => {
    expect(resolveGameplayBannerAdUnitId({
      isDevelopment: true,
      productionAdUnitId: 'ca-app-pub-production/banner',
    })).toBe(TestIds.BANNER);
  });

  test('uses the configured production banner ID outside development', () => {
    expect(resolveGameplayBannerAdUnitId({
      isDevelopment: false,
      productionAdUnitId: '  ca-app-pub-production/banner  ',
    })).toBe('ca-app-pub-production/banner');
  });

  test('returns no ad unit when production configuration is absent', () => {
    expect(resolveGameplayBannerAdUnitId({
      isDevelopment: false,
      productionAdUnitId: undefined,
    })).toBe('');
  });
});

describe('automatic interstitial ad unit', () => {
  test('uses Google test interstitial inventory in development', () => {
    expect(resolveInterstitialAdUnitId({
      isDevelopment: true,
      productionAdUnitId: 'ca-app-pub-production/interstitial',
    })).toBe(TestIds.INTERSTITIAL);
  });

  test('uses the configured production interstitial ID outside development', () => {
    expect(resolveInterstitialAdUnitId({
      isDevelopment: false,
      productionAdUnitId: '  ca-app-pub-production/interstitial  ',
    })).toBe('ca-app-pub-production/interstitial');
  });

  test('returns no interstitial unit when production configuration is absent', () => {
    expect(resolveInterstitialAdUnitId({
      isDevelopment: false,
      productionAdUnitId: undefined,
    })).toBe('');
  });
});

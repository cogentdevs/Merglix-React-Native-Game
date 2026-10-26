import {TestIds} from 'react-native-google-mobile-ads';
import {resolveGameplayBannerAdUnitId} from '../src/config/adUnits';

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

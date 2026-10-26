import {TestIds} from 'react-native-google-mobile-ads';

function normalizeAdUnitId(value) {
  return typeof value === 'string' ? value.trim() : '';
}

export function resolveGameplayBannerAdUnitId({isDevelopment, productionAdUnitId}) {
  if (isDevelopment) return TestIds.BANNER;
  return normalizeAdUnitId(productionAdUnitId);
}

const runtime = typeof global === 'undefined' ? {} : global;

export const GAMEPLAY_BANNER_AD_UNIT_ID = resolveGameplayBannerAdUnitId({
  isDevelopment: runtime.__DEV__ === true,
  productionAdUnitId: runtime.process?.env?.MERGLIX_GAMEPLAY_BANNER_AD_UNIT_ID,
});

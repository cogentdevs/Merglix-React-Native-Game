import React, {memo, useState} from 'react';
import {StyleSheet, View, useWindowDimensions} from 'react-native';
import {BannerAd, BannerAdSize} from 'react-native-google-mobile-ads';
import {GAMEPLAY_BANNER_AD_UNIT_ID} from '../../config/adUnits';

function GameplayBannerAd() {
  const {width} = useWindowDimensions();
  const [failedToLoad, setFailedToLoad] = useState(false);
  const canLoadAd = Boolean(GAMEPLAY_BANNER_AD_UNIT_ID) && !failedToLoad;
  const reservedHeight = width >= 728 ? 90 : 50;

  return (
    <View accessibilityLabel="Gameplay banner advertisement" style={[styles.slot, {height: reservedHeight}]}>
      {canLoadAd ? (
        <BannerAd
          onAdFailedToLoad={() => setFailedToLoad(true)}
          requestOptions={{requestNonPersonalizedAdsOnly: true}}
          size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
          unitId={GAMEPLAY_BANNER_AD_UNIT_ID}
        />
      ) : null}
    </View>
  );
}

export default memo(GameplayBannerAd);

const styles = StyleSheet.create({
  slot: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
});

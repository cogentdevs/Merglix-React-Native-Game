import React, {memo} from 'react';
import {Image, Pressable, StyleSheet, Text, View} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {responsiveFontSize as rf, responsiveHeight as hp, responsiveWidth as wp} from 'react-native-responsive-dimensions';
import {BOOSTER_CONFIG} from '../../game/boosterConfig';
import {isBoosterUnlocked} from '../../game/boosterEconomy';

const coin3d = require('../../assets/coin-3d.png');
const ASSETS = {
  magnet: require('../../assets/merglix game elments/magnet element.png'),
  shuffle: require('../../assets/merglix game elments/swipe element.png'),
  freeze: require('../../assets/merglix game elments/3rd element.png'),
};

function BoosterButton({active, busy, level, name, onPress, uses}) {
  const config = BOOSTER_CONFIG[name];
  const unlocked = isBoosterUnlocked(name, level);
  const remaining = Math.max(0, config.maxUsesPerAttempt - (uses ?? 0));
  const atLimit = remaining === 0;
  const disabled = busy || active || atLimit;
  const label = name.toUpperCase();

  return (
    <Pressable accessibilityLabel={unlocked ? `${label}, ${remaining} uses left` : `${label}, unlocks at level ${config.unlockLevel}`}
      accessibilityRole="button" accessibilityState={{disabled, selected: active}}
      disabled={disabled} onPress={onPress}
      style={({pressed}) => [styles.buttonDepth, active && styles.activeDepth, disabled && !active && styles.disabled, !unlocked && styles.lockedDepth, pressed && styles.pressed]}>
      <View style={[styles.button, active && styles.activeButton, !unlocked && styles.lockedButton]}>
        <Image source={ASSETS[name]} resizeMode="contain" style={[styles.iconImage, !unlocked && styles.lockedAsset]} />
        <View style={styles.copy}>
          <Text numberOfLines={1} style={styles.label}>{label}</Text>
          {!unlocked ? (
            <View style={styles.detailRow}><MaterialCommunityIcons color="#EEE7F4" name="lock" size={rf(1.15)} /><Text style={styles.lockText}>LEVEL {config.unlockLevel}</Text></View>
          ) : atLimit ? <Text style={styles.usedText}>USED</Text>
            : <View style={styles.detailRow}><Image source={coin3d} resizeMode="contain" style={styles.coin} /><Text style={styles.cost}>{config.coinCost}</Text></View>}
        </View>
        {unlocked && !atLimit ? <View style={styles.badge}><Text style={styles.badgeText}>{remaining} LEFT</Text></View> : null}
      </View>
    </Pressable>
  );
}

function BoosterBar({busy, freezeActive, level, magnetActive,
  onFreeze, onMagnet, onShuffle, shuffleActive, uses, hidden = false}) {
  if (hidden) return null;

  return (
    <View style={styles.bar}>
      <BoosterButton active={magnetActive} busy={busy} level={level} name="magnet" onPress={onMagnet} uses={uses.magnet} />
      <BoosterButton active={shuffleActive} busy={busy} level={level} name="shuffle" onPress={onShuffle} uses={uses.shuffle} />
      <BoosterButton active={freezeActive} busy={busy} level={level} name="freeze" onPress={onFreeze} uses={uses.freeze} />
    </View>
  );
}

export default memo(BoosterBar);

const styles = StyleSheet.create({
  bar: {width: Math.min(wp(94), hp(62)), height: Math.min(hp(10.5), wp(22)), marginBottom: hp(0.8), paddingHorizontal: wp(1.5), gap: wp(1.5), borderRadius: wp(4.5), flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#4D1D83', borderWidth: wp(0.45), borderColor: '#9656D1', elevation: 8},
  buttonDepth: {flex: 1, height: '84%', paddingBottom: hp(0.55), borderRadius: wp(3.2), backgroundColor: '#35115F'},
  button: {flex: 1, paddingHorizontal: wp(1), borderRadius: wp(3.2), flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: wp(0.4), backgroundColor: '#7839BA', borderWidth: wp(0.3), borderColor: '#A873DA'},
  activeDepth: {backgroundColor: '#147DA7'}, activeButton: {backgroundColor: '#25B8E4', borderColor: '#CFF8FF'},
  lockedDepth: {backgroundColor: '#403848'}, lockedButton: {backgroundColor: '#69616E', borderColor: '#8B838F'}, lockedAsset: {opacity: 0.4},
  iconImage: {width: Math.min(wp(10), hp(5.5)), height: Math.min(wp(10), hp(5.5))},
  copy: {flex: 1, alignItems: 'center'}, label: {color: '#FFFFFF', fontSize: rf(1.05), fontWeight: '900'},
  detailRow: {marginTop: hp(0.2), flexDirection: 'row', alignItems: 'center', justifyContent: 'center'},
  lockText: {color: '#EEE7F4', fontSize: rf(0.85), fontWeight: '900'}, usedText: {color: '#D4CDD8', fontSize: rf(0.95), fontWeight: '900'},
  coin: {width: wp(4), height: wp(4), maxWidth: 19, maxHeight: 19}, cost: {color: '#FFE052', fontSize: rf(1.05), fontWeight: '900'},
  badge: {position: 'absolute', right: -wp(0.8), top: -hp(0.75), minWidth: wp(9), height: hp(2.7), paddingHorizontal: wp(1), borderRadius: wp(3), alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFD52A', borderWidth: wp(0.25), borderColor: '#FFF3A5'},
  badgeText: {color: '#4B246F', fontSize: rf(0.88), fontWeight: '900'},
  disabled: {opacity: 0.5}, pressed: {opacity: 0.85, transform: [{scale: 0.95}]},
});

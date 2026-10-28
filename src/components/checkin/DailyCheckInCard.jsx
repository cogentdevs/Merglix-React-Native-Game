import React, {useEffect, useMemo, useRef, useState} from 'react';
import {Animated, AppState, Image, Pressable, StyleSheet, Text, View} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {
  responsiveWidth as wp,
  responsiveHeight as hp,
  responsiveFontSize as rf,
} from 'react-native-responsive-dimensions';
import {useGameProgress} from '../../context/GameProgressContext';
import {
  getCheckInReward,
  getCooldownRemaining,
  getCheckInStatus,
  getNextCheckInDay,
  normalizeCheckIn,
} from '../../game/checkIn';
import useGameSounds from '../../hooks/useGameSounds';

const coin3d = require('../../assets/coin-3d.png');

export default function DailyCheckInCard() {
  const {claimDailyCheckIn, dailyCheckIn} = useGameProgress();
  const playSound = useGameSounds();
  const [now, setNow] = useState(() => Date.now());
  const [claiming, setClaiming] = useState(false);
  const [claimedReward, setClaimedReward] = useState(null);
  const claimLock = useRef(false);
  const pulse = useRef(new Animated.Value(1)).current;
  const float = useRef(new Animated.Value(0)).current;
  const success = useRef(new Animated.Value(0)).current;
  const checkIn = useMemo(() => normalizeCheckIn(dailyCheckIn), [dailyCheckIn]);
  const status = getCheckInStatus(checkIn, now);
  const nextDay = getNextCheckInDay(checkIn, now);
  const reward = getCheckInReward(nextDay);
  const cooldownRemaining = getCooldownRemaining(checkIn, now);
  const canClaim = status === 'available' || status === 'expired';

  useEffect(() => {
    const refreshNow = () => setNow(Date.now());
    const interval = setInterval(refreshNow, 1000);
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') refreshNow();
    });
    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    if (!canClaim) {
      pulse.setValue(1);
      return undefined;
    }
    const animation = Animated.loop(Animated.sequence([
      Animated.timing(pulse, {toValue: 1.025, duration: 850, useNativeDriver: true}),
      Animated.timing(pulse, {toValue: 1, duration: 850, useNativeDriver: true}),
    ]));
    animation.start();
    return () => animation.stop();
  }, [canClaim, pulse]);

  useEffect(() => {
    const animation = Animated.loop(Animated.sequence([
      Animated.timing(float, {toValue: -hp(0.7), duration: 1100, useNativeDriver: true}),
      Animated.timing(float, {toValue: 0, duration: 1100, useNativeDriver: true}),
    ]));
    animation.start();
    return () => animation.stop();
  }, [float]);

  const claim = () => {
    if (claimLock.current || !canClaim) return;
    claimLock.current = true;
    setClaiming(true);
    setClaimedReward(reward);
    claimDailyCheckIn(Date.now());
    playSound('coins');
    success.setValue(0);
    Animated.sequence([
      Animated.spring(success, {toValue: 1, friction: 4, useNativeDriver: true}),
      Animated.delay(450),
      Animated.timing(success, {toValue: 0, duration: 220, useNativeDriver: true}),
    ]).start(() => {
      claimLock.current = false;
      setClaiming(false);
      setClaimedReward(null);
    });
  };

  const formatCountdown = milliseconds => {
    const totalSeconds = Math.ceil(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };
  const locked = status === 'locked' || status === 'migrationLocked';
  const expired = status === 'expired';
  const buttonLabel = locked ? 'COME BACK LATER' : expired ? 'RESTART STREAK' : 'CLAIM';
  const stateText = status === 'migrationLocked'
    ? 'New streak available tomorrow'
    : locked
      ? `Next check-in in ${formatCountdown(cooldownRemaining)}`
      : expired
        ? 'Streak expired — restart at Day 1'
        : `Day ${nextDay} reward is ready`;

  return (
    <Animated.View style={[styles.cardDepth, expired && styles.grandDepth, {transform: [{scale: pulse}]}]}>
      <View style={[styles.card, locked && styles.waitingCard, expired && styles.grandCard]}>
        <View pointerEvents="none" style={styles.cardHighlight} />
        <Text style={styles.eyebrow}>DAILY CHECK-IN</Text>
        <View style={styles.dayBadge}><Text style={styles.dayBadgeText}>CURRENT STREAK: DAY {checkIn.streakDay}</Text></View>
        <Animated.View style={{transform: [{translateY: float}]}}>
          <Image source={coin3d} resizeMode="contain" style={styles.coin} />
        </Animated.View>
        <Text style={styles.rewardAmount}>+{reward}</Text>
        <Text style={styles.rewardLabel}>COINS</Text>
        <Text style={styles.stateText}>{stateText}</Text>
        <Pressable
          accessibilityRole="button"
          disabled={!canClaim || claiming}
          onPress={claim}
          style={({pressed}) => [styles.buttonDepth, (!canClaim || claiming) && styles.disabledDepth, pressed && styles.pressed]}>
          <View style={[styles.button, (!canClaim || claiming) && styles.disabledButton]}>
            <MaterialCommunityIcons color="#FFFFFF" name={locked ? 'clock-outline' : expired ? 'refresh' : 'gift'} size={rf(2.25)} />
            <Text style={styles.buttonText}>{buttonLabel}</Text>
          </View>
        </Pressable>
        <Animated.View pointerEvents="none" style={[styles.success, {opacity: success, transform: [{scale: success}]}]}>
          <MaterialCommunityIcons color="#FFFFFF" name="check-bold" size={rf(3.2)} />
          <Text style={styles.successText}>+{claimedReward ?? reward} COINS!</Text>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  cardDepth: {paddingBottom: hp(1), borderRadius: wp(7), backgroundColor: '#4E177C', elevation: 10},
  grandDepth: {backgroundColor: '#A95A00'},
  card: {minHeight: hp(49), padding: wp(5), overflow: 'hidden', alignItems: 'center', borderRadius: wp(7), backgroundColor: '#7B37BA', borderWidth: wp(0.7), borderColor: '#B978E7'},
  cardHighlight: {position: 'absolute', top: 0, left: wp(3), right: wp(3), height: '34%', borderRadius: wp(7), backgroundColor: 'rgba(255,255,255,0.08)'},
  claimedCard: {backgroundColor: '#4B9D46', borderColor: '#8CD77E'},
  waitingCard: {backgroundColor: '#68557D', borderColor: '#9886AA'},
  grandCard: {backgroundColor: '#9A4AC0', borderColor: '#FFD257'},
  eyebrow: {color: '#FFE05A', fontSize: rf(2.2), fontWeight: '900', letterSpacing: wp(0.25)},
  dayBadge: {marginTop: hp(1.1), paddingHorizontal: wp(4), paddingVertical: hp(0.65), borderRadius: wp(5), backgroundColor: '#43166F'},
  dayBadgeText: {color: '#FFF', fontSize: rf(1.4), fontWeight: '900'},
  coin: {width: Math.min(wp(31), hp(17)), height: Math.min(wp(31), hp(17)), marginTop: hp(1.4)},
  rewardAmount: {marginTop: -hp(1.2), color: '#FFD83D', fontSize: rf(5.2), fontWeight: '900', textShadowColor: '#5C2800', textShadowOffset: {width: 0, height: hp(0.3)}, textShadowRadius: wp(0.7)},
  rewardLabel: {color: '#FFF7D3', fontSize: rf(1.7), fontWeight: '900', letterSpacing: wp(0.5)},
  stateText: {marginTop: hp(1.1), color: '#F2E7FA', fontSize: rf(1.35), fontWeight: '700'},
  buttonDepth: {width: '88%', height: hp(6.6), marginTop: hp(2.1), paddingBottom: hp(0.7), borderRadius: wp(7), backgroundColor: '#157F10', elevation: 8},
  button: {flex: 1, gap: wp(2), borderRadius: wp(7), flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#48CF25', borderWidth: wp(0.5), borderColor: '#94F06E'},
  buttonText: {color: '#FFF', fontSize: rf(1.85), fontWeight: '900', textShadowColor: 'rgba(0,0,0,0.35)', textShadowOffset: {width: 0, height: 2}, textShadowRadius: 1},
  disabledDepth: {backgroundColor: '#51475D'},
  disabledButton: {backgroundColor: '#81748E', borderColor: '#A89EB0'},
  pressed: {opacity: 0.88, transform: [{scale: 0.97}]},
  success: {position: 'absolute', top: '43%', paddingHorizontal: wp(5), paddingVertical: hp(1.4), gap: wp(2), borderRadius: wp(6), flexDirection: 'row', alignItems: 'center', backgroundColor: '#42BE24', borderWidth: wp(0.5), borderColor: '#B7FF8E', elevation: 14},
  successText: {color: '#FFF', fontSize: rf(2), fontWeight: '900'},
  lockDepth: {paddingBottom: hp(1), borderRadius: wp(7), backgroundColor: '#3B2850', elevation: 9},
  lockCard: {minHeight: hp(42), padding: wp(6), alignItems: 'center', justifyContent: 'center', borderRadius: wp(7), backgroundColor: '#68557C', borderWidth: wp(0.7), borderColor: '#927BA7'},
  lockIcon: {width: wp(19), height: wp(19), maxWidth: 92, maxHeight: 92, borderRadius: wp(10), alignItems: 'center', justifyContent: 'center', backgroundColor: '#432B59', borderWidth: wp(0.6), borderColor: '#9B83AC'},
  lockEyebrow: {marginTop: hp(2), color: '#FFE05A', fontSize: rf(1.55), fontWeight: '900'},
  lockTitle: {marginTop: hp(0.7), color: '#FFF', fontSize: rf(2.5), fontWeight: '900', textAlign: 'center'},
  lockHint: {marginTop: hp(0.8), color: '#DED1E8', fontSize: rf(1.25), textAlign: 'center'},
  progressTrack: {width: '90%', height: hp(2), marginTop: hp(3), overflow: 'hidden', borderRadius: wp(4), backgroundColor: '#352344', borderWidth: wp(0.35), borderColor: '#8D79A0'},
  progressFill: {height: '100%', borderRadius: wp(4), backgroundColor: '#FFD132'},
  progressText: {marginTop: hp(1), color: '#FFF', fontSize: rf(1.75), fontWeight: '900'},
});

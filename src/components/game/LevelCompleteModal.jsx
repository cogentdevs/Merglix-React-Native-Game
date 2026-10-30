import React, {useEffect, useRef} from 'react';
import {Animated, Image, Modal, Pressable, SafeAreaView, StyleSheet, Text, View, useWindowDimensions} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
const coin3d = require('../../assets/coin-3d.png');
const star3d = require('../../assets/merglix game elments/level start updated.png');

export default function LevelCompleteModal({visible, level, score, matchCoins, completionCoins, totalCoins, extraCoins, adStatus = 'loading', stars = 3, interactionDisabled = false, onWatchAd, onNext, onHome}) {
  const {width, height} = useWindowDimensions();
  const overlay = useRef(new Animated.Value(0)).current;
  const card = useRef(new Animated.Value(0.82)).current;
  const starValues = useRef([0, 1, 2].map(() => new Animated.Value(0))).current;
  const scale = Math.min(1.12, Math.max(0.78, Math.min(width / 390, height / 820)));

  useEffect(() => {
    if (!visible) {
      overlay.setValue(0); card.setValue(0.82); starValues.forEach(value => value.setValue(0));
      return undefined;
    }
    const animation = Animated.parallel([
      Animated.timing(overlay, {toValue: 1, duration: 220, useNativeDriver: true}),
      Animated.spring(card, {toValue: 1, friction: 7, tension: 85, useNativeDriver: true}),
      Animated.stagger(100, starValues.map(value => Animated.spring(value, {toValue: 1, friction: 4, tension: 150, useNativeDriver: true}))),
    ]);
    animation.start();
    return () => animation.stop();
  }, [card, overlay, starValues, visible]);

  return (
    <Modal animationType="none" hardwareAccelerated onRequestClose={() => {
      if (!interactionDisabled) onHome?.();
    }} statusBarTranslucent transparent visible={visible}>
      <Animated.View style={[styles.overlay, {opacity: overlay}]}>
        <SafeAreaView style={styles.safeArea}>
          <Animated.View style={[styles.container, {width: Math.min(width * 0.88, 440), transform: [{scale: card}]}]}>
            <View accessibilityLabel={`${stars} stars`} style={styles.stars}>
              {starValues.map((value, index) => (
                <Animated.View key={index} style={{opacity: value, transform: [{scale: value}, {translateY: index === 1 ? -8 : 3}]}}>
                  <Image
                    source={star3d}
                    resizeMode="contain"
                    style={[
                      styles.star,
                      {
                        width: (index === 1 ? 84 : 68) * scale,
                        height: (index === 1 ? 84 : 68) * scale,
                      },
                      index >= stars && styles.unearnedStar,
                    ]}
                  />
                </Animated.View>
              ))}
            </View>
            <View style={styles.ribbonWrap}>
              <View style={styles.tailLeft} /><View style={styles.tailRight} />
              <View style={styles.ribbon}><View style={styles.highlight} /><Text style={[styles.title, {fontSize: 27 * scale}]}>LEVEL COMPLETE!</Text></View>
            </View>
            <View style={styles.scoreCard}>
              <Text style={[styles.level, {fontSize: 13 * scale}]}>LEVEL {level}</Text>
              <Text style={[styles.coinHeroLabel, {fontSize: 22 * scale}]}>Coins Earned</Text>
              <View style={styles.coinHeroRow}>
                <Image source={coin3d} resizeMode="contain" style={{width: 86 * scale, height: 86 * scale}} />
                <Text adjustsFontSizeToFit numberOfLines={1} style={[styles.coinHeroText, {fontSize: 47 * scale}]}>+{totalCoins}</Text>
              </View>
              <View style={styles.divider}><View style={styles.line} /><View style={styles.dot} /><View style={styles.line} /></View>
              <View style={styles.rewardBreakdown}>
                <Text style={[styles.rewardLine, {fontSize: 15 * scale}]}>Match Coins  +{matchCoins}</Text>
                <Text style={[styles.rewardLine, {fontSize: 15 * scale}]}>Completion Bonus  +{completionCoins}</Text>
              </View>
              <View style={styles.scoreRow}>
                <Text style={[styles.scoreLabel, {fontSize: 17 * scale}]}>Score</Text>
                <Text adjustsFontSizeToFit numberOfLines={1} style={[styles.score, {fontSize: 31 * scale}]}>{score}</Text>
              </View>
            </View>
            <RewardAdButton
              extraCoins={extraCoins}
              interactionDisabled={interactionDisabled}
              onPress={onWatchAd}
              scale={scale}
              status={adStatus}
            />
            <GameButton color="#48D119" dark="#179807" disabled={interactionDisabled} label="NEXT" onPress={onNext} scale={scale} />
            <GameButton color="#199DE6" dark="#0870BE" disabled={interactionDisabled} label="HOME" onPress={onHome} scale={scale} />
          </Animated.View>
        </SafeAreaView>
      </Animated.View>
    </Modal>
  );
}

function RewardAdButton({extraCoins, interactionDisabled, onPress, scale, status}) {
  const pulse = useRef(new Animated.Value(1)).current;
  const shimmer = useRef(new Animated.Value(-1)).current;

  useEffect(() => {
    if (status !== 'ready') {
      pulse.setValue(1);
      shimmer.setValue(-1);
      return undefined;
    }
    const pulseAnimation = Animated.loop(Animated.sequence([
      Animated.timing(pulse, {toValue: 1.025, duration: 700, useNativeDriver: true}),
      Animated.timing(pulse, {toValue: 1, duration: 700, useNativeDriver: true}),
    ]));
    const shimmerAnimation = Animated.loop(Animated.sequence([
      Animated.timing(shimmer, {toValue: 1, duration: 1350, useNativeDriver: true}),
      Animated.delay(850),
      Animated.timing(shimmer, {toValue: -1, duration: 0, useNativeDriver: true}),
    ]));
    pulseAnimation.start();
    shimmerAnimation.start();
    return () => {
      pulseAnimation.stop();
      shimmerAnimation.stop();
    };
  }, [pulse, shimmer, status]);

  const content = {
    loading: ['LOADING REWARD AD...', 'Please wait'],
    ready: ['WATCH AD - 2X COINS', `GET +${extraCoins} EXTRA COINS`],
    showing: ['AD IS PLAYING...', 'Watch the complete ad'],
    closed: ['AD WAS NOT COMPLETED', 'Watch the full ad to earn coins'],
    earned: ['2X COINS CLAIMED!', `+${extraCoins} EXTRA COINS`],
    earnedClosed: ['2X COINS CLAIMED!', `+${extraCoins} EXTRA COINS`],
    error: ['RETRY REWARD AD', 'Tap to load the test ad again'],
  }[status] ?? ['WATCH AD - 2X COINS', `GET +${extraCoins} EXTRA COINS`];
  const disabled = interactionDisabled || status === 'loading' || status === 'showing' || status === 'closed' || status === 'earned' || status === 'earnedClosed';

  return (
    <Animated.View style={{transform: [{scale: pulse}]}}>
      <Pressable
        accessibilityLabel={content.join('. ')}
        accessibilityRole="button"
        disabled={disabled}
        onPress={onPress}
        style={({pressed}) => [
          styles.rewardDepth,
          {height: 76 * scale},
          disabled && styles.rewardDisabled,
          pressed && styles.pressed,
        ]}>
        <View style={[styles.rewardButton, (status === 'earned' || status === 'earnedClosed') && styles.rewardEarned]}>
        <View pointerEvents="none" style={styles.rewardHighlight} />
        <Animated.View
          pointerEvents="none"
          style={[styles.rewardShimmer, {
            transform: [{translateX: shimmer.interpolate({
              inputRange: [-1, 1],
              outputRange: [-220 * scale, 220 * scale],
            })}, {rotate: '18deg'}],
          }]}
        />
        <View style={styles.rewardIconRing}>
          <MaterialCommunityIcons
            color="#FFFFFF"
            name={status === 'earned' || status === 'earnedClosed' ? 'check-bold' : 'play'}
            size={26 * scale}
          />
        </View>
        <View style={styles.rewardCopy}>
          <Text style={[styles.rewardTitle, {fontSize: 19 * scale}]}>
            {content[0]}
          </Text>
          <Text style={[styles.rewardSubtitle, {fontSize: 11 * scale}]}>
            {content[1]}
          </Text>
        </View>
        <Image
          source={coin3d}
          resizeMode="contain"
          style={{width: 42 * scale, height: 42 * scale}}
        />
        </View>
      </Pressable>
    </Animated.View>
  );
}

function GameButton({color, dark, disabled, label, onPress, scale}) {
  return <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress} style={({pressed}) => [styles.buttonDepth, {backgroundColor: dark, height: 65 * scale}, disabled && styles.buttonDisabled, pressed && styles.pressed]}><View style={[styles.button, {backgroundColor: color}]}><View style={styles.buttonHighlight} /><Text style={[styles.buttonText, {fontSize: 27 * scale}]}>{label}</Text></View></Pressable>;
}

const styles = StyleSheet.create({
  overlay: {flex: 1, backgroundColor: 'rgba(16,7,22,0.84)'},
  safeArea: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  container: {maxWidth: 440},
  stars: {height: 88, marginBottom: -20, zIndex: 5, flexDirection: 'row', alignItems: 'center', justifyContent: 'center'},
  star: {marginHorizontal: -7},
  unearnedStar: {opacity: 0.24},
  ribbonWrap: {zIndex: 4, marginHorizontal: -14, marginBottom: -20},
  ribbon: {height: 82, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', borderRadius: 28, backgroundColor: '#7D27BD', borderWidth: 3, borderColor: '#57208B', elevation: 12},
  highlight: {position: 'absolute', top: 3, left: 18, right: 18, height: '43%', borderRadius: 24, backgroundColor: 'rgba(199,103,255,0.42)'},
  tailLeft: {position: 'absolute', left: -8, bottom: -17, width: 75, height: 55, backgroundColor: '#6820A7', transform: [{rotate: '-12deg'}], borderRadius: 8},
  tailRight: {position: 'absolute', right: -8, bottom: -17, width: 75, height: 55, backgroundColor: '#6820A7', transform: [{rotate: '12deg'}], borderRadius: 8},
  title: {color: '#FFF', fontWeight: '900', textAlign: 'center', textShadowColor: '#4B176F', textShadowOffset: {width: 0, height: 3}, textShadowRadius: 2},
  scoreCard: {minHeight: 280, paddingTop: 42, paddingHorizontal: 30, paddingBottom: 24, alignItems: 'center', justifyContent: 'center', borderRadius: 34, backgroundColor: '#FFF0C8', borderWidth: 5, borderColor: '#EFB86D', elevation: 14},
  level: {color: '#9B6A3A', fontWeight: '900', letterSpacing: 1.2},
  coinHeroLabel: {marginTop: 7, color: '#553090', fontWeight: '800'},
  coinHeroRow: {minWidth: '70%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10},
  coinHeroText: {maxWidth: '62%', color: '#553090', fontWeight: '900'},
  scoreLabel: {color: '#8A6598', fontWeight: '800'},
  score: {color: '#553090', fontWeight: '900'},
  divider: {width: '84%', marginVertical: 11, flexDirection: 'row', alignItems: 'center'},
  line: {flex: 1, height: 2, backgroundColor: '#E8B76E'}, dot: {width: 11, height: 11, marginHorizontal: 12, borderRadius: 6, backgroundColor: '#E8B76E'},
  rewardBreakdown: {alignItems: 'center', marginBottom: 4},
  rewardLine: {color: '#744C83', fontWeight: '800', lineHeight: 22},
  scoreRow: {minWidth: '68%', marginTop: 4, gap: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'center'},
  rewardDepth: {marginTop: 17, paddingBottom: 7, borderRadius: 27, backgroundColor: '#B65A00', elevation: 13},
  rewardButton: {flex: 1, overflow: 'hidden', paddingHorizontal: 13, gap: 10, borderRadius: 27, flexDirection: 'row', alignItems: 'center', backgroundColor: '#FF9F12', borderWidth: 2, borderColor: '#FFD969'},
  rewardHighlight: {position: 'absolute', top: 0, left: 2, right: 2, height: '44%', borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.24)'},
  rewardShimmer: {position: 'absolute', top: -20, bottom: -20, left: '50%', width: 44, backgroundColor: 'rgba(255,255,255,0.25)'},
  rewardEarned: {backgroundColor: '#54C91E', borderColor: '#D9FF83'},
  rewardIconRing: {width: 43, height: 43, borderRadius: 23, alignItems: 'center', justifyContent: 'center', backgroundColor: '#7A2DB8', borderWidth: 3, borderColor: '#D9A0FF', elevation: 5},
  rewardCopy: {flex: 1},
  rewardTitle: {color: '#FFFFFF', fontWeight: '900', textAlign: 'center', textShadowColor: '#874000', textShadowOffset: {width: 0, height: 2}, textShadowRadius: 2},
  rewardSubtitle: {marginTop: 2, color: '#FFF5CF', fontWeight: '800', textAlign: 'center'},
  rewardDisabled: {opacity: 0.72},
  buttonDepth: {marginTop: 16, borderRadius: 30, paddingBottom: 7, elevation: 10},
  buttonDisabled: {opacity: 0.62},
  button: {flex: 1, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', borderRadius: 30, borderWidth: 2, borderColor: 'rgba(255,255,255,0.28)'},
  buttonHighlight: {position: 'absolute', top: 0, left: 0, right: 0, height: '45%', backgroundColor: 'rgba(255,255,255,0.13)'},
  buttonText: {color: '#FFF', fontWeight: '900', textShadowColor: 'rgba(0,0,0,0.4)', textShadowOffset: {width: 0, height: 3}, textShadowRadius: 2},
  pressed: {opacity: 0.9, transform: [{scale: 0.97}]},
});

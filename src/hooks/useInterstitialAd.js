import {useCallback, useEffect, useRef, useState} from 'react';
import {AdEventType, InterstitialAd} from 'react-native-google-mobile-ads';
import {INTERSTITIAL_AD_UNIT_ID} from '../config/adUnits';

/**
 * A non-rewarding, preloaded full-screen ad. It deliberately has no wallet or
 * reward callback, keeping it separate from the opt-in RewardedAd flow.
 */
export default function useInterstitialAd(onVisibilityChange) {
  const [status, setStatus] = useState(INTERSTITIAL_AD_UNIT_ID ? 'loading' : 'disabled');
  const adRef = useRef(null);
  const reloadTimerRef = useRef(null);
  const visibilityCallbackRef = useRef(onVisibilityChange);

  useEffect(() => {
    visibilityCallbackRef.current = onVisibilityChange;
  }, [onVisibilityChange]);

  const reload = useCallback((delay = 0) => {
    if (reloadTimerRef.current) clearTimeout(reloadTimerRef.current);
    const load = () => {
      reloadTimerRef.current = null;
      setStatus('loading');
      adRef.current?.load();
    };
    if (delay > 0) {
      reloadTimerRef.current = setTimeout(load, delay);
    } else {
      load();
    }
  }, []);

  useEffect(() => {
    if (!INTERSTITIAL_AD_UNIT_ID) return undefined;

    const ad = InterstitialAd.createForAdRequest(INTERSTITIAL_AD_UNIT_ID, {
      requestNonPersonalizedAdsOnly: true,
    });
    adRef.current = ad;

    const unsubscribeLoaded = ad.addAdEventListener(AdEventType.LOADED, () => {
      setStatus('ready');
    });
    const unsubscribeOpened = ad.addAdEventListener(AdEventType.OPENED, () => {
      setStatus('showing');
      visibilityCallbackRef.current?.(true);
    });
    const unsubscribeClosed = ad.addAdEventListener(AdEventType.CLOSED, () => {
      visibilityCallbackRef.current?.(false);
      reload();
    });
    const unsubscribeError = ad.addAdEventListener(AdEventType.ERROR, error => {
      visibilityCallbackRef.current?.(false);
      console.warn('Interstitial ad error', error);
      setStatus('error');
      reload(1600);
    });

    reload();
    return () => {
      visibilityCallbackRef.current?.(false);
      if (reloadTimerRef.current) clearTimeout(reloadTimerRef.current);
      unsubscribeLoaded();
      unsubscribeOpened();
      unsubscribeClosed();
      unsubscribeError();
      ad.removeAllListeners();
      adRef.current = null;
    };
  }, [reload]);

  // Returns true only when this call has actually started a ready ad. Callers
  // use that result to enforce one automatic display per completed attempt.
  const show = useCallback(() => {
    const ad = adRef.current;
    if (!ad || !ad.loaded) return false;

    try {
      setStatus('showing');
      visibilityCallbackRef.current?.(true);
      Promise.resolve(ad.show()).catch(error => {
        visibilityCallbackRef.current?.(false);
        console.warn('Unable to show interstitial ad', error);
        setStatus('error');
        reload(1600);
      });
      return true;
    } catch (error) {
      visibilityCallbackRef.current?.(false);
      console.warn('Unable to show interstitial ad', error);
      setStatus('error');
      reload(1600);
      return false;
    }
  }, [reload]);

  return {show, status};
}

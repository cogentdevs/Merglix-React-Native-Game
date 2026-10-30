import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import {AdEventType, InterstitialAd} from 'react-native-google-mobile-ads';
import useInterstitialAd from '../src/hooks/useInterstitialAd';

jest.mock('../src/config/adUnits', () => ({
  INTERSTITIAL_AD_UNIT_ID: 'test-interstitial',
}));

let latestAd;

function Probe({onVisible}) {
  latestAd = useInterstitialAd(onVisible);
  return null;
}

describe('useInterstitialAd', () => {
  let ad;
  let listeners;
  let renderer;

  beforeEach(() => {
    listeners = {};
    ad = {
      loaded: false,
      addAdEventListener: jest.fn((event, listener) => {
        listeners[event] = listener;
        return jest.fn();
      }),
      load: jest.fn(),
      removeAllListeners: jest.fn(),
      show: jest.fn(() => Promise.resolve()),
    };
    InterstitialAd.createForAdRequest.mockImplementation(() => ad);
  });

  afterEach(async () => {
    if (renderer) {
      await ReactTestRenderer.act(async () => renderer.unmount());
    }
    renderer = null;
    jest.clearAllMocks();
  });

  test('preloads, displays once without a reward callback, and reloads on close', async () => {
    const onVisible = jest.fn();
    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<Probe onVisible={onVisible} />);
    });

    expect(ad.load).toHaveBeenCalledTimes(1);
    await ReactTestRenderer.act(async () => listeners[AdEventType.LOADED]());
    expect(latestAd.status).toBe('ready');

    ad.loaded = true;
    let shown;
    await ReactTestRenderer.act(async () => {
      shown = latestAd.show();
    });
    expect(shown).toBe(true);
    expect(ad.show).toHaveBeenCalledTimes(1);
    expect(onVisible).toHaveBeenCalledWith(true);

    await ReactTestRenderer.act(async () => listeners[AdEventType.CLOSED]());
    expect(onVisible).toHaveBeenLastCalledWith(false);
    expect(ad.load).toHaveBeenCalledTimes(2);
  });

  test('does not show while the ad is not ready', async () => {
    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<Probe onVisible={jest.fn()} />);
    });

    expect(latestAd.show()).toBe(false);
    expect(ad.show).not.toHaveBeenCalled();
  });
});

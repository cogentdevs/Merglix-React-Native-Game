const createAd = () => ({
  loaded: true,
  addAdEventListener: jest.fn(() => jest.fn()),
  load: jest.fn(),
  removeAllListeners: jest.fn(),
  show: jest.fn(() => Promise.resolve()),
});

module.exports = {
  __esModule: true,
  default: () => ({
    initialize: jest.fn(() => Promise.resolve([])),
    setRequestConfiguration: jest.fn(() => Promise.resolve()),
  }),
  AdEventType: {
    CLOSED: 'closed',
    ERROR: 'error',
    OPENED: 'opened',
  },
  BannerAd: 'BannerAd',
  BannerAdSize: {
    ANCHORED_ADAPTIVE_BANNER: 'anchored-adaptive-banner',
  },
  RewardedAd: {
    createForAdRequest: jest.fn(createAd),
  },
  InterstitialAd: {
    createForAdRequest: jest.fn(createAd),
  },
  RewardedAdEventType: {
    EARNED_REWARD: 'rewarded_earned_reward',
    LOADED: 'rewarded_loaded',
  },
  TestIds: {BANNER: 'test-banner', INTERSTITIAL: 'test-interstitial', REWARDED: 'test-rewarded'},
};

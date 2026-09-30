import {
  createLevelBoard,
  detectMatches,
  findHintSwap,
  findMagnetHintIds,
  shuffleRemainingBoard,
  swapSlots,
} from '../src/game/boardLogic';
import {
  getLevelTimerSeconds,
  getStarsForTime,
  LEVEL_CONFIGS,
  PRODUCT_ASSETS,
  SHELF_ASSETS,
} from '../src/game/levelConfigs';

const EXPECTED_LEVELS = {
  1: {types: 3, matches: 4, items: 12, rows: 3, timer: 60},
  2: {types: 3, matches: 5, items: 15, rows: 3, timer: 60},
  3: {types: 4, matches: 5, items: 15, rows: 3, timer: 60},
  4: {types: 4, matches: 6, items: 18, rows: 3, timer: 60},
  5: {types: 4, matches: 8, items: 24, rows: 4, timer: 60},
  6: {types: 5, matches: 8, items: 24, rows: 4, timer: 60},
  7: {types: 5, matches: 8, items: 24, rows: 4, timer: 60},
  8: {types: 5, matches: 8, items: 24, rows: 4, timer: 60},
  9: {types: 6, matches: 8, items: 24, rows: 4, timer: 60},
  10: {types: 6, matches: 8, items: 24, rows: 4, timer: 60},
  11: {types: 8, matches: 8, items: 24, rows: 4, timer: 70},
  12: {types: 8, matches: 8, items: 24, rows: 4, timer: 70},
  13: {types: 8, matches: 8, items: 24, rows: 4, timer: 70},
  14: {types: 8, matches: 8, items: 24, rows: 4, timer: 70},
  15: {types: 8, matches: 8, items: 24, rows: 4, timer: 70},
  16: {types: 10, matches: 10, items: 30, rows: 5, timer: 70},
  17: {types: 10, matches: 10, items: 30, rows: 5, timer: 70},
  18: {types: 10, matches: 10, items: 30, rows: 5, timer: 70},
  19: {types: 10, matches: 10, items: 30, rows: 5, timer: 70},
  20: {types: 10, matches: 10, items: 30, rows: 5, timer: 70},
  21: {types: 10, matches: 10, items: 30, rows: 5, timer: 80},
  22: {types: 10, matches: 10, items: 30, rows: 5, timer: 80},
  23: {types: 10, matches: 10, items: 30, rows: 5, timer: 80},
  24: {types: 10, matches: 10, items: 30, rows: 5, timer: 80},
  25: {types: 10, matches: 10, items: 30, rows: 5, timer: 80},
  26: {types: 10, matches: 10, items: 30, rows: 5, timer: 80},
  27: {types: 10, matches: 10, items: 30, rows: 5, timer: 80},
  28: {types: 10, matches: 10, items: 30, rows: 5, timer: 80},
  29: {types: 10, matches: 10, items: 30, rows: 5, timer: 80},
  30: {types: 10, matches: 10, items: 30, rows: 5, timer: 80},
  31: {types: 10, matches: 10, items: 30, rows: 5, timer: 90, completion: 30},
  32: {types: 10, matches: 10, items: 30, rows: 5, timer: 90, completion: 30},
  33: {types: 10, matches: 10, items: 30, rows: 5, timer: 90, completion: 30},
  34: {types: 10, matches: 10, items: 30, rows: 5, timer: 90, completion: 30},
  35: {types: 10, matches: 10, items: 30, rows: 5, timer: 90, completion: 30},
  36: {types: 10, matches: 10, items: 30, rows: 5, timer: 90, completion: 30},
  37: {types: 10, matches: 10, items: 30, rows: 5, timer: 90, completion: 30},
  38: {types: 10, matches: 10, items: 30, rows: 5, timer: 90, completion: 30},
  39: {types: 10, matches: 10, items: 30, rows: 5, timer: 90, completion: 30},
  40: {types: 10, matches: 10, items: 30, rows: 5, timer: 90, completion: 30},
  41: {types: 10, matches: 10, items: 30, rows: 5, timer: 100, completion: 30},
  42: {types: 10, matches: 10, items: 30, rows: 5, timer: 100, completion: 30},
  43: {types: 10, matches: 10, items: 30, rows: 5, timer: 100, completion: 30},
  44: {types: 10, matches: 10, items: 30, rows: 5, timer: 100, completion: 30},
  45: {types: 10, matches: 10, items: 30, rows: 5, timer: 100, completion: 30},
  46: {types: 10, matches: 10, items: 30, rows: 5, timer: 100, completion: 30},
  47: {types: 10, matches: 10, items: 30, rows: 5, timer: 100, completion: 30},
  48: {types: 10, matches: 10, items: 30, rows: 5, timer: 100, completion: 30},
  49: {types: 10, matches: 10, items: 30, rows: 5, timer: 100, completion: 30},
  50: {types: 10, matches: 10, items: 30, rows: 5, timer: 100, completion: 30},
  51: {types: 12, matches: 12, items: 36, rows: 6, timer: 110, completion: 30},
  52: {types: 12, matches: 12, items: 36, rows: 6, timer: 110, completion: 30},
  53: {types: 12, matches: 12, items: 36, rows: 6, timer: 110, completion: 30},
  54: {types: 12, matches: 12, items: 36, rows: 6, timer: 110, completion: 30},
  55: {types: 12, matches: 12, items: 36, rows: 6, timer: 110, completion: 30},
  56: {types: 12, matches: 12, items: 36, rows: 6, timer: 110, completion: 30},
  57: {types: 12, matches: 12, items: 36, rows: 6, timer: 110, completion: 30},
  58: {types: 12, matches: 12, items: 36, rows: 6, timer: 110, completion: 30},
  59: {types: 12, matches: 12, items: 36, rows: 6, timer: 110, completion: 30},
  60: {types: 12, matches: 12, items: 36, rows: 6, timer: 110, completion: 30},
  61: {types: 12, matches: 12, items: 36, rows: 6, timer: 120, completion: 35},
  62: {types: 12, matches: 12, items: 36, rows: 6, timer: 120, completion: 35},
  63: {types: 12, matches: 12, items: 36, rows: 6, timer: 120, completion: 35},
  64: {types: 12, matches: 12, items: 36, rows: 6, timer: 120, completion: 35},
  65: {types: 12, matches: 12, items: 36, rows: 6, timer: 120, completion: 35},
  66: {types: 12, matches: 12, items: 36, rows: 6, timer: 120, completion: 35},
  67: {types: 12, matches: 12, items: 36, rows: 6, timer: 120, completion: 35},
  68: {types: 12, matches: 12, items: 36, rows: 6, timer: 120, completion: 35},
  69: {types: 12, matches: 12, items: 36, rows: 6, timer: 120, completion: 35},
  70: {types: 12, matches: 12, items: 36, rows: 6, timer: 120, completion: 35},
  71: {types: 12, matches: 12, items: 36, rows: 6, timer: 130, completion: 35},
  72: {types: 12, matches: 12, items: 36, rows: 6, timer: 130, completion: 35},
  73: {types: 12, matches: 12, items: 36, rows: 6, timer: 130, completion: 35},
  74: {types: 12, matches: 12, items: 36, rows: 6, timer: 130, completion: 35},
  75: {types: 12, matches: 12, items: 36, rows: 6, timer: 130, completion: 35},
  76: {types: 12, matches: 12, items: 36, rows: 6, timer: 130, completion: 35},
  77: {types: 12, matches: 12, items: 36, rows: 6, timer: 130, completion: 35},
  78: {types: 12, matches: 12, items: 36, rows: 6, timer: 130, completion: 35},
  79: {types: 12, matches: 12, items: 36, rows: 6, timer: 130, completion: 35},
  80: {types: 12, matches: 12, items: 36, rows: 6, timer: 130, completion: 35},
  81: {types: 12, matches: 12, items: 36, rows: 6, timer: 140, completion: 40},
  82: {types: 12, matches: 12, items: 36, rows: 6, timer: 140, completion: 40},
  83: {types: 12, matches: 12, items: 36, rows: 6, timer: 140, completion: 40},
  84: {types: 12, matches: 12, items: 36, rows: 6, timer: 140, completion: 40},
  85: {types: 12, matches: 12, items: 36, rows: 6, timer: 140, completion: 40},
  86: {types: 12, matches: 12, items: 36, rows: 6, timer: 140, completion: 40},
  87: {types: 12, matches: 12, items: 36, rows: 6, timer: 140, completion: 40},
  88: {types: 12, matches: 12, items: 36, rows: 6, timer: 140, completion: 40},
  89: {types: 12, matches: 12, items: 36, rows: 6, timer: 140, completion: 40},
  90: {types: 12, matches: 12, items: 36, rows: 6, timer: 140, completion: 40},
  91: {types: 12, matches: 12, items: 36, rows: 6, timer: 150, completion: 40},
  92: {types: 12, matches: 12, items: 36, rows: 6, timer: 150, completion: 40},
  93: {types: 12, matches: 12, items: 36, rows: 6, timer: 150, completion: 40},
  94: {types: 12, matches: 12, items: 36, rows: 6, timer: 150, completion: 40},
  96: {types: 12, matches: 12, items: 36, rows: 6, timer: 150, completion: 40},
  97: {types: 12, matches: 12, items: 36, rows: 6, timer: 150, completion: 40},
  98: {types: 12, matches: 12, items: 36, rows: 6, timer: 150, completion: 40},
  99: {types: 12, matches: 12, items: 36, rows: 6, timer: 150, completion: 40},
  100: {types: 12, matches: 12, items: 36, rows: 6, timer: 150, completion: 40},
};

test('level timers increase automatically by 10 seconds every 10 levels', () => {
  expect(getLevelTimerSeconds(1)).toBe(60);
  expect(getLevelTimerSeconds(10)).toBe(60);
  expect(getLevelTimerSeconds(11)).toBe(70);
  expect(getLevelTimerSeconds(100)).toBe(150);
  expect(getLevelTimerSeconds(121)).toBe(180);
  expect(getLevelTimerSeconds(1000)).toBe(1050);
});

describe.each(Object.entries(EXPECTED_LEVELS))('Level %s', (level, expected) => {
  const config = LEVEL_CONFIGS[level];

  test('matches the V1 configuration and economy', () => {
    expect(config.productTypeCount).toBe(expected.types);
    expect(config.targetMatches).toBe(expected.matches);
    expect(config.totalItemCount).toBe(expected.items);
    expect(config.rows).toBe(expected.rows);
    expect(config.durationSeconds).toBe(expected.timer);
    expect(config.matchReward).toBe(5);
    expect(config.completionReward).toBe(expected.completion ?? 25);
    expect(config.productTypes).toHaveLength(expected.types);
    expect(Object.values(config.copiesByType).every(count => count % 3 === 0)).toBe(true);
  });

  test('generates a playable randomized board without an opening match', () => {
    const board = createLevelBoard(config);
    expect(board).toHaveLength(config.rows * config.columns);
    expect(board.filter(Boolean)).toHaveLength(expected.items);
    expect(detectMatches(board, config.rows, config.columns, 3)).toEqual([]);
    expect(findHintSwap(board, config.rows, config.columns, 3)).not.toBeNull();

    const counts = board.filter(Boolean).reduce((result, item) => {
      result[item.type] = (result[item.type] ?? 0) + 1;
      return result;
    }, {});
    expect(Object.values(counts).every(count => count % 3 === 0)).toBe(true);
  });
});

test('repeated attempts are not locked to one fixed arrangement', () => {
  const config = LEVEL_CONFIGS[10];
  const arrangements = new Set(Array.from({length: 5}, () =>
    createLevelBoard(config).map(item => item?.id ?? '-').join(',')));
  expect(arrangements.size).toBeGreaterThan(1);
});

test('Levels 6-10 rotate products from the Merglix element asset set', () => {
  const earlyTypes = new Set(['apple', 'milk', 'juice', 'can']);
  for (let level = 6; level <= 10; level += 1) {
    expect(LEVEL_CONFIGS[level].productTypes.every(type => PRODUCT_ASSETS[type])).toBe(true);
    expect(LEVEL_CONFIGS[level].productTypes.some(type => !earlyTypes.has(type))).toBe(true);
  }
  expect(new Set(
    [6, 7, 8, 9, 10].flatMap(level => LEVEL_CONFIGS[level].productTypes),
  ).size).toBeGreaterThanOrEqual(11);
});

describe.each(Object.keys(LEVEL_CONFIGS).map(Number).filter(level => level >= 11))(
  'Level %i full-shelf contract',
  level => {
    const config = LEVEL_CONFIGS[level];

    test('fills every slot with registered triple-compatible products', () => {
      expect(config.totalItemCount).toBe(config.rows * config.columns);
      expect(config.targetMatches).toBe(config.totalItemCount / config.matchSize);
      expect(config.durationSeconds).toBe(getLevelTimerSeconds(level));
      expect(config.timerSeconds).toBe(getLevelTimerSeconds(level));
      expect(config.productTypes.every(type => PRODUCT_ASSETS[type])).toBe(true);
      expect(Object.keys(config.copiesByType).sort()).toEqual(
        [...config.productTypes].sort(),
      );
      expect(Object.values(config.copiesByType).every(count => count === 3))
        .toBe(true);
    });

    test('creates unique, playable and randomized full boards', () => {
      const boards = Array.from({length: 3}, () => createLevelBoard(config));
      boards.forEach(board => {
        const items = board.filter(Boolean);
        expect(items).toHaveLength(config.rows * config.columns);
        expect(new Set(items.map(item => item.id)).size).toBe(items.length);
        expect(detectMatches(board, config.rows, config.columns, 3)).toEqual([]);
        expect(findHintSwap(board, config.rows, config.columns, 3)).not.toBeNull();
      });
      expect(new Set(boards.map(board => board.map(item => item.id).join(','))).size)
        .toBeGreaterThan(1);
    });

    test('shuffle preserves every product and remains immediately playable', () => {
      const board = createLevelBoard(config);
      const shuffled = shuffleRemainingBoard(board, config, 500);
      expect(shuffled).not.toBeNull();
      expect(shuffled.map(item => item.id).sort()).toEqual(
        board.map(item => item.id).sort(),
      );
      expect(detectMatches(shuffled, config.rows, config.columns, 3)).toEqual([]);
      expect(findHintSwap(shuffled, config.rows, config.columns, 3)).not.toBeNull();
    });
  },
);

test('Artboard product assets appear only in their requested level ranges', () => {
  for (let level = 21; level <= 25; level += 1) {
    expect(LEVEL_CONFIGS[level].productTypes).toContain('teddy');
    expect(LEVEL_CONFIGS[level].productTypes).not.toContain('duck');
  }
  for (let level = 26; level <= 28; level += 1) {
    expect(LEVEL_CONFIGS[level].productTypes).not.toContain('teddy');
    expect(LEVEL_CONFIGS[level].productTypes).not.toContain('duck');
  }
  for (let level = 29; level <= 30; level += 1) {
    expect(LEVEL_CONFIGS[level].productTypes).toContain('duck');
    expect(LEVEL_CONFIGS[level].productTypes).not.toContain('teddy');
  }
  expect(PRODUCT_ASSETS.teddy).toBeTruthy();
  expect(PRODUCT_ASSETS.duck).toBeTruthy();
});

test('Levels 41-50 follow the approved new-product rollout', () => {
  for (let level = 41; level <= 45; level += 1) {
    expect(LEVEL_CONFIGS[level].productTypes).toContain('corn');
    expect(LEVEL_CONFIGS[level].productTypes).not.toContain('grapes');
    expect(LEVEL_CONFIGS[level].productTypes).not.toContain('lemon');
  }
  for (let level = 46; level <= 50; level += 1) {
    expect(LEVEL_CONFIGS[level].productTypes).toEqual(
      expect.arrayContaining(['corn', 'grapes', 'lemon']),
    );
  }
  expect(PRODUCT_ASSETS.corn).toBeTruthy();
  expect(PRODUCT_ASSETS.grapes).toBeTruthy();
  expect(PRODUCT_ASSETS.lemon).toBeTruthy();
});

test('Level 56 introduces the final World 2 product assets', () => {
  expect(LEVEL_CONFIGS[56].productTypes).toEqual(expect.arrayContaining([
    'watermelon', 'strawberry', 'pineapple', 'sooperBiscuit',
    'corn', 'grapes', 'lemon',
  ]));
  expect(PRODUCT_ASSETS.watermelon).toBeTruthy();
  expect(PRODUCT_ASSETS.strawberry).toBeTruthy();
});

test('five-row levels use the dedicated five-row shelf asset', () => {
  Object.values(LEVEL_CONFIGS)
    .filter(config => config.rows === 5)
    .forEach(config => {
      expect(config.shelf).toBe('classic5');
      expect(config.generatedShelves).toBe(false);
    });
});

test('every level uses a dedicated shelf asset instead of generated dividers', () => {
  Object.values(LEVEL_CONFIGS).forEach(config => {
    expect(config.shelf).toBe(`classic${config.rows}`);
    expect(SHELF_ASSETS[config.shelf]).toBeTruthy();
    expect(config.generatedShelves).toBe(false);
  });
});

test('star ratings use percentage of configured time and boundary values', () => {
  expect(getStarsForTime(35, 100)).toBe(3);
  expect(getStarsForTime(34, 100)).toBe(2);
  expect(getStarsForTime(15, 100)).toBe(2);
  expect(getStarsForTime(14, 100)).toBe(1);
});

test('detects adjacent triples only inside their own row', () => {
  const item = (id, type) => ({id, type});
  const board = [
    item('a1', 'apple'), item('a2', 'apple'), item('a3', 'apple'), item('m1', 'milk'),
    item('m2', 'milk'), item('j1', 'juice'), item('m3', 'milk'), item('j2', 'juice'),
    item('c1', 'can'), item('j3', 'juice'), item('c2', 'can'), item('c3', 'can'),
  ];
  expect(detectMatches(board, 3, 4, 3)).toEqual([[0, 1, 2]]);
});

test('swap and booster helpers preserve the board contract', () => {
  const original = createLevelBoard(LEVEL_CONFIGS[6]);
  const swapped = swapSlots(original, 0, 1);
  expect(swapped).not.toBe(original);
  expect(original[0]).not.toBe(swapped[0]);
  expect(findMagnetHintIds(original, 3)).toHaveLength(3);

  const shuffled = shuffleRemainingBoard(original, LEVEL_CONFIGS[6], 500);
  expect(shuffled).not.toBeNull();
  expect(shuffled.map(item => item?.id).sort()).toEqual(original.map(item => item?.id).sort());
  expect(detectMatches(shuffled, 4, 6, 3)).toEqual([]);
});

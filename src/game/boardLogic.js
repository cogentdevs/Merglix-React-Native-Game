export function detectMatches(board, rows, columns, matchSize = 3) {
  const matches = [];

  for (let row = 0; row < rows; row += 1) {
    const rowStart = row * columns;

    for (let column = 0; column <= columns - matchSize; column += 1) {
      const start = rowStart + column;
      const item = board[start];

      if (!item) {
        continue;
      }

      const group = Array.from({length: matchSize}, (_, offset) => start + offset);
      const isFreshRestockGroup = group.every(index => board[index]?.restockLocked);
      if (
        !isFreshRestockGroup &&
        group.every(index => board[index]?.type === item.type)
      ) {
        matches.push(group);
        column += matchSize - 1;
      }
    }
  }

  return matches;
}

export function swapSlots(board, firstIndex, secondIndex) {
  if (
    firstIndex === secondIndex ||
    firstIndex < 0 ||
    secondIndex < 0 ||
    firstIndex >= board.length ||
    secondIndex >= board.length
  ) {
    return board;
  }

  const nextBoard = [...board];
  const activateRestockedItem = item => item?.restockLocked
    ? {...item, restockLocked: false}
    : item;
  [nextBoard[firstIndex], nextBoard[secondIndex]] = [
    activateRestockedItem(nextBoard[secondIndex]),
    activateRestockedItem(nextBoard[firstIndex]),
  ];
  return nextBoard;
}

export function findHintSwap(board, rows, columns, matchSize = 3) {
  for (let first = 0; first < board.length; first += 1) {
    for (let second = first + 1; second < board.length; second += 1) {
      if (!board[first] && !board[second]) continue;
      if (board[first]?.type === board[second]?.type) continue;
      const candidate = swapSlots(board, first, second);
      if (detectMatches(candidate, rows, columns, matchSize).length > 0) return [first, second];
    }
  }
  return null;
}

export function findMagnetHintIds(board, matchSize = 3) {
  const productsByType = new Map();
  board.forEach(item => {
    if (!item) return;
    const products = productsByType.get(item.type) ?? [];
    products.push(item.id);
    productsByType.set(item.type, products);
  });

  for (const products of productsByType.values()) {
    if (products.length >= matchSize) return products.slice(0, matchSize);
  }
  return null;
}

function shuffle(items) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const target = Math.floor(Math.random() * (index + 1));
    [result[index], result[target]] = [result[target], result[index]];
  }
  return result;
}

function createSafeFallback(pool, config, slotCount) {
  const primaryType = config.productTypes.find(type =>
    pool.filter(item => item.type === type).length >= config.matchSize,
  );
  const secondaryType = config.productTypes.find(type => type !== primaryType);
  const remaining = [...pool];
  const take = type => {
    const index = remaining.findIndex(item => item.type === type);
    return index < 0 ? null : remaining.splice(index, 1)[0];
  };
  const candidate = Array.from({length: slotCount}, () => null);

  // A guaranteed hint: swapping row 2/column 1 into row 1/column 3
  // completes the deliberately placed pair without starting with a match.
  candidate[0] = take(primaryType);
  candidate[1] = take(primaryType);
  candidate[2] = take(secondaryType);
  candidate[config.columns] = take(primaryType);

  for (let slot = 0; slot < candidate.length; slot += 1) {
    if (candidate[slot] || remaining.length === 0) continue;
    const column = slot % config.columns;
    const blockedType = column >= 2 &&
      candidate[slot - 1]?.type === candidate[slot - 2]?.type
      ? candidate[slot - 1].type
      : null;
    const itemIndex = Math.max(0, remaining.findIndex(item => item.type !== blockedType));
    candidate[slot] = remaining.splice(itemIndex, 1)[0];
  }
  return candidate;
}

export function shuffleRemainingBoard(board, config, retryLimit = 200) {
  const originalOrder = board.map(item => item?.id ?? null);
  for (let attempt = 0; attempt < retryLimit; attempt += 1) {
    const candidate = shuffle(board);
    const candidateOrder = candidate.map(item => item?.id ?? null);
    const changed = candidateOrder.some((id, index) => id !== originalOrder[index]);
    if (
      changed &&
      detectMatches(candidate, config.rows, config.columns, config.matchSize).length === 0 &&
      findHintSwap(candidate, config.rows, config.columns, config.matchSize)
    ) {
      return candidate;
    }
  }
  return null;
}

export function createLevelBoard(config) {
  const pool = config.productTypes.flatMap(type =>
    Array.from({
      length: config.copiesByType?.[type] ?? config.copiesPerType,
    }, (_, copy) => ({
      id: `${type}-${copy}`,
      type,
    })),
  );
  const slotCount = config.rows * config.columns;

  if (pool.length > slotCount) {
    throw new Error(`Level ${config.level} has more products than shelf slots`);
  }

  for (let attempt = 0; attempt < 500; attempt += 1) {
    const candidate = shuffle([
      ...pool,
      ...Array.from({length: slotCount - pool.length}, () => null),
    ]);
    if (
      detectMatches(candidate, config.rows, config.columns, config.matchSize)
        .length === 0 &&
      findHintSwap(candidate, config.rows, config.columns, config.matchSize)
    ) {
      return candidate;
    }
  }

  const fallback = createSafeFallback(pool, config, slotCount);
  if (
    detectMatches(fallback, config.rows, config.columns, config.matchSize).length === 0 &&
    findHintSwap(fallback, config.rows, config.columns, config.matchSize)
  ) {
    return fallback;
  }

  throw new Error(`Unable to create a playable board for level ${config.level}`);
}

function createRestockCandidate(board, matchedGroups, types, restockStart) {
  const candidate = [...board];

  matchedGroups.forEach((group, groupIndex) => {
    const type = types[groupIndex];
    group.forEach((slot, copy) => {
      candidate[slot] = {
        id: `${type}-restock-${restockStart + groupIndex}-${copy}`,
        type,
        restockLocked: true,
      };
    });
  });

  return candidate;
}

/**
 * Refills one triple for every matched group while preserving the board contract:
 * no opening match, one available player swap, and unique product IDs.
 */
export function refillMatchedSlots(
  board,
  config,
  matchedGroups,
  restockStart = 1,
  retryLimit = 800,
) {
  const groups = matchedGroups.filter(group =>
    group.length === config.matchSize && group.every(slot => board[slot] === null),
  );
  const productTypes = [...new Set(config.productTypes)];

  if (!groups.length || !productTypes.length) return null;

  for (let attempt = 0; attempt < retryLimit; attempt += 1) {
    const types = groups.map(() =>
      productTypes[Math.floor(Math.random() * productTypes.length)],
    );
    const candidate = createRestockCandidate(board, groups, types, restockStart);
    if (
      detectMatches(candidate, config.rows, config.columns, config.matchSize).length === 0 &&
      findHintSwap(candidate, config.rows, config.columns, config.matchSize)
    ) {
      return candidate;
    }
  }

  return null;
}

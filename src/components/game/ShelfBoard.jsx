import React, {memo, useMemo} from 'react';
import {Image, StyleSheet, View} from 'react-native';
import Animated, {useAnimatedStyle, useSharedValue} from 'react-native-reanimated';
import {PRODUCT_ASSETS} from '../../game/levelConfigs';
import ProductItem from './ProductItem';

function ShelfBoard({board, rows, columns, boardSize, boardHeight = boardSize,
  selectedIndex, matchingIndices,
  disabled, onTap, onDrop, onInteraction, hintIndices,
  highlightedProductIds, onMatchAnimationComplete, shelfSource,
  generatedShelves = false}) {
  const activeTarget = useSharedValue(-1);
  const geometry = useMemo(() => {
    const horizontalInset = boardSize * 0.065;
    // Each shelf image has slightly different wooden-frame padding. Slot
    // bottoms must meet the upper face of a divider, not its middle.
    const verticalInsets = rows === 7
      ? {top: 0.04, bottom: 0.085}
      : rows === 6
        ? {top: 0.045, bottom: 0.081}
      : rows === 5
        ? {top: 0.016, bottom: 0.076}
          : rows === 4
            ? {top: 0.025, bottom: 0.065}
            : {top: 0.03, bottom: 0.065};
    const topInset = boardHeight * verticalInsets.top;
    const usableHeight = boardHeight * (1 - verticalInsets.top - verticalInsets.bottom);
    return {
      horizontalInset,
      topInset,
      slotWidth: (boardSize - horizontalInset * 2) / columns,
      rowHeight: usableHeight / rows,
    };
  }, [boardHeight, boardSize, columns, rows]);

  const targetStyle = useAnimatedStyle(() => {
    const target = activeTarget.value;
    const targetColumn = target < 0 ? 0 : target % columns;
    const targetRow = target < 0 ? 0 : Math.floor(target / columns);
    return {
      opacity: target < 0 ? 0 : 1,
      transform: [
        {translateX: geometry.horizontalInset + targetColumn * geometry.slotWidth},
        {translateY: geometry.topInset + targetRow * geometry.rowHeight},
      ],
    };
  });
  const matchCompletionIndex = matchingIndices.size > 0
    ? Math.min(...matchingIndices)
    : -1;

  return <View style={[styles.board, {width: boardSize, height: boardHeight}]}>
    <Image source={shelfSource} resizeMode="stretch" style={styles.shelf} />
    {generatedShelves ? Array.from({length: rows - 1}, (_, index) => (
      <View
        key={`shelf-${index}`}
        pointerEvents="none"
        style={[
          styles.generatedShelf,
          {
            left: geometry.horizontalInset,
            top: geometry.topInset + geometry.rowHeight * (index + 1) - boardHeight * 0.016,
            width: boardSize - geometry.horizontalInset * 2,
            height: boardHeight * 0.032,
          },
        ]}
      />
    )) : null}
    <Animated.View pointerEvents="none" style={[styles.dropTarget,
      {width: geometry.slotWidth, height: geometry.rowHeight}, targetStyle]} />
    {board.map((item, index) => {
      if (!item) return null;
      const row = Math.floor(index / columns);
      const column = index % columns;
      return <ProductItem
        key={item.id}
        activeTarget={activeTarget}
        disabled={disabled}
        index={index}
        matching={matchingIndices.has(index)}
        notifyMatchComplete={index === matchCompletionIndex}
        onMatchAnimationComplete={onMatchAnimationComplete}
        hint={hintIndices.has(index) || highlightedProductIds.has(item.id)}
        onDrop={onDrop}
        onInteraction={onInteraction}
        columns={columns}
        rows={rows}
        onTap={onTap}
        rowHeight={geometry.rowHeight}
        positionX={geometry.horizontalInset + column * geometry.slotWidth}
        positionY={geometry.topInset + row * geometry.rowHeight}
        selected={selectedIndex === index}
        slotWidth={geometry.slotWidth}
        source={PRODUCT_ASSETS[item.type]}
      />;
    })}
  </View>;
}

export default memo(ShelfBoard);

const styles = StyleSheet.create({
  board: {position: 'relative', overflow: 'hidden'},
  shelf: {...StyleSheet.absoluteFillObject, width: '100%', height: '100%'},
  generatedShelf: {position: 'absolute', zIndex: 1, borderRadius: 8,
    backgroundColor: '#A94F18', borderTopWidth: 2, borderTopColor: '#E39443',
    borderBottomWidth: 3, borderBottomColor: '#5A210B', elevation: 2},
  dropTarget: {position: 'absolute', left: 0, top: 0, zIndex: 2,
    borderRadius: 12, borderWidth: 3, borderColor: '#FFD83D',
    backgroundColor: 'rgba(255,216,61,0.2)'},
});

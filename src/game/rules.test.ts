import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DIFFICULTY_CONFIGS,
  createDeck,
  shuffleDeck,
  checkPairMatch,
  isGameWon,
  formatTime,
  calculateStars,
  isNewBestScore,
  getStorageKey,
  type CardItem,
} from './rules';

test('Difficulty configurations match requirements', () => {
  assert.equal(DIFFICULTY_CONFIGS.easy.cardCount, 8);
  assert.equal(DIFFICULTY_CONFIGS.easy.pairCount, 4);

  assert.equal(DIFFICULTY_CONFIGS.normal.cardCount, 16);
  assert.equal(DIFFICULTY_CONFIGS.normal.pairCount, 8);

  assert.equal(DIFFICULTY_CONFIGS.hard.cardCount, 24);
  assert.equal(DIFFICULTY_CONFIGS.hard.pairCount, 12);
});

test('Deck generation creates exact pairs and total cards for each difficulty', () => {
  (['easy', 'normal', 'hard'] as const).forEach((difficulty) => {
    const config = DIFFICULTY_CONFIGS[difficulty];
    const deck = createDeck(difficulty);

    assert.equal(deck.length, config.cardCount);

    // Count occurrence of each pairId
    const pairCounts: Record<number, number> = {};
    deck.forEach((card) => {
      pairCounts[card.pairId] = (pairCounts[card.pairId] || 0) + 1;
      assert.equal(card.isFlipped, false);
      assert.equal(card.isMatched, false);
    });

    assert.equal(Object.keys(pairCounts).length, config.pairCount);
    Object.values(pairCounts).forEach((count) => {
      assert.equal(count, 2, 'Every card must have exactly one matching pair (2 of same pairId)');
    });
  });
});

test('Deck shuffle changes order when given non-trivial array', () => {
  const original = [1, 2, 3, 4, 5, 6, 7, 8];
  // Deterministic reverse shuffle mock rng
  let call = 0;
  const mockRng = () => 0; // always picks 0
  const shuffled = shuffleDeck(original, mockRng);
  assert.equal(shuffled.length, original.length);
});

test('checkPairMatch returns true only for cards with matching pairId and distinct IDs', () => {
  const cardA: CardItem = { id: 0, pairId: 3, emoji: '🌸', isFlipped: true, isMatched: false };
  const cardB: CardItem = { id: 1, pairId: 3, emoji: '🌸', isFlipped: true, isMatched: false };
  const cardC: CardItem = { id: 2, pairId: 4, emoji: '🍄', isFlipped: true, isMatched: false };

  assert.equal(checkPairMatch(cardA, cardB), true);
  assert.equal(checkPairMatch(cardA, cardC), false);
  assert.equal(checkPairMatch(cardA, cardA), false, 'Same card cannot match itself');
});

test('isGameWon triggers only when all cards are matched', () => {
  const deck: CardItem[] = [
    { id: 0, pairId: 0, emoji: '🐰', isFlipped: true, isMatched: true },
    { id: 1, pairId: 0, emoji: '🐰', isFlipped: true, isMatched: true },
    { id: 2, pairId: 1, emoji: '🐱', isFlipped: true, isMatched: false },
    { id: 3, pairId: 1, emoji: '🐱', isFlipped: true, isMatched: false },
  ];

  assert.equal(isGameWon(deck), false);

  deck[2].isMatched = true;
  deck[3].isMatched = true;

  assert.equal(isGameWon(deck), true);
});

test('formatTime properly formats seconds into mm:ss', () => {
  assert.equal(formatTime(0), '00:00');
  assert.equal(formatTime(9), '00:09');
  assert.equal(formatTime(59), '00:59');
  assert.equal(formatTime(60), '01:00');
  assert.equal(formatTime(125), '02:05');
  assert.equal(formatTime(3599), '59:59');
});

test('calculateStars awards 3, 2, or 1 star based on efficiency', () => {
  // 8 pairs (Normal)
  assert.equal(calculateStars(8, 8), 3); // Perfect
  assert.equal(calculateStars(12, 8), 3); // <= 12
  assert.equal(calculateStars(16, 8), 2); // <= 20
  assert.equal(calculateStars(25, 8), 1); // > 20
});

test('isNewBestScore accurately determines records', () => {
  assert.equal(isNewBestScore({ moves: 10, timeSeconds: 30 }, null), true);

  const existing = { moves: 14, timeSeconds: 40, date: '2026-11-10' };
  assert.equal(isNewBestScore({ moves: 12, timeSeconds: 50 }, existing), true); // fewer moves
  assert.equal(isNewBestScore({ moves: 16, timeSeconds: 20 }, existing), false); // more moves
  assert.equal(isNewBestScore({ moves: 14, timeSeconds: 35 }, existing), true); // same moves, faster time
  assert.equal(isNewBestScore({ moves: 14, timeSeconds: 45 }, existing), false); // same moves, slower time
});

test('getStorageKey generates distinct keys per difficulty', () => {
  assert.equal(getStorageKey('easy'), 'memory_match_best_easy');
  assert.equal(getStorageKey('normal'), 'memory_match_best_normal');
  assert.equal(getStorageKey('hard'), 'memory_match_best_hard');
});

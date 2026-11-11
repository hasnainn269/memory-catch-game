/**
 * Pure game rules and state calculation logic for Memory Match Challenge.
 * Completely decoupled from DOM for unit testing.
 */

export type Difficulty = 'easy' | 'normal' | 'hard';

export interface DifficultyConfig {
  name: Difficulty;
  label: string;
  cardCount: number;
  pairCount: number;
  gridCols: number;
}

export const DIFFICULTY_CONFIGS: Record<Difficulty, DifficultyConfig> = {
  easy: {
    name: 'easy',
    label: 'Easy',
    cardCount: 8,
    pairCount: 4,
    gridCols: 4,
  },
  normal: {
    name: 'normal',
    label: 'Normal',
    cardCount: 16,
    pairCount: 8,
    gridCols: 4,
  },
  hard: {
    name: 'hard',
    label: 'Hard',
    cardCount: 24,
    pairCount: 12,
    gridCols: 6,
  },
};

export const CUTE_EMOJIS: string[] = [
  '🐰', '🐱', '🦊', '🐼', '🦄', '🍓', '🥑', '🌸',
  '🍄', '🍩', '🧁', '🌈', '🐣', '🧋', '🍭', '🍡',
  '🍉', '🐶', '🍦', '🦋', '🐝', '🍎', '🎈', '🌟',
];

export interface CardItem {
  id: number;
  pairId: number;
  emoji: string;
  isFlipped: boolean;
  isMatched: boolean;
}

export interface BestScore {
  moves: number;
  timeSeconds: number;
  date: string;
}

/**
 * Creates and shuffles a deck of cards for the given difficulty.
 * Random shuffle uses Fisher-Yates algorithm.
 */
export function createDeck(difficulty: Difficulty, rng: () => number = Math.random): CardItem[] {
  const config = DIFFICULTY_CONFIGS[difficulty];
  const selectedEmojis = CUTE_EMOJIS.slice(0, config.pairCount);

  const cards: CardItem[] = [];
  let id = 0;

  selectedEmojis.forEach((emoji, pairIndex) => {
    // Each emoji creates 2 cards (1 pair)
    cards.push({
      id: id++,
      pairId: pairIndex,
      emoji,
      isFlipped: false,
      isMatched: false,
    });
    cards.push({
      id: id++,
      pairId: pairIndex,
      emoji,
      isFlipped: false,
      isMatched: false,
    });
  });

  return shuffleDeck(cards, rng);
}

/**
 * Fisher-Yates shuffle algorithm.
 */
export function shuffleDeck<T>(items: T[], rng: () => number = Math.random): T[] {
  const array = [...items];
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

/**
 * Checks if two card IDs match based on their pairId.
 */
export function checkPairMatch(card1: CardItem, card2: CardItem): boolean {
  return card1.pairId === card2.pairId && card1.id !== card2.id;
}

/**
 * Checks if all pairs in the deck are matched.
 */
export function isGameWon(deck: CardItem[]): boolean {
  if (deck.length === 0) return false;
  return deck.every((card) => card.isMatched);
}

/**
 * Format time in seconds to mm:ss string.
 */
export function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Calculates star rating (1 to 3 stars) based on moves and optimal pairs.
 * Optimal moves = pairCount.
 * 3 stars: moves <= pairCount * 1.5
 * 2 stars: moves <= pairCount * 2.5
 * 1 star: moves > pairCount * 2.5
 */
export function calculateStars(moves: number, pairCount: number): number {
  if (moves <= Math.ceil(pairCount * 1.5)) return 3;
  if (moves <= Math.ceil(pairCount * 2.5)) return 2;
  return 1;
}

/**
 * Evaluates whether a new score is better than the existing best score.
 * Lower moves is prioritized, then lower time if moves are equal.
 */
export function isNewBestScore(
  current: { moves: number; timeSeconds: number },
  existing: BestScore | null
): boolean {
  if (!existing) return true;
  if (current.moves < existing.moves) return true;
  if (current.moves === existing.moves && current.timeSeconds < existing.timeSeconds) return true;
  return false;
}

/**
 * Get localStorage key for a difficulty level.
 */
export function getStorageKey(difficulty: Difficulty): string {
  return `memory_match_best_${difficulty}`;
}

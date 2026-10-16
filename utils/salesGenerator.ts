import { SimulatorConfig } from '../types';

/**
 * Generate random integer amounts in minor units within [min, max].
 * If targetTotal is set, distribute so the sum equals target while
 * respecting min/max per item. Returns null + error if impossible.
 */
export function generateAmounts(config: SimulatorConfig): {
  amounts: number[];
  error: string | null;
} {
  const { totalNotifications: n, minAmount: min, maxAmount: max, targetTotal } = config;

  if (n <= 0) {
    return { amounts: [], error: 'Total notifications must be at least 1' };
  }
  if (min < 0 || max < min) {
    return { amounts: [], error: 'Invalid min/max amount range' };
  }

  if (targetTotal == null) {
    // pure random
    const amounts: number[] = [];
    for (let i = 0; i < n; i++) {
      amounts.push(randomInt(min, max));
    }
    return { amounts, error: null };
  }

  // with target
  const minSum = n * min;
  const maxSum = n * max;
  if (targetTotal < minSum || targetTotal > maxSum) {
    return {
      amounts: [],
      error: `Target total ${targetTotal} is outside possible range [${minSum}, ${maxSum}] for ${n} notifications`,
    };
  }

  // Start with all min, then distribute remaining
  const amounts = new Array(n).fill(min);
  let remaining = targetTotal - minSum;

  // Greedy distribution with randomness
  const indices = Array.from({ length: n }, (_, i) => i);
  shuffle(indices);

  for (const idx of indices) {
    if (remaining <= 0) break;
    const room = max - amounts[idx];
    const add = Math.min(room, remaining);
    // add a random portion to keep variance
    const portion = Math.floor(add * (0.3 + Math.random() * 0.7));
    amounts[idx] += portion;
    remaining -= portion;
  }

  // Final pass to exact target
  while (remaining > 0) {
    let added = false;
    for (let i = 0; i < n && remaining > 0; i++) {
      if (amounts[i] < max) {
        amounts[i] += 1;
        remaining -= 1;
        added = true;
      }
    }
    if (!added) break;
  }

  // Safety
  const sum = amounts.reduce((a, b) => a + b, 0);
  if (sum !== targetTotal) {
    return {
      amounts: [],
      error: `Could not distribute exact target (got ${sum}). Try different min/max/count.`,
    };
  }

  return { amounts, error: null };
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle<T>(arr: T[]): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

// Helpers shared by test files. Only tests import this, so it never ships in the game.

import { expect } from 'vitest'
import type { Big } from './big.ts'

/**
 * A tiny seeded random generator (a linear congruential generator). The same seed always gives
 * the same sequence, so a failing random test fails the same way every run.
 */
export function makeRandom(seed: number): () => number {
  let state = seed
  return () => {
    state = (state * 1664525 + 1013904223) % 2 ** 32
    return state / 2 ** 32
  }
}

/**
 * Close if the ratio is within 1e-12 of 1. Big keeps about 16 significant digits, like a number,
 * so calculated values can differ in the last digit. A ratio works past a number's range too.
 */
export function expectBigClose(actual: Big, expected: Big): void {
  expect(Math.abs(actual.div(expected).toNumber() - 1)).toBeLessThanOrEqual(1e-12)
}

// Helpers shared by test files. Only tests import this, so it never ships in the game.

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

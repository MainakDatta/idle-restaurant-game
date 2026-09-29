// Helpers shared by the tests in src/runtime/. Only tests import this, so it never ships.

import type { Clock } from './loop.ts'

export type FakeClock = {
  /** Hand this to the code under test in place of the browser. */
  clock: Clock
  /** Moves time forward by `ms` (backward if negative), then runs the waiting frames. */
  frameAfter(ms: number): void
  /** How many frames are waiting to run. A running loop has exactly one. */
  waitingFrames(): number
}

/**
 * A pretend browser for loop tests. Time stands still and frames never run until the test calls
 * `frameAfter`, so every test controls exactly how much time each frame sees.
 */
export function makeFakeClock(): FakeClock {
  let time = 1_000_000 // any start works; the loop only looks at differences
  let nextId = 1
  const waiting = new Map<number, () => void>()

  return {
    clock: {
      now: () => time,
      requestFrame: (callback) => {
        const id = nextId++
        waiting.set(id, callback)
        return id
      },
      cancelFrame: (id) => {
        waiting.delete(id)
      },
    },
    frameAfter: (ms) => {
      time += ms
      // Like a browser, run only the frames that were waiting when this repaint began. Frames
      // requested while they run wait for the next repaint.
      for (const id of [...waiting.keys()]) {
        const callback = waiting.get(id)
        if (callback === undefined) continue // cancelled by an earlier frame in this repaint
        waiting.delete(id)
        callback()
      }
    },
    waitingFrames: () => waiting.size,
  }
}

// Starts a game: a store for its state, and the one loop that moves it forward in time (D27).

import type { Big } from '../game/big.ts'
import { advance, type GameState } from '../game/state.ts'
import { browserClock, createLoop, type Clock } from './loop.ts'
import { createGameStateStore, type GameStateStore } from './store.ts'

/**
 * A frame longer than this means the player wasn't watching: the tab was hidden, the window
 * minimized or the device asleep. A normal frame is about 0.016 s.
 */
export const AWAY_AFTER_SECONDS = 1

/** What happened while the player was away. For now it's only logged, as a debugging aid. */
export type CatchUp = {
  /** How long they were away. */
  seconds: number
  /** The money earned in that time. */
  earned: Big
}

export type StartOptions = {
  /** Called after each catch-up, once the store has the new state. */
  onCatchUp?: (catchUp: CatchUp) => void
  /** The real browser unless a test passes a fake one. */
  clock?: Clock
}

/**
 * Starts the game and returns its store. Every frame, the state advances by the real time since
 * the previous frame, and that includes all the time away when a hidden tab comes back (D11).
 * main.tsx calls this once, outside React, so StrictMode can't start a second loop.
 */
export function startGame(
  initial: GameState,
  { onCatchUp, clock = browserClock }: StartOptions = {},
): GameStateStore {
  const store = createGameStateStore(initial)
  createLoop((seconds) => {
    const before = store.getState()
    const after = advance(before, seconds)
    store.setState(after)
    if (onCatchUp !== undefined && seconds > AWAY_AFTER_SECONDS) {
      onCatchUp({ seconds, earned: after.money.sub(before.money) })
    }
  }, clock).start()
  return store
}

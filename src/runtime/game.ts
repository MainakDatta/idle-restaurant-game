// Starts a game: a store for its state, and the one loop that moves it forward in time (D27).

import { advance, type GameState } from '../game/state.ts'
import { browserClock, createLoop, type Clock } from './loop.ts'
import { createGameStore, type GameStore } from './store.ts'

/**
 * Starts the game and returns its store. Every frame, the state advances by the real time since
 * the previous frame, and that includes all the time away when a hidden tab comes back (D11).
 * main.tsx calls this once, outside React, so StrictMode can't start a second loop.
 */
export function startGame(initial: GameState, clock: Clock = browserClock): GameStore {
  const store = createGameStore(initial)
  createLoop((seconds) => store.setState(advance(store.getState(), seconds)), clock).start()
  return store
}

// Where the current game state lives while the game runs. The loop replaces it every frame.
// React reads it, and later the Pixi scene and saves will too, so it lives outside all of them.

import type { GameState } from '../game/state.ts'

export type GameStateStore = {
  /** The current state: the same object until something changes. */
  getState(): GameState
  /** Replaces the state and tells every listener, unless it's the same object as before. */
  setState(next: GameState): void
  /** Calls `listener` after every change. Returns a function that stops the calls. */
  subscribe(listener: () => void): () => void
}

// Built from closures rather than a class: nothing uses `this`, so React can be handed
// `store.subscribe` and `store.getState` on their own and call them later.
export function createGameStateStore(initial: GameState): GameStateStore {
  let state = initial
  const listeners = new Set<() => void>()

  return {
    getState: () => state,
    setState: (next) => {
      if (next === state) return // advance hands back the same object when nothing changed
      state = next
      for (const listener of listeners) listener()
    },
    subscribe: (listener) => {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
  }
}

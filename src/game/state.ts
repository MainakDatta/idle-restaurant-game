// The game's state, and the one function that moves it forward in time (D11).
//
// Everything here is pure: no clock, no timers. The loop in src/runtime/ measures how much time
// has passed and calls advance, and coming back after time away goes through the same call.

import { Big } from './big.ts'

/**
 * Everything about a game in progress. It's never changed in place, only replaced, so a new
 * object means something happened. Step 4 adds the coffee shop and step 7 the rush and Buzz.
 * Any timer added here is a duration ("42 s left"), never a clock time, so advance can move
 * it forward like everything else.
 */
export type GameState = {
  readonly money: Big
}

/**
 * A stand-in income until step 4 builds the coffee shop's economy (D17, D19). At $1 a second,
 * money equals the seconds since the page opened, which is easy to check with a stopwatch.
 */
export const PLACEHOLDER_INCOME_PER_SECOND: Big = Big.ONE

/** A new game: no money yet. */
export function newGame(): GameState {
  return { money: Big.ZERO }
}

/**
 * Moves the game forward by `seconds` of real time. It's the only way time passes (D11): a
 * frame of live play passes about 0.016 s, and the first frame back from another tab passes
 * the whole time away. Returns a new state and leaves the one it was given alone.
 */
export function advance(state: GameState, seconds: number): GameState {
  // A clock that went backward is turned into 0 by the loop, where the clock is read. Anything
  // else that isn't a real amount of time is a bug, so it fails here, loudly.
  if (!Number.isFinite(seconds) || seconds < 0) {
    throw new RangeError(`advance: seconds must be a finite number ≥ 0, got ${seconds}`)
  }
  // No time passed, so nothing changed: returning the same object tells the store to skip
  // redrawing.
  if (seconds === 0) return state
  // `...state` copies every other field unchanged, which matters once there are more of them.
  return { ...state, money: state.money.add(PLACEHOLDER_INCOME_PER_SECOND.mul(seconds)) }
}

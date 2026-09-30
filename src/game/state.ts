// The game's state, and the one function that moves it forward in time (D11).
//
// Everything here is pure: no clock, no timers. The loop in src/runtime/ measures how much time
// has passed and calls advance, and coming back after time away goes through the same call.

import { Big } from './big.ts'
import { economy } from './economy.ts'
import type { Franchise, UpgradeItemId } from './franchise.ts'

/**
 * Each leveled upgrade's current level, by id: { tables: 3, baristas: 2, latte: 0 }. 0 means
 * a menu item that isn't unlocked yet. `Record<K, V>` is TypeScript's type for an object used
 * as a dictionary; a plain object rather than a Map, because it has to save as JSON (step 6).
 */
export type UpgradeLevels = Readonly<Record<UpgradeItemId, number>>

/**
 * Everything about a game in progress. It's never changed in place, only replaced, so a new
 * object means something happened. Step 7 adds the rush and Buzz. Any timer added here is a
 * duration ("42 s left"), never a clock time, so advance can move it forward like everything
 * else.
 */
export type GameState = {
  readonly money: Big
  /** Tables, Baristas and each menu item. */
  readonly levels: UpgradeLevels
  /** The one-time global upgrades bought so far: ["chalkboard-sign"]. */
  readonly globalUpgradesBought: readonly UpgradeItemId[]
}

/** A new game: no money, and every leveled upgrade at its starting level from the file. */
export function newGame(franchise: Franchise): GameState {
  const levels: Record<UpgradeItemId, number> = {
    [franchise.demand.id]: franchise.demand.startLevel,
    [franchise.staff.id]: franchise.staff.startLevel,
  }
  // A menu item starts at level 1 if it's on the menu from the start, and locked (0) otherwise.
  for (const item of franchise.menu) levels[item.id] = item.unlock === null ? 1 : 0
  return { money: Big.ZERO, levels, globalUpgradesBought: [] }
}

/**
 * Moves the game forward by `seconds` of real time, earning the shop's income (economy.ts) for
 * that long. It's the only way time passes (D11): a frame of live play passes about 0.016 s,
 * and the first frame back from another tab passes the whole time away. Returns a new state and
 * leaves the one it was given alone.
 */
export function advance(franchise: Franchise, state: GameState, seconds: number): GameState {
  // A clock that went backward is turned into 0 by the loop, where the clock is read. Anything
  // else that isn't a real amount of time is a bug, so it fails here, loudly.
  if (!Number.isFinite(seconds) || seconds < 0) {
    throw new RangeError(`advance: seconds must be a finite number ≥ 0, got ${seconds}`)
  }
  // No time passed, so nothing changed: returning the same object tells the store to skip
  // redrawing.
  if (seconds === 0) return state
  // Income only changes when something is bought, and nothing is bought during a step, so one
  // multiplication covers any length of time exactly (D18).
  const earned = economy(franchise, state).incomePerSecond.mul(seconds)
  // `...state` copies every other field unchanged, which matters once there are more of them.
  return { ...state, money: state.money.add(earned) }
}

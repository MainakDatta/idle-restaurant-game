// A simulated player runs the coffee shop through the real engine, checked against design.md's
// placeholder pacing: first purchase at 6 s, first bonus at 2 min, menu unlocks at 6 min, 8 min
// and 2.4 h. When Phase 1 retunes the coffee shop, design.md and these ranges change together.

import { beforeAll, describe, expect, test } from 'vitest'
import type { Big } from './big.ts'
import { economy } from './economy.ts'
import { COFFEE_SHOP, leveledUpgrades, type UpgradeItemId } from './franchise.ts'
import { advance, newGame, type GameState } from './state.ts'
import { buy, nextCost, requirementMet } from './upgrades.ts'

const MINUTE = 60
const HOUR = 60 * MINUTE

/** One purchase the simulated player made. */
type Purchase = {
  readonly id: UpgradeItemId
  /** Seconds since the game started. */
  readonly at: number
  /** The level it reached, or undefined for a global upgrade. */
  readonly level: number | undefined
  readonly incomeBefore: Big
  readonly incomeAfter: Big
}

/**
 * Plays the coffee shop until pumpkin spice latte is unlocked (or `giveUpAfter` seconds pass).
 * The player always picks the purchase that adds the most income per dollar, waits until it
 * can afford it, and buys it. It's the strategy our design-chat handoff describes; other players
 * wait between purchases differently, but unlock at about the same times.
 */
function playUntilPumpkinSpice(giveUpAfter = 6 * HOUR): Purchase[] {
  const purchases: Purchase[] = []
  let state = newGame(COFFEE_SHOP)
  let seconds = 0
  while (state.levels['pumpkin-spice-latte'] === 0 && seconds < giveUpAfter) {
    const incomeBefore = economy(COFFEE_SHOP, state).incomePerSecond
    const id = bestValue(state, incomeBefore)
    const cost = nextCost(COFFEE_SHOP, state, id)!
    if (state.money.lt(cost)) {
      // Wait until it's affordable, plus a millisecond so rounding can't leave it a hair short.
      const wait = cost.sub(state.money).div(incomeBefore).toNumber() + 0.001
      state = advance(COFFEE_SHOP, state, wait)
      seconds += wait
    }
    state = buy(COFFEE_SHOP, state, id)
    const incomeAfter = economy(COFFEE_SHOP, state).incomePerSecond
    purchases.push({ id, at: seconds, level: state.levels[id], incomeBefore, incomeAfter })
  }
  return purchases
}

/** The purchase on offer that adds the most income per dollar, money aside. */
function bestValue(state: GameState, income: Big): UpgradeItemId {
  const ids = [
    ...leveledUpgrades(COFFEE_SHOP).map((upgrade) => upgrade.id),
    ...COFFEE_SHOP.globalUpgrades.map((upgrade) => upgrade.id),
  ]
  let best: UpgradeItemId | undefined
  let bestPerDollar = -Infinity
  for (const id of ids) {
    const cost = nextCost(COFFEE_SHOP, state, id)
    if (cost === null || !requirementMet(COFFEE_SHOP, state, id)) continue
    // What income would be with it bought, using a copy of the state with just enough money.
    const after = economy(COFFEE_SHOP, buy(COFFEE_SHOP, { ...state, money: cost }, id))
    // Plain numbers are fine at these amounts, and unlike Big they can go below zero, for a
    // purchase that would lower income.
    const perDollar = (after.incomePerSecond.toNumber() - income.toNumber()) / cost.toNumber()
    if (perDollar > bestPerDollar) [best, bestPerDollar] = [id, perDollar]
  }
  if (best === undefined) throw new Error('bestValue: nothing left to buy')
  return best
}

describe("the coffee shop's pacing, for a player who buys the best value", () => {
  let purchases: Purchase[] = []
  beforeAll(() => {
    purchases = playUntilPumpkinSpice()
  })

  // Everything else starts at level 1 or above, so a purchase that reaches level 1 is an unlock.
  const unlocks = () => purchases.filter((purchase) => purchase.level === 1)
  const unlockedAt = (id: UpgradeItemId) => unlocks().find((unlock) => unlock.id === id)?.at

  test('first purchase within 5–8 s (design.md: 6 s)', () => {
    expect(purchases[0]?.at).toBeGreaterThanOrEqual(5)
    expect(purchases[0]?.at).toBeLessThanOrEqual(8)
  })

  test('first bonus level within 1.5–3 min (design.md: 2 min)', () => {
    const firstBonusLevel = COFFEE_SHOP.bonusLevels.at[0]?.level
    const firstBonus = purchases.find((purchase) => purchase.level === firstBonusLevel)
    expect(firstBonus?.at).toBeGreaterThanOrEqual(1.5 * MINUTE)
    expect(firstBonus?.at).toBeLessThanOrEqual(3 * MINUTE)
  })

  test.each([
    ['latte', '3–9 min', '6 min', 3 * MINUTE, 9 * MINUTE],
    ['muffin', '5–11 min', '8 min', 5 * MINUTE, 11 * MINUTE],
    ['pumpkin-spice-latte', '2–3 h', '2.4 h', 2 * HOUR, 3 * HOUR],
  ])('%s unlocks within %s (design.md: %s)', (id, _range, _design, earliest, latest) => {
    expect(unlockedAt(id)).toBeGreaterThanOrEqual(earliest)
    expect(unlockedAt(id)).toBeLessThanOrEqual(latest)
  })

  // D19: each unlock raises income at the point it typically unlocks.
  test('every unlock raises income', () => {
    expect(unlocks().map((unlock) => unlock.id)).toEqual(['latte', 'muffin', 'pumpkin-spice-latte'])
    for (const unlock of unlocks()) {
      expect(unlock.incomeAfter.gt(unlock.incomeBefore), unlock.id).toBe(true)
    }
  })
})

import { describe, expect, test } from 'vitest'
import { Big } from './big.ts'
import { bonusMultiplier, economy } from './economy.ts'
import { COFFEE_SHOP, leveledUpgrades, type BonusLevels, type UpgradeItemId } from './franchise.ts'
import { newGame, type GameState } from './state.ts'
import { expectBigClose, makeRandom } from './test-utils.ts'
import { buy, nextCost, requirementMet } from './upgrades.ts'

/** A coffee shop game with some levels changed from the start, and some global upgrades. */
function gameWith(levels: Record<UpgradeItemId, number>, bought: UpgradeItemId[] = []): GameState {
  const start = newGame(COFFEE_SHOP)
  return { ...start, levels: { ...start.levels, ...levels }, globalUpgradesBought: bought }
}

/** Checks each number in `expected` against the economy, to about 12 significant digits. */
function expectEconomy(
  state: GameState,
  expected: Record<string, number>,
  franchise = COFFEE_SHOP,
) {
  const actual: Record<string, Big> = economy(franchise, state)
  for (const [name, value] of Object.entries(expected)) {
    expect(actual[name], name).toBeDefined()
    // A ratio can't compare with 0, so 0 has to match exactly.
    if (value === 0) expect(actual[name].eq(0), name).toBe(true)
    else expectBigClose(actual[name], Big.fromValue(value))
  }
}

/** Big.pow works through logarithms, so ×8 can come out as 7.999…; close is good enough. */
function expectMultiplier(bonusLevels: BonusLevels, level: number, multiplier: number) {
  expectBigClose(bonusMultiplier(bonusLevels, level), Big.fromValue(multiplier))
}

describe('a new coffee shop', () => {
  // design.md's opening: Service a little above Demand, and the first $2 table in about 6 s.
  test('opens at Demand 6/min, Service 7.5/min, Spend $3 and $0.315/s', () => {
    expectEconomy(newGame(COFFEE_SHOP), {
      demand: 6, // 1 table × 6 customers a minute
      service: 7.5, // 1 barista × 60 s ÷ 8 s per drip coffee
      spend: 3,
      served: 6.3, // all 6, plus 20% of the 1.5 spare, from the barista handing out samples
      incomePerSecond: 0.315, // 6.3 customers × $3 ÷ 60 s
    })
    expect(economy(COFFEE_SHOP, newGame(COFFEE_SHOP)).selfServe.eq(0)).toBe(true)
  })
})

describe('bonus levels', () => {
  // The coffee shop's setting: ×2 at 10, 25, 50 and 100, then ×2 every 50 levels.
  test.each([
    [1, 1],
    [9, 1],
    [10, 2],
    [24, 2],
    [25, 4],
    [49, 4],
    [50, 8],
    [100, 16],
    [149, 16],
    [150, 32],
    [200, 64],
  ])("level %i multiplies output by %i with the coffee shop's setting", (level, multiplier) => {
    expectMultiplier(COFFEE_SHOP.bonusLevels, level, multiplier)
  })

  const EVERY_10: BonusLevels = { at: [], thenEvery: { levels: 10, multiplier: 2 } }
  const LIST_ONLY: BonusLevels = { ...COFFEE_SHOP.bonusLevels, thenEvery: null }
  const MIXED: BonusLevels = {
    at: [
      { level: 10, multiplier: 2 },
      { level: 25, multiplier: 3 },
    ],
    thenEvery: null,
  }
  test.each([
    ['every 10 levels', 9, 1, EVERY_10],
    ['every 10 levels', 10, 2, EVERY_10],
    ['every 10 levels', 35, 8, EVERY_10],
    ['a list with no repeat', 100, 16, LIST_ONLY],
    ['a list with no repeat', 1000, 16, LIST_ONLY],
    ['×2 at 10, then ×3 at 25', 24, 2, MIXED],
    ['×2 at 10, then ×3 at 25', 25, 6, MIXED],
  ])('%s: level %i is ×%i', (_name, level, multiplier, bonusLevels) => {
    expectMultiplier(bonusLevels, level, multiplier)
  })

  test("multiply Tables' customers, Baristas' service and a menu item's speed", () => {
    expectEconomy(gameWith({ tables: 10 }), { demand: 6 * 10 * 2 })
    expectEconomy(gameWith({ baristas: 10 }), { service: 10 * 2 * (60 / 8) })
    // Drip coffee at 10 is made in 4 s instead of 8, and costs 3 × (1 + 0.1 × 9) = $5.70.
    expectEconomy(gameWith({ 'drip-coffee': 10 }), { service: 60 / 4, spend: 5.7 })
  })
})

describe('the menu', () => {
  test('each level adds 10% of the starting price', () => {
    expectEconomy(gameWith({ 'drip-coffee': 2 }), { spend: 3.3 })
    expectEconomy(gameWith({ 'drip-coffee': 50 }), { spend: 3 * (1 + 0.1 * 49) })
  })

  // Drip (popularity 5, $3, 8 s) and latte (popularity 4, $51, 12 s): 5 of every 9 customers
  // order drip.
  test('Spend and prep time are averaged by popularity', () => {
    expectEconomy(gameWith({ latte: 1 }), {
      spend: (5 * 3 + 4 * 51) / 9,
      service: 60 / ((5 * 8 + 4 * 12) / 9),
    })
  })

  test('items still locked (level 0) count for nothing', () => {
    expectEconomy(gameWith({ latte: 0, muffin: 0 }), { spend: 3, service: 7.5 })
  })
})

describe('the bottleneck', () => {
  test('idle baristas bring in 20% of their spare capacity', () => {
    // Service 15, Demand 6: all 6 served, plus 20% of the spare 9.
    expectEconomy(gameWith({ baristas: 2 }), { served: 6 + 0.2 * 9, selfServe: 0 })
  })

  test('a line: the baristas serve all they can, and 20% of the rest serve themselves', () => {
    // Demand 12, Service 7.5: 7.5 served, and 20% of the 4.5 waiting grab something.
    expectEconomy(gameWith({ tables: 2 }), {
      served: 7.5,
      selfServe: 0.2 * 4.5,
      incomePerSecond: (7.5 * 3 + 0.9 * 3) / 60, // $0.42/s
    })
  })

  test('self-serve customers pay the cheapest unlocked item, at its current price', () => {
    // Drip at level 11 costs $6, which is cheaper than a latte at $51.
    const state = gameWith({ tables: 5, 'drip-coffee': 11, latte: 1 })
    const now = economy(COFFEE_SHOP, state)
    expect(now.selfServePrice.eq(6)).toBe(true)
    const expected = now.served.mul(now.spend).add(now.selfServe.mul(6)).div(60)
    expectBigClose(now.incomePerSecond, expected)
  })

  test('Demand exactly equal to Service: everyone is served, and nobody is left over', () => {
    // 5 tables bring 30 a minute; 4 baristas at 7.5 each serve 30.
    expectEconomy(gameWith({ tables: 5, baristas: 4 }), { served: 30, selfServe: 0 })
  })

  test('a franchise without self-serve leaves the line unserved', () => {
    const noSelfServe = { ...COFFEE_SHOP, selfServe: null }
    expectEconomy(gameWith({ tables: 2 }), { served: 7.5, selfServe: 0 }, noSelfServe)
  })
})

describe('global upgrades', () => {
  test('each multiplies its own lever once bought', () => {
    expectEconomy(gameWith({}, ['chalkboard-sign']), { demand: 12, service: 7.5 })
    expectEconomy(gameWith({}, ['second-grinder']), { demand: 6, service: 15 })
    expectEconomy(gameWith({}, ['chalkboard-sign', 'loyalty-cards']), { demand: 24 })
  })
})

describe("the design docs' promises", () => {
  // D19: a new item is slow to make, so unlocking it can serve fewer customers while
  // earning more.
  test('unlocking latte serves fewer customers but earns more', () => {
    const before = economy(COFFEE_SHOP, gameWith({}))
    const after = economy(COFFEE_SHOP, gameWith({ latte: 1 }))
    expect(after.served.lt(before.served)).toBe(true)
    expect(after.incomePerSecond.gt(before.incomePerSecond)).toBe(true)
  })

  // D17: spillover means no purchase is ever useless. Checked on random coffee shops: every
  // level and global upgrade on offer raises income. Unlocks are left out: D19 only promises
  // they raise income at the point they typically unlock, which pacing.test.ts checks.
  test.each([1, 2, 3, 4, 5])('every level and global upgrade raises income (seed %i)', (seed) => {
    const random = makeRandom(seed)
    for (let shop = 0; shop < 50; shop++) {
      const state = randomShop(random)
      const income = economy(COFFEE_SHOP, state).incomePerSecond
      for (const id of purchasesOnOffer(state)) {
        const cost = nextCost(COFFEE_SHOP, state, id)!
        const after = buy(COFFEE_SHOP, { ...state, money: cost }, id)
        const gained = economy(COFFEE_SHOP, after).incomePerSecond.gt(income)
        expect(gained, `${id} in ${JSON.stringify(state.levels)}`).toBe(true)
      }
    }
  })
})

/**
 * A coffee shop with random levels from 1 to 50, some menu items still locked (in any order,
 * since unlocks cost money and nothing else), and some global upgrades bought.
 */
function randomShop(random: () => number): GameState {
  const level = () => 1 + Math.floor(random() * 50)
  const levels: Record<UpgradeItemId, number> = {}
  for (const upgrade of leveledUpgrades(COFFEE_SHOP)) {
    const locked = upgrade.unlock !== null && random() < 0.3
    levels[upgrade.id] = locked ? 0 : level()
  }
  const bought = COFFEE_SHOP.globalUpgrades
    .map((upgrade) => upgrade.id)
    .filter(() => random() < 0.5)
  return gameWith(levels, bought)
}

/** The levels and global upgrades that could be bought next, money aside. Unlocks are left out. */
function purchasesOnOffer(state: GameState): UpgradeItemId[] {
  const levelUps = leveledUpgrades(COFFEE_SHOP)
    .map((upgrade) => upgrade.id)
    .filter((id) => state.levels[id] > 0 && nextCost(COFFEE_SHOP, state, id) !== null)
  const globals = COFFEE_SHOP.globalUpgrades
    .map((upgrade) => upgrade.id)
    .filter((id) => nextCost(COFFEE_SHOP, state, id) !== null)
    .filter((id) => requirementMet(COFFEE_SHOP, state, id))
  return [...levelUps, ...globals]
}

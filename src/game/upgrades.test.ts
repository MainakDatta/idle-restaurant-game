import { describe, expect, test } from 'vitest'
import { Big } from './big.ts'
import { COFFEE_SHOP, type UpgradeId } from './franchise.ts'
import { newGame, type GameState } from './state.ts'
import { expectBigClose } from './test-utils.ts'
import { buy, canBuy, nextCost, requirementMet } from './upgrades.ts'

/** A coffee shop game with some levels changed from the start, and some money. */
function gameWith(levels: Record<UpgradeId, number>, money = 0): GameState {
  const start = newGame(COFFEE_SHOP)
  return { ...start, money: Big.fromValue(money), levels: { ...start.levels, ...levels } }
}

describe('what the next level costs', () => {
  // Each level costs 26% more than the one before, starting from the file's first cost.
  test.each([
    ['tables', 1, 2],
    ['tables', 2, 2.52],
    ['tables', 3, 3.1752],
    ['tables', 49, 2 * 1.26 ** 48],
    ['baristas', 1, 8],
    ['baristas', 2, 10.08],
    ['drip-coffee', 1, 6],
    ['drip-coffee', 2, 7.56],
  ])('%s at level %i costs $%s', (id, level, expected) => {
    expectBigClose(nextCost(COFFEE_SHOP, gameWith({ [id]: level }), id)!, Big.fromValue(expected))
  })

  test('a locked menu item costs its unlock, then its own first level', () => {
    expect(nextCost(COFFEE_SHOP, gameWith({ latte: 0 }), 'latte')?.eq(1440)).toBe(true)
    expect(nextCost(COFFEE_SHOP, gameWith({ latte: 1 }), 'latte')?.eq(150)).toBe(true)
    expectBigClose(nextCost(COFFEE_SHOP, gameWith({ latte: 2 }), 'latte')!, Big.fromValue(189))
  })

  test('nothing is left to buy at the max level', () => {
    expect(nextCost(COFFEE_SHOP, gameWith({ tables: 50 }), 'tables')).toBeNull()
  })

  test('with no max level, the costs keep going', () => {
    const noMax = { ...COFFEE_SHOP, maxLevel: null }
    expectBigClose(nextCost(noMax, gameWith({ tables: 50 }), 'tables')!, Big.fromValue(2 * 1.26 ** 49))
  })

  test('a global upgrade costs its price once, then nothing', () => {
    const game = gameWith({ tables: 10 })
    expect(nextCost(COFFEE_SHOP, game, 'chalkboard-sign')?.eq(4800)).toBe(true)
    const bought = { ...game, globalUpgradesBought: ['chalkboard-sign'] }
    expect(nextCost(COFFEE_SHOP, bought, 'chalkboard-sign')).toBeNull()
  })

  test('an id the franchise doesn\'t have is a bug', () => {
    expect(() => nextCost(COFFEE_SHOP, newGame(COFFEE_SHOP), 'unicorn')).toThrow(
      '"unicorn" isn\'t an upgrade in Coffee shop',
    )
  })
})

describe('global upgrades wait for their line', () => {
  test.each([
    [9, false],
    [10, true],
    [11, true],
  ])('Chalkboard sign with Tables at %i: available %s', (tables, available) => {
    const game = gameWith({ tables }, 1e6)
    expect(requirementMet(COFFEE_SHOP, game, 'chalkboard-sign')).toBe(available)
    expect(canBuy(COFFEE_SHOP, game, 'chalkboard-sign')).toBe(available)
  })

  test('lines have no requirement', () => {
    expect(requirementMet(COFFEE_SHOP, newGame(COFFEE_SHOP), 'tables')).toBe(true)
  })
})

describe('buying', () => {
  test('takes exactly the cost and raises the level', () => {
    const after = buy(COFFEE_SHOP, gameWith({}, 10), 'tables')
    expect(after.money.eq(8)).toBe(true)
    expect(after.levels.tables).toBe(2)
  })

  test('money exactly equal to the cost is enough', () => {
    const game = gameWith({}, 2)
    expect(canBuy(COFFEE_SHOP, game, 'tables')).toBe(true)
    expect(buy(COFFEE_SHOP, game, 'tables').money.eq(0)).toBe(true)
  })

  test('an unlock puts the item on the menu at level 1', () => {
    const after = buy(COFFEE_SHOP, gameWith({}, 1440), 'latte')
    expect(after.levels.latte).toBe(1)
    expect(after.money.eq(0)).toBe(true)
  })

  test('a global upgrade is recorded as bought, and can\'t be bought twice', () => {
    const after = buy(COFFEE_SHOP, gameWith({ tables: 10 }, 10_000), 'chalkboard-sign')
    expect(after.globalUpgradesBought).toEqual(['chalkboard-sign'])
    expect(after.money.eq(5200)).toBe(true)
    expect(canBuy(COFFEE_SHOP, after, 'chalkboard-sign')).toBe(false)
    expect(() => buy(COFFEE_SHOP, after, 'chalkboard-sign')).toThrow('already bought')
  })

  test.each([
    ['not enough money', gameWith({}, 1), 'tables', 'it costs 2 and there\'s only 1'],
    ['at the max level', gameWith({ tables: 50 }, 1e12), 'tables', 'it\'s at the max level (50)'],
    ['a requirement not met', gameWith({ tables: 9 }, 1e6), 'chalkboard-sign', 'it needs tables at level 10'],
  ])('refuses, and says why: %s', (_name, game, id, reason) => {
    expect(canBuy(COFFEE_SHOP, game, id)).toBe(false)
    expect(() => buy(COFFEE_SHOP, game, id)).toThrow(`buy: can't buy "${id}": ${reason}`)
  })

  test('never changes the state it was given', () => {
    const before = gameWith({}, 10)
    buy(COFFEE_SHOP, before, 'tables')
    expect(before.levels.tables).toBe(1)
    expect(before.money.eq(10)).toBe(true)
  })
})

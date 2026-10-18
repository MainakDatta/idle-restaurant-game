import { describe, expect, test } from 'vitest'
import { Big } from './big.ts'
import { COFFEE_SHOP, type UpgradeItemId } from './franchise.ts'
import { newGame, type GameState } from './state.ts'
import { expectBigClose } from './test-utils.ts'
import { buy, canBuy, nextCost, requirementMet } from './upgrades.ts'

/** A coffee shop game with some levels changed from the start, and some money. */
function gameWith(levels: Record<UpgradeItemId, number>, money = 0): GameState {
  const start = newGame(COFFEE_SHOP)
  return { ...start, money: Big.fromValue(money), levels: { ...start.levels, ...levels } }
}

describe('what the next level costs', () => {
  // Each level costs the upgrade's own growth times more than the one before, starting from the
  // file's first cost: Signage 39.5% more each level, drip coffee 7.7% (D35).
  test.each([
    ['signage', 1, 2],
    ['signage', 2, 2.79],
    ['signage', 3, 2 * 1.395 ** 2],
    ['signage', 99, 2 * 1.395 ** 98],
    ['baristas', 1, 8],
    ['baristas', 2, 11],
    ['tables', 1, 4],
    ['tables', 2, 5.12],
    ['drip-coffee', 1, 6],
    ['drip-coffee', 2, 6.462],
  ])('%s at level %i costs $%s', (id, level, expected) => {
    expectBigClose(nextCost(COFFEE_SHOP, gameWith({ [id]: level }), id)!, Big.fromValue(expected))
  })

  test('a locked menu item costs its unlock, then its own first level', () => {
    expect(nextCost(COFFEE_SHOP, gameWith({ latte: 0 }), 'latte')?.eq(1940)).toBe(true)
    expect(nextCost(COFFEE_SHOP, gameWith({ latte: 1 }), 'latte')?.eq(194)).toBe(true)
    expectBigClose(nextCost(COFFEE_SHOP, gameWith({ latte: 2 }), 'latte')!, Big.fromValue(232.994))
  })

  test('nothing is left to buy at the max level', () => {
    expect(nextCost(COFFEE_SHOP, gameWith({ signage: 100 }), 'signage')).toBeNull()
  })

  test('a global upgrade costs its price once, then nothing', () => {
    const game = gameWith({ signage: 10 })
    expect(nextCost(COFFEE_SHOP, game, 'free-wi-fi')?.eq(4800)).toBe(true)
    const bought = { ...game, globalUpgradesBought: ['free-wi-fi'] }
    expect(nextCost(COFFEE_SHOP, bought, 'free-wi-fi')).toBeNull()
  })

  test('an id the franchise doesn\'t have is a bug', () => {
    expect(() => nextCost(COFFEE_SHOP, newGame(COFFEE_SHOP), 'unicorn')).toThrow(
      '"unicorn" isn\'t an upgrade in Coffee shop',
    )
  })
})

describe('global upgrades wait for the upgrade they require', () => {
  test.each([
    [9, false],
    [10, true],
    [11, true],
  ])('Free Wi-Fi with Signage at %i: available %s', (signage, available) => {
    const game = gameWith({ signage }, 1e6)
    expect(requirementMet(COFFEE_SHOP, game, 'free-wi-fi')).toBe(available)
    expect(canBuy(COFFEE_SHOP, game, 'free-wi-fi')).toBe(available)
  })

  test('leveled upgrades have no requirement', () => {
    expect(requirementMet(COFFEE_SHOP, newGame(COFFEE_SHOP), 'signage')).toBe(true)
  })
})

describe('buying', () => {
  test('takes exactly the cost and raises the level', () => {
    const after = buy(COFFEE_SHOP, gameWith({}, 10), 'signage')
    expect(after.money.eq(8)).toBe(true)
    expect(after.levels.signage).toBe(2)
  })

  test('money exactly equal to the cost is enough', () => {
    const game = gameWith({}, 2)
    expect(canBuy(COFFEE_SHOP, game, 'signage')).toBe(true)
    expect(buy(COFFEE_SHOP, game, 'signage').money.eq(0)).toBe(true)
  })

  test('an unlock puts the item on the menu at level 1', () => {
    const after = buy(COFFEE_SHOP, gameWith({}, 1940), 'latte')
    expect(after.levels.latte).toBe(1)
    expect(after.money.eq(0)).toBe(true)
  })

  test('a global upgrade is recorded as bought, and can\'t be bought twice', () => {
    const after = buy(COFFEE_SHOP, gameWith({ signage: 10 }, 10_000), 'free-wi-fi')
    expect(after.globalUpgradesBought).toEqual(['free-wi-fi'])
    expect(after.money.eq(5200)).toBe(true)
    expect(canBuy(COFFEE_SHOP, after, 'free-wi-fi')).toBe(false)
    expect(() => buy(COFFEE_SHOP, after, 'free-wi-fi')).toThrow('already bought')
  })

  test.each([
    ['not enough money', gameWith({}, 1), 'signage', 'it costs 2 and there\'s only 1'],
    ['at the max level', gameWith({ signage: 100 }, 1e30), 'signage', 'it\'s at the max level (100)'],
    ['a requirement not met', gameWith({ signage: 9 }, 1e6), 'free-wi-fi', 'it needs signage at level 10'],
  ])('refuses, and says why: %s', (_name, game, id, reason) => {
    expect(canBuy(COFFEE_SHOP, game, id)).toBe(false)
    expect(() => buy(COFFEE_SHOP, game, id)).toThrow(`buy: can't buy "${id}": ${reason}`)
  })

  test('never changes the state it was given', () => {
    const before = gameWith({}, 10)
    buy(COFFEE_SHOP, before, 'signage')
    expect(before.levels.signage).toBe(1)
    expect(before.money.eq(10)).toBe(true)
  })
})

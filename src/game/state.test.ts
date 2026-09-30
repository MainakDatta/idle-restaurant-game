import { describe, expect, test } from 'vitest'
import { Big } from './big.ts'
import { economy } from './economy.ts'
import { COFFEE_SHOP } from './franchise.ts'
import { advance, newGame } from './state.ts'
import { expectBigClose, makeRandom } from './test-utils.ts'

// A new game's income ($0.315/s), worked out rather than written down, so these tests keep
// passing when the coffee shop's numbers are tuned. economy.test.ts checks the number itself.
const RATE = economy(COFFEE_SHOP, newGame(COFFEE_SHOP)).incomePerSecond

describe('newGame', () => {
  test('starts with no money', () => {
    expect(newGame(COFFEE_SHOP).money.eq(0)).toBe(true)
  })

  test('starts every leveled upgrade at its level from the file, with later menu items locked', () => {
    const game = newGame(COFFEE_SHOP)
    expect(game.levels).toEqual({
      tables: 1,
      baristas: 1,
      'drip-coffee': 1,
      latte: 0,
      muffin: 0,
      'pumpkin-spice-latte': 0,
    })
    expect(game.globalUpgradesBought).toEqual([])
  })
})

describe('advance', () => {
  test.each([
    ['one frame', 0.016],
    ['a second', 1],
    ['a minute', 60],
    ['an hour', 3600],
    ['a day', 86_400],
    ['a year', 31_536_000],
  ])('earns the income for %s', (_name, seconds) => {
    expectBigClose(advance(COFFEE_SHOP, newGame(COFFEE_SHOP), seconds).money, RATE.mul(seconds))
  })

  test('adds to the money already there', () => {
    const state = { ...newGame(COFFEE_SHOP), money: Big.fromValue(100) }
    expectBigClose(advance(COFFEE_SHOP, state, 10).money, RATE.mul(10).add(100))
  })

  test("earns at the shop's own income: a second table raises it to $0.42/s", () => {
    const state = newGame(COFFEE_SHOP)
    const twoTables = { ...state, levels: { ...state.levels, tables: 2 } }
    expectBigClose(advance(COFFEE_SHOP, twoTables, 10).money, Big.fromValue(4.2))
  })

  test('no time passing gives back the same object, so nothing redraws', () => {
    const state = newGame(COFFEE_SHOP)
    expect(advance(COFFEE_SHOP, state, 0)).toBe(state)
  })

  test('leaves the state it was given alone', () => {
    const before = newGame(COFFEE_SHOP)
    const after = advance(COFFEE_SHOP, before, 5)
    expect(after).not.toBe(before)
    expect(before.money.eq(0)).toBe(true)
  })

  // D11's promise: live play (many small steps) and catch-up (one big step) end up in the same
  // place. Every rule added later has to keep passing this.
  test.each([1, 2, 3])('an hour of random frames equals one hour-long step (seed %i)', (seed) => {
    const random = makeRandom(seed)
    let state = newGame(COFFEE_SHOP)
    let total = 0
    while (total < 3600) {
      const seconds = 0.001 + 0.049 * random() // 1 to 50 ms, like real frames
      state = advance(COFFEE_SHOP, state, seconds)
      total += seconds
    }
    expectBigClose(state.money, advance(COFFEE_SHOP, newGame(COFFEE_SHOP), total).money)
  })

  test.each([-1, -0.001, NaN, Infinity, -Infinity])('rejects %s seconds', (seconds) => {
    expect(() => advance(COFFEE_SHOP, newGame(COFFEE_SHOP), seconds)).toThrow(RangeError)
    expect(() => advance(COFFEE_SHOP, newGame(COFFEE_SHOP), seconds)).toThrow('advance:')
  })
})

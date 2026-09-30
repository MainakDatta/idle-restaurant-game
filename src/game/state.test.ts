import { describe, expect, test } from 'vitest'
import { Big } from './big.ts'
import { COFFEE_SHOP } from './franchise.ts'
import { PLACEHOLDER_INCOME_PER_SECOND, advance, newGame } from './state.ts'
import { expectBigClose, makeRandom } from './test-utils.ts'

// Expected money is worked out from the rate rather than assuming $1, so these tests still
// pass when the rate is changed to try the game at a different speed.
const RATE = PLACEHOLDER_INCOME_PER_SECOND

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
    expectBigClose(advance(newGame(COFFEE_SHOP), seconds).money, RATE.mul(seconds))
  })

  test('adds to the money already there', () => {
    const state = { ...newGame(COFFEE_SHOP), money: Big.fromValue(100) }
    expectBigClose(advance(state, 10).money, RATE.mul(10).add(100))
  })

  test('no time passing gives back the same object, so nothing redraws', () => {
    const state = newGame(COFFEE_SHOP)
    expect(advance(state, 0)).toBe(state)
  })

  test('leaves the state it was given alone', () => {
    const before = newGame(COFFEE_SHOP)
    const after = advance(before, 5)
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
      state = advance(state, seconds)
      total += seconds
    }
    expectBigClose(state.money, advance(newGame(COFFEE_SHOP), total).money)
  })

  test.each([-1, -0.001, NaN, Infinity, -Infinity])('rejects %s seconds', (seconds) => {
    expect(() => advance(newGame(COFFEE_SHOP), seconds)).toThrow(RangeError)
    expect(() => advance(newGame(COFFEE_SHOP), seconds)).toThrow('advance:')
  })
})

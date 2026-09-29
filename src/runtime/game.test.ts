// Catch-up, through the same startGame the app uses: coming back after time away goes through
// the same code as live play and counts every second (D11, D14).

import { describe, expect, test } from 'vitest'
import { PLACEHOLDER_INCOME_PER_SECOND, advance, newGame } from '../game/state.ts'
import { expectBigClose } from '../game/test-utils.ts'
import { startGame } from './game.ts'
import { makeFakeClock, type FakeClock } from './test-utils.ts'

// Expected money comes from the rate, so these tests pass at any rate.
const RATE = PLACEHOLDER_INCOME_PER_SECOND
const MINUTE = 60 * 1000 // in milliseconds, like the clock

/** Plays for `ms` milliseconds in 16 ms frames, as if the tab were open and visible. */
function play(fake: FakeClock, ms: number): void {
  for (let played = 0; played < ms; played += 16) fake.frameAfter(16)
}

describe('catch-up', () => {
  test('a minute of play, 10 minutes away, then a minute more: every second counts', () => {
    const fake = makeFakeClock()
    const store = startGame(newGame(), fake.clock)
    play(fake, MINUTE)
    fake.frameAfter(10 * MINUTE) // the first frame back from a hidden tab
    play(fake, MINUTE)
    // 12 minutes in all, and the same money as one advance over the whole span.
    expectBigClose(store.getState().money, advance(newGame(), 12 * 60).money)
  })

  test('a week away counts in full, with no cap (D14)', () => {
    const fake = makeFakeClock()
    const store = startGame(newGame(), fake.clock)
    play(fake, MINUTE)
    const before = store.getState().money
    fake.frameAfter(7 * 24 * 60 * MINUTE)
    expectBigClose(store.getState().money, before.add(RATE.mul(7 * 24 * 60 * 60)))
  })

  test('a clock set back an hour while away loses nothing, and money keeps growing (D11)', () => {
    const fake = makeFakeClock()
    const store = startGame(newGame(), fake.clock)
    play(fake, MINUTE)
    const before = store.getState().money
    fake.frameAfter(-60 * MINUTE)
    expect(store.getState().money.eq(before)).toBe(true)
    fake.frameAfter(1000)
    expectBigClose(store.getState().money, before.add(RATE.mul(1)))
  })
})

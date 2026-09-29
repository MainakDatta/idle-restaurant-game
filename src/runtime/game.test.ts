// Catch-up, through the same startGame the app uses: coming back after time away goes through
// the same code as live play and counts every second (D11, D14).

import { describe, expect, test } from 'vitest'
import type { Big } from '../game/big.ts'
import { PLACEHOLDER_INCOME_PER_SECOND, advance, newGame } from '../game/state.ts'
import { expectBigClose } from '../game/test-utils.ts'
import { AWAY_AFTER_SECONDS, startGame, type CatchUp } from './game.ts'
import { makeFakeClock, type FakeClock } from './test-utils.ts'

// Expected money comes from the rate, so these tests pass at any rate.
const RATE = PLACEHOLDER_INCOME_PER_SECOND
const SECOND = 1000 // in milliseconds, like the clock
const MINUTE = 60 * SECOND

/** A new game on a fake clock that records every catch-up it reports. */
function startTestGame() {
  const fake = makeFakeClock()
  const catchUps: CatchUp[] = []
  const store = startGame(newGame(), {
    clock: fake.clock,
    onCatchUp: (catchUp) => catchUps.push(catchUp),
  })
  return { fake, store, catchUps }
}

/** Plays for `ms` milliseconds in 16 ms frames, as if the tab were open and visible. */
function play(fake: FakeClock, ms: number): void {
  for (let played = 0; played < ms; played += 16) fake.frameAfter(16)
}

describe('catch-up', () => {
  test('a minute of play, 10 minutes away, then a minute more: every second counts', () => {
    const { fake, store } = startTestGame()
    play(fake, MINUTE)
    fake.frameAfter(10 * MINUTE) // the first frame back from a hidden tab
    play(fake, MINUTE)
    // 12 minutes in all, and the same money as one advance over the whole span.
    expectBigClose(store.getState().money, advance(newGame(), 12 * 60).money)
  })

  test('a week away counts in full, with no cap (D14)', () => {
    const { fake, store } = startTestGame()
    play(fake, MINUTE)
    const before = store.getState().money
    fake.frameAfter(7 * 24 * 60 * MINUTE)
    expectBigClose(store.getState().money, before.add(RATE.mul(7 * 24 * 60 * 60)))
  })

  test('a clock set back an hour while away loses nothing, and money keeps growing (D11)', () => {
    const { fake, store, catchUps } = startTestGame()
    play(fake, MINUTE)
    const before = store.getState().money
    fake.frameAfter(-60 * MINUTE)
    expect(store.getState().money.eq(before)).toBe(true)
    expect(catchUps).toEqual([]) // no time passed, so there's nothing to report
    fake.frameAfter(SECOND)
    expectBigClose(store.getState().money, before.add(RATE.mul(1)))
  })
})

describe('catch-up reports', () => {
  test('coming back reports how long you were away and what you earned', () => {
    const { fake, catchUps } = startTestGame()
    play(fake, MINUTE) // money from before, which the report must leave out
    fake.frameAfter(10 * MINUTE)
    expect(catchUps).toHaveLength(1)
    const [catchUp] = catchUps
    expect(catchUp.seconds).toBe(600)
    expectBigClose(catchUp.earned, RATE.mul(600))
  })

  // So a welcome-back message can show the new total alongside what was earned.
  test('the store already has the new money when the report goes out', () => {
    const fake = makeFakeClock()
    let moneyWhenReported: Big | undefined
    const store = startGame(newGame(), {
      clock: fake.clock,
      onCatchUp: () => {
        moneyWhenReported = store.getState().money
      },
    })
    fake.frameAfter(10 * MINUTE)
    expect(moneyWhenReported?.eq(store.getState().money)).toBe(true)
  })

  test('ordinary frames report nothing, however many there are', () => {
    const { fake, catchUps } = startTestGame()
    play(fake, 10 * MINUTE)
    expect(catchUps).toEqual([])
  })

  test(`a frame counts as time away only when it's longer than ${AWAY_AFTER_SECONDS} s`, () => {
    const { fake, catchUps } = startTestGame()
    fake.frameAfter(AWAY_AFTER_SECONDS * SECOND) // a very slow frame, but not time away
    expect(catchUps).toHaveLength(0)
    fake.frameAfter(AWAY_AFTER_SECONDS * SECOND + 1)
    expect(catchUps).toHaveLength(1)
  })
})

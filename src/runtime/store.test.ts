import { describe, expect, test } from 'vitest'
import { Big } from '../game/big.ts'
import { newGame } from '../game/state.ts'
import { createGameStateStore } from './store.ts'

const RICH = { money: Big.fromValue(100) }

describe('createGameStateStore', () => {
  test('getState returns the latest state', () => {
    const start = newGame()
    const store = createGameStateStore(start)
    expect(store.getState()).toBe(start)
    store.setState(RICH)
    expect(store.getState()).toBe(RICH)
  })

  test('each listener hears about each change once', () => {
    const store = createGameStateStore(newGame())
    let a = 0
    let b = 0
    store.subscribe(() => a++)
    store.subscribe(() => b++)
    store.setState(RICH)
    store.setState(newGame())
    expect([a, b]).toEqual([2, 2])
  })

  test('unsubscribing stops the calls', () => {
    const store = createGameStateStore(newGame())
    let calls = 0
    const unsubscribe = store.subscribe(() => calls++)
    store.setState(RICH)
    unsubscribe()
    store.setState(newGame())
    expect(calls).toBe(1)
  })

  test("subscribe, unsubscribe, subscribe (StrictMode's double effect) hears each change once", () => {
    const store = createGameStateStore(newGame())
    let calls = 0
    const unsubscribe = store.subscribe(() => calls++)
    unsubscribe()
    store.subscribe(() => calls++)
    store.setState(RICH)
    expect(calls).toBe(1)
  })

  test('setting the same object notifies nobody', () => {
    const store = createGameStateStore(RICH)
    let calls = 0
    store.subscribe(() => calls++)
    store.setState(RICH)
    expect(calls).toBe(0)
  })
})

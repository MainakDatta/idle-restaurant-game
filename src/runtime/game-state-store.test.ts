import { describe, expect, test } from 'vitest'
import { Big } from '../game/big.ts'
import { COFFEE_SHOP } from '../game/franchise.ts'
import { newGame } from '../game/state.ts'
import { createGameStateStore } from './game-state-store.ts'

const RICH = { ...newGame(COFFEE_SHOP), money: Big.fromValue(100) }

describe('createGameStateStore', () => {
  test('getState returns the latest state', () => {
    const start = newGame(COFFEE_SHOP)
    const gameStateStore = createGameStateStore(start)
    expect(gameStateStore.getState()).toBe(start)
    gameStateStore.setState(RICH)
    expect(gameStateStore.getState()).toBe(RICH)
  })

  test('each listener hears about each change once', () => {
    const gameStateStore = createGameStateStore(newGame(COFFEE_SHOP))
    let a = 0
    let b = 0
    gameStateStore.subscribe(() => a++)
    gameStateStore.subscribe(() => b++)
    gameStateStore.setState(RICH)
    gameStateStore.setState(newGame(COFFEE_SHOP))
    expect([a, b]).toEqual([2, 2])
  })

  test('unsubscribing stops the calls', () => {
    const gameStateStore = createGameStateStore(newGame(COFFEE_SHOP))
    let calls = 0
    const unsubscribe = gameStateStore.subscribe(() => calls++)
    gameStateStore.setState(RICH)
    unsubscribe()
    gameStateStore.setState(newGame(COFFEE_SHOP))
    expect(calls).toBe(1)
  })

  test("subscribe, unsubscribe, subscribe (StrictMode's double effect) hears each change once", () => {
    const gameStateStore = createGameStateStore(newGame(COFFEE_SHOP))
    let calls = 0
    const unsubscribe = gameStateStore.subscribe(() => calls++)
    unsubscribe()
    gameStateStore.subscribe(() => calls++)
    gameStateStore.setState(RICH)
    expect(calls).toBe(1)
  })

  test('setting the same object notifies nobody', () => {
    const gameStateStore = createGameStateStore(RICH)
    let calls = 0
    gameStateStore.subscribe(() => calls++)
    gameStateStore.setState(RICH)
    expect(calls).toBe(0)
  })
})

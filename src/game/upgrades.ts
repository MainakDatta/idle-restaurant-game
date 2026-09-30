// What each upgrade costs, and what buying it does (design.md *Upgrades*, D19). Three kinds:
// - a leveled line (Tables, Baristas, an unlocked menu item): each level costs `costGrowth`
//   times more than the one before, up to the franchise's max level;
// - an unlock: a menu item still at level 0, which the unlock puts on the menu at level 1;
// - a global upgrade: bought once, after the line it requires reaches its level.
// Everything here is pure: buy returns a new state and leaves the one it was given alone.

import { Big } from './big.ts'
import { formatBig } from './format.ts'
import {
  leveledLines,
  type Franchise,
  type GlobalUpgrade,
  type LeveledLine,
  type UpgradeId,
} from './franchise.ts'
import type { GameState } from './state.ts'

/**
 * What buying `id` costs right now, or null if there's nothing left to buy: the line is at the
 * max level, or the global upgrade is already bought.
 */
export function nextCost(franchise: Franchise, state: GameState, id: UpgradeId): Big | null {
  const global = findGlobalUpgrade(franchise, id)
  if (global !== undefined) return state.globalUpgradesBought.includes(id) ? null : global.cost

  const line = findLine(franchise, id)
  const level = levelOf(state, id)
  if (level === 0) {
    if (line.unlock === null) throw new Error(`nextCost: "${id}" is at level 0 but has no unlock`)
    return line.unlock.cost
  }
  if (franchise.maxLevel !== null && level >= franchise.maxLevel) return null
  // The first level you buy (1 → 2 for Tables) costs firstCost, and each one after that
  // costs costGrowth times more: $2, $2.52, $3.18…
  return line.firstCost.mul(Big.fromValue(franchise.costGrowth).pow(level - 1))
}

/** Whether a global upgrade's line has reached the level it needs. Always true for lines. */
export function requirementMet(franchise: Franchise, state: GameState, id: UpgradeId): boolean {
  const global = findGlobalUpgrade(franchise, id)
  return global === undefined || levelOf(state, global.requires.upgrade) >= global.requires.level
}

/** Whether `id` can be bought right now: something left to buy, its requirement met, and the money. */
export function canBuy(franchise: Franchise, state: GameState, id: UpgradeId): boolean {
  return 'cost' in checkPurchase(franchise, state, id)
}

/**
 * Buys the next level of `id` (or the global upgrade) and returns the new state. Throws if it
 * can't be bought, because the screen only offers it when canBuy says yes.
 */
export function buy(franchise: Franchise, state: GameState, id: UpgradeId): GameState {
  const purchase = checkPurchase(franchise, state, id)
  if ('problem' in purchase) throw new Error(`buy: can't buy "${id}": ${purchase.problem}`)
  // checkPurchase made sure the money covers the cost, so this sub can't go below zero.
  const money = state.money.sub(purchase.cost)
  if (findGlobalUpgrade(franchise, id) !== undefined) {
    return { ...state, money, globalUpgradesBought: [...state.globalUpgradesBought, id] }
  }
  return { ...state, money, levels: { ...state.levels, [id]: levelOf(state, id) + 1 } }
}

/** Either what it costs, or why it can't be bought. */
type Purchase = { readonly cost: Big } | { readonly problem: string }

function checkPurchase(franchise: Franchise, state: GameState, id: UpgradeId): Purchase {
  const cost = nextCost(franchise, state, id)
  const global = findGlobalUpgrade(franchise, id)
  if (cost === null) {
    return { problem: global === undefined ? `it's at the max level (${franchise.maxLevel})` : 'already bought' }
  }
  if (global !== undefined && !requirementMet(franchise, state, id)) {
    return { problem: `it needs ${global.requires.upgrade} at level ${global.requires.level}` }
  }
  if (state.money.lt(cost)) {
    return { problem: `it costs ${formatBig(cost, 'short')} and there's only ${formatBig(state.money, 'short')}` }
  }
  return { cost }
}

function findGlobalUpgrade(franchise: Franchise, id: UpgradeId): GlobalUpgrade | undefined {
  return franchise.globalUpgrades.find((upgrade) => upgrade.id === id)
}

function findLine(franchise: Franchise, id: UpgradeId): LeveledLine {
  const line = leveledLines(franchise).find((candidate) => candidate.id === id)
  if (line === undefined) throw new Error(`"${id}" isn't an upgrade in ${franchise.name}`)
  return line
}

function levelOf(state: GameState, id: UpgradeId): number {
  const level = state.levels[id]
  if (level === undefined) throw new Error(`The game state has no level for "${id}"`)
  return level
}

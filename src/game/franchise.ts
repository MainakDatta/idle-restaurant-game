// A franchise, as read from its data file (D9, D28). The file holds everything that makes one
// franchise different from another: names, prices, costs, bonus levels and the max level.
// loadFranchise checks the whole file when the game starts, so a mistake stops the game with a
// clear message instead of turning into a strange number later (D6).

import { Big } from './big.ts'
import coffeeShopFile from './franchises/coffee-shop.json' with { type: 'json' }

/**
 * Which upgrade: its id from the franchise file, such as "tables", "latte" or
 * "chalkboard-sign".
 */
export type UpgradeItemId = string

/** The levers a global upgrade can multiply (D17). */
export type Lever = 'demand' | 'service'

export type Franchise = {
  readonly id: string
  readonly name: string
  /** The highest level any leveled upgrade can reach, or null for no max. */
  readonly maxLevel: number | null
  /** How much more each level costs than the one before: 1.26 is 26% more. */
  readonly costGrowth: number
  readonly bonusLevels: BonusLevels
  /** What each level adds to a menu item's price, as a share of its starting price: 0.1 is 10%. */
  readonly priceRisePerLevel: number
  /** How much idle staff help outside their own role: 0.2 is 20% (D17). */
  readonly spillover: { readonly acrossRoles: number }
  /** The share of a line's extra customers who serve themselves, or null for none (D17). */
  readonly selfServe: number | null
  /** What brings customers in: the coffee shop's Tables. */
  readonly demand: DemandUpgrade
  /** Who serves them: the coffee shop's Baristas. One staff role for now (D28). */
  readonly staff: StaffUpgrade
  readonly menu: readonly MenuItem[]
  /** One-time purchases that multiply a lever for the whole shop (design.md's lever boosts). */
  readonly globalUpgrades: readonly GlobalUpgrade[]
}

/**
 * Levels where a leveled upgrade's output jumps. Every leveled upgrade in the franchise shares
 * the same ones.
 */
export type BonusLevels = {
  /** Specific levels, each with its own multiplier: ×2 at 10, ×3 at 25, and so on. */
  readonly at: readonly { readonly level: number; readonly multiplier: number }[]
  /** Repeats after the last listed level (every 50 levels, ×2 each time), or null for no repeat. */
  readonly thenEvery: { readonly levels: number; readonly multiplier: number } | null
}

export type DemandUpgrade = {
  readonly id: UpgradeItemId
  readonly name: string
  /** Customers each level brings in per minute, before bonus levels. */
  readonly customersPerMinute: number
  readonly startLevel: number
  /** What the first level you buy costs. Each level after that costs `costGrowth` times more. */
  readonly firstCost: Big
}

/** Each level is one more member of staff. */
export type StaffUpgrade = {
  readonly id: UpgradeItemId
  readonly name: string
  readonly startLevel: number
  readonly firstCost: Big
}

export type MenuItem = {
  readonly id: UpgradeItemId
  readonly name: string
  /** The price at level 1. */
  readonly price: Big
  /** Staff time to make one, at level 1. */
  readonly prepSeconds: number
  /** How often it's ordered compared with the other unlocked items: 5 against 4 is 5 in every 9. */
  readonly popularity: number
  /** What the first level you buy after unlocking it costs. */
  readonly firstCost: Big
  /** What puts it on the menu, or null if it's there from the start (at level 1). */
  readonly unlock: Unlock | null
}

/** A purchase that puts a menu item on the menu at level 1: the Espresso machine unlocks Latte. */
export type Unlock = { readonly name: string; readonly cost: Big }

export type GlobalUpgrade = {
  readonly id: UpgradeItemId
  readonly name: string
  readonly lever: Lever
  readonly multiplier: number
  /** It can only be bought once this leveled upgrade reaches this level: Tables 10. */
  readonly requires: { readonly upgrade: UpgradeItemId; readonly level: number }
  readonly cost: Big
}

/** Anything you level up (Tables, Baristas or a menu item), in the shape they have in common. */
export type LeveledUpgrade = {
  readonly id: UpgradeItemId
  readonly name: string
  readonly firstCost: Big
  /** null if it's there from the start. */
  readonly unlock: Unlock | null
}

/** Every leveled upgrade, in display order: Tables, Baristas, then the menu. */
export function leveledUpgrades(franchise: Franchise): readonly LeveledUpgrade[] {
  return [
    { ...franchise.demand, unlock: null },
    { ...franchise.staff, unlock: null },
    ...franchise.menu,
  ]
}

export class FranchiseFileError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'FranchiseFileError'
  }
}

/**
 * Reads a franchise file and checks everything in it. A mistake throws a FranchiseFileError
 * naming the file and the field: "coffee-shop.json: menu[2].popularity must be above 0, got -1".
 */
export function loadFranchise(file: unknown, fileName: string): Franchise {
  try {
    return readFranchise(file)
  } catch (error) {
    // The readers below only know where they are inside the file, so the name is added here.
    if (error instanceof FranchiseFileError) {
      throw new FranchiseFileError(`${fileName}: ${error.message}`)
    }
    throw error
  }
}

/** The coffee shop, the first franchise (design.md *First build*). */
export const COFFEE_SHOP: Franchise = loadFranchise(coffeeShopFile, 'coffee-shop.json')

function readFranchise(file: unknown): Franchise {
  const root = readObject(file, '', [
    'id', 'name', 'maxLevel', 'costGrowth', 'bonusLevels', 'priceRisePerLevel', 'spillover',
    'selfServe', 'demand', 'staff', 'menu', 'globalUpgrades',
  ])
  const spillover = readObject(root.spillover, 'spillover', ['acrossRoles'])
  const franchise: Franchise = {
    id: readId(root.id, 'id'),
    name: readText(root.name, 'name'),
    maxLevel: root.maxLevel === null ? null : readWholeNumber(root.maxLevel, 'maxLevel', 1),
    costGrowth: readAbove(root.costGrowth, 'costGrowth', 1),
    bonusLevels: readBonusLevels(root.bonusLevels, 'bonusLevels'),
    priceRisePerLevel: readAtLeast(root.priceRisePerLevel, 'priceRisePerLevel', 0),
    spillover: { acrossRoles: readShare(spillover.acrossRoles, 'spillover.acrossRoles') },
    selfServe: root.selfServe === null ? null : readShare(root.selfServe, 'selfServe'),
    demand: readDemandUpgrade(root.demand, 'demand'),
    staff: readStaffUpgrade(root.staff, 'staff'),
    menu: readList(root.menu, 'menu', readMenuItem),
    globalUpgrades: readList(root.globalUpgrades, 'globalUpgrades', readGlobalUpgrade),
  }
  checkSetup(franchise)
  return franchise
}

function readBonusLevels(value: unknown, path: string): BonusLevels {
  const record = readObject(value, path, ['at', 'thenEvery'])
  const at = readList(record.at, `${path}.at`, (item, itemPath) => {
    const bonus = readObject(item, itemPath, ['level', 'multiplier'])
    return {
      level: readWholeNumber(bonus.level, `${itemPath}.level`, 1),
      // At least 1: a bonus level can't shrink output.
      multiplier: readAtLeast(bonus.multiplier, `${itemPath}.multiplier`, 1),
    }
  })
  at.forEach((bonus, i) => {
    const before = at[i - 1]
    if (before !== undefined && bonus.level <= before.level) {
      const problem = `must be above the level before it (${before.level}), got ${bonus.level}`
      fail(`${path}.at[${i}].level`, problem)
    }
  })
  if (record.thenEvery === null) return { at, thenEvery: null }
  const repeat = readObject(record.thenEvery, `${path}.thenEvery`, ['levels', 'multiplier'])
  return {
    at,
    thenEvery: {
      levels: readWholeNumber(repeat.levels, `${path}.thenEvery.levels`, 1),
      multiplier: readAtLeast(repeat.multiplier, `${path}.thenEvery.multiplier`, 1),
    },
  }
}

function readDemandUpgrade(value: unknown, path: string): DemandUpgrade {
  const upgrade = readObject(value, path, [
    'id', 'name', 'customersPerMinute', 'startLevel', 'firstCost',
  ])
  return {
    id: readId(upgrade.id, `${path}.id`),
    name: readText(upgrade.name, `${path}.name`),
    customersPerMinute: readAbove(upgrade.customersPerMinute, `${path}.customersPerMinute`, 0),
    // At least 1: a new game needs somewhere for customers to come.
    startLevel: readWholeNumber(upgrade.startLevel, `${path}.startLevel`, 1),
    firstCost: readDollars(upgrade.firstCost, `${path}.firstCost`),
  }
}

function readStaffUpgrade(value: unknown, path: string): StaffUpgrade {
  const upgrade = readObject(value, path, ['id', 'name', 'startLevel', 'firstCost'])
  return {
    id: readId(upgrade.id, `${path}.id`),
    name: readText(upgrade.name, `${path}.name`),
    // At least 1: a new game needs someone to serve.
    startLevel: readWholeNumber(upgrade.startLevel, `${path}.startLevel`, 1),
    firstCost: readDollars(upgrade.firstCost, `${path}.firstCost`),
  }
}

function readMenuItem(value: unknown, path: string): MenuItem {
  const item = readObject(value, path, [
    'id', 'name', 'price', 'prepSeconds', 'popularity', 'firstCost', 'unlock',
  ])
  let unlock: Unlock | null = null
  if (item.unlock !== null) {
    const record = readObject(item.unlock, `${path}.unlock`, ['name', 'cost'])
    unlock = {
      name: readText(record.name, `${path}.unlock.name`),
      cost: readDollars(record.cost, `${path}.unlock.cost`),
    }
  }
  return {
    id: readId(item.id, `${path}.id`),
    name: readText(item.name, `${path}.name`),
    price: readDollars(item.price, `${path}.price`),
    prepSeconds: readAbove(item.prepSeconds, `${path}.prepSeconds`, 0),
    popularity: readAbove(item.popularity, `${path}.popularity`, 0),
    firstCost: readDollars(item.firstCost, `${path}.firstCost`),
    unlock,
  }
}

function readGlobalUpgrade(value: unknown, path: string): GlobalUpgrade {
  const upgrade = readObject(value, path, ['id', 'name', 'lever', 'multiplier', 'requires', 'cost'])
  const requires = readObject(upgrade.requires, `${path}.requires`, ['upgrade', 'level'])
  if (upgrade.lever !== 'demand' && upgrade.lever !== 'service') {
    fail(`${path}.lever`, `must be "demand" or "service", got ${describe(upgrade.lever)}`)
  }
  return {
    id: readId(upgrade.id, `${path}.id`),
    name: readText(upgrade.name, `${path}.name`),
    lever: upgrade.lever,
    // At least 1: an upgrade can't shrink a lever.
    multiplier: readAtLeast(upgrade.multiplier, `${path}.multiplier`, 1),
    requires: {
      upgrade: readId(requires.upgrade, `${path}.requires.upgrade`),
      level: readWholeNumber(requires.level, `${path}.requires.level`, 1),
    },
    cost: readDollars(upgrade.cost, `${path}.cost`),
  }
}

/** Checks that the parts fit together, once each field is valid on its own. */
function checkSetup(franchise: Franchise): void {
  const { maxLevel } = franchise

  // Every id is unique, so an id always means one thing in saves and in the code.
  const idPaths: [UpgradeItemId, string][] = [
    [franchise.demand.id, 'demand.id'],
    [franchise.staff.id, 'staff.id'],
    ...franchise.menu.map((item, i): [UpgradeItemId, string] => [item.id, `menu[${i}].id`]),
    ...franchise.globalUpgrades.map(
      (upgrade, i): [UpgradeItemId, string] => [upgrade.id, `globalUpgrades[${i}].id`],
    ),
  ]
  const firstPath = new Map<UpgradeItemId, string>()
  for (const [id, path] of idPaths) {
    const earlier = firstPath.get(id)
    if (earlier !== undefined) fail(path, `"${id}" is already used by ${earlier}`)
    firstPath.set(id, path)
  }

  // Starting levels fit under the max.
  const startingUpgrades = [[franchise.demand, 'demand'], [franchise.staff, 'staff']] as const
  for (const [upgrade, path] of startingUpgrades) {
    if (maxLevel !== null && upgrade.startLevel > maxLevel) {
      fail(`${path}.startLevel`, `is above maxLevel (${maxLevel}), got ${upgrade.startLevel}`)
    }
  }

  // A new game has something to sell.
  if (!franchise.menu.some((item) => item.unlock === null)) {
    fail('menu', 'needs at least one item with "unlock": null, or a new game has nothing to sell')
  }

  // A global upgrade's requirement names a leveled upgrade, at a level you can reach.
  const leveledIds = leveledUpgrades(franchise).map((upgrade) => upgrade.id)
  franchise.globalUpgrades.forEach((upgrade, i) => {
    const path = `globalUpgrades[${i}].requires`
    if (!leveledIds.includes(upgrade.requires.upgrade)) {
      const choices = leveledIds.join(', ')
      fail(`${path}.upgrade`, `must be one of ${choices}, got "${upgrade.requires.upgrade}"`)
    }
    if (maxLevel !== null && upgrade.requires.level > maxLevel) {
      fail(`${path}.level`, `is above maxLevel (${maxLevel}), so it could never be bought`)
    }
  })
}

// The readers. Each checks one value and throws a FranchiseFileError naming where it sits.

function fail(path: string, problem: string): never {
  throw new FranchiseFileError(`${path === '' ? 'the file' : path} ${problem}`)
}

/** An object with exactly these fields: none missing, none unknown (a typo like "prepSecond"). */
function readObject(
  value: unknown,
  path: string,
  fields: readonly string[],
): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    fail(path, `must be an object, got ${describe(value)}`)
  }
  const record = value as Record<string, unknown>
  const at = (field: string) => (path === '' ? field : `${path}.${field}`)
  for (const field of Object.keys(record)) {
    if (!fields.includes(field)) {
      fail(at(field), `isn't a known field (expected: ${fields.join(', ')})`)
    }
  }
  for (const field of fields) {
    if (!(field in record)) fail(at(field), 'is missing')
  }
  return record
}

function readList<T>(
  value: unknown,
  path: string,
  readItem: (item: unknown, path: string) => T,
): T[] {
  if (!Array.isArray(value)) fail(path, `must be a list, got ${describe(value)}`)
  return value.map((item, i) => readItem(item, `${path}[${i}]`))
}

function readText(value: unknown, path: string): string {
  if (typeof value !== 'string' || value.trim() === '') {
    fail(path, `must be some text, got ${describe(value)}`)
  }
  return value
}

/** Ids are lowercase words joined by hyphens, like "drip-coffee", so they're safe as save keys. */
function readId(value: unknown, path: string): UpgradeItemId {
  const id = readText(value, path)
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(id)) {
    fail(path, `must be lowercase words joined by hyphens, like "drip-coffee", got "${id}"`)
  }
  return id
}

function readNumber(value: unknown, path: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    fail(path, `must be a number, got ${describe(value)}`)
  }
  return value
}

function readAbove(value: unknown, path: string, limit: number): number {
  const number = readNumber(value, path)
  if (!(number > limit)) fail(path, `must be above ${limit}, got ${number}`)
  return number
}

function readAtLeast(value: unknown, path: string, limit: number): number {
  const number = readNumber(value, path)
  if (!(number >= limit)) fail(path, `must be at least ${limit}, got ${number}`)
  return number
}

/** A share between 0 and 1: 0.2 is 20%. */
function readShare(value: unknown, path: string): number {
  const number = readNumber(value, path)
  if (!(number >= 0 && number <= 1)) fail(path, `must be between 0 and 1, got ${number}`)
  return number
}

function readWholeNumber(value: unknown, path: string, min: number): number {
  const number = readNumber(value, path)
  if (!Number.isInteger(number) || number < min) {
    fail(path, `must be a whole number, at least ${min}, got ${number}`)
  }
  return number
}

/**
 * A price or cost, read once as a Big. Above 0, because a free first level would make every
 * level free.
 */
function readDollars(value: unknown, path: string): Big {
  return Big.fromValue(readAbove(value, path, 0))
}

/** How a bad value looks in an error message: "abc" in quotes, a missing field as nothing. */
function describe(value: unknown): string {
  return value === undefined ? 'nothing' : JSON.stringify(value)
}

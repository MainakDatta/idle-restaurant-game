// A franchise, as read from its data file (D9, D28). The file holds everything that makes one
// franchise different from another: names, prices, costs, bonus levels and the max level.
// loadFranchise checks the whole file when the game starts, so a mistake stops the game with a
// clear message instead of turning into a strange number later (D6).

import { Big } from './big.ts'
import coffeeShopFile from './franchises/coffee-shop.json' with { type: 'json' }

/**
 * Which upgrade: its id from the franchise file, such as "signage", "latte" or "free-wi-fi".
 */
export type UpgradeItemId = string

/** The levers a global upgrade can multiply (D17). */
export type Lever = 'demand' | 'service'

export type Franchise = {
  readonly id: string
  readonly name: string
  /**
   * The levels where a leveled upgrade's output jumps, in order: [10, 25, 50, 100]. Every leveled
   * upgrade shares them, and each has its own multiplier at each one (D34).
   */
  readonly bonusLevels: readonly number[]
  /** The highest level any leveled upgrade can reach. It's always the last bonus level (D35). */
  readonly maxLevel: number
  /** What each level adds to a menu item's price, as a share of its starting price: 0.1 is 10%. */
  readonly priceRisePerLevel: number
  readonly cookTime: CookTime
  readonly samples: Samples
  /** What brings customers in: the coffee shop's Signage. */
  readonly demand: DemandUpgrade
  /** Who serves them: the coffee shop's Baristas. One staff role for now (D28). */
  readonly staff: StaffUpgrade
  /** Where served customers sit: the coffee shop's Tables (D30). */
  readonly seating: SeatingUpgrade
  readonly menu: readonly MenuItem[]
  /** One-time purchases that multiply a lever for the whole shop. */
  readonly globalUpgrades: readonly GlobalUpgrade[]
}

/** How menu items get faster as they level up (D33). */
export type CookTime = {
  /** The shortest an item's cook time gets, as a share of its starting time: 0.5 is half. */
  readonly shortest: number
  /** The level where it gets there. Until then, it falls a little every level. */
  readonly shortestFromLevel: number
  /** Bonus levels that add a machine: two machines make twice as many, three make three times. */
  readonly extraMachinesAt: readonly number[]
}

/** Idle baristas stepping outside with sample trays (D32). */
export type Samples = {
  /** The most baristas that go outside. Any more idle baristas stay behind the counter. */
  readonly maxBaristasOutside: number
  /** The extra customers each one brings in, as a share of Demand: 0.1 is 10%. */
  readonly customersEach: number
}

/** What every leveled upgrade has: Signage, Baristas, Tables and each menu item. */
type LeveledFields = {
  readonly id: UpgradeItemId
  readonly name: string
  /** What the first level you buy costs. Each level after that costs `costGrowth` times more. */
  readonly firstCost: Big
  /** How much more each level costs than the one before: 1.395 is 39.5% more (D35). */
  readonly costGrowth: number
  /** Its multiplier at each of the franchise's bonus levels, in the same order (D34). */
  readonly bonusMultipliers: readonly number[]
}

/**
 * The same fields, as the readers below list them. It sits up here because COFFEE_SHOP is loaded
 * while this file is still being set up, before any `const` further down exists.
 */
const LEVELED_FIELDS = ['id', 'name', 'firstCost', 'costGrowth', 'bonusMultipliers']

// `A & B` is a type with every field of both: a DemandUpgrade has the leveled fields above,
// plus the fields listed here.
export type DemandUpgrade = LeveledFields & {
  /** Customers each level brings in per minute, before bonus levels. */
  readonly customersPerMinute: number
  readonly startLevel: number
}

/** Each level is one more member of staff. */
export type StaffUpgrade = LeveledFields & {
  readonly startLevel: number
}

/** Each level adds seats, counted as how many customers a minute can sit down (D30). */
export type SeatingUpgrade = LeveledFields & {
  /** Seated customers a minute that each level adds, before bonus levels. */
  readonly seatedPerMinute: number
  /** What a seated customer spends, compared with the usual order: 1.5 is 50% more. */
  readonly seatedSpend: number
  readonly startLevel: number
}

export type MenuItem = LeveledFields & {
  /** The price at level 1. */
  readonly price: Big
  /** A barista's time to make one at level 1, in seconds: the docs' "cook time". */
  readonly cookSeconds: number
  /** How often it's ordered compared with the other unlocked items: 5 against 4 is 5 in every 9. */
  readonly popularity: number
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
  /** It can only be bought once this leveled upgrade reaches this level: Signage 10. */
  readonly requires: { readonly upgrade: UpgradeItemId; readonly level: number }
  readonly cost: Big
}

/** Anything you level up (Signage, Baristas, Tables or a menu item), in the shape they share. */
export type LeveledUpgrade = LeveledFields & {
  /** null if it's there from the start. */
  readonly unlock: Unlock | null
}

/** Every leveled upgrade, in display order: Signage, Baristas, Tables, then the menu. */
export function leveledUpgrades(franchise: Franchise): readonly LeveledUpgrade[] {
  return [
    { ...franchise.demand, unlock: null },
    { ...franchise.staff, unlock: null },
    { ...franchise.seating, unlock: null },
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
    'id', 'name', 'bonusLevels', 'maxLevel', 'priceRisePerLevel', 'cookTime', 'samples',
    'demand', 'staff', 'seating', 'menu', 'globalUpgrades',
  ])
  const franchise: Franchise = {
    id: readId(root.id, 'id'),
    name: readText(root.name, 'name'),
    bonusLevels: readLevels(root.bonusLevels, 'bonusLevels'),
    maxLevel: readWholeNumber(root.maxLevel, 'maxLevel', 1),
    priceRisePerLevel: readAtLeast(root.priceRisePerLevel, 'priceRisePerLevel', 0),
    cookTime: readCookTime(root.cookTime, 'cookTime'),
    samples: readSamples(root.samples, 'samples'),
    demand: readDemandUpgrade(root.demand, 'demand'),
    staff: readStaffUpgrade(root.staff, 'staff'),
    seating: readSeatingUpgrade(root.seating, 'seating'),
    menu: readList(root.menu, 'menu', readMenuItem),
    globalUpgrades: readList(root.globalUpgrades, 'globalUpgrades', readGlobalUpgrade),
  }
  checkSetup(franchise)
  return franchise
}

/** Levels in increasing order, such as the bonus levels [10, 25, 50, 100]. */
function readLevels(value: unknown, path: string): number[] {
  const levels = readList(value, path, (item, itemPath) => readWholeNumber(item, itemPath, 1))
  levels.forEach((level, i) => {
    const before = levels[i - 1]
    if (before !== undefined && level <= before) {
      fail(`${path}[${i}]`, `must be above the level before it (${before}), got ${level}`)
    }
  })
  return levels
}

function readCookTime(value: unknown, path: string): CookTime {
  const record = readObject(value, path, ['shortest', 'shortestFromLevel', 'extraMachinesAt'])
  const shortest = readShare(record.shortest, `${path}.shortest`)
  if (shortest === 0) fail(`${path}.shortest`, 'must be above 0: nothing is made instantly')
  return {
    shortest,
    // At least 2: every item starts at its full cook time at level 1.
    shortestFromLevel: readWholeNumber(record.shortestFromLevel, `${path}.shortestFromLevel`, 2),
    extraMachinesAt: readLevels(record.extraMachinesAt, `${path}.extraMachinesAt`),
  }
}

function readSamples(value: unknown, path: string): Samples {
  const record = readObject(value, path, ['maxBaristasOutside', 'customersEach'])
  return {
    // 0 turns samples off.
    maxBaristasOutside: readWholeNumber(record.maxBaristasOutside, `${path}.maxBaristasOutside`, 0),
    customersEach: readShare(record.customersEach, `${path}.customersEach`),
  }
}

function readLeveledFields(record: Record<string, unknown>, path: string): LeveledFields {
  return {
    id: readId(record.id, `${path}.id`),
    name: readText(record.name, `${path}.name`),
    firstCost: readDollars(record.firstCost, `${path}.firstCost`),
    // Above 1: each level costs more than the one before.
    costGrowth: readAbove(record.costGrowth, `${path}.costGrowth`, 1),
    // checkSetup makes sure there's one for each bonus level.
    bonusMultipliers: readList(record.bonusMultipliers, `${path}.bonusMultipliers`, readMultiplier),
  }
}

/** A multiplier at a bonus level: at least 1, because a bonus level can't shrink output. */
function readMultiplier(value: unknown, path: string): number {
  return readAtLeast(value, path, 1)
}

function readDemandUpgrade(value: unknown, path: string): DemandUpgrade {
  const upgrade = readObject(value, path, [...LEVELED_FIELDS, 'customersPerMinute', 'startLevel'])
  return {
    ...readLeveledFields(upgrade, path),
    customersPerMinute: readAbove(upgrade.customersPerMinute, `${path}.customersPerMinute`, 0),
    // At least 1: a new game needs something bringing customers in.
    startLevel: readWholeNumber(upgrade.startLevel, `${path}.startLevel`, 1),
  }
}

function readStaffUpgrade(value: unknown, path: string): StaffUpgrade {
  const upgrade = readObject(value, path, [...LEVELED_FIELDS, 'startLevel'])
  return {
    ...readLeveledFields(upgrade, path),
    // At least 1: a new game needs someone to serve.
    startLevel: readWholeNumber(upgrade.startLevel, `${path}.startLevel`, 1),
  }
}

function readSeatingUpgrade(value: unknown, path: string): SeatingUpgrade {
  const upgrade = readObject(value, path, [
    ...LEVELED_FIELDS, 'seatedPerMinute', 'seatedSpend', 'startLevel',
  ])
  return {
    ...readLeveledFields(upgrade, path),
    seatedPerMinute: readAbove(upgrade.seatedPerMinute, `${path}.seatedPerMinute`, 0),
    // At least 1: sitting down doesn't make a customer spend less.
    seatedSpend: readAtLeast(upgrade.seatedSpend, `${path}.seatedSpend`, 1),
    // At least 1: level 0 means locked, and seating has no unlock.
    startLevel: readWholeNumber(upgrade.startLevel, `${path}.startLevel`, 1),
  }
}

function readMenuItem(value: unknown, path: string): MenuItem {
  const item = readObject(value, path, [
    ...LEVELED_FIELDS, 'price', 'cookSeconds', 'popularity', 'unlock',
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
    ...readLeveledFields(item, path),
    price: readDollars(item.price, `${path}.price`),
    cookSeconds: readAbove(item.cookSeconds, `${path}.cookSeconds`, 0),
    popularity: readAbove(item.popularity, `${path}.popularity`, 0),
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
  const { bonusLevels, maxLevel } = franchise

  // The max level is the last bonus level (D35), so no bonus level is out of reach.
  const lastBonusLevel = bonusLevels.at(-1)
  if (lastBonusLevel === undefined) {
    fail('bonusLevels', 'needs at least one level: the last one is the max level')
  }
  if (maxLevel !== lastBonusLevel) {
    fail('maxLevel', `must be the last bonus level (${lastBonusLevel}), got ${maxLevel}`)
  }

  // Every leveled upgrade, with where it sits in the file, for the checks below.
  const leveled: [LeveledFields, string][] = [
    [franchise.demand, 'demand'],
    [franchise.staff, 'staff'],
    [franchise.seating, 'seating'],
    ...franchise.menu.map((item, i): [LeveledFields, string] => [item, `menu[${i}]`]),
  ]

  // Every id is unique, so an id always means one thing in saves and in the code.
  const idPaths: [UpgradeItemId, string][] = [
    ...leveled.map(([upgrade, path]): [UpgradeItemId, string] => [upgrade.id, `${path}.id`]),
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

  // Each leveled upgrade has a multiplier for each bonus level.
  for (const [upgrade, path] of leveled) {
    const [wanted, got] = [bonusLevels.length, upgrade.bonusMultipliers.length]
    if (got !== wanted) {
      const problem = `needs one multiplier per bonus level (${wanted}), got ${got}`
      fail(`${path}.bonusMultipliers`, problem)
    }
  }

  // Starting levels fit under the max.
  const startingUpgrades = [
    [franchise.demand, 'demand'], [franchise.staff, 'staff'], [franchise.seating, 'seating'],
  ] as const
  for (const [upgrade, path] of startingUpgrades) {
    if (upgrade.startLevel > maxLevel) {
      fail(`${path}.startLevel`, `is above maxLevel (${maxLevel}), got ${upgrade.startLevel}`)
    }
  }

  // Menu items reach their shortest cook time, and machines arrive at bonus levels (D33).
  const { cookTime } = franchise
  if (cookTime.shortestFromLevel > maxLevel) {
    const problem = `is above maxLevel (${maxLevel}), so it could never be reached`
    fail('cookTime.shortestFromLevel', problem)
  }
  cookTime.extraMachinesAt.forEach((level, i) => {
    if (!bonusLevels.includes(level)) {
      const problem = `must be one of the bonus levels (${bonusLevels.join(', ')}), got ${level}`
      fail(`cookTime.extraMachinesAt[${i}]`, problem)
    }
  })

  // A new game has something to sell.
  if (!franchise.menu.some((item) => item.unlock === null)) {
    fail('menu', 'needs at least one item with "unlock": null, or a new game has nothing to sell')
  }

  // A global upgrade's requirement names a leveled upgrade, at a level you can reach.
  const leveledIds = leveled.map(([upgrade]) => upgrade.id)
  franchise.globalUpgrades.forEach((upgrade, i) => {
    const path = `globalUpgrades[${i}].requires`
    if (!leveledIds.includes(upgrade.requires.upgrade)) {
      const choices = leveledIds.join(', ')
      fail(`${path}.upgrade`, `must be one of ${choices}, got "${upgrade.requires.upgrade}"`)
    }
    if (upgrade.requires.level > maxLevel) {
      fail(`${path}.level`, `is above maxLevel (${maxLevel}), so it could never be bought`)
    }
  })
}

// The readers. Each checks one value and throws a FranchiseFileError naming where it sits.

function fail(path: string, problem: string): never {
  throw new FranchiseFileError(`${path === '' ? 'the file' : path} ${problem}`)
}

/** An object with exactly these fields: none missing, none unknown (a typo like "cookSecond"). */
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

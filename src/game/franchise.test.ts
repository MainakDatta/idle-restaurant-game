import { describe, expect, test } from 'vitest'
import { COFFEE_SHOP, FranchiseFileError, leveledUpgrades, loadFranchise } from './franchise.ts'
import coffeeShopFile from './franchises/coffee-shop.json' with { type: 'json' }

/**
 * The coffee shop file with one change made to a copy, loaded as if it were the real file.
 * `any` lets each test reach into the JSON freely; the loader is what's under test.
 */
function loadWith(change: (file: any) => void) {
  const file = JSON.parse(JSON.stringify(coffeeShopFile)) // a deep copy, safe for plain JSON
  change(file)
  return loadFranchise(file, 'coffee-shop.json')
}

/** Every leveled upgrade in a copy of the file: Signage, Baristas, Tables and the menu. */
const leveledInFile = (file: any): any[] => [file.demand, file.staff, file.seating, ...file.menu]

describe('the coffee shop file', () => {
  test('loads, with the numbers from design.md', () => {
    expect(COFFEE_SHOP.bonusLevels).toEqual([10, 25, 50, 100])
    expect(COFFEE_SHOP.maxLevel).toBe(100)
    expect(COFFEE_SHOP.demand).toMatchObject({
      id: 'signage',
      customersPerMinute: 6,
      costGrowth: 1.395,
      bonusMultipliers: [3, 3, 3, 6],
    })
    expect(COFFEE_SHOP.staff.firstCost.eq(8)).toBe(true)
    expect(COFFEE_SHOP.seating).toMatchObject({ id: 'tables', seatedPerMinute: 8, seatedSpend: 1.5 })
    expect(COFFEE_SHOP.cookTime).toEqual({ shortest: 0.5, shortestFromLevel: 25, extraMachinesAt: [50, 100] })
    expect(COFFEE_SHOP.samples).toEqual({ maxBaristasOutside: 3, customersEach: 0.1 })
    expect(COFFEE_SHOP.menu.map((item) => [item.id, item.cookSeconds, item.popularity])).toEqual([
      ['drip-coffee', 8, 5],
      ['latte', 12, 4],
      ['muffin', 4, 3],
      ['pumpkin-spice-latte', 14, 2],
    ])
    expect(COFFEE_SHOP.menu[3]?.unlock?.cost.eq(1.63e11)).toBe(true)
    expect(COFFEE_SHOP.globalUpgrades.map((upgrade) => upgrade.id)).toEqual([
      'free-wi-fi',
      'second-grinder',
      'loyalty-cards',
      'local-influencer-visit',
      'mobile-ordering',
      'barista-training',
    ])
  })

  test('lists the leveled upgrades in display order', () => {
    expect(leveledUpgrades(COFFEE_SHOP).map((upgrade) => upgrade.id)).toEqual([
      'signage',
      'baristas',
      'tables',
      'drip-coffee',
      'latte',
      'muffin',
      'pumpkin-spice-latte',
    ])
  })
})

describe('settings the loader accepts', () => {
  test('other bonus levels, with the max level on the last one', () => {
    const franchise = loadWith((file) => {
      file.bonusLevels = [20, 40, 60, 80, 100]
      for (const upgrade of leveledInFile(file)) upgrade.bonusMultipliers = [2, 2, 2, 2, 2]
      file.cookTime.extraMachinesAt = [60, 100]
    })
    expect(franchise.bonusLevels).toEqual([20, 40, 60, 80, 100])
    expect(franchise.staff.bonusMultipliers).toEqual([2, 2, 2, 2, 2])
  })

  test.each([
    ['no samples', (f) => (f.samples.maxBaristasOutside = 0)],
    ['no extra machines', (f) => (f.cookTime.extraMachinesAt = [])],
    ['items that never get faster', (f) => (f.cookTime.shortest = 1)],
    ['seated customers who spend the usual order', (f) => (f.seating.seatedSpend = 1)],
  ] as [string, (file: any) => void][])('%s', (_name, change) => {
    expect(() => loadWith(change)).not.toThrow()
  })
})

describe('mistakes the loader catches, naming the file and the field', () => {
  test.each([
    // A field that's wrong on its own
    ['a missing field', (f) => delete f.priceRisePerLevel, 'priceRisePerLevel is missing'],
    ['a misspelled field', (f) => (f.menu[0].cookSecond = 8), 'menu[0].cookSecond isn\'t a known field'],
    ['the old name for cook time', (f) => (f.menu[0].prepSeconds = 8), 'menu[0].prepSeconds isn\'t a known field'],
    ['text where a number goes', (f) => (f.demand.customersPerMinute = '6'), 'demand.customersPerMinute must be a number, got "6"'],
    ['a negative cost', (f) => (f.staff.firstCost = -8), 'staff.firstCost must be above 0, got -8'],
    ['a free first level', (f) => (f.demand.firstCost = 0), 'demand.firstCost must be above 0, got 0'],
    ['a popularity of 0', (f) => (f.menu[2].popularity = 0), 'menu[2].popularity must be above 0, got 0'],
    ['costs that never rise', (f) => (f.seating.costGrowth = 1), 'seating.costGrowth must be above 1, got 1'],
    ['a share over 100%', (f) => (f.samples.customersEach = 1.5), 'samples.customersEach must be between 0 and 1, got 1.5'],
    ['a max level that isn\'t whole', (f) => (f.maxLevel = 2.5), 'maxLevel must be a whole number, at least 1, got 2.5'],
    ['no staff at the start', (f) => (f.staff.startLevel = 0), 'staff.startLevel must be a whole number, at least 1, got 0'],
    ['no tables at the start', (f) => (f.seating.startLevel = 0), 'seating.startLevel must be a whole number, at least 1, got 0'],
    ['an id with spaces', (f) => (f.menu[0].id = 'Drip coffee'), 'menu[0].id must be lowercase words joined by hyphens'],
    ['a lever that doesn\'t exist', (f) => (f.globalUpgrades[0].lever = 'demnd'), 'globalUpgrades[0].lever must be "demand" or "service", got "demnd"'],
    ['a list that isn\'t a list', (f) => (f.menu = {}), 'menu must be a list, got {}'],
    ['instant cooking', (f) => (f.cookTime.shortest = 0), 'cookTime.shortest must be above 0: nothing is made instantly'],
    ['the shortest cook time at level 1', (f) => (f.cookTime.shortestFromLevel = 1), 'cookTime.shortestFromLevel must be a whole number, at least 2, got 1'],
    ['seated customers who spend less', (f) => (f.seating.seatedSpend = 0.8), 'seating.seatedSpend must be at least 1, got 0.8'],
    ['a bonus level that shrinks output', (f) => (f.staff.bonusMultipliers[0] = 0.5), 'staff.bonusMultipliers[0] must be at least 1, got 0.5'],
    ['a global upgrade that shrinks a lever', (f) => (f.globalUpgrades[1].multiplier = 0.5), 'globalUpgrades[1].multiplier must be at least 1, got 0.5'],
    // A setup that doesn't make sense
    ['two upgrades with one id', (f) => (f.globalUpgrades[0].id = 'latte'), 'globalUpgrades[0].id "latte" is already used by menu[1].id'],
    ['tables and signage with one id', (f) => (f.seating.id = 'signage'), 'seating.id "signage" is already used by demand.id'],
    ['a requirement that names nothing', (f) => (f.globalUpgrades[0].requires.upgrade = 'signs'), 'globalUpgrades[0].requires.upgrade must be one of signage, baristas, tables, drip-coffee, latte, muffin, pumpkin-spice-latte, got "signs"'],
    ['a requirement above the max level', (f) => (f.globalUpgrades[5].requires.level = 150), 'globalUpgrades[5].requires.level is above maxLevel (100), so it could never be bought'],
    ['a start level above the max level', (f) => (f.demand.startLevel = 150), 'demand.startLevel is above maxLevel (100), got 150'],
    ['nothing on the menu at the start', (f) => (f.menu[0].unlock = { name: 'Coffee maker', cost: 10 }), 'menu needs at least one item with "unlock": null'],
    ['bonus levels out of order', (f) => (f.bonusLevels = [10, 50, 25, 100]), 'bonusLevels[2] must be above the level before it (50), got 25'],
    ['no bonus levels', (f) => (f.bonusLevels = []), 'bonusLevels needs at least one level: the last one is the max level'],
    ['a max level that isn\'t the last bonus level', (f) => (f.maxLevel = 50), 'maxLevel must be the last bonus level (100), got 50'],
    ['a multiplier missing for a bonus level', (f) => (f.menu[1].bonusMultipliers = [2, 2, 3]), 'menu[1].bonusMultipliers needs one multiplier per bonus level (4), got 3'],
    ['a machine that arrives off a bonus level', (f) => (f.cookTime.extraMachinesAt = [50, 75]), 'cookTime.extraMachinesAt[1] must be one of the bonus levels (10, 25, 50, 100), got 75'],
    ['the shortest cook time out of reach', (f) => (f.cookTime.shortestFromLevel = 150), 'cookTime.shortestFromLevel is above maxLevel (100), so it could never be reached'],
  ] as [string, (file: any) => void, string][])('%s', (_name, change, message) => {
    expect(() => loadWith(change)).toThrow(FranchiseFileError)
    expect(() => loadWith(change)).toThrow(`coffee-shop.json: ${message}`)
  })

  test('a file that isn\'t an object at all', () => {
    expect(() => loadFranchise([], 'coffee-shop.json')).toThrow('coffee-shop.json: the file must be an object, got []')
  })
})

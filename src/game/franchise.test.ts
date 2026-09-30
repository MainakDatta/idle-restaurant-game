import { describe, expect, test } from 'vitest'
import { COFFEE_SHOP, FranchiseFileError, leveledLines, loadFranchise } from './franchise.ts'
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

describe('the coffee shop file', () => {
  test('loads, with the numbers from design.md', () => {
    expect(COFFEE_SHOP.maxLevel).toBe(50)
    expect(COFFEE_SHOP.costGrowth).toBe(1.26)
    expect(COFFEE_SHOP.demand).toMatchObject({ id: 'tables', customersPerMinute: 6, startLevel: 1 })
    expect(COFFEE_SHOP.staff.firstCost.eq(8)).toBe(true)
    expect(COFFEE_SHOP.menu.map((item) => [item.id, item.popularity])).toEqual([
      ['drip-coffee', 5],
      ['latte', 4],
      ['muffin', 3],
      ['pumpkin-spice-latte', 2],
    ])
    expect(COFFEE_SHOP.menu[3]?.unlock?.cost.eq(373e6)).toBe(true)
    expect(COFFEE_SHOP.globalUpgrades.map((upgrade) => upgrade.id)).toEqual([
      'chalkboard-sign',
      'second-grinder',
      'loyalty-cards',
    ])
  })

  test('lists the lines you level up in display order', () => {
    expect(leveledLines(COFFEE_SHOP).map((line) => line.id)).toEqual([
      'tables',
      'baristas',
      'drip-coffee',
      'latte',
      'muffin',
      'pumpkin-spice-latte',
    ])
  })
})

describe('settings the loader accepts', () => {
  test('no max level', () => {
    expect(loadWith((file) => (file.maxLevel = null)).maxLevel).toBeNull()
  })

  test('no self-serve', () => {
    expect(loadWith((file) => (file.selfServe = null)).selfServe).toBeNull()
  })

  test('bonus levels every 10 levels, with no list', () => {
    const franchise = loadWith((file) => {
      file.bonusLevels = { at: [], thenEvery: { levels: 10, multiplier: 2 } }
    })
    expect(franchise.bonusLevels).toEqual({ at: [], thenEvery: { levels: 10, multiplier: 2 } })
  })

  test('a list of bonus levels with no repeat, and mixed multipliers', () => {
    const franchise = loadWith((file) => {
      file.bonusLevels = { at: [{ level: 10, multiplier: 2 }, { level: 25, multiplier: 3 }], thenEvery: null }
    })
    expect(franchise.bonusLevels.thenEvery).toBeNull()
    expect(franchise.bonusLevels.at[1]).toEqual({ level: 25, multiplier: 3 })
  })
})

describe('mistakes the loader catches, naming the file and the field', () => {
  test.each([
    // A field that's wrong on its own
    ['a missing field', (f) => delete f.costGrowth, 'costGrowth is missing'],
    ['a misspelled field', (f) => (f.menu[0].prepSecond = 8), 'menu[0].prepSecond isn\'t a known field'],
    ['text where a number goes', (f) => (f.demand.customersPerMinute = '6'), 'demand.customersPerMinute must be a number, got "6"'],
    ['a negative cost', (f) => (f.staff.firstCost = -8), 'staff.firstCost must be above 0, got -8'],
    ['a free first level', (f) => (f.demand.firstCost = 0), 'demand.firstCost must be above 0, got 0'],
    ['a popularity of 0', (f) => (f.menu[2].popularity = 0), 'menu[2].popularity must be above 0, got 0'],
    ['costs that never rise', (f) => (f.costGrowth = 1), 'costGrowth must be above 1, got 1'],
    ['a share over 100%', (f) => (f.selfServe = 1.5), 'selfServe must be between 0 and 1, got 1.5'],
    ['a max level that isn\'t whole', (f) => (f.maxLevel = 2.5), 'maxLevel must be a whole number, at least 1, got 2.5'],
    ['no staff at the start', (f) => (f.staff.startLevel = 0), 'staff.startLevel must be a whole number, at least 1, got 0'],
    ['an id with spaces', (f) => (f.menu[0].id = 'Drip coffee'), 'menu[0].id must be lowercase words joined by hyphens'],
    ['a lever that doesn\'t exist', (f) => (f.globalUpgrades[0].lever = 'demnd'), 'globalUpgrades[0].lever must be "demand" or "service", got "demnd"'],
    ['a list that isn\'t a list', (f) => (f.menu = {}), 'menu must be a list, got {}'],
    // A setup that doesn't make sense
    ['two upgrades with one id', (f) => (f.globalUpgrades[0].id = 'latte'), 'globalUpgrades[0].id "latte" is already used by menu[1].id'],
    ['a requirement that names nothing', (f) => (f.globalUpgrades[0].requires.upgrade = 'tablez'), 'globalUpgrades[0].requires.upgrade must be one of tables, baristas, drip-coffee, latte, muffin, pumpkin-spice-latte, got "tablez"'],
    ['a requirement above the max level', (f) => (f.maxLevel = 40), 'globalUpgrades[2].requires.level is above maxLevel (40), so it could never be bought'],
    ['a start level above the max level', (f) => (f.demand.startLevel = 60), 'demand.startLevel is above maxLevel (50), got 60'],
    ['nothing on the menu at the start', (f) => (f.menu[0].unlock = { name: 'Coffee maker', cost: 10 }), 'menu needs at least one item with "unlock": null'],
    ['bonus levels out of order', (f) => (f.bonusLevels.at[1].level = 10), 'bonusLevels.at[1].level must be above the level before it (10), got 10'],
    ['a bonus that shrinks output', (f) => (f.bonusLevels.at[0].multiplier = 0.5), 'bonusLevels.at[0].multiplier must be at least 1, got 0.5'],
    ['a global upgrade that shrinks a lever', (f) => (f.globalUpgrades[1].multiplier = 0.5), 'globalUpgrades[1].multiplier must be at least 1, got 0.5'],
  ] as [string, (file: any) => void, string][])('%s', (_name, change, message) => {
    expect(() => loadWith(change)).toThrow(FranchiseFileError)
    expect(() => loadWith(change)).toThrow(`coffee-shop.json: ${message}`)
  })

  test('a file that isn\'t an object at all', () => {
    expect(() => loadFranchise([], 'coffee-shop.json')).toThrow('coffee-shop.json: the file must be an object, got []')
  })
})

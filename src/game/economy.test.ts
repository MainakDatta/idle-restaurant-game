import { describe, expect, test } from 'vitest'
import { Big } from './big.ts'
import { bonusMultiplier, economy, type Economy } from './economy.ts'
import { COFFEE_SHOP, type UpgradeItemId } from './franchise.ts'
import { newGame, type GameState } from './state.ts'
import { expectBigClose } from './test-utils.ts'

/** A coffee shop game with some levels changed from the start, and some global upgrades. */
function gameWith(levels: Record<UpgradeItemId, number>, bought: UpgradeItemId[] = []): GameState {
  const start = newGame(COFFEE_SHOP)
  return { ...start, levels: { ...start.levels, ...levels }, globalUpgradesBought: bought }
}

/** Checks each number in `expected` against the economy, to about 12 significant digits. */
function expectEconomy(state: GameState, expected: Partial<Record<keyof Economy, number>>) {
  const actual = economy(COFFEE_SHOP, state)
  for (const [name, value] of Object.entries(expected) as [keyof Economy, number][]) {
    const got = actual[name]
    if (typeof got === 'number') expect(got, name).toBeCloseTo(value, 12)
    // A ratio can't compare with 0, so 0 has to match exactly.
    else if (value === 0) expect(got.eq(0), name).toBe(true)
    else expect(Math.abs(got.div(value).toNumber() - 1), name).toBeLessThanOrEqual(1e-12)
  }
}

describe('a new coffee shop', () => {
  // design.md's opening: Service a little above Demand.
  test('opens at Demand 6/min and Service 7.5/min, earning $0.459/s', () => {
    expectEconomy(newGame(COFFEE_SHOP), {
      demand: 6, // 1 level of Signage × 6 customers a minute
      service: 7.5, // 1 barista × 60 s ÷ 8 s per drip coffee
      spend: 3,
      baristasOutside: 0.2, // the spare 1.5 a minute is a fifth of a barista's 7.5
      samples: 0.12, // 10% of Demand for each barista outside: 0.1 × 6 × 0.2
      served: 6.12,
      seats: 8,
      seated: 6.12, // everyone finds a seat
      incomePerSecond: 0.459, // (6.12 × $3 + 6.12 × $3 × 0.5) ÷ 60
    })
  })
})

describe('bonus levels', () => {
  // The coffee shop's Signage: ×3 at levels 10, 25 and 50, then ×6 at 100.
  test.each([
    [1, 1],
    [9, 1],
    [10, 3],
    [24, 3],
    [25, 9],
    [49, 9],
    [50, 27],
    [99, 27],
    [100, 162],
  ])('Signage at level %i multiplies its customers by %i', (level, multiplier) => {
    const { bonusLevels, demand } = COFFEE_SHOP
    const actual = bonusMultiplier(bonusLevels, demand.bonusMultipliers, level)
    expectBigClose(actual, Big.fromValue(multiplier))
  })

  test('each upgrade has its own multipliers: Baristas ×2, ×2, ×3, ×3', () => {
    const { bonusLevels, staff } = COFFEE_SHOP
    expectBigClose(bonusMultiplier(bonusLevels, staff.bonusMultipliers, 50), Big.fromValue(12))
    expectBigClose(bonusMultiplier(bonusLevels, staff.bonusMultipliers, 100), Big.fromValue(36))
  })

  test('a franchise places its own bonus levels', () => {
    expectBigClose(bonusMultiplier([20, 40], [2, 3], 39), Big.fromValue(2))
    expectBigClose(bonusMultiplier([20, 40], [2, 3], 40), Big.fromValue(6))
  })
})

describe('Demand and Service', () => {
  test('Signage brings in 6 customers a minute per level, multiplied at bonus levels', () => {
    expectEconomy(gameWith({ signage: 10 }), { demand: 6 * 10 * 3 })
  })

  test('each barista serves 60 ÷ the cook time a minute, multiplied at bonus levels', () => {
    expectEconomy(gameWith({ baristas: 10 }), { service: 10 * 2 * (60 / 8) })
  })
})

describe('the menu', () => {
  test('each level adds 10% of the starting price, and bonus levels multiply it', () => {
    expectEconomy(gameWith({ 'drip-coffee': 2 }), { spend: 3.3 })
    expectEconomy(gameWith({ 'drip-coffee': 10 }), { spend: 3 * 1.9 * 2 })
    expectEconomy(gameWith({ 'drip-coffee': 100 }), { spend: 3 * 10.9 * 60 })
  })

  // One barista making drip coffee serves 60 ÷ its cook time a minute.
  test('cook time falls a little every level, to half the starting time at level 25', () => {
    expectEconomy(gameWith({ 'drip-coffee': 13 }), { service: 60 / (8 / 1.5) }) // halfway there
    expectEconomy(gameWith({ 'drip-coffee': 25 }), { service: 60 / 4 })
    expectEconomy(gameWith({ 'drip-coffee': 49 }), { service: 60 / 4 }) // never faster than half
  })

  test('levels 50 and 100 add a 2nd and a 3rd machine', () => {
    expectEconomy(gameWith({ 'drip-coffee': 50 }), { service: 2 * (60 / 4) })
    expectEconomy(gameWith({ 'drip-coffee': 100 }), { service: 3 * (60 / 4) })
  })

  // Drip coffee (popularity 5, $3, 8 s) and latte (popularity 4, $84, 12 s): 5 of every 9
  // customers order drip.
  test('Spend and cook time are averaged by popularity', () => {
    expectEconomy(gameWith({ latte: 1 }), {
      spend: (5 * 3 + 4 * 84) / 9,
      service: 60 / ((5 * 8 + 4 * 12) / 9),
    })
  })

  test('items still locked (level 0) count for nothing', () => {
    expectEconomy(gameWith({ latte: 0, muffin: 0 }), { spend: 3, service: 7.5 })
  })
})

describe('the bottleneck', () => {
  // Demand 12 or 18, Service 7.5: the baristas serve all they can. Signage bought now pays only
  // once the baristas catch up (D31).
  test('with a line, extra customers wait instead of being served', () => {
    expectEconomy(gameWith({ signage: 2 }), { served: 7.5, samples: 0, baristasOutside: 0 })
    expectEconomy(gameWith({ signage: 3 }), { served: 7.5 })
  })

  test('Demand exactly equal to Service: everyone is served, and nobody goes outside', () => {
    // 5 levels of Signage bring in 30 a minute; 4 baristas at 7.5 each serve 30.
    expectEconomy(gameWith({ signage: 5, baristas: 4 }), { served: 30, samples: 0 })
  })

  // 10 baristas serve 150 a minute (×2 from level 10), and 6 customers arrive: 9.6 baristas are
  // idle. 3 go outside, and each brings in 10% of Demand.
  test('up to 3 idle baristas hand out samples, each bringing in 10% of Demand', () => {
    expectEconomy(gameWith({ baristas: 10 }), { baristasOutside: 3, samples: 1.8, served: 7.8 })
  })

  test('idle baristas beyond the 3 outside stay behind the counter', () => {
    expectEconomy(gameWith({ baristas: 11 }), { baristasOutside: 3, samples: 1.8, served: 7.8 })
  })

  // Demand 180, Service 195 (13 baristas at 15 a minute): 1 idle barista, whose sample tray
  // could bring in 18 more customers, but there's only time to serve 15.
  test('samples never bring in more than the idle baristas can serve', () => {
    expectEconomy(gameWith({ signage: 10, baristas: 13 }), {
      baristasOutside: 1,
      samples: 15,
      served: 195,
    })
  })
})

describe('seating', () => {
  // Demand 12, Service 15: 12.48 served (samples included), but only 8 seats.
  test('served customers sit if there is a seat, and spend 1.5× when they do', () => {
    expectEconomy(gameWith({ signage: 2, baristas: 2 }), {
      served: 12.48,
      seats: 8,
      seated: 8,
      incomePerSecond: (12.48 * 3 + 8 * 3 * 0.5) / 60,
    })
  })

  test('bonus levels multiply the seats', () => {
    expectEconomy(gameWith({ tables: 10 }), { seats: 8 * 10 * 3 })
  })
})

describe('global upgrades', () => {
  test('each multiplies its own lever once bought', () => {
    expectEconomy(gameWith({}, ['free-wi-fi']), { demand: 12, service: 7.5 })
    expectEconomy(gameWith({}, ['second-grinder']), { demand: 6, service: 15 })
    expectEconomy(gameWith({}, ['barista-training']), { service: 7.5 * 1.5 })
    const demandBoosts = ['free-wi-fi', 'loyalty-cards', 'local-influencer-visit']
    expectEconomy(gameWith({}, demandBoosts), { demand: 6 * 8 })
  })
})

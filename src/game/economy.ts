// The economy (D17, D29, design.md *Inside a run*): how a game's levels turn into customers and
// money. Everything is a rate worked out from the state alone, so income only changes when a
// purchase does, and catch-up stays exact (D18). Nothing here changes the state, and every
// number comes from the franchise file.

import { Big } from './big.ts'
import type { Franchise, Lever, MenuItem } from './franchise.ts'
import type { GameState } from './state.ts'
import { levelOf } from './upgrades.ts'

/** Everything the shop does right now. Customers are per minute; income is per second. */
export type Economy = {
  /** Demand: customers arriving per minute. Players see "Customers" (D30). */
  readonly demand: Big
  /** Service: customers the baristas could serve per minute. */
  readonly service: Big
  /** Spend: what the average customer orders, weighted by popularity. */
  readonly spend: Big
  /**
   * Idle baristas outside with sample trays, from 0 up to the franchise's max. It can be a
   * fraction: 0.2 means a fifth of a barista's time.
   */
  readonly baristasOutside: number
  /** The extra customers a minute their samples bring in (D32). */
  readonly samples: Big
  /** Customers served per minute, samples included. */
  readonly served: Big
  /** How many customers a minute the tables can seat (D30). */
  readonly seats: Big
  /** Served customers who sit down, per minute. The rest take their order to go. */
  readonly seated: Big
  readonly incomePerSecond: Big
}

/** Works out the shop's levers, customers and income from its levels. */
export function economy(franchise: Franchise, state: GameState): Economy {
  const { bonusLevels } = franchise
  const order = averageOrder(franchise, state)

  // Demand: each level of Signage brings in customersPerMinute, and bonus levels multiply them.
  const signage = levelOf(state, franchise.demand.id)
  const demand = bonusMultiplier(bonusLevels, franchise.demand.bonusMultipliers, signage)
    .mul(franchise.demand.customersPerMinute * signage)
    .mul(globalMultiplier(franchise, state, 'demand'))

  // Service: each barista makes one order per average cook time, so 60 ÷ that a minute.
  const baristas = levelOf(state, franchise.staff.id)
  const service = bonusMultiplier(bonusLevels, franchise.staff.bonusMultipliers, baristas)
    .mul(baristas * 60)
    .div(order.cookSeconds)
    .mul(globalMultiplier(franchise, state, 'service'))

  // The bottleneck (D17). With a line, the baristas serve all they can and the rest wait. With
  // time to spare, up to maxBaristasOutside idle baristas hand out samples outside (D32).
  let served = service
  let samples = Big.ZERO
  let baristasOutside = 0
  if (service.gte(demand)) {
    const spare = service.sub(demand)
    // Each barista serves service ÷ baristas a minute, so the spare is this many idle baristas.
    const idleBaristas = spare.div(service.div(baristas)).toNumber()
    baristasOutside = Math.min(idleBaristas, franchise.samples.maxBaristasOutside)
    // Each one brings in a share of Demand, but never more than the idle baristas can serve.
    samples = demand.mul(franchise.samples.customersEach * baristasOutside).min(spare)
    served = demand.add(samples)
  }

  // Served customers sit down if there's a seat, and spend more when they do (D30).
  const tables = levelOf(state, franchise.seating.id)
  const seats = bonusMultiplier(bonusLevels, franchise.seating.bonusMultipliers, tables)
    .mul(franchise.seating.seatedPerMinute * tables)
  const seated = seats.min(served)

  // Everyone pays Spend, and those who sit pay (seatedSpend − 1) × Spend on top. Customers are
  // per minute and income is per second, hence the ÷ 60.
  const dineIn = seated.mul(order.spend).mul(franchise.seating.seatedSpend - 1)
  const incomePerSecond = served.mul(order.spend).add(dineIn).div(60)
  return {
    demand,
    service,
    spend: order.spend,
    baristasOutside,
    samples,
    served,
    seats,
    seated,
    incomePerSecond,
  }
}

/**
 * What the bonus levels an upgrade has reached multiply its output by: their multipliers,
 * multiplied together. Signage (×3 at 10, ×3 at 25) is ×9 at level 25 (D34).
 */
export function bonusMultiplier(
  bonusLevels: readonly number[],
  multipliers: readonly number[],
  level: number,
): Big {
  let multiplier = Big.ONE
  bonusLevels.forEach((bonusLevel, i) => {
    // The loader makes sure there's a multiplier for every bonus level.
    if (level >= bonusLevel) multiplier = multiplier.mul(multipliers[i])
  })
  return multiplier
}

/**
 * Spend and the average cook time over the unlocked items, each weighted by popularity. With
 * drip coffee (popularity 5, $3) and latte (4, $84), Spend is (5 × $3 + 4 × $84) ÷ 9 = $39.
 */
function averageOrder(franchise: Franchise, state: GameState) {
  let popularity = 0
  let prices = Big.ZERO
  let cookSeconds = 0
  for (const item of franchise.menu) {
    const level = levelOf(state, item.id)
    if (level === 0) continue // not unlocked yet
    popularity += item.popularity
    prices = prices.add(priceAt(franchise, item, level).mul(item.popularity))
    cookSeconds += cookSecondsAt(franchise, item, level) * item.popularity
  }
  // The loader makes sure something is on the menu from the start, so this never divides by 0.
  return { spend: prices.div(popularity), cookSeconds: cookSeconds / popularity }
}

/**
 * A menu item's price at `level`: each level adds priceRisePerLevel of the starting price, and
 * bonus levels multiply it. Drip coffee is $3, then $3.30, $3.60… and $11.40 at level 10 (D33).
 */
function priceAt(franchise: Franchise, item: MenuItem, level: number): Big {
  const rise = 1 + franchise.priceRisePerLevel * (level - 1)
  const bonus = bonusMultiplier(franchise.bonusLevels, item.bonusMultipliers, level)
  return item.price.mul(rise).mul(bonus)
}

/**
 * A menu item's cook time at `level`, in seconds (D33). It falls a little every level until it
 * reaches `shortest` of the starting time, and each extra machine makes as many again: drip
 * coffee takes 8 s, then 4 s from level 25, and 2 s once a 2nd machine arrives at level 50.
 */
function cookSecondsAt(franchise: Franchise, item: MenuItem, level: number): number {
  const { shortest, shortestFromLevel, extraMachinesAt } = franchise.cookTime
  // Speed rises evenly, from 1 at level 1 to 1 ÷ shortest (2 for half the time) at
  // shortestFromLevel.
  const progress = Math.min(level - 1, shortestFromLevel - 1) / (shortestFromLevel - 1)
  const speed = 1 + (1 / shortest - 1) * progress
  const machines = 1 + extraMachinesAt.filter((machineLevel) => level >= machineLevel).length
  return item.cookSeconds / (speed * machines)
}

/** The bought global upgrades' multipliers for one lever, multiplied together. */
function globalMultiplier(franchise: Franchise, state: GameState, lever: Lever): Big {
  let multiplier = Big.ONE
  for (const upgrade of franchise.globalUpgrades) {
    if (upgrade.lever === lever && state.globalUpgradesBought.includes(upgrade.id)) {
      multiplier = multiplier.mul(upgrade.multiplier)
    }
  }
  return multiplier
}

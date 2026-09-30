// The economy (D17, D19, design.md *Inside a run*): how a game's levels turn into customers and
// money. Everything is a rate worked out from the state alone, so income only changes when a
// purchase does, and catch-up stays exact (D18). Nothing here changes the state.
//
// This is our reading of the design docs, which the design chat is confirming (D29). Every
// number comes from the franchise file.

import { Big } from './big.ts'
import type { BonusLevels, Franchise, Lever, MenuItem } from './franchise.ts'
import type { GameState } from './state.ts'
import { levelOf } from './upgrades.ts'

/** Everything the shop does right now. Customers are per minute; income is per second. */
export type Economy = {
  /** Demand: customers arriving per minute. */
  readonly demand: Big
  /** Service: customers the staff could serve per minute. */
  readonly service: Big
  /** Spend: what the average customer pays, the popularity-weighted average price. */
  readonly spend: Big
  /** Customers served by staff per minute, each paying Spend. */
  readonly served: Big
  /** Customers from the line who serve themselves, per minute. 0 when there's no line. */
  readonly selfServe: Big
  /** What a self-serve customer pays: the cheapest unlocked item's current price. */
  readonly selfServePrice: Big
  readonly incomePerSecond: Big
}

/** Works out the shop's levers, customers and income from its levels. */
export function economy(franchise: Franchise, state: GameState): Economy {
  const menu = menuNow(franchise, state)

  // Demand: each table brings in customersPerMinute, and bonus levels multiply all of them.
  const tables = levelOf(state, franchise.demand.id)
  const demand = bonusMultiplier(franchise.bonusLevels, tables)
    .mul(franchise.demand.customersPerMinute * tables)
    .mul(globalMultiplier(franchise, state, 'demand'))

  // Service: each barista serves one customer per average prep time, so 60 ÷ prep a minute.
  const baristas = levelOf(state, franchise.staff.id)
  const service = bonusMultiplier(franchise.bonusLevels, baristas)
    .mul(baristas * 60)
    .div(weightedAverage(menu, (item) => item.prepSeconds))
    .mul(globalMultiplier(franchise, state, 'service'))

  const spend = weightedAverage(menu, (item) => item.price)
  const selfServePrice = menu
    .map((item) => item.price)
    .reduce((cheapest, price) => cheapest.min(price))

  // The bottleneck (D17). Big can't go below zero, so each side subtracts the smaller lever.
  let served: Big
  let selfServe = Big.ZERO
  if (service.gte(demand)) {
    // Idle baristas step outside with samples, bringing in a share of their spare capacity as
    // extra customers (spillover across roles).
    served = demand.add(service.sub(demand).mul(franchise.spillover.acrossRoles))
  } else {
    // A line: the baristas serve all they can, and a share of the rest serve themselves.
    served = service
    if (franchise.selfServe !== null) selfServe = demand.sub(service).mul(franchise.selfServe)
  }

  // Customers are per minute and income is per second, hence the ÷ 60.
  const incomePerSecond = served.mul(spend).add(selfServe.mul(selfServePrice)).div(60)
  return { demand, service, spend, served, selfServe, selfServePrice, incomePerSecond }
}

/**
 * What the bonus levels multiply a leveled upgrade's output by at `level`: each listed bonus
 * level reached so far, then the repeat after the last one. With the coffee shop's setting
 * (×2 at 10, 25, 50 and 100, then every 50), level 9 is ×1, 10 is ×2, 25 is ×4 and 150 is ×32.
 */
export function bonusMultiplier(bonusLevels: BonusLevels, level: number): Big {
  let multiplier = Big.ONE
  for (const bonus of bonusLevels.at) {
    if (level >= bonus.level) multiplier = multiplier.mul(bonus.multiplier)
  }
  const repeat = bonusLevels.thenEvery
  if (repeat !== null) {
    // The repeat counts from the last listed level, or from 0 if none are listed.
    const lastListed = bonusLevels.at.at(-1)?.level ?? 0
    const repeats = Math.floor(Math.max(0, level - lastListed) / repeat.levels)
    multiplier = multiplier.mul(Big.fromValue(repeat.multiplier).pow(repeats))
  }
  return multiplier
}

/** An unlocked menu item as it is at its current level. */
type ItemNow = {
  readonly popularity: number
  readonly price: Big
  /** A Big, because bonus levels can shrink it without limit. */
  readonly prepSeconds: Big
}

/** The unlocked menu items (level 1 and up), with their prices and prep times right now. */
function menuNow(franchise: Franchise, state: GameState): ItemNow[] {
  return franchise.menu
    .filter((item) => levelOf(state, item.id) > 0)
    .map((item) => {
      const level = levelOf(state, item.id)
      return {
        popularity: item.popularity,
        price: priceAt(franchise, item, level),
        // Bonus levels make an item faster to make: ×2 speed halves its prep time (D19).
        prepSeconds: Big.fromValue(item.prepSeconds).div(
          bonusMultiplier(franchise.bonusLevels, level),
        ),
      }
    })
}

/**
 * A menu item's price at `level`. Each level adds the same amount, priceRisePerLevel of the
 * starting price: drip coffee is $3, then $3.30, $3.60…
 */
function priceAt(franchise: Franchise, item: MenuItem, level: number): Big {
  return item.price.mul(1 + franchise.priceRisePerLevel * (level - 1))
}

/**
 * The average of `value` over the menu, where each item counts as often as it's ordered. With
 * drip (popularity 5, $3) and latte (4, $51), that's (5 × $3 + 4 × $51) ÷ 9 = $24.33.
 */
function weightedAverage(menu: readonly ItemNow[], value: (item: ItemNow) => Big): Big {
  let total = Big.ZERO
  let popularity = 0
  for (const item of menu) {
    total = total.add(value(item).mul(item.popularity))
    popularity += item.popularity
  }
  // The loader makes sure something is on the menu from the start, so this never divides by 0.
  return total.div(popularity)
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

// A human-like simulated player (D40) plays whole coffee shop runs through the real engine, and
// the test checks how each run goes against design.md's placeholder pacing. The player decides
// only by what the screen would show, never by income math (design.md *Simulated players*).

import { beforeAll, describe, expect, test } from 'vitest'
import type { Big } from './big.ts'
import { economy, type Economy } from './economy.ts'
import { COFFEE_SHOP, leveledUpgrades, type UpgradeItemId } from './franchise.ts'
import { advance, newGame, type GameState } from './state.ts'
import { makeRandom } from './test-utils.ts'
import { buy, nextCost, requirementMet } from './upgrades.ts'

const MINUTE = 60
const HOUR = 60 * MINUTE

type Range = { readonly from: number; readonly to: number }

/**
 * What a run should look like, as ranges around the design chat's simulation of the same player
 * (design.md *Pacing targets* and *Placeholder numbers: coffee shop*). Every threshold the test
 * checks is here, so moving one is a one-line change. They're guesses that Phase 1 will tune: if a
 * run misses one by less than 10%, talk it through before retuning the coffee shop or moving the
 * threshold.
 */
const EXPECTED = {
  /** Seconds. Simulated: 4 s. Target: within about 10 s. */
  firstPurchase: { from: 2, to: 10 },
  /** Simulated: 1.4–1.9 min. Target: 1–3 min. */
  firstBonusLevel: { from: 1 * MINUTE, to: 3 * MINUTE },
  /** When each unlock is bought. Simulated: about 2.5 min, 15 min and 1.1 h. */
  unlocks: {
    latte: { from: 1.5 * MINUTE, to: 4 * MINUTE },
    muffin: { from: 10 * MINUTE, to: 25 * MINUTE },
    'pumpkin-spice-latte': { from: 45 * MINUTE, to: 1.5 * HOUR },
  } as Record<UpgradeItemId, Range>,
  /** What an unlock multiplies income by. Simulated: ×1.9 to ×2.2. Target: about ×2. */
  unlockIncomeGain: { from: 1.5, to: 3 },
  /**
   * Until every upgrade is maxed and every global upgrade bought. Simulated: 4.4 h. Target: 4–6 h.
   */
  fullRun: { from: 4 * HOUR, to: 6 * HOUR },
  /** The share of the run the shop spends balanced. Simulated: about 80%. Target: most of it. */
  balanced: { from: 0.7, to: 1 },
} as const

/** The human-like player's habits (D40). */
const PLAYER = {
  /** It never saves up for longer than this. */
  patienceSeconds: 3 * MINUTE,
  /** Gut feel nudges each option's score by up to ±40%. */
  gutFeel: 0.4,
  /** When nothing is within reach, it looks again after this long. */
  lookAgainSeconds: MINUTE,
}

/** A run that hasn't finished by now has gone wrong. */
const GIVE_UP_AFTER = 12 * HOUR

/** How the shop looks on screen (design.md *The shop's three states*). */
type ShopState = 'overstaffed' | 'balanced' | 'backed up'

type Purchase = {
  readonly id: UpgradeItemId
  /** Seconds since the run started. */
  readonly at: number
  /** The level it reached, or undefined for a global upgrade. */
  readonly level: number | undefined
  readonly incomeBefore: Big
  readonly incomeAfter: Big
}

type Run = {
  readonly purchases: readonly Purchase[]
  /** Seconds until there was nothing left to buy. */
  readonly seconds: number
  /** How long the shop spent in each state. */
  readonly secondsIn: Readonly<Record<ShopState, number>>
}

/** Every upgrade in the coffee shop: the leveled ones, then the global ones. */
const ALL_IDS = [
  ...leveledUpgrades(COFFEE_SHOP).map((upgrade) => upgrade.id),
  ...COFFEE_SHOP.globalUpgrades.map((upgrade) => upgrade.id),
]

/** Plays a coffee shop run until there's nothing left to buy. The seed fixes its gut feel. */
function playRun(seed: number): Run {
  const random = makeRandom(seed)
  const purchases: Purchase[] = []
  const secondsIn: Record<ShopState, number> = { overstaffed: 0, balanced: 0, 'backed up': 0 }
  let state = newGame(COFFEE_SHOP)
  let seconds = 0

  // Nothing changes while the player waits, so the shop stays in one state the whole time.
  const wait = (waitSeconds: number, now: Economy) => {
    state = advance(COFFEE_SHOP, state, waitSeconds)
    seconds += waitSeconds
    secondsIn[shopState(now)] += waitSeconds
  }

  while (ALL_IDS.some((id) => nextCost(COFFEE_SHOP, state, id) !== null)) {
    if (seconds > GIVE_UP_AFTER) throw new Error(`the run didn't finish in ${GIVE_UP_AFTER} s`)
    const now = economy(COFFEE_SHOP, state)
    const choice = choose(state, now, random)
    if (choice === undefined) {
      wait(PLAYER.lookAgainSeconds, now)
      continue
    }
    if (state.money.lt(choice.cost)) {
      // Wait until it's affordable, plus a millisecond so rounding can't leave it a hair short.
      wait(choice.cost.sub(state.money).div(now.incomePerSecond).toNumber() + 0.001, now)
    }
    state = buy(COFFEE_SHOP, state, choice.id)
    purchases.push({
      id: choice.id,
      at: seconds,
      level: state.levels[choice.id],
      incomeBefore: now.incomePerSecond,
      incomeAfter: economy(COFFEE_SHOP, state).incomePerSecond,
    })
  }
  return { purchases, seconds, secondsIn }
}

/**
 * What the player buys next, or undefined if everything would take too long to save for. It
 * scores each option by how much it likes it, nudged by gut feel, and buys the highest:
 * appeal × gut feel ÷ √(cost in minutes of income) ÷ (1 + minutes it must wait).
 */
function choose(state: GameState, now: Economy, random: () => number) {
  // Plain numbers are fine for judging, and money itself stays a Big.
  const income = now.incomePerSecond.toNumber()
  const money = state.money.toNumber()
  const shop = shopState(now)
  const seatsFull = now.seated.gte(now.seats.mul(0.999))
  let best: { id: UpgradeItemId; cost: Big; score: number } | undefined
  for (const id of ALL_IDS) {
    const cost = nextCost(COFFEE_SHOP, state, id)
    if (cost === null || !requirementMet(COFFEE_SHOP, state, id)) continue
    const waitSeconds = Math.max(0, (cost.toNumber() - money) / income)
    if (waitSeconds > PLAYER.patienceSeconds) continue
    const gutFeel = 1 - PLAYER.gutFeel + 2 * PLAYER.gutFeel * random()
    // Cheap things feel better, and waiting feels worse. Anything under 3 seconds of income
    // counts as 3 seconds, so very cheap things don't divide by almost nothing.
    const costInMinutes = Math.max(cost.toNumber() / (income * MINUTE), 0.05)
    const score =
      (appeal(id, state, shop, seatsFull) * gutFeel) /
      Math.sqrt(costInMinutes) /
      (1 + waitSeconds / MINUTE)
    if (best === undefined || score > best.score) best = { id, cost, score }
  }
  return best
}

/**
 * How much the player likes an option, going only by what the screen shows: it loves unlocks,
 * ×2 upgrades and maxing things out, and likes reaching bonus levels.
 */
function appeal(id: UpgradeItemId, state: GameState, shop: ShopState, seatsFull: boolean) {
  const { demand, staff, seating, bonusLevels, maxLevel } = COFFEE_SHOP
  if (COFFEE_SHOP.globalUpgrades.some((upgrade) => upgrade.id === id)) return 6
  const level = state.levels[id] ?? 0
  if (level === 0) return 10 // an unlock: a new menu item

  let liking: number
  if (id === demand.id) liking = { overstaffed: 5, balanced: 3, 'backed up': 1 }[shop]
  else if (id === staff.id) liking = { 'backed up': 5, balanced: 3, overstaffed: 1 }[shop]
  else if (id === seating.id) liking = seatsFull ? 4 : 1
  else {
    // A menu item: nicer when its next level is a bonus level, or one is 1 to 3 levels after it.
    const next = level + 1
    const soon = bonusLevels.some((bonusLevel) => bonusLevel > next && bonusLevel - next <= 3)
    liking = 3 + (bonusLevels.includes(next) ? 2 : soon ? 1 : 0)
  }
  // Nearly done: more for the last level, a little within 5 levels of the max.
  const levelsLeft = maxLevel - level
  return liking + (levelsLeft === 1 ? 4 : levelsLeft <= 5 ? 2 : 0)
}

/**
 * The shop's state as the player sees it, with a 5% margin for what a person would notice.
 * Overstaffed means baristas are still idle after the most samples can bring in: 3 baristas
 * outside at 10% each is 30% more customers.
 */
function shopState(now: Economy): ShopState {
  const { maxBaristasOutside, customersEach } = COFFEE_SHOP.samples
  const withMostSamples = 1 + maxBaristasOutside * customersEach
  const serviceOverDemand = now.service.div(now.demand).toNumber()
  if (serviceOverDemand < 0.95) return 'backed up'
  if (serviceOverDemand > 1.05 * withMostSamples) return 'overstaffed'
  return 'balanced'
}

/** A duration the way the test's messages show it: 4.4 s, 2.6 min, 1.10 h. */
function time(seconds: number): string {
  if (seconds < MINUTE) return `${seconds.toFixed(1)} s`
  if (seconds < HOUR) return `${(seconds / MINUTE).toFixed(1)} min`
  return `${(seconds / HOUR).toFixed(2)} h`
}

/** Checks that a measured value falls in its range. The message shows both if it doesn't. */
function expectWithin(value: number | undefined, range: Range, show: (n: number) => string) {
  const got = value === undefined ? 'nothing' : show(value)
  const message = `got ${got}, expected ${show(range.from)} to ${show(range.to)}`
  expect(value, message).toBeDefined()
  expect(value! >= range.from && value! <= range.to, message).toBe(true)
}

const times = (n: number) => `×${n.toFixed(2)}`
const share = (n: number) => `${Math.round(n * 100)}%`

describe.each([1, 2, 3])('a coffee shop run, human-like player with seed %i', (seed) => {
  let run: Run
  beforeAll(() => {
    run = playRun(seed)
  })

  // Only unlocks bring a menu item to level 1: everything else starts at level 1 or above.
  const unlocks = () => run.purchases.filter((purchase) => purchase.level === 1)

  test('first purchase within about 10 seconds', () => {
    expectWithin(run.purchases[0]?.at, EXPECTED.firstPurchase, time)
  })

  test('first bonus level within 1 to 3 minutes', () => {
    const firstBonusLevel = COFFEE_SHOP.bonusLevels[0]
    const reached = run.purchases.find((purchase) => purchase.level === firstBonusLevel)
    expectWithin(reached?.at, EXPECTED.firstBonusLevel, time)
  })

  test.each(Object.keys(EXPECTED.unlocks))('%s unlocks on time', (id) => {
    const unlock = unlocks().find((purchase) => purchase.id === id)
    expectWithin(unlock?.at, EXPECTED.unlocks[id]!, time)
  })

  test('each unlock about doubles income', () => {
    for (const unlock of unlocks()) {
      const gain = unlock.incomeAfter.div(unlock.incomeBefore).toNumber()
      expectWithin(gain, EXPECTED.unlockIncomeGain, times)
    }
  })

  test('every upgrade maxed in 4 to 6 hours', () => {
    expectWithin(run.seconds, EXPECTED.fullRun, time)
  })

  test('the shop is balanced most of the run', () => {
    expectWithin(run.secondsIn.balanced / run.seconds, EXPECTED.balanced, share)
  })
})

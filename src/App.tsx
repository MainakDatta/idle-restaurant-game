import { useSyncExternalStore } from 'react'
import type { Big } from './game/big.ts'
import { economy, type Economy } from './game/economy.ts'
import {
  leveledUpgrades,
  type Franchise,
  type Lever,
  type UpgradeItemId,
} from './game/franchise.ts'
import { formatBig } from './game/format.ts'
import type { GameState } from './game/state.ts'
import { buy, canBuy, nextCost, requirementMet } from './game/upgrades.ts'
import type { GameStateStore } from './runtime/game-state-store.ts'

type AppProps = { franchise: Franchise; gameStateStore: GameStateStore }

function App({ franchise, gameStateStore }: AppProps) {
  // React's hook for reading state kept outside React: it redraws App whenever the store
  // changes, which is every frame while money is going up.
  const state = useSyncExternalStore(gameStateStore.subscribe, gameStateStore.getState)
  const readout = temporaryReadout(state, economy(franchise, state))

  // Buys from the store's latest state, which can be a frame newer than the one drawn.
  const buyUpgrade = (id: UpgradeItemId) =>
    gameStateStore.setState(buy(franchise, gameStateStore.getState(), id))

  return (
    <main>
      <h1>{import.meta.env.VITE_GAME_TITLE}</h1>
      {/* Temporary, to try the economy and buying. Step 5 builds the real screen. */}
      <p>{readout.money}</p>
      <p>{readout.levers}</p>
      <p>{readout.customers}</p>
      <ul className="upgrades">
        {upgradeButtons(franchise, state).map(({ id, label }) => (
          <li key={id}>
            <button
              type="button"
              disabled={!canBuy(franchise, state, id)}
              onClick={() => buyUpgrade(id)}
            >
              {label}
            </button>
          </li>
        ))}
      </ul>
    </main>
  )
}

/** The temporary screen's numbers, as lines of text. */
function temporaryReadout(state: GameState, now: Economy) {
  const levers = [
    `Customers ${perMinute(now.demand)}`,
    `Service ${perMinute(now.service)}`,
    `Spend ${dollars(now.spend)}`,
  ]
  const customers = [
    `Served ${perMinute(now.served)}`,
    `${perMinute(now.samples)} from samples (${now.baristasOutside.toFixed(1)} baristas outside)`,
    `Seated ${perMinute(now.seated)} of ${perMinute(now.seats)}`,
  ]
  return {
    money: `Money: ${dollars(state.money)} · Income: ${dollars(now.incomePerSecond)}/s`,
    levers: levers.join(' · '),
    customers: customers.join(' · '),
  }
}

const dollars = (amount: Big) => `$${formatBig(amount, 'short')}`
const perMinute = (rate: Big) => `${formatBig(rate, 'short')}/min`

/** What players call each lever: Demand shows as "Customers" for now (D30). */
const LEVER_NAMES: Record<Lever, string> = { demand: 'customers', service: 'service' }

type UpgradeButton = { id: UpgradeItemId; label: string }

/** A label for every upgrade on offer. Global upgrades drop off the list once bought. */
function upgradeButtons(franchise: Franchise, state: GameState): UpgradeButton[] {
  const leveled = leveledUpgrades(franchise)
  const leveledButtons = leveled.map((upgrade) => {
    const level = state.levels[upgrade.id] ?? 0
    if (level === 0 && upgrade.unlock !== null) {
      const unlockCost = formatBig(upgrade.unlock.cost, 'short')
      const label = `${upgrade.unlock.name} (unlocks ${upgrade.name}) · $${unlockCost}`
      return { id: upgrade.id, label }
    }
    const cost = nextCost(franchise, state, upgrade.id)
    const price = cost === null ? 'Max' : `$${formatBig(cost, 'short')}`
    return { id: upgrade.id, label: `${upgrade.name} · level ${level} · ${price}` }
  })
  const globalButtons = franchise.globalUpgrades
    .filter((upgrade) => !state.globalUpgradesBought.includes(upgrade.id))
    .map((upgrade) => {
      const name = `${upgrade.name} (${LEVER_NAMES[upgrade.lever]} ×${upgrade.multiplier})`
      if (requirementMet(franchise, state, upgrade.id)) {
        return { id: upgrade.id, label: `${name} · $${formatBig(upgrade.cost, 'short')}` }
      }
      const { upgrade: requiredId, level } = upgrade.requires
      const required = leveled.find((candidate) => candidate.id === requiredId)
      return { id: upgrade.id, label: `${name} · needs ${required?.name ?? requiredId} ${level}` }
    })
  return [...leveledButtons, ...globalButtons]
}

export default App

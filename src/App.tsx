import { useSyncExternalStore } from 'react'
import { leveledLines, type Franchise, type UpgradeId } from './game/franchise.ts'
import { formatBig } from './game/format.ts'
import type { GameState } from './game/state.ts'
import { buy, canBuy, nextCost, requirementMet } from './game/upgrades.ts'
import type { GameStateStore } from './runtime/game-state-store.ts'

type AppProps = { franchise: Franchise; gameStateStore: GameStateStore }

function App({ franchise, gameStateStore }: AppProps) {
  // React's hook for reading state kept outside React: it redraws App whenever the store
  // changes, which is every frame while money is going up.
  const state = useSyncExternalStore(gameStateStore.subscribe, gameStateStore.getState)

  // Buys from the store's latest state, which can be a frame newer than the one drawn.
  const buyUpgrade = (id: UpgradeId) =>
    gameStateStore.setState(buy(franchise, gameStateStore.getState(), id))

  return (
    <main>
      <h1>{import.meta.env.VITE_GAME_TITLE}</h1>
      {/* Temporary, to try the loop and buying. Step 5 builds the real screen. */}
      <p>Money: ${formatBig(state.money, 'short')}</p>
      <ul className="upgrades">
        {upgradeButtons(franchise, state).map(({ id, label }) => (
          <li key={id}>
            <button type="button" disabled={!canBuy(franchise, state, id)} onClick={() => buyUpgrade(id)}>
              {label}
            </button>
          </li>
        ))}
      </ul>
    </main>
  )
}

/** A label for every upgrade on offer. Global upgrades drop off the list once bought. */
function upgradeButtons(franchise: Franchise, state: GameState): { id: UpgradeId; label: string }[] {
  const lines = leveledLines(franchise)
  const lineButtons = lines.map((line) => {
    const level = state.levels[line.id] ?? 0
    if (level === 0 && line.unlock !== null) {
      const label = `${line.unlock.name} (unlocks ${line.name}) · $${formatBig(line.unlock.cost, 'short')}`
      return { id: line.id, label }
    }
    const cost = nextCost(franchise, state, line.id)
    const price = cost === null ? 'Max' : `$${formatBig(cost, 'short')}`
    return { id: line.id, label: `${line.name} · level ${level} · ${price}` }
  })
  const globalButtons = franchise.globalUpgrades
    .filter((upgrade) => !state.globalUpgradesBought.includes(upgrade.id))
    .map((upgrade) => {
      const name = `${upgrade.name} (${upgrade.lever} ×${upgrade.multiplier})`
      if (requirementMet(franchise, state, upgrade.id)) {
        return { id: upgrade.id, label: `${name} · $${formatBig(upgrade.cost, 'short')}` }
      }
      const { upgrade: lineId, level } = upgrade.requires
      const lineName = lines.find((line) => line.id === lineId)?.name ?? lineId
      return { id: upgrade.id, label: `${name} · needs ${lineName} ${level}` }
    })
  return [...lineButtons, ...globalButtons]
}

export default App

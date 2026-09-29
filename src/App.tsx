import { useSyncExternalStore } from 'react'
import { formatBig } from './game/format.ts'
import type { GameStore } from './runtime/store.ts'

function App({ store }: { store: GameStore }) {
  // React's hook for reading state kept outside React: it redraws App whenever the store
  // changes, which is every frame while money is going up.
  const { money } = useSyncExternalStore(store.subscribe, store.getState)

  return (
    <main>
      <h1>{import.meta.env.VITE_GAME_TITLE}</h1>
      {/* Temporary, to watch the loop run. Step 5 builds the real screen. */}
      <p>Money: {formatBig(money, 'short')}</p>
    </main>
  )
}

export default App

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { formatBig } from './game/format.ts'
import { newGame } from './game/state.ts'
import { startGame } from './runtime/game.ts'

// The one game loop, started here outside React so StrictMode's double effects can't start a
// second one (D27). Saves (step 6) will hand startGame the loaded game instead of a new one.
const gameStateStore = startGame(newGame(), {
  // A debugging aid: logs each catch-up to the browser console (F12).
  onCatchUp: ({ seconds, earned }) => {
    const away = seconds < 60 ? `${Math.round(seconds)} s` : `${(seconds / 60).toFixed(1)} min`
    console.log(`You were away for ${away} and earned ${formatBig(earned, 'short')}.`)
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App gameStateStore={gameStateStore} />
  </StrictMode>,
)

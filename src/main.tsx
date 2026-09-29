import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { newGame } from './game/state.ts'
import { startGame } from './runtime/game.ts'

// The one game loop, started here outside React so StrictMode's double effects can't start a
// second one (D27). Saves (step 6) will hand startGame the loaded game instead of a new one.
const store = startGame(newGame())

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App store={store} />
  </StrictMode>,
)

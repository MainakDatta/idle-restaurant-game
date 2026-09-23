import { expect, test } from 'vitest'

// Smoke test: proves the test runner works and can read values from .env.
// Delete this once real tests exist (Phase 0, step 2).
test('the game title is loaded from .env', () => {
  expect(import.meta.env.VITE_GAME_TITLE).toBeTruthy()
})

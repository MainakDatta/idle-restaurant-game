/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    // The game logic is plain TypeScript with no browser APIs, so tests run in Node.
    // (This is already Vitest's default; it's spelled out so the choice is visible.)
    environment: 'node',
  },
})

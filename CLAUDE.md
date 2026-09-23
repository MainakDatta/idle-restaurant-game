# Notes for Claude

A cozy idle game (working title "Under New Management"), built as a learning project.
Before changing anything, read `docs/design.md` (what the game is) and `docs/decisions.md`
(why it's built this way). Record every real decision in `decisions.md` as a new numbered
entry, and always add one for a new dependency.

## Commands

- `npm run dev`: dev server
- `npm test` / `npm run test:watch`: Vitest
- `npm run typecheck` · `npm run lint` (oxlint) · `npm run build`

## How we work

- Mainak is learning and wants to understand every line. Explain design choices and
  non-obvious code as you go. Readable beats clever. Work in small steps he can review.
- A dependency must solve a problem we've actually hit (D4). Propose it along with the
  hand-rolled alternative instead of just adding it.
- Game logic imports nothing from React or Pixi. Every game quantity is a `Big` (D5, D6).
- The title lives only in `.env` as `VITE_GAME_TITLE`. Never put it in identifiers or
  storage keys (D7).
- No AI-generated art or audio. The repo is public, so check an asset's license before
  committing it, and never commit secrets (`VITE_*` values ship to players).
- One milestone per branch → pull request → merge.
- Attribution is decided per commit and per PR: add the `Co-Authored-By: Claude` trailer
  when Claude wrote most of the change, leave it off when Mainak did, and ask when unclear.

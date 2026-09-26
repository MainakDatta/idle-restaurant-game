# Notes for Claude

A cozy idle game (working title "Under New Management"), built as a learning project.
Before changing anything, read `docs/design.md` (what the game is) and `docs/decisions.md`
(why it's built this way). Record every real decision in `decisions.md` as a new numbered
entry, and always add one for a new dependency.

## Commands

- `npm run dev`: dev server
- `npm test` / `npm run test:watch`: Vitest
- `npm run typecheck` · `npm run lint` (oxlint) · `npm run build`
- `npm run check`: lint, typecheck, tests and build in one go. Run it before every commit (D26).

## How we work

- Mainak is learning and wants to understand every line. Explain design choices and
  non-obvious code as you go. Readable beats clever. Work in small steps he can review.
- Game design is decided in a separate design chat and lands in `docs/design.md` and
  `docs/decisions.md`. If the docs don't answer a design question, stop and ask Mainak instead
  of inventing an answer.
- A dependency must solve a problem we've actually hit (D4). Propose it along with the
  hand-rolled alternative instead of just adding it.
- Game logic imports nothing from React or Pixi. Anything that can grow without limit (money,
  costs, income) is a `Big`. Time, levels, counts, percentages and slots stay plain numbers
  (D5, D6).
- The title lives only in `.env` as `VITE_GAME_TITLE`. Never put it in identifiers or
  storage keys (D7).
- No AI-generated art or audio. The repo is public, so check an asset's license before
  committing it, and never commit secrets (`VITE_*` values ship to players).
- Work happens in numbered **steps**, listed in the current phase's checklist in
  `docs/design.md` (under *Build phases*). One step per branch → pull request → merge.
- Attribution is decided per commit and per PR: add the `Co-Authored-By: Claude` trailer
  when Claude wrote most of the change, leave it off when Mainak did, and ask when unclear.
- When Mainak asks for something to pass to the design chat, save it as a markdown file in
  `~/handoff/` and give him the path.

## Developer agent notes

What earlier sessions learned that the design and decision docs don't say.

**Starting work**
- Where things stand: ✅ rows in the current phase's checklist are merged, and `gh pr list`
  shows open PRs.
- Before starting, update `main` and skim what changed in `docs/` since you last looked
  (`git diff <old>..origin/main -- docs/`). The design chat lands docs often, sometimes mid-step.
- Take the next free decision number from `main`, and check again before your PR merges. If the
  design chat took it in the meantime, renumber yours.
- Branch names: `step-N/<topic>` for checklist steps, `tooling/<topic>`, `docs/<topic>`, and
  `design/<topic>` (the design chat's).

**Working with Mainak**
- A short question about a specific line gets a short answer first. Go deeper when he asks.
- Name PRs by what they do ("the check-command PR"), with a link. He doesn't track numbers.
- Offer extras (pages, docs, files nobody asked for) in one line and wait for a yes.
- When he wants to build something himself to learn (he wrote the CI workflow), give checked doc
  links, an annotated example and the specific changes to make, then review. Don't write it.
- If he says he changed a file but the disk shows no change, it's probably unsaved in VS Code.

**Commits and PRs**
- Commit verified work to the branch and push early. Review fixes go on as new commits. Open the
  PR only when Mainak says so.
- A step's PR ticks its row ✅ in the phase's checklist and adds the new decision numbers to the
  row's *See* column.
- PR descriptions have *What changed*, *Testing* and *Notes for review*; the PR that added `Big`
  (#4) is a good example. Under Testing, report what you broke on purpose and what caught it.
- PRs merge with merge commits, so a branch built on an unmerged branch works. After its base
  merges, merge `main` into it so GitHub's diff refreshes.
- CI (`.github/workflows/check.yml`, shown as "Regression Test / check") runs `npm run check` on
  every PR into `main` and every push to `main`. It doesn't block merging; Mainak merges.

**Code**
- TypeScript settings that bite: imports include `.ts` (`./big.ts`), type-only imports need
  `type` (`import { Big, type BigSource }`), and `erasableSyntaxOnly` rules out `enum`, runtime
  `namespace`s and constructor parameter properties.
- `src/game/` is type-checked a second time without browser types (`tsconfig.game.json`), so no
  `window`, timers, `console` or JSX there. `console.log` still works in `npm run dev` for
  debugging, but `npm run check` fails until it's removed.
- `Big` speed (measured 2026-09-25): ~55 ns per operation between Bigs, ~255 ns when an argument
  is a plain number, because it's converted on every call. In hot loops, create constants once
  (`const GROWTH = Big.fromValue(1.26)`). "Buy max" needs a formula, not a loop.
- Tests sit beside the code (`big.test.ts`). The pattern: table-driven `test.each`, seeded random
  checks against plain-number math (`makeRandom`, copied in both test files; move it to a shared
  helper if a third file needs it), and breaking the code on purpose to prove the tests catch it.
- Node 24 runs `.ts` files directly (`node probe.ts`), handy for quick probes and benchmarks that
  import from `src/`.

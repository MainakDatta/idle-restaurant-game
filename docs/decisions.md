# Decisions

One entry per real choice: what we decided, why, and what we passed on. Newest last.

**Status:** Accepted · Proposed (awaiting a call) · Superseded (kept for history — never delete).

**Changing a decision:** a clarification that doesn't reverse it gets a dated *Updated* note on
the entry. A reversal gets a new entry, and the old one is marked Superseded with a pointer to
its replacement.

Adding a dependency always gets an entry (see D4).

---

## D1 · Web stack, not a game engine — Accepted · 2026-09-21

**Decision:** TypeScript + React web client, Python backend. Godot saved for a later project.

**Why:** An idle game is mostly UI and arithmetic, so an engine's strengths (physics, scene
tree) go unused, while its web export is heavy and unreliable on phones. The web shares as a
URL, and a Python backend serves the de-rusting goal.

**Passed on:** Godot + Python API · pure Python (Pygame — can't be shared easily).

**Note:** Godot uses GDScript, not Python.

**Revisited 2026-09-22 and reaffirmed.** Re-checked once the design was fleshed out and app stores
became a real (someday) goal. The design added a lot of UI (market board, cards, valuation,
meta screens), which favors the web, and the PWA may be the only platform for a long while.
The engine's genuine advantage is scene authoring (visual editor, animation timeline,
particles); we handle that with layouts stored as data. *Correction to the original
comparison:* Godot has no official console export either (it needs a paid third-party port
plus registered developer status), and Steam is reachable from the web: Cookie Clicker ships
on Steam as its web game in an Electron wrapper. Switching to an engine later would mean
rewriting the client, not the whole game; the backend, assets, franchise data files and save
format all carry over. Precedent: Vampire Survivors moved from Phaser to Unity after it took
off.

**Revisit if:** the game takes off and needs platforms or polish that a packaged web app
can't provide · animated scenes get too complex to build comfortably in code · phone
performance becomes a real problem in testing. Moving to the app stores is *not* a trigger
on its own, because Capacitor already covers it. It's just a good moment to re-check this list.

## D2 · PixiJS, not Phaser — Accepted · 2026-09-21

**Decision:** PixiJS for the animated scene layer (Phase 2).

**Why:** We need a renderer, not a framework. Phaser's scene lifecycle competes with React for
control of the page; Pixi is smaller and does one job.

**Passed on:** Phaser.

## D3 · Mobile via Capacitor, not React Native — Accepted · 2026-09-21

**Decision:** PWA first, then Capacitor to reach the app stores.

**Why:** React Native doesn't run DOM/CSS code, and PixiJS doesn't run in it (`expo-pixi` is a
modified fork with no canvas text rendering). Capacitor ships the existing web app as-is.

**Cost accepted:** WebView overhead versus native; no console targets.

## D4 · Dependencies must earn their place — Accepted · 2026-09-22

**Decision:** Add a dependency only when it solves a problem we've actually hit. Each one gets
an entry here naming the problem it solves and the hand-rolled alternative we skipped.

**Why:** Avoid a web of framework code nobody can debug without AI. Readability beats
convention.

**Consequence:** Phase 0 runtime dependencies: React only. Tailwind cut. Zustand, SQLAlchemy,
Alembic, Howler deferred.

## D5 · Big numbers from day one — Accepted · 2026-09-22

**Decision:** Every game quantity uses a big-number type from the first line of game logic.

**Why:** JavaScript has no operator overloading, so a big-number object can't use `+` or `>`.
`cost * 1.15` becomes `cost.mul(1.15)` and `money >= cost` becomes `money.gte(cost)`.
Adding it later means rewriting every arithmetic expression in the game, plus the save format.

**Supersedes:** the earlier plan to start with `number` behind a wrapper module. A wrapper
doesn't help, because the operators themselves change.

**Updated 2026-09-22 (which quantities):** `Big` is for anything that can grow without limit over
the life of a save: money, costs, income, sale value, the cross-run currency, and multipliers
that stack. Quantities with a natural limit stay plain numbers: time, levels, counts,
percentages (including Potential) and slots. `Big`'s methods accept plain numbers as
arguments, so `cost.mul(1.15)` is fine. Use `null` for "unlimited" (e.g. `maxSlots`), because
JSON saves `Infinity` as `null`.

## D6 · Big-number implementation: our own `Big` class — Accepted · 2026-09-22

**Decision:** A ~200-line class storing `mantissa × 10^exponent`, using break_infinity.js's
method names. It **fails loudly**: bad input or bad math throws a clear error at the line that
caused it. Its fields are read-only. It's tested against native `number` wherever both are
valid (< ~1e300).

**Why:** Debuggability. break_infinity.js v2.2.0, tested 2026-09-22 with bad input:

| Input | break_infinity.js |
|---|---|
| `"abc"` | throws a clear `[DecimalError]` ✅ |
| `"1,000"` | silently `1` |
| `undefined` | silently `0` |
| divide by zero | silently `0` |
| NaN, then `.add(500)` | silently `0`, so the NaN hides itself |
| NaN, saved | written as `"NaN"`, loads back as NaN |
| `PRICE.mantissa = 9` | allowed; the "constant" becomes 900 |

The whole library has two `throw` statements. The silent zeros are the worst case: they look
like real values, so no check further along can catch them, and the symptom ("my money
reset") appears far from the cause. A safety wrapper would have to check the inputs to every
operation, which adds up to most of our own class anyway.
It was also last published in Feb 2023, has 1,555 lines and 91 methods (we need about 15),
and depends on a polyfill browsers no longer need.

**Paired with (Phase 0):** the save system never writes a save containing invalid numbers, and
keeps the last good save.

**Fallback:** matching method names let break_infinity drop in, if we accept its silent failures.

**Passed on:** break_infinity.js · break_eternity.js (maintained, but 7× larger and built for far
bigger numbers than we need).

**Note:** Mainak was fine with either; this was decided on the evidence above.

**Updated 2026-09-22 (game-side rules):** no game quantity is ever negative (no debt, no fail
states), so `Big` throws if a result would go below zero. Display follows D15. The rest of the
API is settled in Phase 0 step 2.

## D7 · Codename vs title — Accepted · 2026-09-22

**Decision:** Folders, package name and storage keys use `idle-restaurant-game`. The display
title lives in exactly one constant plus the HTML `<title>`.

**Why:** Renaming the game must never touch code. In particular, **save keys must never
contain the title**, because renaming would silently orphan every player's save.

**Updated 2026-09-22:** the title now lives in exactly one place, `VITE_GAME_TITLE` in `.env`.
`index.html` reads it as `%VITE_GAME_TITLE%`, and code reads it as
`import.meta.env.VITE_GAME_TITLE`.

## D8 · PostgreSQL in Phase 4 — Accepted · 2026-09-22

**Decision:** Postgres from the start of Phase 4 (not SQLite first).

**Why:** Learning Postgres is an explicit goal. The local instance comes from the existing
`~/development/dev-services` compose stack.

**Default, to revisit in Phase 4:** raw SQL through a driver before any ORM, so we learn
Postgres itself rather than an ORM's abstraction of it (per D4).

## D9 · Franchises are data; mechanics are a code library — Accepted · 2026-09-22

**Decision:** Franchise definitions are data files. Active mechanics are a small library of
code modules, and each franchise picks one by ID.

**Why:** Five franchises must not mean five codebases. A new franchise that reuses a mechanic
is only data plus sprites.

## D10 · Saves built for the PWA now and app stores later — Accepted · 2026-09-22

**Decision:** four rules for saves. All are Phase 0 except the install hint, which ships with
the first public deploy (Phase 1).
1. **Storage behind a small interface.** localStorage in the browser, native storage in a
   future Capacitor build, cloud saves in Phase 4. Switching means changing one module.
2. **Save export and import** as copy-paste text, from Phase 0.
3. **A portable, versioned format:** plain JSON, big numbers stored as strings, and a
   `version` field with step-by-step migrations.
4. **Nudge iPhone players to install** with an "Add to Home Screen" hint (shown only in
   Safari), and **request persistent storage**. Installed games are exempt from Safari's
   7-day rule. The persistence request is one line of code and helps on Android, but it
   won't save a Safari tab: Safari grants it based on signals like being installed.
   The hint needs a minimal web app manifest so the installed game opens as its own app,
   not a Safari tab, since that's what the exemption covers. Verify on a real iPhone in
   Phase 1.

**Why:** Safari deletes a site's storage after 7 days of Safari use without a visit to that
site (apps installed to the home screen are exempt). For a game built on "come back
whenever," losing a save after a week away is the worst failure there is. Export and import
is cheap insurance and a staple of the genre. A portable format also survives a future
client rewrite and feeds the Phase 4 backend.

**Known gap:** none of these back anything up automatically. Automatic backups arrive with
cloud saves in Phase 4. Until then, an iPhone player who plays in a Safari tab and never
installs or exports can lose their save after a week away. If friends on iPhone play
seriously before Phase 4, bring cloud saves forward.

**Note:** Mainak accepted this gap as a fair trade for playtesting before Phase 4.

## D11 · Offline progress is calculated in the browser — Accepted · 2026-09-22

**Decision:** When the game opens, the browser calculates what was earned while it was closed,
starting in Phase 0. From Phase 4, the server *double-checks* that math for cloud saves and
the leaderboard; it doesn't own it.

**Why:** The game has to work fully in the browser long before a backend exists. If only the
server could calculate offline progress, closing the tab would pause the game. This corrects
the early brainstorming, which had the server doing the calculation.

**Updated 2026-09-22:** all progress is calculated from real elapsed time, never by counting
timer ticks. Live play and catch-up run **the same code** (advance the game by N seconds), so
every rule applies identically whether the player was watching or not, including the knee once
it's designed. Catch-up runs when the game opens and when a background tab becomes visible
again. If the clock moves backward, elapsed time counts as zero, so progress is never lost.

**Updated 2026-09-23:** once Phase 2 adds live customers (D18), live play and catch-up follow
**the same rules** rather than the same code. A test keeps them within 5% of each other.

## D12 · Phase 0 foundation dependencies — Accepted · 2026-09-22

**Decision:** The scaffold is hand-written from Vite's official `react-ts` starter
(create-vite 9.2.1), minus its demo content. Each package, and why it earns its place (D4):

| Package | Ships to players? | Why |
|---|---|---|
| `react`, `react-dom` | yes | The UI layer (D1). About 69 KB gzipped, the baseline cost of React |
| `vite` | no | Dev server and production bundler (D1) |
| `@vitejs/plugin-react` | no | Lets Vite compile JSX and live-reload React components |
| `typescript` ~6.0 | no | Type checking. **Pinned to 6.0, not 7:** Vite's own starter pins 6.0, and TypeScript 7.0 has no compiler API for other tools until 7.1 (~Oct 2026). Revisit then |
| `vitest` | no | Test runner that reuses the Vite config and runs game-logic tests in Node, with no browser |
| `oxlint` | no | A single fast linter binary, Vite's default. Its `rules-of-hooks` check catches React hooks mistakes that are easy to make and hard to spot |
| `@types/react`, `@types/react-dom`, `@types/node@24` | no | Type definitions only; nothing runs. `@types/node` matches our Node 24 |

**Passed on:** using the generated starter as-is, which comes with demo files we'd delete.

## D13 · Public repository — Accepted · 2026-09-22

**Decision:** The repo is public from the first commit, with no license.

**Why:** Easy sharing. GitHub Actions is also free and unmetered on public repos, including
macOS runners, so iOS builds won't require owning a Mac.

**Rules that come with it:**
- **Secrets never enter git,** because history is permanent. They live in gitignored `*.local`
  files. `VITE_*` values are public by design.
- **Check every art and audio license before committing.** Packs that forbid redistribution
  stay out of the repo.
- **AI disclosure:** one sentence in the README. Commit and PR attribution is decided per
  change: the `Co-Authored-By` trailer goes on when Claude wrote most of it.
- **No license:** default copyright applies, so the code can be read but not reused. GitHub's
  Terms still let users view the repo and fork it on GitHub.
- **Personal details stay out of the repo.** Project instructions for Claude live in
  `CLAUDE.md`; personal preferences and machine setup live in `~/.claude/CLAUDE.md`, which is
  never committed.

**Updated 2026-09-22:** every asset gets a row in `CREDITS.md` (source, license, required
attribution).

## D14 · No cap on offline progress — Accepted · 2026-09-22

**Decision:** Idle progress keeps building however long the game is closed.

**Why:** A cap punishes absence and pushes daily check-ins, against pillars 1 and 4. The knee
already slows the cross-run currency, so a long absence can't break progression. Someone who
moves their clock forward only cheats a single-player game; the Phase 4 server protects the
leaderboard.

**Passed on:** the genre-standard 8–24h cap · a generous 7-day cap.

**Still open:** how the knee's slowdown is applied during catch-up is on the next design
session's agenda. The structure is settled in D11.

## D15 · Numbers shown with short suffixes — Accepted · 2026-09-22

**Decision:** 1.23K, 45.6M, 789B, 1.23T, then Qa, Qi, Sx, Sp, Oc, No, Dc, then two-letter codes
(aa, ab, …). Three significant digits. A setting switches to scientific notation.

**Why:** Compact enough for phone screens, and friendly to casual players.

**Passed on:** full words ("1.23 million"), which get long on phones and unwieldy at names like
"quattuordecillion" · scientific notation by default, which reads like math to casual players.

## D16 · Phase 0 ends with one complete run loop — Accepted · 2026-09-23

**Decision:** Phase 0 delivers a playable single run: earning, upgrading, the first active
mechanic, saves and offline progress. Gray boxes are fine. Selling and everything between runs
come later.

**Why:** It's the smallest thing Phase 1 can tune for fun.

**Passed on:** a minimal tech demo · including a basic sale, which needs session B's currency and
knee decisions first.

## D17 · A bottleneck economy with spillover — Accepted · 2026-09-23

**Decision:** Three levers: Demand, Service and Spend ("Ticket", renamed). Income = customers
served × Spend. Customers served = the lower of Demand and Service, plus spillover: staff help
100% within their role and 20% across roles (idle staff handing out samples counts as
cross-role), and a line converts 20% of its surplus into self-serve spend. Runs open slightly off
balance, with Service above Demand. Franchise templates define the roles.

**Why:** Every purchase is a real choice, and the screen shows the bottleneck. In simulation, a
strict bottleneck alone traps a one-purchase-at-a-time player: at balance, a single table or
barista earns $0, so everything goes into the menu. Players who upgrade stations together escape
it, and spillover is the safety net for those who don't. It keeps growth even, never leaves a
purchase doing nothing, and holds with three staff roles.

**Passed on:** stacking producers (the only decision becomes best income per dollar) · a strict
bottleneck alone · a soft congestion formula (loses ~16% at perfect balance, which live customers
wouldn't reproduce) · universal spillover (any role helps with any job).

## D18 · Rates now, live customers in Phase 2 — Accepted · 2026-09-23

**Decision:** The economy runs on rates; customers on screen only illustrate them. Phase 2 adds
live customers: irregular arrivals (gaps 60–140% of the average, service times ±20%), weighted
random orders, and a patient line capped around 50 ("come back later"). Their long-run average
must stay within 5% of the rate formula, enforced by a test that simulates hours of play.

**Why:** Offline catch-up stays exact while live play gets a restaurant's randomness. In
simulation with 3 baristas, fully random arrivals and a 10-person line turned away 7.7% of
customers at balance. A patient line of 50 with moderate randomness lost 0.1%.

**Passed on:** Eatventure's approach (a live simulation plus a capped, deliberately weaker offline
estimate), which punishes absence (pillars 1 and 4, D14).

## D19 · A real menu with per-item upgrades — Accepted · 2026-09-23

**Decision:** Menu items have a price, a barista time and an order weight. One level per item:
the price rises every level, and production speed doubles at bonus levels, arriving as visible
equipment. The whole menu is visible from the start, and items unlock by cost only. New items
follow the tier rule: about 3× the previous item's value per barista-second at the point it
typically unlocks.

**Why:** It's how restaurant idle games feel, and fixed order shares push players to spread their
upgrades. In simulation, new items were never unlocked until the tier rule was measured per
barista-second. With it, every unlock raises income. Per-item speed makes unlocks a shake-up
(pumpkin spice: customers served −61%, income +182%), which we treat as a feature. Cost-only
unlocks pace the same as level-gated ones, because price already does the gating.

**Passed on:** one "Recipes" upgrade for the whole menu · shop-wide speed only (gentler unlocks) ·
level-gated menu unlocks.

## D20 · Buttons show an upgrade's own effect — Accepted · 2026-09-23

**Decision:** An upgrade button shows what it changes ("Service 24 → 36/min"), never derived stats
like income previews. The scene shows the bottleneck.

**Why:** Mainak prefers game-like readability over spreadsheet stats. With spillover, no purchase
is ever useless anyway.

**Passed on:** showing "+$X/s right now" on every button.

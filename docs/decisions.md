# Decisions

One entry per real choice: what we decided, why, and what we passed on. Newest last.

**Status:** Accepted · Proposed (awaiting a call) · Superseded (kept for history — never delete).

**Changing a decision:** a clarification that doesn't reverse it gets a dated *Updated* note on
the entry. A reversal gets a new entry, and the old one is marked Superseded with a pointer to
its replacement.

Adding a dependency always gets an entry (see D4).

## At a glance

One line per decision. The numbers are the D-numbers, and each title links to the full entry.
**Adding or changing a decision:** update its line here too, and keep an `<a id="dN"></a>` anchor on
the line above its heading. The links point at those anchors, so they keep working when a heading's
status changes.

1. [**Web stack, not a game engine**](#d1): a TypeScript + React web client and a Python backend. Godot is saved for a later project.
2. [**PixiJS, not Phaser**](#d2): Pixi draws the animated scene: a renderer, not a framework competing with React. Updated by D38.
3. [**Mobile via Capacitor, not React Native**](#d3): a PWA first, then Capacitor ships the same web app to the app stores.
4. [**Dependencies must earn their place**](#d4): add one only for a problem we've actually hit, and give it an entry here.
5. [**Big numbers from day one**](#d5): anything that can grow without limit is a `Big`; time, levels and counts stay plain numbers.
6. [**Big-number implementation: our own `Big` class**](#d6): small, read-only and fails loudly, with break_infinity.js's method names.
7. [**Codename vs title**](#d7): code and save keys say `idle-restaurant-game`; the display title lives only in `.env`.
8. [**PostgreSQL in Phase 4**](#d8): Postgres from the backend's start, with raw SQL before any ORM.
9. [**Franchises are data; mechanics are a code library**](#d9): a new franchise that reuses a mechanic is only data and sprites.
10. [**Saves built for the PWA now and app stores later**](#d10): one storage module, export/import, versioned JSON and an iPhone install hint.
11. [**Offline progress is calculated in the browser**](#d11): from real elapsed time, on the device; the Phase 4 server only double-checks it.
12. [**Phase 0 foundation dependencies**](#d12): Vite's React + TypeScript starter, each package justified; TypeScript pinned to 6.0.
13. [**Public repository**](#d13): public with no license; no secrets in git, asset licenses checked, AI disclosed in the README. Updated by D39.
14. [**No cap on offline progress**](#d14): idle progress keeps building however long you're away.
15. [**Numbers shown with short suffixes**](#d15): 1.23K, 45.6M and so on, three digits, rounded down; scientific notation is a setting.
16. [**Phase 0 ends with one complete run loop**](#d16): earning, upgrading, the first active mechanic, saves and offline progress, with the scene in basic shapes (D38).
17. [**A bottleneck economy with spillover**](#d17): income = customers served × Spend; served = the lower of Demand and Service, plus spillover. Updated by D31, D32.
18. [**Rates now, live customers in Phase 2**](#d18): the economy runs on rates; Phase 2's live customers must average within 5% of them. At scale, each visible customer stands for a group.
19. [**A real menu with per-item upgrades**](#d19): a price, cook time and popularity per item, one level per item; unlocks cost money only. Speed and the tier rule are replaced by D33 and D36.
20. [**Buttons show an upgrade's own effect**](#d20): "Service 24 → 36/min", never income previews; the scene shows the bottleneck. Updated by D31.
21. [**Three active mechanics: tips, Rush Hour, special customers**](#d21): the pour starts a rush and costs Buzz; tips and visitors are free.
22. [**Rush Hour rolls one lever at ×3**](#d22): Demand or Service at random, for 3 minutes (4.5 after a Perfect pour), one rush at a time.
23. [**Buzz: one refill rate, a small cap**](#d23): 1 charge every 10 minutes, in the shop or away, up to 6.
24. [**The `Big` API**](#d24): 17 methods; one way in (`fromValue`), strings only where data loads, mistakes throw a `BigError`.
25. [**A lint rule keeps React and Pixi out of `src/game/`**](#d25): plus a type check that runs game code without browser types.
26. [**One check command before every pull request**](#d26): `npm run check` runs lint, types, tests and the build; CI runs it too.
27. [**The game runs outside React, on one clock**](#d27): a pure `advance(state, seconds)` moves time; catch-up is the first frame back.
28. [**Franchise files: JSON, checked when they load**](#d28): a mistake names the file and the field; tuning numbers live in the file. Updated by D34, D35.
29. **The economy engine** is D29, on the step 4b branch until that pull request merges.
30. [**The coffee shop is counter service: Signage brings customers in, Tables seat them**](#d30): seated customers spend 1.5×; Chalkboard sign becomes Free Wi-Fi.
31. [**Purchases may pay later**](#d31): a purchase can earn nothing until the rest of the shop catches up; D17's "never does nothing" is dropped.
32. [**Samples: at most 3 baristas outside; self-serve removed**](#d32): each one brings in 10% more customers; idle baristas beyond 3 stay inside.
33. [**Menu items: cook time shrinks gradually; bonus levels raise the price and add machines**](#d33): half the starting time by level 25; 2nd and 3rd machines at 50 and 100.
34. [**Bonus levels vary by level and by upgrade; a finished shop must balance**](#d34): Signage ×3, ×3, ×3, ×6 leads; a maxed shop's Service ÷ Demand lands around 1.1.
35. [**Max level 100 for every upgrade, each with its own price growth**](#d35): upgrades finish one after another, the last near the end of the run.
36. [**Each menu unlock about doubles income; D19's promise becomes a guiding principle**](#d36): bought in cost order, upgrades should raise income, now or later.
37. [**A 4–6 hour coffee shop run for now, with one-time upgrades spread across it**](#d37): late global upgrades paired in time and priced at about a minute of income.
38. [**The scene comes early: basic shapes in Phase 0, placeholder sprites first in Phase 1**](#d38): Phase 2 brings the final art, animation and live customers.
39. [**Where AI-generated content is allowed**](#d39): never in-game art or music; UX elements yes; sound effects real first; discussion visuals anything.
40. [**Simulated players: the human-like player is the reference**](#d40): it goes by what the screen shows; optimizers only for special cases.
41. [**Times shown with their two largest units**](#d41): 42s, 2m 41s, 1h 23m, 2d 4h.

---

<a id="d1"></a>
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

<a id="d2"></a>
## D2 · PixiJS, not Phaser — Accepted · 2026-09-21

**Decision:** PixiJS for the animated scene layer (Phase 2).

**Why:** We need a renderer, not a framework. Phaser's scene lifecycle competes with React for
control of the page; Pixi is smaller and does one job.

**Passed on:** Phaser.

**Updated 2026-10-04:** the scene now starts in Phase 0, as basic shapes (D38). Whether PixiJS draws
it from the start is the call of the step that builds it.

<a id="d3"></a>
## D3 · Mobile via Capacitor, not React Native — Accepted · 2026-09-21

**Decision:** PWA first, then Capacitor to reach the app stores.

**Why:** React Native doesn't run DOM/CSS code, and PixiJS doesn't run in it (`expo-pixi` is a
modified fork with no canvas text rendering). Capacitor ships the existing web app as-is.

**Cost accepted:** WebView overhead versus native; no console targets.

<a id="d4"></a>
## D4 · Dependencies must earn their place — Accepted · 2026-09-22

**Decision:** Add a dependency only when it solves a problem we've actually hit. Each one gets
an entry here naming the problem it solves and the hand-rolled alternative we skipped.

**Why:** Avoid a web of framework code nobody can debug without AI. Readability beats
convention.

**Consequence:** Phase 0 runtime dependencies: React only. Tailwind cut. Zustand, SQLAlchemy,
Alembic, Howler deferred.

<a id="d5"></a>
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

<a id="d6"></a>
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

**Updated 2026-09-24:** the full API is D24.

<a id="d7"></a>
## D7 · Codename vs title — Accepted · 2026-09-22

**Decision:** Folders, package name and storage keys use `idle-restaurant-game`. The display
title lives in exactly one constant plus the HTML `<title>`.

**Why:** Renaming the game must never touch code. In particular, **save keys must never
contain the title**, because renaming would silently orphan every player's save.

**Updated 2026-09-22:** the title now lives in exactly one place, `VITE_GAME_TITLE` in `.env`.
`index.html` reads it as `%VITE_GAME_TITLE%`, and code reads it as
`import.meta.env.VITE_GAME_TITLE`.

<a id="d8"></a>
## D8 · PostgreSQL in Phase 4 — Accepted · 2026-09-22

**Decision:** Postgres from the start of Phase 4 (not SQLite first).

**Why:** Learning Postgres is an explicit goal. The local instance comes from the existing
`~/development/dev-services` compose stack.

**Default, to revisit in Phase 4:** raw SQL through a driver before any ORM, so we learn
Postgres itself rather than an ORM's abstraction of it (per D4).

<a id="d9"></a>
## D9 · Franchises are data; mechanics are a code library — Accepted · 2026-09-22

**Decision:** Franchise definitions are data files. Active mechanics are a small library of
code modules, and each franchise picks one by ID.

**Why:** Five franchises must not mean five codebases. A new franchise that reuses a mechanic
is only data plus sprites.

<a id="d10"></a>
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

<a id="d11"></a>
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

<a id="d12"></a>
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

<a id="d13"></a>
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

**Updated 2026-10-04:** where AI-generated content is allowed is D39.

<a id="d14"></a>
## D14 · No cap on offline progress — Accepted · 2026-09-22

**Decision:** Idle progress keeps building however long the game is closed.

**Why:** A cap punishes absence and pushes daily check-ins, against pillars 1 and 4. The knee
already slows the cross-run currency, so a long absence can't break progression. Someone who
moves their clock forward only cheats a single-player game; the Phase 4 server protects the
leaderboard.

**Passed on:** the genre-standard 8–24h cap · a generous 7-day cap.

**Still open:** how the knee's slowdown is applied during catch-up is on the next design
session's agenda. The structure is settled in D11.

<a id="d15"></a>
## D15 · Numbers shown with short suffixes — Accepted · 2026-09-22

**Decision:** 1.23K, 45.6M, 789B, 1.23T, then Qa, Qi, Sx, Sp, Oc, No, Dc, then two-letter codes
(aa, ab, …). Three significant digits. A setting switches to scientific notation.

**Why:** Compact enough for phone screens, and friendly to casual players.

**Passed on:** full words ("1.23 million"), which get long on phones and unwieldy at names like
"quattuordecillion" · scientific notation by default, which reads like math to casual players.

**Updated 2026-09-24 (the details):** `formatBig(value, 'short' | 'scientific')` in
`src/game/format.ts` does this. Numbers always round **down**, so the screen never shows more
money than you have: 999,999 is 999K, not 1.00M. With a suffix there are always three digits,
zeros included: 1.00K, 10.0K, 100K. Below 1,000 both settings show the plain number with up to
three significant digits and no padded zeros: 3.5, 12.3, 999, 0.05. The scientific setting
looks like 1.23e45 and keeps its zeros (1.00e3). The two-letter codes run aa to zz (up to
1e2064), and short mode switches to scientific after that.

<a id="d16"></a>
## D16 · Phase 0 ends with one complete run loop — Accepted · 2026-09-23

**Decision:** Phase 0 delivers a playable single run: earning, upgrading, the first active
mechanic, saves and offline progress. Gray boxes are fine. Selling and everything between runs
come later.

**Why:** It's the smallest thing Phase 1 can tune for fun.

**Passed on:** a minimal tech demo · including a basic sale, which needs session B's currency and
knee decisions first.

**Updated 2026-10-04:** instead of gray boxes, Phase 0's scene shows the shop in basic shapes (D38).

<a id="d17"></a>
## D17 · A bottleneck economy with spillover — Accepted · 2026-09-23

**Decision:** Three levers: Demand, Service and Spend. Income = customers served × Spend.
Customers served = the lower of Demand and Service, plus spillover: staff help 100% within their
role and 20% across roles (idle staff handing out samples counts as cross-role). Optionally, per
franchise, a line converts a share of its surplus into self-serve spend (people grab a pastry
while waiting). It stays off wherever self-serve isn't realistic. Runs open slightly off balance,
with Service above Demand. Franchise templates define the roles.

**Why:** Every purchase is a real choice, and the screen shows the bottleneck. In simulation, a
strict bottleneck alone traps a one-purchase-at-a-time player: at balance, a single table or
barista earns $0, so everything goes into the menu. Players who upgrade stations together escape
it, and spillover is the safety net for those who don't. It keeps growth even, never leaves a
purchase doing nothing, and holds with three staff roles. Self-serve isn't needed for any of
this: removing it left the simulated shop's growth unchanged, so it's optional flavor.

**Passed on:** stacking producers (the only decision becomes best income per dollar) · a strict
bottleneck alone · a soft congestion formula (loses ~16% at perfect balance, which live customers
wouldn't reproduce) · universal spillover (any role helps with any job).

**Updated 2026-10-04:** purchases may pay later, so "never leaves a purchase doing nothing" is no
longer a goal (D31). Samples become at most 3 baristas outside, each bringing in 10% more customers,
and self-serve from the line is removed (D32).

<a id="d18"></a>
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

**Updated 2026-10-04 (scale):** within an hour the shop serves hundreds of customers a second, too
many to simulate or draw one by one. So each visible customer stands for a group that grows with
the shop (1, then 10, then 100…). The randomness applies to each visible customer, and the 5% rule
still holds. How the group size grows is a Phase 2 open question.

<a id="d19"></a>
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

**Updated 2026-10-04:** speed doubling at bonus levels and the tier rule are replaced. An item's
cook time now shrinks gradually to half by level 25, and its bonus levels raise the price and add
machines (D33). Each unlock should about double income when it typically happens, and "every
unlock raises income" becomes a guiding principle (D36). "Order weight" is now *popularity*, as in
the code (D28).

<a id="d20"></a>
## D20 · Buttons show an upgrade's own effect — Accepted · 2026-09-23

**Decision:** An upgrade button shows what it changes ("Service 24 → 36/min"), never derived stats
like income previews. The scene shows the bottleneck.

**Why:** Mainak prefers game-like readability over spreadsheet stats. With spillover, no purchase
is ever useless anyway.

**Passed on:** showing "+$X/s right now" on every button.

**Updated 2026-10-04:** with purchases allowed to pay later (D31), a purchase can be useless for a
while. The scene is what shows the player what to buy next.

<a id="d21"></a>
## D21 · Three active mechanics: tips, Rush Hour, special customers — Accepted · 2026-09-24

**Decision:** The coffee shop gets three active mechanics. **Tips** pile up while you watch, and
you tap to collect them. **Rush Hour** starts with the pour (hold the espresso machine, let go; a
wide sweet spot adds "Perfect!", cosmetic latte art on the cup and a longer rush) and costs Buzz
(D22, D23). **Special customers** visit one at a time while you watch: a big tipper, a food
critic whose review raises Demand, and a stray cat that doubles tips. Tips and visitors are free
because they come at a fixed pace; anything where more tapping means more boost costs Buzz.
Nothing can fail, and every reward scales with the shop. The first mechanic library holds three
reusable kinds: boost, collectible and visitor.

**Why:** Each mechanic gives a different kind of reward (money in hand, a busier shop, a
surprise), each is one short gesture, and none punishes absence (pillars 1 and 4). Tips, the
forgiving sweet spot and special customers were Mainak's picks. Holding to pour, speeding up the
machines and calling in customers merged into one mechanic: the pour starts a rush that does
those jobs.

**Passed on:** dragging food to customers (fiddly on a phone, and it needs Phase 2's live
customers) · separate buttons for faster machines and for more customers (see D22) · a pour that
can fail · the critic's pour for a free rush (on ice: edge cases such as a rush already running)
· a "never do the staff's job" rule. Doing a barista's job is fine when tuned, but one barista is
under 1% of income by hour 1, so such a mechanic should be sized as a share of the crew.

<a id="d22"></a>
## D22 · Rush Hour rolls one lever at ×3 — Accepted · 2026-09-24

**Decision:** Each rush rolls Demand or Service at random (50/50) and multiplies it by 3 for 3
minutes, or 4.5 after a Perfect pour. One rush runs at a time, and a running rush finishes on its
own after the app closes. The tuning target for a player who's always watching becomes about
1.5× idle (it was 1.5–2×).

**Why:** In simulation, both levers ×2 always paid +100%: a flat bonus you'd want running
nonstop. Mainak wanted rushes to feel different from each other. A single-lever roll pays about
the same on average whichever way the shop leans (about +47% at ×2, +70–90% at ×3), so it
survives Phase 1 tuning. Letting the player pick the lever doesn't work: the simulated shop leans
one way almost all run, so one button would nearly always be the weak pick. ×3 keeps each rush
big and the rush time needed down: reaching 1.5× takes a rush about 45% of the time at ×3, versus
77% at ×2. Nothing breaks at the top end. Even nonstop rushes move a player through a run only
about 1.8× faster, because a steady boost compresses the run instead of compounding. The old 2×
end would need rushes nonstop.

**Passed on:** Demand and Service ×2 together · the player choosing the lever · ×2 per roll ·
overlapping rushes (a double rush running nonstop gives 3.3×, well past the target).

<a id="d23"></a>
## D23 · Buzz: one refill rate, a small cap — Accepted · 2026-09-24

**Decision:** Rush Hour costs one charge of **Buzz**. Buzz refills at a single rate, 1 charge
every 10 minutes whether you're in the shop or away, up to a cap of 6. When the pile is full, the
refill timer disappears. All numbers are placeholders. This replaces the design doc's earlier rule
to size the cap to cover a night away, which was never a numbered decision.

**Why:** The refill rate sets the ceiling for a player who never leaves (a rush running about 45%
of the time). The cap only decides how long you can rush nonstop when you come back. In
simulation, the old rule (a cap covering a night, with a refill fast enough for the 1.5× target)
let normal players keep a rush going nonstop by pouring every 5 minutes. With a cap of 6, you come
back to about 50 minutes of nonstop rushes, then settle into a rush about half the time. Because
only one rush runs at a time, a short visit can't spend a big pile, so a full pile gives no reason
to check in more often. A refill 2–3× slower while away changed almost nothing (only a long
session after a short break: 82% → 71% of play with a rush running), so one rate wins on
simplicity. It also gives no reason to leave the app open.

**Passed on:** one rate with a cap covering a night (48 charges) · fast in the shop and slow while
away (16× slower felt jarring, and 2–3× barely differed) · a cap of 3 (Mainak wanted players to
come back to more) · caps of 20 or more (a 3-hour evening becomes rushes from start to finish) ·
"rushes" as the name.

<a id="d24"></a>
## D24 · The `Big` API — Accepted · 2026-09-24

**Decision:** `Big` (in `src/game/big.ts`) has 17 methods, named as in break_infinity.js:
`fromValue`; `add`, `sub`, `mul`, `div`, `pow`; `cmp`, `eq`, `gt`, `gte`, `lt`, `lte`, `max`,
`min`; `toNumber`, `toString`, `toJSON`. Plus `Big.ZERO`, `Big.ONE` and a `BigError` class.
- **One way in:** `Big.fromValue` takes a Big, a number or a string. The constructor is private.
  Numbers must be finite and not negative. Strings must look like `"1500"`, `"1.5"` or
  `"1.5e300"`, with no commas, spaces or signs in front.
- **Methods take a Big or a plain number, never a string.** Strings from saves and data files
  are read once, where they load.
- **Mistakes throw a `BigError` naming the operation:** a negative result from `sub`, dividing
  by zero, 0 to a negative power, a non-finite power, and `toNumber` on a value too big for a
  number. Checking `a.gte(b)` before `a.sub(b)` can never throw.
- **Save format:** `toString()` is always mantissa `e` exponent (`"1.5e300"`, `"1.5e2"`,
  `"0e0"`), and `toJSON()` returns the same string, so `JSON.stringify` writes Bigs as strings
  (D10). Loading a saved string gives back exactly the same value.
- **Read-only at runtime too:** fields are `readonly`, and each Big is frozen, so
  `PRICE.mantissa = 9` throws.
- **`valueOf()` throws.** TypeScript allows `a < b` between objects, and JavaScript would then
  compare the strings: `"1.5e3" < "2e2"`, so 1500 < 200 would be true.
- **Precision is a number's:** about 16 significant digits. Numbers with up to 15 significant
  digits survive number → Big → number exactly. A full 17-digit number can come back off in
  its last digit (18% of random doubles, by at most 3 parts in 10¹⁶), the same limit as
  break_infinity. Calculated values are compared with `gte`/`lte`, not `eq`.
- **Left out until a step needs them:** `log10` (for "buy max"), `floor`, `sqrt` and the rest.

**Why:** Each rule closes one of D6's silent failures or keeps the class small enough to read.
`toNumber` reads the Big's own string back rather than calculating `mantissa × 10^exponent`,
because the calculation turns 0.11 into 0.11000000000000001.

**Passed on:** accepting strings in every method (break_infinity does) · private fields with
getters instead of freezing · break_infinity's `"1.5e+300"` string, or plain `"150"` for small
values (not an exact round trip) · a `valueOf` returning a number, which makes `a < b` work until
~1e308 and then silently compare `Infinity`.

<a id="d25"></a>
## D25 · A lint rule keeps React and Pixi out of `src/game/` — Accepted · 2026-09-24

**Decision:** Game logic lives in `src/game/`. An oxlint `no-restricted-imports` rule, scoped
to that folder in `.oxlintrc.json`, fails `npm run lint` on any import of `react`, `react-dom`,
`pixi.js` or `@pixi/*`, including their subpaths and dynamic `import()`.

**Why:** It enforces the structural rule with the linter we already have, and the error message
says what to do instead.

**Passed on:** dependency-cruiser or eslint-plugin-boundaries (new dependencies for one rule,
D4) · a test that searches the source for imports (text matching misses cases).

**Next:** a separate pull request adds a type check that runs `src/game/` without browser types
(`window`, `localStorage`, `performance`, JSX), so the clock and storage have to be passed in.

**Updated 2026-09-25:** the type check is in. `tsconfig.game.json` checks `src/game/` a second
time with only JavaScript's own types (`lib: ["ES2023"]`, `types: []`, JSX off), and
`npm run typecheck` runs it. `window`, `document`, `localStorage`, `performance`, timers,
`console` and JSX all fail there. One gap: `Date` is part of JavaScript itself, so `Date.now()`
still passes.

<a id="d26"></a>
## D26 · One check command before every pull request — Accepted · 2026-09-25

**Decision:** `npm run check` runs lint, the type check, the tests and the production build, in
that order, and stops at the first failure. Run it after making changes and before pushing
(about 3 seconds today). Lint warnings count as failures (`oxlint --deny-warnings`). A rule
that's too noisy gets switched off in `.oxlintrc.json` rather than left warning.

**Why:** One command catches regressions before a pull request, so nobody has to remember
four. oxlint reports its built-in bug-finding rules (`no-debugger` and the rest) as warnings,
which exit with success, so without the flag they could never fail the check.

**Passed on:** a git pre-push hook (slows every push, is easy to skip, and husky would be a new
dependency) · making GitHub block merges until the check passes (one person merges for now) · a
formatter and a coverage threshold (no problem for them to solve yet, D4).

**Next:** GitHub Actions runs `npm run check` on every pull request. Mainak is setting that up.

**Updated 2026-09-25:** CI is in. `.github/workflows/check.yml` runs `npm ci` and then
`npm run check` on every pull request into `main` and every push to `main`. It reads the Node
version from `.nvmrc`, so CI and local runs match, and uses GitHub's own `actions/checkout` and
`actions/setup-node`. GitHub's machines are free for public repositories. The result shows on
each pull request, and merging isn't blocked.

<a id="d27"></a>
## D27 · The game runs outside React, on one clock — Accepted · 2026-09-28

**Decision:** how time moves while the game runs (step 3).
- **One pure function moves time:** `advance(state, seconds)` in `src/game/state.ts` returns a
  new state and never reads a clock. Live frames and catch-up both call it (D11). Any timer the
  state gains later (a rush, the Buzz refill) is a duration, such as "42 s left", never a clock
  time, so `advance` can split a long absence at the moment a rush ends.
- **The state lives in a small store outside React** (`src/runtime/game-state-store.ts`). React reads it
  with `useSyncExternalStore`; the Pixi scene (Phase 2) and saves (step 6) will read the same
  store.
- **The loop runs on `requestAnimationFrame` and the wall clock** (`src/runtime/loop.ts`). Each
  frame gets the `Date.now()` time since the previous frame. A clock set backward counts as 0,
  and counting resumes from the new time (D11). There's no upper limit on a frame (D14).
- **Catch-up is the first frame back.** Browsers pause repaints in hidden tabs, so the first
  frame after switching back carries the whole time away through `advance`. Catch-up when the
  game opens needs to know when you left, so it arrives with saves (step 6).
- **Catch-ups are reported, as a debugging aid.** A frame longer than 1 s means the player
  wasn't watching (a normal frame is about 0.016 s), so `startGame` calls
  `onCatchUp({ seconds, earned })` once the store has the new state, and `main.tsx` logs it to
  the browser console. A welcome-back message for players could use the same report later, but
  it isn't planned for Phase 0.
- **One loop:** `main.tsx` calls `startGame` once, outside React, so StrictMode's double effects
  can't start a second, and `start()` does nothing if the loop is already running.
- **The clock is passed in**, so tests run in Node with a fake one.

**Why:** Saves need the state from a page-close handler and the Pixi scene isn't React, so the
state can't live inside a component. `Date.now()` keeps counting while a device sleeps, and one
clock for live play and catch-up means a gap is never counted twice or missed. A pure `advance`
makes "an hour of frames equals one hour-long step" a test every later rule has to pass.

**Passed on:** state in React with a loop started from an effect · `setInterval` (keeps running
in hidden tabs, not tied to repaints) · the `performance.now()` timestamp rAF passes in (may stop
while the device sleeps) · a store library such as Zustand (15 lines by hand, D4) · counting
ticks (D11) · a separate `visibilitychange` catch-up (it would count the gap twice unless
coordinated with the loop, and nothing needs "time away" apart from "time watching" until tips
and special customers in Phase 1).

<a id="d28"></a>
## D28 · Franchise files: JSON, checked when they load — Accepted · 2026-09-29

**Decision:** Each franchise is a JSON file in `src/game/franchises/`; the coffee shop is
`coffee-shop.json`. `loadFranchise` in `src/game/franchise.ts` reads it when the game starts (D9).
- **Checked when it loads.** Hand-written checks cover every field (nothing missing, nothing
  unknown, numbers in range) and whether the setup makes sense: ids are unique, a global
  upgrade's requirement names a real leveled upgrade at a level under the max, and something is
  on the menu at the start. An error names the file and the field:
  `coffee-shop.json: menu[2].popularity must be above 0, got -1`.
- **Dollar amounts are plain JSON numbers**, read into `Big` once, at load (D24). Levels,
  popularity, seconds and shares stay plain numbers (D5).
- **Tuning lives in the file**, so Phase 1 can try variants without code changes. That covers bonus
  levels (a listed sequence with a multiplier each, a repeating step, or both, shared by every
  leveled upgrade), a max level (one per franchise, `null` for none, 50 as a placeholder) and
  each global upgrade's multiplier.
- **Names:** `globalUpgrades` for design.md's lever boosts, and `popularity` for D19's order
  weight. An upgrade's id (`"tables"`, `"latte"`) has the type `UpgradeItemId`. Anything with
  levels (Tables, Baristas, each menu item) is a *leveled upgrade*, so "line" only ever means the
  queue of customers. A menu item with `"unlock": null` starts at level 1; the others start
  locked, at 0.
- **The game state** keeps each leveled upgrade's level (`levels`) and the global upgrades bought
  (`globalUpgradesBought`). In `src/game/upgrades.ts`, each level costs
  `firstCost × costGrowth^(level − 1)`. An unlock costs its own price and puts its item at level 1.
  A global upgrade can be bought once, after the upgrade it requires reaches its level.
- **One staff role** for now. Several roles need rules the design docs don't have yet.
- Mobile ordering, Local influencer visit and Barista training are left out until they're
  priced.

**Why:** Franchises are data (D9), and the Phase 4 server has to read the same numbers, so the
files are JSON rather than TypeScript. A mistake in a data file should stop the game at once with
a clear message, not turn up later as a strange number (D6).

**Passed on:** TypeScript checking the imported JSON on its own (it can't check ranges or
cross-references) · zod (a new dependency, D4) · a version number (the file ships with the code
that reads it, unlike a save, D10) · a list of staff roles now (their rules aren't designed yet) ·
TypeScript files instead of JSON.

**Updated 2026-10-04:** bonus-level multipliers and price growth now differ for each leveled
upgrade, and the max level is 100 (D34, D35). How the file holds them is up to the next step's
pull request.

<a id="d30"></a>
## D30 · The coffee shop is counter service: Signage brings customers in, Tables seat them — Accepted · 2026-10-04

**Decision:** Customers line up at the counter to order. **Signage** replaces Tables as Demand's
leveled upgrade, with the same math (+6 customers a minute per level). Every franchise shares the
name, and each bonus level brings a bigger sign (chalkboard → painted → lit → neon). **Tables become
dine-in seats:** a served customer sits if a seat is free and spends 1.5× the usual order;
otherwise they take it to go. Nobody waits for a seat. Each Tables level adds seats, counted as
seated customers a minute. The Chalkboard sign global upgrade becomes **Free Wi-Fi** (×2 Demand).
The lever keeps the name Demand in the docs and code; players see "Customers" for now.

**Why:** Tables bringing customers in felt off. Signage names what the upgrade does (it tells
people you're there) and what you see, and it fits a food truck or a beach bar as well as a coffee
shop. Dine-in gives tables a real job: customers who sit spend more than those who take it to go.
It's in Phase 0 because Phase 0 delivers the whole run and Phase 1 tunes it; an upgrade added
after tuning would mean tuning twice.

**Passed on:** Storefront and Curb appeal (awkward for a truck or a beach) · Reputation and
Marketing (nothing to see) · Hype (too close to Buzz) · tables as decoration only · tables as
capacity, with customers sitting first (Mainak's pattern for full-service franchises, parked for
the multi-role session) · tips from seated customers (tips only come while you watch, so tables
would do nothing for idle play).

<a id="d31"></a>
## D31 · Purchases may pay later — Accepted · 2026-10-04

**Decision:** A purchase doesn't have to raise income the moment it's bought. A table bought while
seats sit empty, or Signage bought while the baristas can't keep up, earns nothing until the rest
of the shop catches up. D17's "never leaves a purchase doing nothing" is dropped as a goal;
spillover stays as the safety net it was meant to be.

**Why:** Chasing "every purchase pays at once" would discourage planning ahead (Mainak). D17's own
simulation showed that players who upgrade stations together escape the strict bottleneck, and
spillover was added for those who don't. This also settles a question from step 4: in a franchise
without self-serve, more customers during a line earn nothing for a while, and that's fine.

**Passed on:** a spillover for empty seats (empty tables drawing people in), which would work like
samples, and samples were already too strong.

<a id="d32"></a>
## D32 · Samples: at most 3 baristas outside; self-serve removed — Accepted · 2026-10-04

**Decision:** When the baristas can serve more customers than arrive, up to **3** idle baristas step
outside with sample trays. Each one brings in **10% more customers** (10% of Demand), never more
than the idle baristas can serve. Idle baristas beyond the 3 stay behind the counter and earn
nothing. Sampled customers join the back of the line like everyone else, pay the usual order and sit
if a seat is free. Both numbers are franchise settings. **Self-serve from the line is removed** for
now; it's on the *Later* list in design.md.

**Why:** Under the old rule (20% of the idle capacity), a shop with far too many baristas got 96% of
its customers from samples, with dozens of baristas outside: immersion-breaking. Mainak's limit on
how many baristas go outside fixes the picture. Basing what each one brings in on Demand (the people
walking past) rather than on their serving speed fixes the numbers: samples bring in about 23% of
customers on a typical run and in that lopsided shop alike. Walking out and back takes time; the
10% is an average that includes it, and Phase 2's live baristas get tuned to match (D18).
Self-serve rarely triggered, because the shop was almost never backed up; in a shop that is, it was
worth about 3% of income. It also needed a grab-and-go item for each franchise, the Pastry case
requirement and a rule for dine-in. It's easy to bring back.

**Passed on:** 20% of the idle capacity (the runaway above) · capping samples at +50% of Demand
(invisible on screen) · removing samples (with today's numbers, extra baristas would stop paying) ·
a smaller share, such as 5–10% (still runs away in a lopsided shop) · self-serve customers buying a
set grab-and-go item (the muffin).

<a id="d33"></a>
## D33 · Menu items: cook time shrinks gradually; bonus levels raise the price and add machines — Accepted · 2026-10-04

**Decision:** An item's cook time falls a little every level until it reaches **half its starting
time at level 25** (drip coffee: 8 s → 4 s), and it never gets faster than that. An item's bonus
levels raise its **price** instead (×2, ×2, ×3, ×5 at levels 10, 25, 50 and 100; see D34), and
levels 50 and 100 add a **2nd and 3rd machine**: two machines make twice the drinks, three make
three times. The price still rises every level by 10% of the starting price. The minimum (half)
and the level it's reached at are franchise settings.

**Why:** With an item's speed doubling at every bonus level (D19), Service grew two ways (baristas,
and every item) while Demand grew one way, so the simulated shop sat overstaffed 98% of the time
and the bottleneck never swung. Mainak wants it to swing: each purchase can tip the shop, so the
scene always shows what to buy next. A minimum cook time (his idea) caps how much faster items get.
At half, the shop stays balanced; at a quarter or an eighth, it overstaffs again. Reaching the
minimum gradually by level 25, rather than all at once at level 10, kept the balance and made
pacing much less dependent on play style: both simulated players unlocked Pumpkin spice at the same
time instead of 1.2 h vs 3.5 h. Machines double the drinks rather than shortening the cook, which
is what a second machine really does (Mainak). They need customers to grow faster to match (D34).

**Passed on:** ×1.5 speed at each bonus level · alternating speed and price · price only, never
faster · reaching the minimum at level 10 · minimums of a quarter or an eighth.

<a id="d34"></a>
## D34 · Bonus levels vary by level and by upgrade; a finished shop must balance — Accepted · 2026-10-04

**Decision:** Each leveled upgrade has its own multipliers at bonus levels 10, 25, 50 and 100
(placeholders):

| Upgrade | 10 | 25 | 50 | 100 |
|---|---|---|---|---|
| Signage | ×3 customers | ×3 | ×3 | ×6 |
| Baristas | ×2 service | ×2 | ×3 | ×3 |
| Tables | ×3 seats | ×3 | ×3 | ×6 |
| Menu items | ×2 price | ×2 | ×3 price, 2nd machine | ×5 price, 3rd machine |

The set stays the same within a franchise; other franchises get their own. **Tuning rule:** with
every upgrade at max level and every global upgrade bought, Service ÷ Demand should land around 1.1,
inside the balanced band.

**Why:** Mainak wanted multipliers that aren't always ×2, with bigger jumps later, varying by both
level and upgrade. Machines add drinks, so Signage needs bigger jumps than Baristas to keep
customers coming, and they have to start early, because machines start arriving early: drip
coffee's 2nd machine comes within the first half hour. A Signage ladder that saved its big jump for
the end (×2, ×3, ×3, ×6) left the shop overstaffed for up to 20 hours. The finished-shop check
catches that kind of mismatch by hand, since a shop that ends unbalanced stays stuck that way
through its last hours. Tables use Signage's multipliers so seats keep up with customers: a third to
a half of customers sit for the first 3 hours, and dine-in is about 9% of income. On screen, big
seating multipliers show as stages (bigger tables, a patio, a second room, a rooftop), not counts.
Signage's ×6 at level 100 pairs with Barista training (D37).

**Passed on:** ×2 everywhere · Signage at ×2, ×3, ×3, ×6 (overstaffed for hours) or ×2, ×3, ×4, ×6
(backed up once everything is maxed) · Tables on Baristas' multipliers (seats fall behind customers,
and dine-in is only 4% of income).

<a id="d35"></a>
## D35 · Max level 100 for every upgrade, each with its own price growth — Accepted · 2026-10-04

**Decision:** Every leveled upgrade maxes out at level **100**, a bonus level. Each one's price rises
by its own percentage per level (placeholders from 8% to 40%), chosen so upgrades finish one after
another through the run, the last near its end: drip coffee first, Signage and Baristas together
near the end (they balance each other), Pumpkin spice last. Players only ever see each level's price.

**Why:** A max gives each upgrade a "quest completed" moment. Idle Brewery had none, and Mainak
liked that least about it. One max for everything is one rule to remember, and ending on a bonus
level makes the last level special. With one shared price growth, completions bunch up, or menu
items never finish; a price growth for each upgrade spreads them out. With the previous placeholder
(max 50 and 26% per level), Signage, Baristas and Tables all maxed out in the first 10 minutes.

**Passed on:** max 50 · a different max for each upgrade (60 or 90 aren't bonus levels, and there'd
be more to keep track of) · no max.

<a id="d36"></a>
## D36 · Each menu unlock about doubles income; D19's promise becomes a guiding principle — Accepted · 2026-10-04

**Decision:** Two principles replace D19's "every unlock raises income" and its tier rule:
- **When bought in cost order, every upgrade should raise income, right away or once the rest of the
  shop catches up. Exceptions can happen and get discussed as they come up.**
- **Each menu unlock should about double income when it typically happens.** A new item's starting
  price is set for that, and its unlock price for when it should arrive.

Unlocks stay cost-only and visible from the start. Buying them out of order is a legitimate choice.

**Why:** The old tier rule (a new item worth about 3× the previous one per second of barista time,
at the point it typically unlocks) broke once bonus levels raised prices and added machines: a
leveled muffin earned 25× what a new Pumpkin spice latte did, so unlocking it cut income by 36%.
Re-applying 3× gave 6–15× income jumps and wouldn't settle in tuning. "About doubles income" is what
a player feels, and it tunes cleanly. Two cases can still lower income: unlocking out of order (a
cheaper item joins the menu), and unlocking late, after the old items have grown far ahead. The
human-like simulated player never hit either. A player who strictly buys the cheapest thing first
still loses about half its income when it buys the Espresso machine late.

**Passed on:** the 3× tier rule · unlocks that must happen in menu order.

<a id="d37"></a>
## D37 · A 4–6 hour coffee shop run for now, with one-time upgrades spread across it — Accepted · 2026-10-04

**Decision:** For Phase 0 and Phase 1's first tests, a full coffee shop run (every upgrade maxed)
takes **4–6 hours**. Session B decides the real first-run length, together with the sale and the
knee. One-time upgrades spread across the run: the menu unlocks come at about 2.5 min, 15 min and
1 h, and the three late global upgrades get requirements a run reaches, plus prices:
- **Local influencer visit:** ×2 Demand, needs Signage 75.
- **Mobile ordering:** ×2 Service, needs Baristas 75.
- **Barista training:** ×1.5 Service, needs Baristas 100.

**Tuning rules:** boosts to Demand and Service arrive in pairs: the influencer with mobile ordering
around the 1-hour mark, and training with Signage's ×6 at level 100 around 3 hours. A late global
upgrade costs about a minute of income when its requirement is typically met, so the requirement
sets the timing.

**Why:** The earlier target (a first run of 1–2 days, so upgrades kept finishing up to 36 hours in)
felt far too long, and Phase 1's first tests need faster loops (Mainak). The three earlier global
upgrades were all bought in the first 15 minutes; the late three now fill the rest of the run.
Their old requirements (Baristas 200, Signage 150) were above the max. A boost with nothing to match
it on the other side leaves the shop stuck: an influencer at ×3, matched only two hours later, left
it backed up for up to 2 hours. With the pairs, the shop is balanced 83% of the time and never stuck
for more than about 20 minutes.

**Passed on:** a first run of 1–2 days for now · a test-speed setting instead (long runs, with time
running faster for playtests) · the influencer at ×3 · pricing the late upgrades by hand (a high
price kept mobile ordering out of reach for an hour after its requirement was met).

<a id="d38"></a>
## D38 · The scene comes early: basic shapes in Phase 0, placeholder sprites first in Phase 1 — Accepted · 2026-10-04

**Decision:** Phase 0 ends with a real scene drawn in basic shapes, not a gray box: the counter, the
baristas, the line, the tables, the sign and baristas outside with samples, all driven by the rates.
It takes up more of the screen than the first wireframe. Upgrades sit either on the scene itself
(tap the sign for Signage) or in a condensed menu under it; Mainak will try both. **The first step
of Phase 1 swaps the shapes for placeholder sprites** from a licensed pack, before anyone else
plays. Phase 2 brings the final art and animation, live customers (D18) and asset loading. Whether
PixiJS draws the shapes scene from the start is the call of the step that builds it (D2).

**Why:** Playtesters need something real to look at, and so does Mainak: seeing the game early keeps
the project going. design.md had put everything visual in Phase 2, while Phase 1's tips, special
customers and tuning for fun already assumed a scene.

**Passed on:** a gray box until Phase 2 · real sprites already in Phase 0.

<a id="d39"></a>
## D39 · Where AI-generated content is allowed — Accepted · 2026-10-04

**Decision:**

| Content | AI-generated? |
|---|---|
| In-game art: sprites, backgrounds, icons, the logo and app icon | Never, including AI edits of licensed art |
| Music | Never |
| Sound effects | Real ones first, after a good-faith search; AI if that takes too long |
| UX elements: buttons, panels, menu layouts, a main or pause menu | Yes, and they can ship as is |
| Art drawn with code | Shapes and effects (steam, confetti) are fine; drawings count as art |
| In-game writing | Yes, with Mainak's review |
| Visuals for design discussions (mockups, wireframes, sample screenshots) | Anything, since they never go into the game. They stay out of the repo |

Placeholders come only from licensed packs. Prompts for anything that ships describe what we want
rather than naming another game. AI-made UX elements and sound effects are marked in `CREDITS.md`.

**Why:** Mainak's line is the art and music players experience as the game's own. UX elements are
fine, and discussion visuals help the design chat and Mainak stay on the same page. Good free sound
effects have been hard for him to find before, and he'll be particular about them. Marking AI-made
assets keeps an honest record for the disclosure he wants if the game ships, and some stores ask
(Steam does). Purely AI-generated work generally can't be copyrighted in the US, so AI-made UX isn't
protected the way his own work is; that's fine for this project.

**Passed on:** no AI-generated images at all, the earlier rule, which also ruled out UX elements and
discussion mockups.

<a id="d40"></a>
## D40 · Simulated players: the human-like player is the reference — Accepted · 2026-10-04

**Decision:** Pacing is judged with a **human-like** simulated player. It decides by what the screen
shows, never by income math:
- It sees the shop's state (overstaffed, balanced or backed up), whether every seat is full, and the
  upgrade buttons.
- It loves unlocks, ×2 upgrades and maxing things out, likes reaching bonus levels, and prefers
  cheap things.
- It never saves up for more than about 3 minutes of income.
- It judges by gut feel: a random nudge of up to ±40% on each option, with a fixed seed so a run
  repeats exactly.

Players that maximize income per dollar are for special cases only: an upper bound for a min-maxer,
and a player that always buys the cheapest thing, to check D36's cost-order principle. The design
chat's simulator uses the human-like player, and the pacing test switches to it.

**Why:** Real players can't see what a purchase does to income (D20), so optimizing players aren't
realistic, and they misled the design: a 99-minute wait around the 1-hour mark and "the Espresso
machine never gets bought" were both optimizer behavior. With the human-like player, the wait was
about 2 minutes, and the Espresso machine raised income. Its limits: its tastes are guesses, it's
one personality with some noise, and how often a real player checks in moves results the most.
Phase 1 playtests are the real check.

**Passed on:** the best-value player as the reference (today's pacing test) · a player that also
weighs buying two things together · a player that always buys the cheapest thing.

<a id="d41"></a>
## D41 · Times shown with their two largest units — Accepted · 2026-10-04

**Decision:** Durations show their two largest units, kept short: 42s, 2m 41s, 1h 23m, 2d 4h. Rush
Hour's timer, the Buzz refill countdown and a future welcome-back message all use it. (Decided
2026-10-01; recorded here.)

**Why:** It's compact on a phone, like the number suffixes (D15), and two units are enough to plan
by.

**Passed on:** a clock format (2:14:00) · full words (2 hours 14 minutes).

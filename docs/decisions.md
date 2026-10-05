# Decisions

One entry per real choice: what we decided, why, and what we passed on. Newest last.

**Status:** Accepted · Proposed (awaiting a call) · Superseded (no longer applies at all; the entry
keeps its heading and one line naming what replaced it).

**Each rule lives in one entry, always in its current version.** Other entries point to it ("cook
time: see D33") instead of restating it. **To change a rule,** rewrite its entry, or move the rule
to a new entry when the change is big and point to it from the old one. A replaced version that was
a real choice goes to *Passed on* with why it changed, and a changed entry's heading ends with
"changed" and the date, like D19's. Git history keeps the earlier versions. Numbers are never
reused.

Adding a dependency always gets an entry (see D4).

**Franchise names and numbers** appear in an entry only as examples, as they stood when it was
written. The current ones live in design.md's placeholder numbers (later, in the franchise files),
so changing them needs no new entry; changing a rule does. That keeps tuning and new franchises
from growing this file.

## At a glance

One line per decision. The numbers are the D-numbers, and each title links to the full entry.
**Adding or changing a decision:** update its line here too, and keep an `<a id="dN"></a>` anchor on
the line above its heading. The links point at those anchors, so they keep working when a heading
changes.

1. [**Web stack, not a game engine**](#d1): a TypeScript + React web client and a Python backend. Godot is saved for a later project.
2. [**PixiJS, not Phaser**](#d2): Pixi draws the animated scene: a renderer, not a framework competing with React.
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
13. [**Public repository**](#d13): public with no license; no secrets in git, asset licenses checked, AI disclosed in the README.
14. [**No cap on offline progress**](#d14): idle progress keeps building however long you're away.
15. [**Numbers shown with short suffixes**](#d15): 1.23K, 45.6M and so on, three digits, rounded down; scientific notation is a setting.
16. [**Phase 0 ends with one complete run loop**](#d16): earning, upgrading, the first active mechanic, saves and offline progress.
17. [**A bottleneck economy with spillover**](#d17): income = customers served × Spend; served = the lower of Demand and Service, plus spillover.
18. [**Rates now, live customers in Phase 2**](#d18): the economy runs on rates; Phase 2's live customers must average within 5% of them.
19. [**A real menu with per-item upgrades**](#d19): a price, cook time and popularity per item, one level per item; the whole menu is visible, and unlocks cost money only.
20. [**Buttons show an upgrade's own effect**](#d20): "Service 24 → 36/min", never income previews; the scene shows the bottleneck.
21. [**Three active mechanics: tips, Rush Hour, special customers**](#d21): the pour starts a rush and costs Buzz; tips and visitors are free.
22. [**Rush Hour rolls one lever at ×3**](#d22): Demand or Service at random, for 3 minutes (4.5 after a Perfect pour), one rush at a time.
23. [**Buzz: one refill rate, a small cap**](#d23): 1 charge every 10 minutes, in the shop or away, up to 6.
24. [**The `Big` API**](#d24): 17 methods; one way in (`fromValue`), strings only where data loads, mistakes throw a `BigError`.
25. [**A lint rule keeps React and Pixi out of `src/game/`**](#d25): plus a type check that runs game code without browser types.
26. [**One check command before every pull request**](#d26): `npm run check` runs lint, types, tests and the build; CI runs it too.
27. [**The game runs outside React, on one clock**](#d27): a pure `advance(state, seconds)` moves time; catch-up is the first frame back.
28. [**Franchise files: JSON, checked when they load**](#d28): a mistake names the file and the field; tuning numbers live in the file.
29. **The economy engine** is D29, on the step 4b branch until that pull request merges.
30. [**The coffee shop is counter service: Signage brings customers in, Tables seat them**](#d30): seated customers spend 1.5×; the first ×2 Demand global upgrade is Free Wi-Fi.
31. [**Purchases may pay later**](#d31): a purchase can earn nothing until the rest of the shop catches up, and that's fine.
32. [**Samples: at most 3 baristas outside; no self-serve for now**](#d32): each one brings in 10% more customers; idle baristas beyond 3 stay inside.
33. [**Menu items: cook time shrinks gradually; bonus levels raise the price and add machines**](#d33): half the starting time by level 25; 2nd and 3rd machines at 50 and 100.
34. [**Bonus levels are set per franchise, with multipliers by level and by upgrade; a finished shop must balance**](#d34): the coffee shop's are 10, 25, 50 and 100; later jumps are bigger, and a maxed shop's Service ÷ Demand lands around 1.1.
35. [**One max level per franchise, on a bonus level; each upgrade has its own price growth**](#d35): 100 in the coffee shop; upgrades finish one after another, the last near the end of the run.
36. [**Each menu unlock about doubles income; upgrades bought in cost order should raise income**](#d36): right away or once the shop catches up; exceptions get discussed.
37. [**A 4–6 hour coffee shop run for now, with one-time upgrades spread across it**](#d37): late global upgrades paired in time and priced at about a minute of income.

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

<a id="d17"></a>
## D17 · A bottleneck economy with spillover — Accepted · 2026-09-23 · changed 2026-10-04

**Decision:** Three levers: Demand, Service and Spend. Income = customers served × Spend (seated
customers spend more, D30). Customers served = the lower of Demand and Service, plus spillover:
when the shop is overstaffed, idle baristas bring in extra customers with samples (D32). With
several staff roles, staff help 100% within their role and 20% across roles; the rest of those
rules wait for their own design session. Runs open slightly off balance, with Service above
Demand. Franchise templates define the roles.

**Why:** Every purchase is a real choice, and the screen shows the bottleneck. In simulation, a
strict bottleneck alone traps a one-purchase-at-a-time player: at balance, a single Demand or
Service upgrade earns $0, so everything goes into the menu. Players who upgrade stations together
escape it, and spillover is the safety net for those who don't. It keeps growth even and holds
with three staff roles.

**Passed on:** stacking producers (the only decision becomes best income per dollar) · a strict
bottleneck alone · a soft congestion formula (loses ~16% at perfect balance, which live customers
wouldn't reproduce) · universal spillover (any role helps with any job).

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

<a id="d19"></a>
## D19 · A real menu with per-item upgrades — Accepted · 2026-09-23 · changed 2026-10-04

**Decision:** Menu items have a price, a cook time and a popularity. One level per item: the price
rises every level, and the cook time falls (see D33, along with what bonus levels do). The whole
menu is visible from the start, and items unlock by cost only. How much an unlock should raise
income: see D36.

**Why:** It's how restaurant idle games feel, and fixed order shares push players to spread their
upgrades. Per-item cook times mean an unlock changes how fast the baristas serve as well as what
customers pay, a shake-up we treat as a feature. Cost-only unlocks pace the same as level-gated
ones, because price already does the gating.

**Passed on:** one "Recipes" upgrade for the whole menu · shop-wide speed only (gentler unlocks) ·
level-gated menu unlocks.

<a id="d20"></a>
## D20 · Buttons show an upgrade's own effect — Accepted · 2026-09-23 · changed 2026-10-04

**Decision:** An upgrade button shows what it changes ("Service 24 → 36/min"), never derived stats
like income previews. The scene shows the bottleneck, which tells the player what to buy next.

**Why:** Mainak prefers game-like readability over spreadsheet stats. A purchase can earn nothing
for a while (D31), and the scene shows why: empty seats, or a line out the door.

**Passed on:** showing "+$X/s right now" on every button.

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
## D28 · Franchise files: JSON, checked when they load — Accepted · 2026-09-29 · changed 2026-10-04

**Decision:** Each franchise is a JSON file in `src/game/franchises/`; the coffee shop is
`coffee-shop.json`. `loadFranchise` in `src/game/franchise.ts` reads it when the game starts (D9).
- **Checked when it loads.** Hand-written checks cover every field (nothing missing, nothing
  unknown, numbers in range) and whether the setup makes sense: ids are unique, a global
  upgrade's requirement names a real leveled upgrade at a level under the max, and something is
  on the menu at the start. An error names the file and the field:
  `coffee-shop.json: menu[2].popularity must be above 0, got -1`.
- **Dollar amounts are plain JSON numbers**, read into `Big` once, at load (D24). Levels,
  popularity, seconds and shares stay plain numbers (D5).
- **Tuning lives in the file**, so Phase 1 can try variants without code changes. That covers the
  franchise's bonus levels and max level (D34, D35), each leveled upgrade's price growth and
  bonus-level multipliers, and each global upgrade's multiplier. How the file holds the
  per-upgrade values is step 4b's call.
- **Names:** `globalUpgrades` (one-time boosts to a lever) and `popularity` (how often customers
  order an item), the terms the docs use too. An upgrade's id (`"tables"`, `"latte"`) has the type
  `UpgradeItemId`. Anything with levels (Signage, Baristas, Tables, each menu item) is a *leveled
  upgrade*, so "line" only ever means the queue of customers. A menu item with `"unlock": null`
  starts at level 1; the others start locked, at 0.
- **The game state** keeps each leveled upgrade's level (`levels`) and the global upgrades bought
  (`globalUpgradesBought`). In `src/game/upgrades.ts`, each level costs
  `firstCost × costGrowth^(level − 1)`. An unlock costs its own price and puts its item at level 1.
  A global upgrade can be bought once, after the upgrade it requires reaches its level.
- **One staff role** for now. Several roles need rules the design docs don't have yet.

**Why:** Franchises are data (D9), and the Phase 4 server has to read the same numbers, so the
files are JSON rather than TypeScript. A mistake in a data file should stop the game at once with
a clear message, not turn up later as a strange number (D6).

**Passed on:** TypeScript checking the imported JSON on its own (it can't check ranges or
cross-references) · zod (a new dependency, D4) · a version number (the file ships with the code
that reads it, unlike a save, D10) · a list of staff roles now (their rules aren't designed yet) ·
TypeScript files instead of JSON.

<a id="d30"></a>
## D30 · The coffee shop is counter service: Signage brings customers in, Tables seat them — Accepted · 2026-10-04

**Decision:** Customers line up at the counter to order. **Signage** is Demand's leveled upgrade
(+6 customers a minute per level). Every franchise shares the name, and each bonus level brings a
bigger sign (chalkboard → painted → lit → neon). **Tables are dine-in seats:** a served customer
sits if a seat is free and spends 1.5× the usual order; otherwise they take it to go. Nobody waits
for a seat. Each Tables level adds seats, counted as seated customers a minute. The first ×2
Demand global upgrade is **Free Wi-Fi**. The lever keeps the name Demand in the docs and code;
players see "Customers" for now.

**Why:** Tables bringing customers in felt off. Signage names what the upgrade does (it tells
people you're there) and what you see, and it fits a food truck or a beach bar as well as a coffee
shop. Dine-in gives tables a real job: customers who sit spend more than those who take it to go.
It's in Phase 0 because Phase 0 delivers the whole run and Phase 1 tunes it; an upgrade added
after tuning would mean tuning twice.

**Passed on:** Storefront and Curb appeal (awkward for a truck or a beach) · Reputation and
Marketing (nothing to see) · Hype (too close to Buzz) · tables as decoration only · tables as
capacity, with customers sitting first (Mainak's pattern for full-service franchises, parked for
the multi-role session) · tips from seated customers (tips only come while you watch, so tables
would do nothing for idle play) · Tables bringing customers in (it felt off) · Chalkboard sign
as the first ×2 Demand global upgrade (signs are Signage's now).

<a id="d31"></a>
## D31 · Purchases may pay later — Accepted · 2026-10-04

**Decision:** A purchase doesn't have to raise income the moment it's bought. A table bought while
seats sit empty, or Signage bought while the baristas can't keep up, earns nothing until the rest
of the shop catches up. Spillover (D17) is a safety net, not a promise that every purchase pays at
once.

**Why:** Chasing "every purchase pays at once" would discourage planning ahead (Mainak). D17's
simulation showed that players who upgrade stations together escape the strict bottleneck, and
spillover covers those who don't. The same goes for a shop without self-serve: more customers
during a line earn nothing for a while, and that's fine.

**Passed on:** a goal that no purchase ever does nothing (it discouraged planning ahead) · a
spillover for empty seats (empty tables drawing people in), which would work like
samples, and samples were already too strong.

<a id="d32"></a>
## D32 · Samples: at most 3 baristas outside; no self-serve for now — Accepted · 2026-10-04

**Decision:** When the baristas can serve more customers than arrive, up to **3** idle baristas step
outside with sample trays. Each one brings in **10% more customers** (10% of Demand), never more
than the idle baristas can serve. Idle baristas beyond the 3 stay behind the counter and earn
nothing. Sampled customers join the back of the line like everyone else, pay the usual order and sit
if a seat is free. Both numbers are franchise settings. **There's no self-serve from the line** for
now; it's on the *Later* list in design.md.

**Why:** With samples worth 20% of the idle capacity, a shop with far too many baristas got 96% of
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
set grab-and-go item (the muffin) · self-serve from the line, for now (see above).

<a id="d33"></a>
## D33 · Menu items: cook time shrinks gradually; bonus levels raise the price and add machines — Accepted · 2026-10-04

**Decision:** An item's cook time falls a little every level until it reaches **half its starting
time at level 25** (drip coffee: 8 s → 4 s), and it never gets faster than that. An item's bonus
levels raise its **price** (×2, ×2, ×3, ×5 at levels 10, 25, 50 and 100; see D34), and
levels 50 and 100 add a **2nd and 3rd machine**: two machines make twice the drinks, three make
three times. The price still rises every level by 10% of the starting price. The minimum (half),
the level it's reached at and the bonus levels that add machines are franchise settings.

**Why:** With an item's speed doubling at every bonus level, Service grew two ways (baristas,
and every item) while Demand grew one way, so the simulated shop sat overstaffed 98% of the time
and the bottleneck never swung. Mainak wants it to swing: each purchase can tip the shop, so the
scene always shows what to buy next. A minimum cook time (his idea) caps how much faster items get.
At half, the shop stays balanced; at a quarter or an eighth, it overstaffs again. Reaching the
minimum gradually by level 25, rather than all at once at level 10, kept the balance and made
pacing much less dependent on play style: both simulated players unlocked Pumpkin spice at the same
time instead of 1.2 h vs 3.5 h. Machines double the drinks rather than shortening the cook, which
is what a second machine really does (Mainak). They need customers to grow faster to match (D34).

**Passed on:** doubling speed at each bonus level (the shop sat overstaffed) · ×1.5 speed at each
bonus level · alternating speed and price · price only, never
faster · reaching the minimum at level 10 · minimums of a quarter or an eighth.

<a id="d34"></a>
## D34 · Bonus levels are set per franchise, with multipliers by level and by upgrade; a finished shop must balance — Accepted · 2026-10-04

**Decision:** Each franchise sets its own bonus levels, shared by all its leveled upgrades; the
coffee shop's are 10, 25, 50 and 100. Each leveled upgrade has its own multiplier at each bonus
level, and they can differ from one bonus level to the next. In the coffee shop, for example,
Signage goes ×3, ×3, ×3, ×6 and Baristas ×2, ×2, ×3, ×3 (design.md's placeholder numbers list them
all). **Tuning rule:** with every upgrade at max level and every global upgrade bought, Service ÷
Demand should land around 1.1, inside the balanced band.

**Why:** Mainak wanted multipliers that aren't always ×2, with bigger jumps later, varying by both
level and upgrade, and bonus levels that each franchise places, as one more way to tune it.
Machines add drinks, so Signage needs bigger jumps than Baristas to keep
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
and dine-in is only 4% of income) · the same bonus levels for every franchise.

<a id="d35"></a>
## D35 · One max level per franchise, on a bonus level; each upgrade has its own price growth — Accepted · 2026-10-04

**Decision:** Every leveled upgrade in a franchise maxes out at the same level, one of its bonus
levels: **100** in the coffee shop. Each one's price rises
by its own percentage per level (placeholders from 8% to 40%), chosen so upgrades finish one after
another through the run, the last near its end: drip coffee first, Signage and Baristas together
near the end (they balance each other), Pumpkin spice last. Players only ever see each level's price.

**Why:** A max gives each upgrade a "quest completed" moment. Idle Brewery had none, and Mainak
liked that least about it. One max for everything in a franchise is one rule to remember, and
ending on a bonus level makes the last level special; since each franchise places its bonus levels
(D34), it sets its max too. With one shared price growth, completions bunch up, or menu
items never finish; a price growth for each upgrade spreads them out. With the previous placeholder
(max 50 and 26% per level), Signage, Baristas and Tables all maxed out in the first 10 minutes.

**Passed on:** max 50 · a different max for each upgrade (60 or 90 aren't bonus levels, and there'd
be more to keep track of) · no max · max 100 for every franchise (each would need a bonus level at
100).

<a id="d36"></a>
## D36 · Each menu unlock about doubles income; upgrades bought in cost order should raise income — Accepted · 2026-10-04

**Decision:** Two principles:
- **When bought in cost order, every upgrade should raise income, right away or once the rest of the
  shop catches up. Exceptions can happen and get discussed as they come up.**
- **Each menu unlock should about double income when it typically happens.** A new item's starting
  price is set for that, and its unlock price for when it should arrive.

Buying unlocks out of order is a legitimate choice.

**Why:** A tier rule (a new item worth about 3× the previous one per second of barista time, at the
point it typically unlocks) broke once bonus levels raised prices and added machines: a leveled
muffin earned 25× what a new Pumpkin spice latte did, so unlocking it cut income by 36%.
Re-applying 3× gave 6–15× income jumps and wouldn't settle in tuning. "About doubles income" is what
a player feels, and it tunes cleanly. Neither principle is a promise. Two cases can still lower
income: unlocking out of order (a cheaper item joins the menu), and unlocking late, after the old
items have grown far ahead. The human-like simulated player never hit either. A player who
strictly buys the cheapest thing first still loses about half its income when it buys the Espresso
machine late.

**Passed on:** the 3× tier rule · promising that every unlock raises income (the two cases above
break it) · unlocks that must happen in menu order.

<a id="d37"></a>
## D37 · A 4–6 hour coffee shop run for now, with one-time upgrades spread across it — Accepted · 2026-10-04

**Decision:** For Phase 0 and Phase 1's first tests, a full coffee shop run (every upgrade maxed)
takes **4–6 hours**. Session B decides the real first-run length, together with the sale and the
knee. One-time upgrades spread across the run: the menu unlocks come at about 2.5 min, 15 min and
1 h, and the three late global upgrades (Local influencer visit, Mobile ordering and Barista
training) get requirements a run reaches, plus prices; both are in design.md's placeholder numbers.

**Tuning rules:** boosts to Demand and Service arrive in pairs, such as the influencer with mobile
ordering around the 1-hour mark, and training with Signage's ×6 at level 100 around 3 hours. A late
global upgrade costs about a minute of income when its requirement is typically met, so the
requirement sets the timing.

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

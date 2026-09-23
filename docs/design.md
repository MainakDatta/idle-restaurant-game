# Under New Management — Design Doc

*Working title, for display only. Code, folders, packages and storage keys use the neutral
codename `idle-restaurant-game` — see `decisions.md` D7.*
*Status: design settled 2026-09-22, ready for Phase 0. Technical rationale lives in
`decisions.md`; this doc is about the game.*

An idle/incremental game about starting, growing, and **selling** eating establishments —
then choosing what you run next.

---

## Pillars

1. **Cozy, never pressured.** Play for a bit, come back later. Nothing punishes you for
   leaving: no fail states, no demand you're forced to manage, no meters that nag.
2. **Prestige is a draft, not a reset.** Selling your business opens a choice of what to run
   next. (PlateUp's cross-run progression, applied to an idle loop.)
3. **Visible growth.** The place physically fills up as you invest. Number-go-up made physical.
4. **Attention is rewarded; absence is never punished.**

## The novelty

In almost every idle game, prestige means *press reset, return to the same game with a
multiplier*. Here it's a **draft**. That attacks the genre's structural weakness — late-game
sameness. Most idle games become the same screen with more zeros. This becomes a different
screen.

## Core loop

```
open franchise → serve customers → earn → buy upgrades → capacity rises
      ↑                                                        │
      └──── pick from market board ←── SELL ←── Potential 100% ─┘
```

---

## Architecture: franchises are data, mechanics are a code library

Every franchise runs the *same* engine: customers arrive → get served → money → upgrades →
capacity. What varies:

| Varies | Lives in |
|---|---|
| Art set | sprite sheet |
| Naming ("Barista" vs "Line Cook") | franchise data file |
| Tuning (pizza = slow, high ticket · coffee = fast, low ticket) | franchise data file |
| Active mechanic | **picked by ID from a small library of mechanics (code)** |

- New franchise reusing an existing mechanic = **data + sprites only**.
- New mechanic = code, written once, then reusable by any franchise.
- **Build franchise #1 reading from a definition file**, even though there's only one.

*Later:* **templates** (e.g. counter-service vs table-service) as a layer between the engine
and franchise data, for structural variety.

## Drafting: listings

Listings arrive on the **market board** during a run (see *The sale*); when you sell, you pick
one. Each is a pre-combined option, like browsing businesses for sale:

> *Coffee shop · college town* · *Pizza · beach boardwalk* · *Cat café · airport terminal*

Axes combined into a listing:

| Axis | Status | Examples |
|---|---|---|
| **Franchise type** | ✅ | coffee, pizza, cat café, bar… |
| **Location** | ✅ | college town (volume), airport (rush windows, no regulars), boardwalk (seasonal) |
| **Floorplan** | 🤔 considering | narrow counter (turnover) · open dining room (capacity) · patio (weather) |

Locations and floorplans are *modifiers* — a few numbers and a background, not new systems.
5 types × 6 locations = 30 distinct runs from 11 pieces of content. Presenting them as
pre-combined listings keeps the choice a simple pick-one-of-a-few, however many axes exist.

## Tiers

**Tier = how big the business is.** Coffee cart (1) → café (2) → roastery (3) → airport coffee
bar (4).

**Why it exists:** every sale makes you permanently stronger. If drafted businesses stayed the
same size, runs would shrink run after run until you're flipping coffee carts in minutes — the
exact collapse the pacing floor forbids. Tiers make **targets grow alongside power**: listings
unlock upward as meta-progression grows. Higher tiers also bring *more* — staff roles, upgrade
lines, on-screen activity — so later runs are richer, not just longer.

**Open:** does tier belong to the franchise type or the location? Lean: **location**, so every
franchise type stays in play all game (a late-game coffee run is an airport, not a cart).

---

## Run pacing

| | Target |
|---|---|
| First run | 1–2 days |
| Mid-game runs | Hours |
| **Floor** | **~1–3 hours — never minutes** |

The draft is the payoff; a run you never inhabited makes the choice meaningless. Tiers hold
the floor.

## Active play

- **Rule:** the active mechanic is a bonus on idle progress, never the income itself.
- **It changes throughput, not income.** E.g. a Rush Hour window: tapping applies a multiplier
  that decays over a few minutes. Egg Inc's running-chicken button is the proven precedent.
- **Gated by a consumable resource** that regenerates over time. This is what makes the
  active:idle ratio *enforceable* — the ceiling becomes two tunable numbers (regen, cap).
  - ⚠️ **Cozy trap:** a full meter that wastes regen nags people to check in. **Size the cap to
    cover a normal absence** (a night's sleep, a workday) so returning to a full meter always
    feels like a gift.
- **Tuning target:** fully active ≈ 1.5–2× fully idle over a run. Hypothesis; Phase 1 proves or
  kills it.
- **Mini-games skew simple and cozy.** One gesture, clear feedback.
  - v1: coffee — hold to pour espresso, release in the green zone.
  - **Stretch: merge** (NecroMerger-style), contained as *one franchise's* mechanic — e.g. a
    bakery merging dough → bread → pastries — not the whole game's progression system.
- **To jam on when relevant:** Cookie Clicker (click value scales with upgrades), Egg Inc
  (running chickens, drones), Eatventure (collecting tips).

## Upgrades

- Choosing upgrades is itself a light active mechanic — buying the right thing early rewards
  attention without punishing absence.
- **Needs real choices** — trade-offs and synergies. If "buy the moment it's affordable" is
  always right, it's a chore, not a decision.
- **Automation as a reward:** hand-pick early; earn autobuyers through meta-progression. A gift
  that removes chores — cozy by design.
- **Affordability is visible** — highlight what you can buy, hint "affordable in 4 min."

## Meta-progression

Carries across runs:

- **Cheaper or free swaps** — more control over the board (the free redraw stays once per sale)
- **Listing slots** — more listings arrive per run (e.g. hire a real estate agent)
- **Signature recipes** — carried forward *(strongest hook; PlateUp's dish cards)*
- **Better starting equipment**
- **Advertising** — more customers from minute one
- **Automation** — autobuyers
- **Royalties** — sold franchises pay a small permanent trickle. v1: uncapped. Later: a
  slotted **portfolio**. Model as a *list of holdings* with `maxSlots = ∞` from day one; never a
  single aggregate number.

## The sale

**Push gently, pull strongly, and let the game do the math.**

### Push: Potential and "the knee"

- Cross-run currency fills a **Potential** bar during the run.
- At **100%**: a small celebration (*"This place has reached its full potential"*) and a plain
  "great time to sell."
- Past 100%, earning continues at a **trickle**, never zero. Time away after hitting 100% is
  never wasted.
- **Tuning rule:** keep the trickle well below the run's *average* rate (start: ~10%). Then the
  mathematically best moment to sell lands at 100%, so casual players and min-maxers do the
  same thing.
- "The knee" is our internal name for the bend in the earnings curve. Players only ever see
  "Potential."

*Why not a pure cap:* a hard cap wastes time spent away after the cap, which becomes pressure
to check in. A pure soft cap turns "when do I sell?" into a math problem.

*Background:* Charnov's marginal value theorem (1976) says a forager should leave a patch
when its current rate drops to its average rate. Animals and humans reliably stay too long,
which is one more reason the game should *say* when.

### Pull: the market board

- **The board is the draft,** revealed across the run instead of all at once at the sale.
- Listings **arrive** as Potential rises (e.g. at 25 / 50 / 75 / 100%), each one semi-random at
  the moment it arrives.
- **Sell whenever you like** and pick from whatever is on the board. Selling early just means
  fewer choices; there's no penalty.
- **Listings never expire,** so there's no fear of missing out.
- Idea: the **100% listing is special**, e.g. the only one that can be a tier up.
- Returning after a long absence: *"3 businesses came on the market while you were away."*

### Surprise: one free redraw at the sale

The board swaps the surprise at the sale for anticipation during the run. The redraw gives
the surprise back to anyone who wants it.

- **Once per sale, free:** throw out the whole board and draw a fresh hand.
- **Can't be undone.** That's what makes it a real card draw instead of a free peek.
- **Same quality, different businesses:** the new hand has as many listings as the board you
  earned, under the same rules (including the special 100% slot). A redraw changes *which*
  businesses you're offered, never *how good* the offer is, so reaching 100% still matters.
- **Make it a show:** listings are cards, and a redraw flips them over one at a time.
- It serves three kinds of player: the *planner* picks what they've been eyeing, the
  *gambler* redraws for the surprise, and the *unlucky* one redraws as an escape hatch.
- *Fallback if playtesting shows regret:* draw the new hand, then pick from either hand.
  Less of a gamble, no disappointment.

**Paid swaps** are a separate tool, for control rather than surprise: replace one listing on
the board at any time during the run. They're deliberately *not* extra full redraws, because
buying unlimited redraws would let a gambler redraw until they win, and the gamble would
disappear.

### The moment

End every run on a **valuation screen**: one number summarizing the run. It's the score, and
the leaderboard hook once the backend lands (*best sale price*, *most flipped*). Then the
board opens in pick-one mode.

## Tone

Comedy is free and it's most of what people remember. Absurd franchise names, unhinged
customer requests, surprise visits.

---

## First build: coffee shop

Fast customer cycle keeps the screen visibly busy, so early playtesting feels alive.
Hold-to-pour sets the template every later mechanic copies.

## Visible growth & asset loading

More tables, more staff sprites bustling, longer queues as you invest.

Performance plan (Phase 2, a deliberate learning area):
- **Per-franchise asset bundles** — only the current franchise is loaded.
- **Listing thumbnails load when a listing arrives; the chosen franchise's full bundle loads
  during the valuation screen** — the sale moment doubles as a loading screen the player is
  enjoying anyway.
- Texture atlases; object pooling for customer sprites.

## Constraints

- **Portrait / mobile-first.** Desktop is the scaled-up variant.
- **No hover-dependent UI.** Tap to inspect.
- Finger-sized tap targets.
- **Reserve the scene region in the layout from day one**, even as a gray box.
- **Saves must survive.** Losing progress breaks pillar 1: export/import and an iPhone install
  hint first, then cloud saves (D10).

---

## Stack (summary — rationale in `decisions.md`)

| Layer | Pick | Phase |
|---|---|---|
| Language · UI · Build | TypeScript · React · Vite | 0 |
| Styling | Plain CSS / CSS Modules | 0 |
| State | Plain store class + `useSyncExternalStore` | 0 |
| **Numbers** | **Our own `Big` class**, used from day one (D5, D6) | 0 |
| Save | localStorage behind one swappable module · export/import (D10) | 0 |
| Test | Vitest | 0 |
| Graphics | PixiJS v8 | 2 |
| Audio | TBD at Phase 3 | 3 |
| Backend | Python 3.14 + FastAPI | 4 |
| Database | **PostgreSQL** | 4 |
| Hosting | Cloudflare Pages · Fly.io | 1 · 4 |
| Mobile | Installable PWA → offline support → Capacitor | 1 · 5 · post-5 |

**Structural rules:** game logic imports nothing from React or Pixi · every game quantity is a
big number · the title lives in one constant · saves are versioned JSON behind one storage
module · offline progress is calculated in the browser (D11).

## Build phases

| Phase | Deliverable |
|---|---|
| **0** | `Big` class, game loop with offline catch-up, coffee shop from a definition file, portrait layout with placeholder art, save system (versioned, export/import) |
| **1** | Tune curves until genuinely fun. CI. Deploy to Cloudflare Pages, installable (manifest + iPhone install hint) for playtesters |
| **2** | PixiJS scene, real sprites, visible growth, asset loading |
| **3** | Audio — lofi, unobtrusive over hours, persistent mute |
| **4** | Python + Postgres: accounts, cloud saves, server-checked progress, leaderboard |
| **5** | Offline support (service worker), polish, share widely |
| **post-5** | Capacitor → app stores |

## Assets & audio

- Free/cheap packs to start (Kenney, itch.io). **No AI-generated images.** Pixel art by hand is
  a maybe-later.
- Audio is relaxing lofi that survives hours of looping. Persistent mute. Browsers block
  autoplay until the first interaction.

---

## Open questions

- [ ] Title — "Under New Management" is a working title
- [ ] How many listings arrive per run? (start: 4, at 25 / 50 / 75 / 100%)
- [ ] Is the 100% listing special (e.g. the only tier-up)?
- [ ] Trickle rate past 100% (start: ~10% of the run's average rate)
- [ ] Currency for paid swaps (lean: in-run cash, which gives money earned past 100% a use,
      with a mild side effect of encouraging players to stay past 100%)
- [ ] Guarantee variety, or allow repeat franchise types?
- [ ] Tier on franchise type or on location?
- [ ] Floorplan as a third listing axis?
- [ ] Consumable resource — name, regen rate, cap
- [ ] Mechanic library v1 contents
- [ ] Offline progress cap (genre norm: 8–24h)

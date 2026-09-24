# Under New Management — Design Doc

*Working title, for display only. Code, folders, packages and storage keys use the neutral
codename `idle-restaurant-game` — see `decisions.md` D7.*
*Status: Phase 0 in progress (see the checklist under *Build phases*). Technical rationale lives in
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
| Tuning (pizza = slow service, high spend · coffee = fast service, low spend) | franchise data file |
| Active mechanic | **picked by ID from a small library of mechanics (code)** |

- New franchise reusing an existing mechanic = **data + sprites only**.
- New mechanic = code, written once, then reusable by any franchise.
- **Build franchise #1 reading from a definition file**, even though there's only one.
- **The file format** is settled in step 4. Design lean: JSON, because the Phase 4 server has to
  read the same numbers to check progress.

**Templates** define a franchise's staff roles: counter service has one; kitchen is cashier →
cook; full service is host → waiter → chef. See *Inside a run*.

## Inside a run: the economy

*Settled in design session A, 2026-09-23. Rationale in D16–D20.*

### Three levers

| Lever | Means | Raised by |
|---|---|---|
| **Demand** | Customers arriving per minute | Tables, marketing boosts |
| **Service** | Customers served per minute | Baristas, equipment, each item's speed |
| **Spend** | Average spend per customer | Each item's price, new menu items |

**Income = customers served × Spend.** Customers served is set by the bottleneck:

- **Strict at the core:** served = the lower of Demand and Service.
- **Spillover, so surplus is never wasted:** idle staff help 100% within their role and 20% across
  roles. Idle baristas stepping outside with samples counts as cross-role help (it raises Demand).
  A line converts 20% of its surplus into self-serve spend (people grab a pastry while waiting).
- **Off-balance opening:** a run starts with Service a little above Demand, so the first purchases
  have an obvious target.
- **Templates define the roles.** The coffee shop has one (barista). Kitchen: cashier → cook. Full
  service: host → waiter → chef.

### The menu is real

Each item has a price, a barista time to make it, and an order weight. Spend is the weighted
average price, and the weighted average barista time sets how many customers the baristas serve.

- **One level per item:** its price rises every level. At bonus levels its production speed
  doubles, arriving as visible equipment (a second machine, a bigger oven).
- **The whole menu is visible from the start** and items unlock by **cost only**, priced so an
  unlock pays for itself in a reasonable time.
- **Tier rule:** a new item starts at about 3× the previous item's value *at the point it
  typically unlocks*, measured per second of barista time (price ÷ time). Every unlock raises
  income, and because the new item starts slow, it also shakes up the balance: the line grows.
- Every item keeps its share of orders, so a neglected item costs twice (a low price on its share,
  slow production). Players naturally spread their upgrades.
- *Advanced franchise trait (later):* a fully unlocked menu from day one.

### Upgrades

| Kind | Examples | Rule |
|---|---|---|
| **Leveled** | Tables, Baristas, each menu item | Each level costs more; output doubles at levels 10, 25, 50, 100, then every 50 |
| **Menu unlocks** | Espresso machine → Latte | Visible from the start; cost is the only gate |
| **Lever boosts** | Chalkboard sign (×2 Demand), Second grinder (×2 Service) | Visible from the start; buyable once a bonus level is reached; staggered by lever |

Buttons show the upgrade's **own effect** ("Service 24 → 36/min"), never a derived income preview.
The scene shows the bottleneck: a line out the door, or baristas with nothing to do.

### Rates now, live customers later

The economy runs on **rates**, and customers on screen only illustrate them, so offline catch-up
is exact. Phase 2 adds live customers with randomness, and their long-run average must stay within
5% of the rates (D18).

### Pacing targets

Phase 1 tunes toward these:

| Moment | Target |
|---|---|
| First purchase | Within about 10 seconds |
| First level bonus | 2–5 minutes |
| First one-time upgrade | 5–15 minutes |
| One-time upgrades | Spread across the whole run |
| Wait between purchases | 1–5 min around the 1-hour mark; 20–40 min around the 8-hour mark |

### Placeholder numbers: coffee shop (for step 4)

Tested in simulation; Phase 1 tunes them. Costs rise **26% per level**. A run starts with 1 table,
1 barista and drip coffee.

| Leveled upgrade | Each level | First level costs |
|---|---|---|
| Tables | +6 customers/min | $2 |
| Baristas | +1 barista | $8 |
| Drip coffee | Price +10% of $3 | $6 |
| Latte | Price +10% of $51 | $150 |
| Muffin | Price +10% of $195 | $3.6K |
| Pumpkin spice latte | Price +10% of $8.5K | $36M |

| Menu item | Starting price | Barista time | Order weight | Unlocked by |
|---|---|---|---|---|
| Drip coffee | $3 | 8 s | 5 | Start |
| Latte | $51 | 12 s | 4 | Espresso machine, $1.44K |
| Muffin | $195 | 4 s | 3 | Pastry case, $36K |
| Pumpkin spice latte | $8.5K | 14 s | 2 | Seasonal specials, $373M |

| Lever boost (×2) | Buyable at | Cost |
|---|---|---|
| Chalkboard sign (Demand) | Tables 10 | $4.8K |
| Second grinder (Service) | Baristas 25 | $615K |
| Loyalty cards (Demand) | Tables 50 | $49.7M |
| Mobile ordering (Service), Local influencer visit (Demand), Barista training (Service) | Baristas 100, Tables 150, Baristas 200 | ⚠️ Not reached in 24 h of simulation. Lower these in Phase 1 |

Simulated: first purchase at 6 s, first bonus at 2 min, menu unlocks at 6 min, 8 min and 2.4 h.
Waits between purchases were under a minute around the 1-hour mark and 43 min around the 8-hour
mark, both a little outside the targets.

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

**Open, and the earlier lean is in doubt.** The lean was to make tier part of the location, so
every franchise type stays in play all game. But tiers add new systems (staff roles, upgrade
lines), while locations are meant to be light modifiers, and the ladder above mixes business
sizes with a location (the airport). Likely answer: tier is the business's *size*, its own
part of a listing. To revisit in a design session.

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
  - v1 for coffee: hold to pour espresso, release in the green zone. **Under review:** a
    brainstorm on alternatives comes before step 7.
  - **Stretch: merge** (NecroMerger-style), contained as *one franchise's* mechanic — e.g. a
    bakery merging dough → bread → pastries — not the whole game's progression system.
- **To jam on when relevant:** Cookie Clicker (click value scales with upgrades), Egg Inc
  (running chickens, drones), Eatventure (collecting tips).
- **Special customers** (a big group order, a food critic, a generous tipper) appear only while
  you're watching: attention rewarded, absence never punished. Designed with the active mechanic.

## Upgrades

- Choosing upgrades is itself a light active mechanic — buying the right thing early rewards
  attention without punishing absence.
- **Needs real choices** — trade-offs and synergies. If "buy the moment it's affordable" is
  always right, it's a chore, not a decision.
- **Automation as a reward:** hand-pick early; earn autobuyers through meta-progression. A gift
  that removes chores — cozy by design.
- **Affordability is visible:** highlight what you can buy. Buttons show each upgrade's own
  effect, never derived stats like income previews (D20).
- How upgrades work in detail: see *Inside a run*.

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
  earned, under the same rules (including the special 100% slot, if we adopt it). A redraw changes *which*
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

Fast customer cycle keeps the screen visibly busy, so early playtesting feels alive. One staff
role (barista). The menu starts with drip coffee, with latte, muffin and pumpkin spice latte to
unlock (placeholders; see *Inside a run*). Its first active mechanic (under review) sets the
template every later mechanic copies.

## Visible growth & asset loading

More tables, more staff sprites bustling, longer queues as you invest. Each item's bonus levels
arrive as new equipment (a second machine). Idle baristas step outside with sample trays, and a
long line snakes out the door with a counter ("+37 waiting").

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
- **Numbers use short suffixes:** 1.23K, 45.6M, 789B, 1.23T, then Qa, Qi, Sx, Sp, Oc, No, Dc,
  then two-letter codes (aa, ab, …). Three significant digits, and a setting for scientific
  notation (D15).
- **Reserve the scene region in the layout from day one**, even as a gray box.
- **Saves must survive.** Losing progress breaks pillar 1: export/import and an iPhone install
  hint first, then cloud saves (D10).

---

## Stack (summary)

Picks already in use have an entry in `decisions.md`. The rest are the plan, and each gets an
entry when its phase adopts it.

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

**Structural rules:** game logic imports nothing from React or Pixi · anything that can grow
without limit is a `Big` (D5) · the title lives only in `.env` (D7) · saves are versioned JSON
behind one storage module (D10) · live play and offline catch-up run the same code (D11).

## Build phases

**Terms:** a *phase* is a stage of the roadmap below. Each phase is split into numbered
*steps*, and each step is built on its own branch and merged through one pull request.

| Phase | Deliverable |
|---|---|
| **0** | `Big` class, game loop with offline catch-up, coffee shop from a definition file, portrait layout with placeholder art, save system (versioned, export/import), first active mechanic. See the checklist below |
| **1** | Tune curves until genuinely fun. CI. Deploy to Cloudflare Pages, installable (manifest + iPhone install hint) for playtesters |
| **2** | PixiJS scene, real sprites, visible growth, asset loading, live customers (D18) |
| **3** | Audio — lofi, unobtrusive over hours, persistent mute |
| **4** | Python + Postgres: accounts, cloud saves, server-checked progress, leaderboard |
| **5** | Offline support (service worker), polish, share widely |
| **post-5** | Capacitor → app stores |

### Phase 0 checklist

One step per branch → pull request → merge.

| Step | What gets built | See |
|---|---|---|
| 1 ✅ | Scaffold: Vite, React, TypeScript, Vitest, oxlint | D12 |
| 2 | `Big` class, plus the `src/game/` folder and a check that keeps React and Pixi out of it | D5, D6 |
| 3 | Game state and loop, with offline catch-up | D11, D14, D18 |
| 4 | Coffee shop definition file and the engine that reads it | D9, D17, D19; *Inside a run* |
| 5 | Portrait UI: money, upgrades, a gray box where the scene will go | *Constraints*, D20 |
| 6 | Save system: one storage module, versioned JSON, export/import | D10 |
| 7 | First active mechanic, with its Rush Hour boost and the resource that limits it (placeholder numbers) | *Active play* (mechanic under review) |

## Assets & audio

- Free/cheap packs to start (Kenney, itch.io). **No AI-generated images.** Pixel art by hand is
  a maybe-later.
- **Every asset gets a row in `CREDITS.md`:** where it came from, its license, and any required
  attribution text. Assets that require attribution also appear on an in-game credits screen.
- Audio is relaxing lofi that survives hours of looping. Persistent mute. Browsers block
  autoplay until the first interaction.

---

## Open questions

### Finish session A (before step 7)

- [ ] **Active mechanic:** alternatives to hold-to-pour for the coffee shop, what goes in the first
      version of the mechanic library, and **special customers** (see *Active play*).
- [ ] **Consumable resource:** name, regen rate and cap (placeholders are fine).

### Session B (before Phase 1)

- [ ] **Roadmap:** the build phases don't yet schedule selling, the valuation screen, the market
      board and draft, or the cross-run currency and meta upgrades. Phase 1 needs them to test
      whether the game is fun. Idea: a Python balance simulator that reads the franchise file,
      as Mainak's first Python in the project.
- [ ] **The cross-run currency:** its name, what it buys, how it relates to the sale value, and
      what royalties pay in. ("Potential" is the bar the currency fills, not the currency.)
- [ ] **How the knee works in practice:** the exact curve, and how catch-up applies it after a
      long absence. The structure is settled in D11.
- [ ] **What a tier is** (see *Tiers*: probably business size, not location).

### Later

- [ ] Title: "Under New Management" is a working title
- [ ] How many listings arrive per run? (start: 4, at 25 / 50 / 75 / 100%)
- [ ] Is the 100% listing special (e.g. the only tier-up)?
- [ ] Selling before the first listing arrives: have a listing waiting from the start, or unlock
      selling with the first listing? Lean: a listing from the start, so the board is never
      empty and a redraw always deals cards.
- [ ] Trickle rate past 100% (start: ~10% of the run's average rate)
- [ ] Currency for paid swaps (lean: in-run cash, which gives money earned past 100% a use,
      with a mild side effect of encouraging players to stay past 100%)
- [ ] Guarantee variety, or allow repeat franchise types?
- [ ] Floorplan as a third listing axis?
- [ ] **Random events** (rain, an influencer post) that temporarily shift a lever. Cozy rule: they
      shift the balance rather than just cutting income.
- [ ] **Featured item:** a player-chosen item that gets ordered more often.

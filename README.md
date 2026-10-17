# idle-restaurant-game

**Grand Reopening** is a cozy idle game about starting, growing and selling
eating establishments, then choosing what to run next.

**Status:** Phase 0 (foundations). Not playable yet.

## Running it

Needs Node 24 (`nvm use` reads `.nvmrc`).

```bash
npm install
npm run dev         # local dev server with live reload
npm test            # unit tests
npm run typecheck   # TypeScript type checking
npm run lint        # oxlint
npm run build       # production build into dist/
npm run check       # lint, typecheck, tests and build: run before every push
```

## Docs

- [`docs/design.md`](docs/design.md): what the game is
- [`docs/decisions.md`](docs/decisions.md): why it's built the way it is

## About

A side project I'm co-developing with Claude, Anthropic's AI. I set the direction and make the
design and product calls. Claude writes most of the code and drafts the docs, and I review every
change before it merges.

Two Claude sessions split the work, one as game-design lead and one as developer. They don't share
a conversation. They coordinate through this repo's docs and pull requests, plus short handoff
notes I carry between them. Most of the process is visible here:
[`docs/decisions.md`](docs/decisions.md) records each call and why, and every commit Claude worked
on carries a `Co-Authored-By: Claude` trailer.

No license: all rights reserved. You're welcome to read the code, but it isn't licensed for
reuse.

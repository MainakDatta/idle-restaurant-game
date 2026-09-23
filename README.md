# idle-restaurant-game

Working title: **Under New Management**, a cozy idle game about starting, growing and selling
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
```

## Docs

- [`docs/design.md`](docs/design.md): what the game is
- [`docs/decisions.md`](docs/decisions.md): why it's built the way it is

## About

Built as a learning project with an AI pair programmer (Claude).

No license: all rights reserved. You're welcome to read the code, but it isn't licensed for
reuse.

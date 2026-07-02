# CLAUDE.md

## Project Overview

Multi-site anime crawler on a NestJS monorepo. A cron seeder publishes crawl
jobs to RabbitMQ; a worker parses pages (XPath or headless browser) and
recursively re-publishes next-stage jobs; a sink publishes final structured
data; a store persists it to SQLite. A dashboard app provides an HTTP UI to
browse/edit stored data and trigger re-crawls/archives. `otakudesu` is the
reference `SiteAdapter`. See `README.md` and `docs/infra/architecture.md` for
the full picture — don't duplicate that detail here, read it.

## Tech Stack

- NestJS 11 (monorepo, Nest CLI multi-app), TypeScript
- RabbitMQ via `@golevelup/nestjs-rabbitmq` (topic exchanges)
- TypeORM + `better-sqlite3` (single SQLite file, no server)
- `@hanivanrizky/nestjs-xpath-parser` (xpath engine), `@hanivanrizky/nestjs-browser-action` (headless Chromium engine)
- `@anthropic-ai/sdk` / `@openrouter/sdk` (dashboard AI Pattern Finder)
- `yt-dlp` (downloader, extracts real video from mirror embeds) + S3-compatible storage (MinIO in dev)
- pnpm workspaces, Jest, ESLint 10 flat config + Prettier

## Repository Structure

```
apps/
  scheduler/       cron seeder — starts the pipeline
  scraper-worker/  parse worker (xpath/browser engines), scale this one
  result-sink/     publishes parsed items to the public results exchange
  result-store/    persists to SQLite, owns the adapter/schema
  control/         on-demand crawl trigger (no HTTP)
  downloader/      archives episode videos to S3/MinIO via yt-dlp
  dashboard/       the only HTTP app — browse/edit data, re-crawl, AI pattern finder
libs/commons/src/  shared: adapters, entities, messaging, rabbit, s3, engine, pipes
docs/infra/        per-app docs + architecture.md — READ THESE FIRST for any app change
docs/todos/        gitignored, local scratch notes — not shared, don't rely on it existing
docs/superpowers/  gitignored, local plans/specs from prior sessions
data/               SQLite file (gitignored)
resources/yt-dlp    vendored yt-dlp binary
```

## Development Commands

Prefer `make help` for the full aliased list (self-documenting, backed by
`package.json` scripts). Key ones:

```bash
make install          # pnpm install
make worker sink store control downloader scheduler   # start one service (prod mode)
make worker-dev        # same, --watch (append -dev to any service target)
make up                # boot the whole pipeline in required startup order (backgrounded)
make dashboard-dev      # HTTP UI on :3001, needs DASH_USER/DASH_PASS in .env
```

**Startup order matters** — RabbitMQ topic exchanges silently drop messages
with no bound queue. Start consumers (worker → sink → store → control →
downloader) before the scheduler. `make up` already does this in order.

## Build & Test

```bash
pnpm run build          # nest build
pnpm run test            # jest, unit
pnpm run test:e2e        # apps/control/test/jest-e2e.json
pnpm run test:cov
pnpm run lint             # eslint --fix
pnpm run format            # prettier --write apps/**/*.ts libs/**/*.ts
```

Jest roots are `apps/` and `libs/`, testRegex `*.spec.ts`. Path alias
`@libs/commons` → `libs/commons/src`.

## Code Style

- Prettier: single quotes, trailing commas everywhere (`.prettierrc`).
- ESLint flat config (`eslint.config.mjs`): `typescript-eslint` recommendedTypeChecked + prettier-recommended.
  `no-explicit-any` is **off**; `no-floating-promises` and `no-unsafe-argument` are `warn`, not `error`.
- `any` is allowed by config but **avoid it anyway** — prefer a concrete type, generic, or `unknown` + narrowing.
- No enforced comment/docstring convention beyond what's in this repo's existing files — keep terse, explain *why* not *what*.

## Architecture

See `docs/infra/architecture.md` (authoritative, keep it that way — update it
alongside any pipeline/stage/exchange change) and `docs/infra/adapters.md`.
Quick orientation:

- Stages: `index → detail → episode|batch`. Engine per stage: `xpath` (HTTP + XPath) or `browser` (headless Chromium, serialized — one episode at a time per worker process).
- Exchanges (all topic): `anime.crawl`, `anime.parsed`, `anime.results` (public), `anime.crawl.dlx`, `anime.download`. Routing key shape: `<prefix>.<stage>.<source>`.
- **Adapters are DB rows, not code.** `result-store` seeds `otakudesuAdapter` (the TS constant) once on first empty boot; after that the DB is authoritative and edits happen via the dashboard. Triggers embed a full adapter **snapshot** into each job — mid-cascade edits only apply on the *next* trigger cycle.
- **Freshness skip:** worker skips re-fetching `detail`/`episode` rows updated within `SKIP_FRESH_HOURS` (default 72h). Dashboard manual re-crawls pass `force: true` to bypass.
- Mapper coupling caveat: `apps/result-store/src/result.mapper.ts` is hardcoded to otakudesu's parsed-key shape. A new adapter crawls/parses fine but won't map into entity tables correctly unless its parsed keys match otakudesu's contract — see `docs/infra/adapters.md#-mapper-coupling-caveat`.

## Database

SQLite, single file, path from `SQLITE_PATH` (default `data/results.sqlite`,
gitignored). TypeORM `synchronize` only runs when `NODE_ENV=development` — use
migrations for anything else. `result-store` owns the schema; other apps that
need the `Adapter` entity (`scheduler`, `control`, `dashboard`) open
`synchronize: false` connections. Normalized tables: `anime`, `genre`,
`anime_genre`, `episode`, `mirror`, `download_link`, `download_archive`,
`adapter`. No write-time FKs across stages — `*Url` columns are resolved in
the read/API layer. Full column-level reference: `docs/infra/result-store.md`.

## API

Only `apps/dashboard` is HTTP (Basic auth via `DASH_USER`/`DASH_PASS`,
`DASH_PORT`, default `:3001`). All other apps are headless RMQ microservices —
no HTTP surface, no REST/GraphQL API to document. Dashboard routes: CRUD on
`/adapter`, episode archive trigger (`POST /episode/:id/archive`), AI pattern
finder (`GET /adapter/ai-pattern`). See `docs/infra/dashboard.md`.

## Environment Variables

Copy `.env.example` → `.env`, every var is commented there — that file is the
source of truth, don't duplicate values here (they drift). Notable ones to
know exist: `SKIP_FRESH_HOURS`, `CONSUME_DELAY_MS`, `PREFETCH_COUNT`,
`BROWSER_HEADLESS`, `DOWNLOADER_AUTO_TRIGGER`, `AI_PROVIDER` +
`ANTHROPIC_API_KEY`/`OPENROUTER_API_KEY`, `YTDLP_BIN`,
`DOWNLOAD_MAX_RETRIES`/`DOWNLOAD_RETRY_DELAY_MS`, S3/MinIO `S3_*` vars
(bucket must be pre-created, e.g. `mc mb local/anime-archive`).

## Deployment

No Dockerfile/docker-compose/CI config in this repo as of this writing —
deployment is manual (`pnpm run start:prod` runs `dist/apps/control/main`;
each app is built and run independently via `nest build`/`nest start <app>`).
If you add containerization or CI, document it here and in the Makefile.

## Git Workflow

- Trunk-based on `main`, conventional-commit-ish messages (`feat(scope):`,
  `fix:`, `chore:`, `docs:`, `refactor:`) — check `git log --oneline` for the
  exact tone before writing one.
- No CI/PR template detected — confirm with the user before assuming a review process.

## Coding Rules

- Don't hardcode a second site's parsed-key shape into `result.mapper.ts`
  without first reading the mapper-coupling caveat above — it's a known,
  intentional limitation, not an oversight.
- Adapters are edited at runtime (DB), not by changing the `otakudesuAdapter`
  TS constant after first boot — that constant is seed-only.
- Keep `docs/infra/*.md` in sync with any change to stages, exchanges, engines, or entity schema — these docs are treated as authoritative elsewhere in this project.

## Testing Rules

- Jest colocated `*.spec.ts` under `apps/`/`libs/`. `test:e2e` is control-app-only (`apps/control/test/jest-e2e.json`).
- No project-specific testing framework beyond stock Jest/ts-jest — nothing exotic to learn here.

## Security Rules

- Dashboard is Basic-auth only (`DASH_USER`/`DASH_PASS`) — don't expose `:3001` publicly without a reverse proxy/stronger auth.
- `.env` is gitignored — never commit real `ANTHROPIC_API_KEY`/`OPENROUTER_API_KEY`/S3 credentials; `.env.example` holds placeholders only.
- README carries a legal disclaimer on web-crawling legality — don't add crawling behavior that ignores robots.txt/ToS without flagging it to the user first.

## AI Agent Instructions

- **End of every task:** run `pnpm run format && pnpm run lint && pnpm run build` (or `make format lint build`) and resolve every warning and error before considering the work done — don't leave warns unresolved even though ESLint won't fail the build on them.
- Before touching any app's behavior, read its `docs/infra/<app>.md` — they're current and detailed; don't rediscover message flow by grepping when it's already written down.
- `docs/todos/` and `docs/superpowers/` are gitignored local scratch — useful context if present, but don't assume they exist or are up to date for a fresh clone.
- Use `make help` to discover run/test/build aliases rather than re-deriving `pnpm run` script names from `package.json` each time.
- This repo has no Docker/CI — don't assume containerized dev workflows.

## Common Tasks

```bash
make up                          # boot full pipeline, correct order
make dashboard-dev                # dashboard only, watch mode
pnpm run test -- <pattern>         # run a subset of unit tests
```

- **Bump dependencies:** edit `package.json`, `pnpm install`, commit
  `package.json` + `pnpm-lock.yaml` (+ `pnpm-workspace.yaml` if catalog
  entries changed) together as one `chore:` commit.
- **Add/edit a site adapter:** don't edit code — use the dashboard's adapter
  CRUD (`/adapter`) or AI Pattern Finder (`/adapter/ai-pattern`); see
  `docs/infra/adapters.md`.

## Known Issues

- `result.mapper.ts` is otakudesu-shape-hardcoded — see mapper coupling caveat above. Multi-site output mapping is a known, separate future effort.
- No Docker/CI/deployment automation exists yet.

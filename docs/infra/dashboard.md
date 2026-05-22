# dashboard

**App:** `apps/dashboard` · **Run:** `pnpm run start:dashboard`

## What it does

The only **HTTP** app in the monorepo — an internal tool to browse, edit,
delete, and re-crawl the data that `result-store` persists to SQLite. Every
other app is a headless RabbitMQ microservice; this one serves server-rendered
Handlebars pages with [htmx](https://htmx.org) for inline edits.

It reads/writes the same SQLite file as `result-store` and publishes re-crawl
jobs onto the existing `anime.crawl` exchange, so a re-crawl flows through the
normal pipeline (`scraper-worker → result-sink → result-store`).

## Routes

```
GET    /                    stats dashboard (counts + coverage gaps)
GET    /anime?q=&page=      list: title search, paginate
GET    /anime/:id           detail: fields + genres + episodes
POST   /anime/:id           edit fields (inline htmx)
DELETE /anime/:id           delete (cascades anime_genre rows)
POST   /anime/:id/recrawl   publish detail job for anime.url
GET    /episode/:id         detail: fields + mirrors + downloads
POST   /episode/:id         edit
DELETE /episode/:id         delete (cascades mirrors by episodeUrl)
POST   /episode/:id/recrawl publish episode job for episode.url
```

## Auth

All routes are guarded by HTTP Basic auth (`BasicAuthMiddleware`,
`forRoutes('*')`). Credentials come from env `DASH_USER` / `DASH_PASS`
(both default to `admin` when unset). A missing/wrong credential returns `401`
with a `WWW-Authenticate: Basic` challenge.

## Database access

The dashboard opens its **own** TypeORM `better-sqlite3` connection to the file
at `SQLITE_PATH` (default `data/results.sqlite`), reusing the 6 entities now
shared from `@libs/commons/entities`. Two settings matter:

- `synchronize: false` — `result-store` owns the schema (it runs `synchronize`
  in development). The dashboard never alters the schema.
- WAL journal mode (`db.pragma('journal_mode = WAL')` via the driver's
  `prepareDatabase` hook) so the dashboard's reads/writes coexist with the
  worker/result-store writing concurrently.

## Re-crawl

Re-crawl reuses the existing `CrawlJobDto` contract on `EXCHANGES.crawl`
(`anime.crawl`):

- Anime: `{ source, stage: 'detail', url }`, routing key `crawl.detail.<source>`.
- Episode: `{ source, stage: 'episode', url }`, routing key `crawl.episode.<source>`.

These are the same messages `scraper-worker` already consumes — re-crawl just
re-injects a stage job for an existing URL.

## Inputs / outputs

- **Reads/writes:** the SQLite tables owned by `result-store`.
- **Publishes:** `crawl.detail.<source>` / `crawl.episode.<source>` to
  `anime.crawl` on re-crawl.

## Notes

- HTTP app (Express platform); listens on `DASH_PORT` (default `3001`).
- Views are served from source (`apps/dashboard/src/views`), not the webpack
  bundle, so no asset-copy wiring is needed.
- `pnpm build` (= `nest build`) only compiles the default project — it does
  **not** type-check the dashboard. Use `pnpm nest build dashboard` (or
  `start:dashboard`) to type-check this app.
- Inline edits go through a `ValidationPipe` (`transform` + `whitelist`) over
  per-field edit DTOs, so unknown fields are stripped.

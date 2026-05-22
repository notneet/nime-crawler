# Architecture

Multi-site anime crawler on a NestJS monorepo. Five headless RabbitMQ
microservices pass crawl work down a staged pipeline. No HTTP server.

## Stages

```
index → detail → episode
              └→ batch
```

A `SiteAdapter` config object declares, per stage, which engine to use and how
to discover the next stage's URLs. `otakudesu` is the reference adapter
(`libs/commons/src/adapters/otakudesu.adapter.ts`).

## Engines

- **xpath** — fetches the page over HTTP and evaluates XPath patterns
  (`@hanivanrizky/nestjs-xpath-parser`). Used for `index`, `detail`, `batch`.
- **browser** — drives a headless Chromium via a workflow
  (`@hanivanrizky/nestjs-browser-action`). Used for `episode` only.

Browser scrapes are serialized inside `EngineService` (the library shares one
mutable page), so episodes process one at a time per worker process.

## Exchanges (RabbitMQ, all `topic`)

| Constant          | Name               | Purpose                                  |
|-------------------|--------------------|------------------------------------------|
| `EXCHANGES.crawl` | `anime.crawl`      | Crawl jobs (one per stage/url)           |
| `EXCHANGES.parsed`| `anime.parsed`     | Internal parsed-page payloads            |
| `EXCHANGES.results`| `anime.results`   | **Public** final structured data         |
| `EXCHANGES.dlx`   | `anime.crawl.dlx`  | Dead-letter exchange for failed jobs     |

Routing keys are `<prefix>.<stage>.<source>`, e.g. `crawl.episode.otakudesu`.

## Message flow

```
scheduler/control ──crawl.*──▶ anime.crawl ──▶ scraper-worker
                                                   │
                  re-publish next-stage jobs ◀─────┤ (crawl.*)
                                                   │
                              parsed.* ────────────▶ anime.parsed ──▶ result-sink
                                                                          │
                                                       result.* ──────────▶ anime.results ──▶ result-store
                                                                                                  │
                                                                                                  ▼
                                                                                          SQLite (crawl_results)
```

## Where results are stored

`result-store` persists final structured data to a **SQLite** database via
TypeORM. `result-sink` publishes each item to the `anime.results` topic
exchange (routing key `result.<stage>.<source>`); `result-store` binds a durable
queue (`anime.results.store`, key `result.#`) to that exchange and upserts each
item into the `crawl_results` table, keyed on `(source, url, stage)`.

DB path comes from `SQLITE_PATH` (default `data/results.sqlite`); schema is
created on boot via TypeORM `synchronize` when `NODE_ENV=development` (use
migrations otherwise). See
[result-store](./result-store.md) for the table layout.

The split still holds: `anime.results` is a public topic exchange, so other
downstream consumers can bind their own queues alongside `result-store`. As with
any topic exchange, messages with no bound queue are dropped — `result-store`
must be running (queue declared) before a crawl publishes results.

## Per-app docs

- [scheduler](./scheduler.md) — cron seeder
- [scraper-worker](./scraper-worker.md) — parse worker
- [result-sink](./result-sink.md) — results publisher
- [result-store](./result-store.md) — SQLite persistence
- [control](./control.md) — on-demand trigger

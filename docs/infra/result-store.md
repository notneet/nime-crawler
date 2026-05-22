# result-store

**App:** `apps/result-store` · **Run:** `pnpm run start:store`

## What it does

The persistence consumer. It binds the **public** `anime.results` exchange and
writes every final structured item into a SQLite database via TypeORM. This is
the project's storage boundary — the sink only publishes; this app durably
saves.

Subscription:

```
exchange:    anime.results
routingKey:  result.#
queue:       anime.results.store   (durable, deadLetterExchange: anime.crawl.dlx)
```

Per message it upserts a row keyed on `(source, url, stage)`, so re-crawling a
page updates the existing row instead of duplicating it. A write failure →
`Nack(false)` (dead-letter, avoids infinite requeue).

## Inputs / outputs

- **Consumes:** `result.#` from `anime.results`.
- **Persists:** rows in the `crawl_results` table (SQLite).

## Where results are stored

A SQLite file, path from `SQLITE_PATH` (default `data/results.sqlite`).
TypeORM `synchronize` creates the schema on boot, but **only when
`NODE_ENV=development`**. In any other environment the schema is not
auto-managed — provision it with migrations.

Table `crawl_results`:

| Column      | Type         | Notes                                   |
|-------------|--------------|-----------------------------------------|
| `id`        | integer PK   | auto-increment                          |
| `source`    | text         | adapter source, e.g. `otakudesu`        |
| `stage`     | text         | `index` / `detail` / `episode` / `batch`|
| `url`       | text         | page URL                                |
| `data`      | json (text)  | the stage's `ParsedResultDto.data`      |
| `createdAt` | datetime     | row insert time                         |
| `updatedAt` | datetime     | last upsert time                        |

Unique index `uq_source_url_stage` on `(source, url, stage)` backs the upsert.

## Notes

- Headless RMQ microservice; no HTTP.
- The `data` payload shape differs per stage, so it is stored as a JSON column
  rather than typed columns.
- `synchronize` is gated to `NODE_ENV=development` (convenient for a local
  single-file SQLite store). For prod, use migrations for controlled upgrades.
- The DB file is gitignored (`/data`, `*.sqlite`).

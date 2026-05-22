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

Per message a `ResultMapper` turns the stage payload into normalized
entity rows, written inside a single transaction. Each write is an upsert on the
table's unique key, so re-crawling a page updates existing rows instead of
duplicating. A write failure → `Nack(false)` (dead-letter, avoids infinite
requeue).

## Inputs / outputs

- **Consumes:** `result.#` from `anime.results`.
- **Persists:** rows across the normalized tables below (SQLite).

## Where results are stored

A SQLite file, path from `SQLITE_PATH` (default `data/results.sqlite`).
TypeORM `synchronize` creates the schema on boot, but **only when
`NODE_ENV=development`**. In any other environment the schema is not
auto-managed — provision it with migrations.

Normalized tables (one mapper per stage fills them):

- **`anime`** (from `detail`) — `id` PK; `source`, `url`, `slug`; `title`,
  `titleJP`, `thumbnailUrl`, `type`, `status`, `score`, `duration`,
  `totalEpisodes`, `studio`, `producers`, `releaseDate`, `synopsis`; `raw`
  (json escape hatch); `createdAt`/`updatedAt`. Unique `uq_anime_source_url`
  on `(source, url)`.
- **`genre`** — `id` PK; `name`; `slug`. Unique `uq_genre_slug` on `(slug)`.
- **`anime_genre`** — composite PK `(animeId, genreId)`. Many-to-many join.
- **`episode`** (from `episode`) — `id` PK; `source`, `url`; `animeUrl` (loose
  link, resolved in the API layer); `number`, `title`, `streamUrl`,
  `streamFallback`, `postedBy`, `releaseInfo`; `raw`; timestamps. Unique
  `uq_episode_source_url` on `(source, url)`.
- **`mirror`** (from `episode`) — `id` PK; `episodeUrl`, `quality`, `host`
  (the mirror label), `payload` (`data-content`). Unique `uq_mirror` on
  `(episodeUrl, quality, host)`.
- **`download_link`** (from `episode` + `batch`) — `id` PK; `source`,
  `ownerUrl` (episode or batch page), `kind` (`episode`/`batch`), `quality`,
  `host` (label), `size`, `url`. Unique `uq_download` on `(url, ownerUrl, kind)`
  — `host` is nullable (episode downloads carry no label), so it is kept out of
  the unique key to preserve upsert idempotency (`NULL` never matches in SQLite).

`source`/`url` (and `*Url`) columns keep stages decoupled: nothing resolves a
cross-stage foreign key at write time; joins happen in the read/API layer.

## Notes

- Headless RMQ microservice; no HTTP.
- Stage payloads are normalized into typed tables; `anime` and `episode` keep a
  nullable `raw` JSON column as an escape hatch for un-modeled fields.
- `synchronize` is gated to `NODE_ENV=development` (convenient for a local
  single-file SQLite store). For prod, use migrations for controlled upgrades.
- The DB file is gitignored (`/data`, `*.sqlite`).

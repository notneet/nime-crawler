# downloader

**App:** `apps/downloader` · **Run:** `pnpm run start:downloader`

## What it does

Archives episode videos to S3-compatible object storage (MinIO). For each
episode it picks the **highest- and lowest-resolution** direct downloads and
streams them into a bucket, recording one `download_archive` row per quality.

Cut 1 covers direct downloads only (`download_link.kind = 'download'`). Mirror
embeds (yt-dlp extraction) are out of scope.

Subscription:

```
exchange:    anime.download
routingKey:  download.episode.*
queue:       anime.download.archive   (durable, deadLetterExchange: anime.crawl.dlx)
```

## Triggers

Two producers publish the same `DownloadJobDto` (`{ episodeId, source, manual? }`):

- **Auto** — `result-store` publishes after it persists an episode result that
  carried `≥1` download row.
- **Manual** — the dashboard `POST /episode/:id/archive` button publishes with
  `manual: true`.

## Selection

For an episode it loads `download_link WHERE ownerUrl = episode.url AND
kind = 'download'`, parses a numeric rank from each `quality` string
(`/(\d{3,4})\s*p?/i`, so `1080p → 1080`; unparseable qualities are dropped), and
keeps the max and min. One quality → archived once. Zero candidates → job is a
no-op (info log).

## Upload

`fetch(sourceUrl)` → `Readable.fromWeb` → `@aws-sdk/lib-storage` `Upload`
(multipart, `partSize` 8 MiB, `queueSize` 4). `ContentType` comes from the
response header (fallback `application/octet-stream`).

Object key scheme:

```
{source}/{animeSlug}/ep-{episodeNumber}-{quality}.{ext}
```

- `animeSlug` resolved via the `anime` table by `episode.animeUrl`; missing →
  `unknown-anime-{episodeId}`.
- `ext` derived from `Content-Type` (`video/mp4`→`mp4`,
  `application/x-mpegURL`→`m3u8`, `video/x-matroska`→`mkv`, `video/webm`→`webm`,
  else `bin`).

## State / idempotency

A `download_archive` row is keyed by `(episodeId, qualityRank)`:

- Before upload → upsert a `pending` row carrying `sourceUrl`.
- On success → `status = 'done'`, `s3Key`, `s3Bucket`, `sizeBytes`.
- On failure → `status = 'failed'`, `error`.

Re-running the same job overwrites the S3 object and the row (no leak). Per-
quality failures are isolated — a failing max does not block the min. A failed
job returns `Nack(false)` (dead-letter, no infinite requeue).

## Configuration (env)

```
S3_ENDPOINT          e.g. http://localhost:9000
S3_REGION            default us-east-1
S3_ACCESS_KEY        MinIO root user / access key
S3_SECRET_KEY        MinIO root password / secret key
S3_BUCKET            target bucket (must be pre-created)
S3_FORCE_PATH_STYLE  default true (required for MinIO)
```

The bucket is **not** auto-created — make it first, e.g.
`mc mb local/<bucket>` or via the MinIO console.

## Inputs / outputs

- **Consumes:** `download.episode.*` from `anime.download`.
- **Reads:** `episode`, `download_link`, `anime` (SQLite, shared with
  `result-store`).
- **Writes:** `download_archive` rows + objects in the S3 bucket.

## Notes

- Headless RMQ microservice; no HTTP.
- Reads the same SQLite file as `result-store` (`SQLITE_PATH`). It does not own
  the schema — `result-store` runs `synchronize` in development.
- `pnpm build` compiles only the default project; use `pnpm nest build downloader`
  to type-check this app.

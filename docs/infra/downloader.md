# downloader

**App:** `apps/downloader` · **Run:** `pnpm run start:downloader`

## What it does

Archives episode videos to S3-compatible object storage (MinIO). For each
episode it picks the **highest- and lowest-resolution** resolvable mirror and
streams the extracted video into a bucket, recording one `download_archive` row
per quality.

The episode's `download_link` rows are *not* the source — they redirect through
`link.desustream.com → desudrive → vidhidepro` and the `mirror` embeds are what
actually resolve to a fetchable video. The downloader hands the mirror's
`streamUrl` to **`yt-dlp`**, which extracts the direct media URL (e.g. the
`googlevideo.com` `<source>` inside a `desustream.info` embed) and streams it to
stdout.

Subscription:

```
exchange:    anime.download
routingKey:  download.episode.*
queue:       anime.download.archive   (durable, deadLetterExchange: anime.crawl.dlx)
```

## Triggers

Two producers publish the same `DownloadJobDto` (`{ episodeId, source, manual? }`):

- **Manual** — the dashboard `POST /episode/:id/archive` button (episode-detail
  page and the per-row Archive button on `/anime/:id/episodes`) publishes with
  `manual: true`. This is the default path.
- **Auto** — `result-store` publishes after it persists an episode result that
  carried `≥1` download row, **only when `DOWNLOADER_AUTO_TRIGGER=true`**. The
  flag defaults to `false`, so by default the downloader is decoupled from the
  crawl pipeline and runs manual-only.

## Selection

For an episode it loads `mirror WHERE episodeUrl = episode.url`, **keeps only
rows with a non-null `streamUrl`** (unresolved mirrors are skipped), parses a
numeric rank from each `quality` string (`/(\d{3,4})\s*p?/i`, so `720p → 720`;
unparseable qualities are dropped), and keeps the max and min rank. When only one
quality resolves it is archived once; zero resolvable mirrors → job is a no-op
(info log).

Within a rank, mirrors are sorted so **`desustream.info` hosts come first** —
those embed a direct `googlevideo` source that yt-dlp extracts most reliably, so
the preferred host wins the max/min pick. Other hosts (`odvidhide.com`,
`mega.nz`) are used only when no `desustream.info` mirror exists at that rank.

## Upload

For each pick the downloader spawns:

```
{YTDLP_BIN} --no-warnings --no-part --no-playlist -f "best[ext=mp4]/best" -o - {streamUrl}
```

and pipes the child's stdout into `@aws-sdk/lib-storage` `Upload` (multipart,
`partSize` 8 MiB, `queueSize` 4) with `ContentType: video/mp4`. The row is marked
`done` only after **both** the upload finishes and yt-dlp exits `0`; a non-zero
exit (or spawn error) propagates the stderr tail and fails the row.

Object key scheme (always `.mp4`):

```
{source}/{animeSlug}/ep-{episodeNumber}-{quality}.mp4
```

- `animeSlug` resolved via the `anime` table by `episode.animeUrl`; missing →
  `unknown-anime-{episodeId}`.
- `quality` is the normalized rank (e.g. `720p`).

## State / idempotency

A `download_archive` row is keyed by `(episodeId, qualityRank)`:

- Before upload → upsert a `pending` row carrying `sourceUrl` (the mirror's
  `streamUrl`).
- On success → `status = 'done'`, `s3Key`, `s3Bucket`, `sizeBytes`.
- On failure → `status = 'failed'`, `error`.

Re-running the same job overwrites the S3 object and the row (no leak). Per-
quality failures are isolated — a failing max does not block the min. The job
only fails (and retries) if it archived **nothing**; a partial success is acked.

## Bounded delayed retry

A job that archives nothing throws, and the consumer dead-letters it for a
bounded, delayed retry instead of dropping it:

```
anime.download.archive --Nack(false)--> anime.crawl.dlx (RK download.episode.*)
        ▲                                        │
        │                                        ▼
anime.download <--expire(TTL)-- anime.download.retry (messageTtl, DLX=anime.download)
```

- The main queue dead-letters to the shared `anime.crawl.dlx`. `anime.download.retry`
  binds it on `download.episode.*` (the original RK is preserved, so only download
  jobs are caught), holds the message for `DOWNLOAD_RETRY_DELAY_MS`, then
  dead-letters it back to `anime.download` → the main queue. One cycle = one retry.
- The consumer counts the `x-death` `rejected` entry. After `DOWNLOAD_MAX_RETRIES`
  it stops cycling: it publishes the job to the durable `anime.download.failed`
  queue (RK `download.failed`) and acks. The job is parked, not lost — and the
  `download_archive` row is still `failed` for the dashboard to re-trigger.

## Configuration (env)

```
S3_ENDPOINT              e.g. http://localhost:9000
S3_REGION                default us-east-1
S3_ACCESS_KEY            MinIO root user / access key
S3_SECRET_KEY            MinIO root password / secret key
S3_BUCKET                target bucket (must be pre-created)
S3_FORCE_PATH_STYLE      default true (required for MinIO)
YTDLP_BIN                path to the yt-dlp binary (default "yt-dlp" on PATH)
DOWNLOAD_MAX_RETRIES     retry attempts before parking (default 3)
DOWNLOAD_RETRY_DELAY_MS  delay between retries, in ms (default 30000)
```

`YTDLP_BIN` defaults to `yt-dlp` (resolved on `PATH`); a vendored binary lives at
`resoureces/yt-dlp`. `yt-dlp` needs Python 3.10+, and **ffmpeg on `PATH`** for
hosts whose formats require muxing.

`DOWNLOADER_AUTO_TRIGGER` (read by `result-store`, default `false`) gates the
auto-publish from the crawl pipeline. Leave it off to keep the downloader
manual-only; set `true` to archive automatically after each episode persist.

The bucket is **not** auto-created — make it first, e.g.
`mc mb local/<bucket>` or via the MinIO console.

## Inputs / outputs

- **Consumes:** `download.episode.*` from `anime.download`.
- **Reads:** `episode`, `mirror`, `anime` (SQLite, shared with `result-store`).
- **Writes:** `download_archive` rows + objects in the S3 bucket.

## Notes

- Headless RMQ microservice; no HTTP.
- Requires the `yt-dlp` binary (+ ffmpeg) available to the process.
- Reads the same SQLite file as `result-store` (`SQLITE_PATH`). It does not own
  the schema — `result-store` runs `synchronize` in development.
- `pnpm build` compiles only the default project; use `pnpm nest build downloader`
  to type-check this app.

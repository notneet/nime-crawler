# scraper-worker

**App:** `apps/scraper-worker` · **Run:** `pnpm run start:worker`

## What it does

The parse worker — the core of the pipeline. It consumes every crawl job,
parses the page with the stage's engine, recursively re-publishes next-stage
jobs, and emits the parsed payload.

Subscription:

```
exchange:    anime.crawl
routingKey:  crawl.#
queue:       anime.crawl.worker   (durable, deadLetterExchange: anime.crawl.dlx)
```

Per job:

1. Look up the site adapter + stage config. Missing config → `Nack(false)`
   (dead-letter, no requeue).
2. **Freshness skip-check** (`detail`/`episode` only). If a row already exists for
   `(source, url)` and was updated within `SKIP_FRESH_HOURS`, skip the fetch and
   ack — no parse, no next-stage jobs, no parsed payload. Jobs with `force: true`
   (manual dashboard re-crawls) bypass this. Set `SKIP_FRESH_HOURS=0` to disable.
   The check reads SQLite directly (`synchronize: false`; result-store owns the
   schema) and fails open — any lookup error falls through to a normal fetch.
3. Parse via `EngineService`:
   - `xpath` stages → HTTP fetch + XPath (`index`, `detail`, `batch`).
   - `browser` stages → headless Chromium workflow (`episode`), serialized.
4. Discover next-stage URLs from the parsed data (`discover` rules) and publish
   a `crawl.<nextStage>.<source>` job per URL back to `anime.crawl`.
5. Publish the parsed payload as `parsed.<stage>.<source>` to `anime.parsed`.
6. Any parse/engine error → `Nack(false)` (dead-letter).

## Inputs / outputs

- **Consumes:** `crawl.#` from `anime.crawl`.
- **Publishes:** next-stage jobs → `anime.crawl`; parsed payloads → `anime.parsed`.

## Where results are stored

Nowhere on disk. Parsed payloads are published to `anime.parsed` for the
result-sink to forward. See
[architecture](./architecture.md#where-results-are-stored).

## Notes

- **Scale this app** — run multiple instances for throughput. Each instance has
  its own browser pool and serializes its own episode scrapes; xpath stages run
  concurrently.
- `app.enableShutdownHooks()` is set so the browser pool cleans up on Ctrl+C.
- Failed jobs land in `anime.crawl.dlx` for inspection/replay.
- **Skip caveat:** skipping a fresh `detail` page also skips re-discovering that
  anime's episode jobs (no parse → no `discover`). That is intended — a fresh
  detail implies its episodes were already enqueued on the prior crawl. To force a
  full re-walk, lower/zero `SKIP_FRESH_HOURS` or use the dashboard re-crawl
  (`force: true`). `index` and `batch` stages are never skipped.

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
2. Parse via `EngineService`:
   - `xpath` stages → HTTP fetch + XPath (`index`, `detail`, `batch`).
   - `browser` stages → headless Chromium workflow (`episode`), serialized.
3. Discover next-stage URLs from the parsed data (`discover` rules) and publish
   a `crawl.<nextStage>.<source>` job per URL back to `anime.crawl`.
4. Publish the parsed payload as `parsed.<stage>.<source>` to `anime.parsed`.
5. Any parse/engine error → `Nack(false)` (dead-letter).

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

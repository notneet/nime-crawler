# scheduler

**App:** `apps/scheduler` · **Run:** `pnpm run start:scheduler`

## What it does

The cron seeder. It kicks off crawls by publishing one `index` job per enabled
site into the `anime.crawl` exchange.

- On startup (`OnApplicationBootstrap`) it seeds immediately.
- Then re-seeds every 30 minutes (`@Cron(EVERY_30_MINUTES)`).

For each enabled site in the `SiteRegistry` it publishes:

```
exchange:    anime.crawl
routingKey:  crawl.index.<source>
payload:     { source, stage: 'index', url: '<baseUrl>/' }
```

## Inputs / outputs

- **Consumes:** nothing (timer-driven).
- **Publishes:** `index` crawl jobs → `anime.crawl`.

## Where results are stored

None directly. It only emits jobs; the pipeline produces results downstream.
See [architecture](./architecture.md#where-results-are-stored).

## Notes

- Runs as an application context (no HTTP, no RMQ consumer).
- Scale: run a single instance — multiple schedulers would duplicate seed jobs.

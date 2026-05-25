## Description

Multi-site anime crawler on a NestJS monorepo. A cron seeder publishes crawl jobs
to a RabbitMQ topic exchange; a worker parses pages (XPath or headless browser) and
recursively re-publishes next-stage jobs; a sink publishes final structured data to
a public results exchange. Sites are declarative `SiteAdapter` config objects
(otakudesu is the reference). All apps are headless RMQ microservices — no HTTP.

## Running the crawler

Start RabbitMQ, copy `.env.example` to `.env`, then run each app.

**Startup order matters.** The crawl/parsed exchanges are RabbitMQ topic
exchanges, which silently drop messages that have no bound queue. Start the
consumers first so their durable queues are declared and bound before any
producer publishes:

```bash
pnpm run start:worker     # 1. scraper-worker — binds anime.crawl.worker (scale this one)
pnpm run start:sink       # 2. result-sink    — binds anime.parsed.sink
pnpm run start:store      # 3. result-store   — binds anime.results.store, writes SQLite
pnpm run start:control    # 4. control        — control plane (crawl.trigger)
pnpm run start:downloader # 5. downloader     — binds anime.download.archive, archives videos to S3/MinIO
pnpm run start:scheduler  # 6. scheduler      — cron seeder, starts publishing jobs
```

The downloader needs an S3-compatible target (MinIO) — set the `S3_*` vars in
`.env` and pre-create the bucket (`mc mb local/<bucket>`). See
[downloader](./docs/infra/downloader.md).

Bring the scheduler up last; once it runs (or you emit `crawl.trigger`), index
jobs flow into the already-bound worker queue. Queues are durable, so a
consumer that restarts later still drains anything published while it was down —
only messages published *before a queue ever existed* are lost.

The HTTP dashboard is independent of the pipeline and can run any time:

```bash
DASH_USER=admin DASH_PASS=admin pnpm run start:dashboard  # HTTP UI on :3001
```

## Architecture & per-app docs

See [`docs/infra/`](./docs/infra/) for the full breakdown:

- [architecture](./docs/infra/architecture.md) — overview, exchanges, where results are stored
- [scheduler](./docs/infra/scheduler.md) — cron seeder
- [scraper-worker](./docs/infra/scraper-worker.md) — parse worker
- [result-sink](./docs/infra/result-sink.md) — results publisher
- [result-store](./docs/infra/result-store.md) — SQLite persistence
- [control](./docs/infra/control.md) — on-demand trigger
- [downloader](./docs/infra/downloader.md) — archives episode videos to S3/MinIO
- [dashboard](./docs/infra/dashboard.md) — HTTP UI to browse/edit/re-crawl stored data

## Project setup

```bash
$ pnpm install
```

## Compile and run the project

```bash
# development
$ pnpm run start

# watch mode
$ pnpm run start:dev

# production mode
$ pnpm run start:prod
```

## Run tests

```bash
# unit tests
$ pnpm run test

# e2e tests
$ pnpm run test:e2e

# test coverage
$ pnpm run test:cov
```

## Preview

<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/38c9ccbb-7aba-46f4-9950-fea07ca26e7f" />
<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/67f9a565-52a1-456b-afd1-03ebcaefd09c" />
<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/72f2b61d-3b33-4c00-a58f-6fa1ee50c911" />
<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/37ec1cc6-708b-4117-ac9e-bc9e55a5f1d4" />

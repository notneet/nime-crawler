# control

**App:** `apps/control` (project name `control`) · **Run:** `pnpm run start:control`

## What it does

The control plane. It lets you trigger a crawl on demand (instead of waiting
for the scheduler's cron) by emitting a `crawl.trigger` event.

It's a `@nestjs/microservices` RMQ consumer listening on queue `anime.control`:

```
@EventPattern('crawl.trigger')
payload: { source: string }   // validated by ValidationPipe
```

On receipt it looks up the site in `SiteRegistry` and publishes an `index` job
(same shape the scheduler emits):

```
exchange:    anime.crawl
routingKey:  crawl.index.<source>
payload:     { source, stage: 'index', url: '<baseUrl>/' }
```

Unknown source → `SiteRegistry.getOrThrow` throws.

## Triggering it

Send a `crawl.trigger` message to the `anime.control` queue with payload
`{ "source": "otakudesu" }` (e.g. via another microservice client or the RMQ
management UI).

## Inputs / outputs

- **Consumes:** `crawl.trigger` on queue `anime.control`.
- **Publishes:** `index` crawl job → `anime.crawl`.

## Where results are stored

None directly — it only seeds jobs, like the scheduler. See
[architecture](./architecture.md#where-results-are-stored).

## Notes

- Uses the `@nestjs/microservices` transport (Transport.RMQ) for the trigger,
  while the rest of the pipeline uses `@golevelup/nestjs-rabbitmq`. This hybrid
  is intentional: the trigger is a request-style RPC, the pipeline is pub/sub.

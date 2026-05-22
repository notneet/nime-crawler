# result-sink

**App:** `apps/result-sink` · **Run:** `pnpm run start:sink`

## What it does

The results publisher. It consumes internal parsed payloads and forwards them
to the **public** results exchange, which is the project's output boundary.

Subscription:

```
exchange:    anime.parsed
routingKey:  parsed.#
queue:       anime.parsed.sink   (durable, deadLetterExchange: anime.crawl.dlx)
```

Per message it re-publishes to:

```
exchange:    anime.results
routingKey:  result.<stage>.<source>
payload:     the ParsedResultDto { source, stage, url, data }
```

A publish failure → `Nack(false)` (dead-letter, avoids infinite requeue).

## Inputs / outputs

- **Consumes:** `parsed.#` from `anime.parsed`.
- **Publishes:** `result.<stage>.<source>` → `anime.results`.

## Where results are stored

This app **does not persist** — it publishes to the `anime.results` topic
exchange. Persistence is [result-store](./result-store.md)'s job: it binds a
durable queue to `anime.results` (`result.#`) and writes to SQLite. Nothing
bound to `anime.results` = results dropped. See
[architecture](./architecture.md#where-results-are-stored).

## Notes

- Headless RMQ microservice; no HTTP.
- Splitting `anime.parsed` (internal) from `anime.results` (public) lets you
  reshape/enrich payloads here later without touching the worker.

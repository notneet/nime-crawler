# adapters

Site adapters are the per-source crawl config: base URL, enabled flag, and a
per-stage workflow (`stages`). They are **DB rows**, not code — editable at
runtime from the [dashboard](./dashboard.md).

## Entity (`adapter` table)

| Column      | Type        | Notes                                          |
|-------------|-------------|------------------------------------------------|
| `id`        | PK int      | autoincrement                                  |
| `source`    | varchar     | **unique** — the source key (e.g. `otakudesu`) |
| `baseUrl`   | varchar     | site base URL                                  |
| `enabled`   | boolean     | default true                                   |
| `stages`    | simple-json | `Partial<Record<Stage, StageConfig>>`          |
| `createdAt` | datetime    | `@CreateDateColumn`                            |
| `updatedAt` | datetime    | `@UpdateDateColumn`                            |

`StageConfig` reuses the existing shape from
`libs/commons/src/adapters/site-adapter.types.ts` (`engine: 'xpath'|'browser'`,
plus `patterns`/`workflow`/`discover`/`collect`). No new type is introduced.

## Source of truth + seeding

The DB is authoritative. `result-store` owns the schema (it runs `synchronize`
in development) and **seeds** otakudesu once on first boot: if the `adapter`
table is empty it inserts `otakudesuAdapter` (the TS constant in
`libs/commons/src/adapters/otakudesu.adapter.ts`), otherwise it does nothing. The
seed never overwrites an existing row — after the first boot, edits made in the
dashboard are the truth and the constant survives only as the seed payload.

Other apps open `synchronize: false` connections with just the `Adapter` entity:
`scheduler`, `control`, and `dashboard` read adapters via `AdapterService`
(`get` / `getOrThrow` / `enabledAdapters`); the worker holds no DB adapter
connection at all.

## Snapshot-in-job flow

When a crawl is triggered (scheduler tick, control trigger, dashboard re-crawl),
the trigger reads the current adapter from the DB and embeds the **full snapshot**
into the job (`job.adapter`). The worker uses that snapshot and threads it into
every discovered next-stage job, so one consistent snapshot flows through
detail→episode→batch. An edit made mid-cascade only affects the **next** trigger
cycle. A missing/invalid `job.adapter` or missing stage config dead-letters
(`Nack(false)`).

## Editing

The dashboard exposes full CRUD (`/adapter`). `baseUrl` and `enabled` are plain
fields; `stages` is edited as a raw JSON textarea, validated on save (stage keys,
engine, and the per-engine required shape). `source` is read-only on edit; a
duplicate `source` on create is rejected.

## ⚠️ Mapper coupling caveat

This feature makes adapters **editable** and supports **new** adapters that emit
the **same parsed-key contract** as otakudesu. It does **not** yet make the
crawler truly multi-site, because `apps/result-store/src/result.mapper.ts` is
hardcoded to otakudesu's parsed-key shape (`mirror720Payload`, `kategoz`, the
`episode-(\d+)` number extraction, the 360/480/720 mirror split). An adapter for
a site whose parsed keys differ will crawl and parse fine, but its output will
**not map into the entity tables correctly** until the mapper is made
source-aware — a separate effort. Editing otakudesu (selectors, URLs, enable,
workflow) and creating same-shape adapters work fully.

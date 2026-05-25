<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

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

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ pnpm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).

.DEFAULT_GOAL := help

.PHONY: help install build format lint test test-watch test-cov test-e2e \
	start start-dev start-debug start-prod \
	worker sink store control dashboard downloader scheduler \
	worker-dev sink-dev store-dev control-dev dashboard-dev downloader-dev scheduler-dev \
	up clean

help: ## Show this help
	@grep -hE '^[a-zA-Z0-9_-]+:.*##' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*##"}; {printf "  \033[36m%-16s\033[0m %s\n", $$1, $$2}'

install: ## pnpm install
	pnpm install

build: ## nest build
	pnpm run build

format: ## prettier --write
	pnpm run format

lint: ## eslint --fix
	pnpm run lint

test: ## unit tests
	pnpm run test

test-watch: ## unit tests, watch mode
	pnpm run test:watch

test-cov: ## unit tests with coverage
	pnpm run test:cov

test-e2e: ## e2e tests
	pnpm run test:e2e

start: ## nest start (default app)
	pnpm run start

start-dev: ## nest start, watch mode (default app)
	pnpm run start:dev

start-debug: ## nest start --debug, watch mode
	pnpm run start:debug

start-prod: ## node dist/apps/control/main
	pnpm run start:prod

# Individual services, prod mode
worker: ## start scraper-worker
	pnpm run start:worker

sink: ## start result-sink
	pnpm run start:sink

store: ## start result-store
	pnpm run start:store

control: ## start control
	pnpm run start:control

dashboard: ## start dashboard (HTTP UI, :3001)
	pnpm run start:dashboard

downloader: ## start downloader
	pnpm run start:downloader

scheduler: ## start scheduler (cron seeder)
	pnpm run start:scheduler

# Individual services, watch mode
worker-dev: ## start scraper-worker, watch mode
	pnpm run start:worker:dev

sink-dev: ## start result-sink, watch mode
	pnpm run start:sink:dev

store-dev: ## start result-store, watch mode
	pnpm run start:store:dev

control-dev: ## start control, watch mode
	pnpm run start:control:dev

dashboard-dev: ## start dashboard, watch mode
	pnpm run start:dashboard:dev

downloader-dev: ## start downloader, watch mode
	pnpm run start:downloader:dev

scheduler-dev: ## start scheduler, watch mode
	pnpm run start:scheduler:dev

up: ## bring the whole pipeline up in the required startup order (see README)
	pnpm run start:worker &
	pnpm run start:sink &
	pnpm run start:store &
	pnpm run start:control &
	pnpm run start:downloader &
	pnpm run start:scheduler &
	wait

clean: ## remove build/test artifacts
	rm -rf dist coverage

# NIME Crawler Development Makefile
# 
# Microservice Development Commands
# ===================================

.PHONY: help install build start clean test lint format

# Default target
help:
	@echo "🎯 NIME Crawler Development Commands"
	@echo ""
	@echo "📦 Setup & Dependencies:"
	@echo "  make install          - Install all dependencies"
	@echo "  make build            - Build all services"
	@echo "  make clean            - Clean build artifacts"
	@echo ""
	@echo "🚀 Service Development:"
	@echo "  make start-crawler    - Start crawler microservice (consumer mode)"
	@echo "  make start-api        - Start API gateway service"
	@echo "  make start-scheduler  - Start scheduler service"
	@echo "  make start-analytics  - Start analytics service"
	@echo "  make start-mailer     - Start mailer service"
	@echo "  make start-notification - Start notification service"
	@echo "  make start-link-checker - Start link checker service"
	@echo ""
	@echo "🔄 Queue Operations:"
	@echo "  make crawler-producer - Test crawler job producer"
	@echo "  make crawler-consumer - Start crawler consumer only"
	@echo "  make queue-health     - Check RabbitMQ queue health"
	@echo ""
	@echo "🗄️  Database Operations:"
	@echo "  make migration-generate ARGS=\"MigrationName\""
	@echo "  make migration-run    - Run pending migrations"
	@echo "  make migration-revert - Revert last migration"
	@echo "  make seed             - Run database seeders"
	@echo ""
	@echo "🧪 Testing & Quality:"
	@echo "  make test             - Run all tests"
	@echo "  make test-unit        - Run unit tests only"
	@echo "  make test-e2e         - Run e2e tests"
	@echo "  make test-coverage    - Run tests with coverage"
	@echo "  make lint             - Run linter"
	@echo "  make format           - Format code"
	@echo ""
	@echo "🐳 Docker Operations:"
	@echo "  make docker-up        - Start all infrastructure (MySQL, Redis, RabbitMQ)"
	@echo "  make docker-down      - Stop all containers"
	@echo "  make docker-logs      - Show container logs"
	@echo "  make docker-clean     - Clean Docker resources"
	@echo ""

# ===================================
# Setup & Dependencies
# ===================================

install:
	@echo "📦 Installing dependencies..."
	yarn install

build:
	@echo "🔨 Building all services..."
	yarn build

clean:
	@echo "🧹 Cleaning build artifacts..."
	rm -rf dist/
	rm -rf node_modules/.cache/
	rm -rf coverage/

# ===================================
# Service Development
# ===================================

start-crawler:
	@echo "🕷️  Starting Crawler Microservice (Consumer Mode)..."
	yarn start:dev crawler

start-api:
	@echo "🌐 Starting API Gateway..."
	yarn start:dev api-gateway

start-scheduler:
	@echo "⏰ Starting Scheduler Service..."
	yarn start:dev scheduler

start-analytics:
	@echo "📊 Starting Analytics Service..."
	yarn start:dev analytics

start-mailer:
	@echo "📧 Starting Mailer Service..."
	yarn start:dev mailer

start-notification:
	@echo "🔔 Starting Notification Service..."
	yarn start:dev notification

start-link-checker:
	@echo "🔗 Starting Link Checker Service..."
	yarn start:dev link-checker

# ===================================
# Queue Operations
# ===================================

crawler-producer:
	@echo "🎯 Testing Crawler Job Producer..."
	@echo "This will schedule a test crawl job..."
	node -e "console.log('🚧 Producer test script not implemented yet. Use the API Gateway to schedule jobs.')"

crawler-consumer:
	@echo "👂 Starting Crawler Consumer Only..."
	yarn start:dev crawler

queue-health:
	@echo "🏥 Checking RabbitMQ Queue Health..."
	@curl -s http://guest:guest@localhost:15672/api/queues | jq '.[].name' || echo "❌ RabbitMQ not accessible. Make sure it's running with 'make docker-up'"

# ===================================
# Database Operations
# ===================================

migration-generate:
	@echo "📝 Generating migration: $(ARGS)"
	yarn typeorm:migration:generate libs/database/src/migrations/$(ARGS)

migration-run:
	@echo "🏃 Running pending migrations..."
	yarn typeorm:migration:run

migration-revert:
	@echo "⏪ Reverting last migration..."
	yarn typeorm:migration:revert

seed:
	@echo "🌱 Running database seeders..."
	yarn seed

# ===================================
# Testing & Quality
# ===================================

test:
	@echo "🧪 Running all tests..."
	yarn test

test-unit:
	@echo "🎯 Running unit tests..."
	yarn test

test-e2e:
	@echo "🔄 Running e2e tests..."
	yarn test:e2e

test-coverage:
	@echo "📊 Running tests with coverage..."
	yarn test:cov

lint:
	@echo "🔍 Running linter..."
	yarn lint

format:
	@echo "✨ Formatting code..."
	yarn format

# ===================================
# Docker Operations
# ===================================

docker-up:
	@echo "🐳 Starting infrastructure containers..."
	docker-compose up -d mysql redis rabbitmq

docker-down:
	@echo "🛑 Stopping all containers..."
	docker-compose down

docker-logs:
	@echo "📜 Showing container logs..."
	docker-compose logs -f

docker-clean:
	@echo "🧹 Cleaning Docker resources..."
	docker-compose down -v
	docker system prune -f

# ===================================
# Development Workflows
# ===================================

dev-setup: install docker-up migration-run seed
	@echo "🎉 Development environment ready!"
	@echo ""
	@echo "Next steps:"
	@echo "1. make start-crawler    # Start the crawler microservice"
	@echo "2. make start-api        # Start the API gateway"
	@echo "3. Open http://localhost:15672 for RabbitMQ management"

dev-reset: docker-down docker-clean docker-up migration-run seed
	@echo "🔄 Development environment reset complete!"

# ===================================
# Microservice Testing
# ===================================

test-crawler:
	@echo "🕷️  Testing Crawler Service..."
	yarn test --testPathPattern=apps/crawler

test-api:
	@echo "🌐 Testing API Gateway..."
	yarn test --testPathPattern=apps/api-gateway

test-scheduler:
	@echo "⏰ Testing Scheduler Service..."
	yarn test --testPathPattern=apps/scheduler

# ===================================
# Production Helpers
# ===================================

prod-build:
	@echo "🏭 Building for production..."
	yarn build
	@echo "✅ Production build complete!"

prod-start:
	@echo "🚀 Starting in production mode..."
	yarn start:prod 
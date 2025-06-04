# TypeORM migration aliases
#
# Usage:
#   make migration-generate ARGS="libs/database/src/migrations/YourMigrationName"
#     (Do NOT use -n or --name. Just provide the path with the migration name. TypeORM will append a timestamp and .ts)
#   make migration-run
#   make migration-revert

migration-generate:
	npm run typeorm:migration:generate -- $(ARGS)

migration-run:
	npm run typeorm:migration:run

migration-revert:
	npm run typeorm:migration:revert 
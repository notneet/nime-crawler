ifeq ($(OS), Windows_NT)
	SHELL := powershell.exe
	.SHELLFLAGS := -NoProfile -Command
	SHELL_VERSION = $(shell (Get-Host | Select-Object Version | Format-Table -HideTableHeaders | Out-String).Trim())
	OS = $(shell "{0} {1}" -f "windows", (Get-ComputerInfo -Property OsVersion, OsArchitecture | Format-Table -HideTableHeaders | Out-String).Trim())
	HELP_CMD = Select-String "^[a-zA-Z_-]+:.*?\#\# .*$$" "./Makefile" | Foreach-Object { $$_data = $$_.matches -split ":.*?\#\# "; $$obj = New-Object PSCustomObject; Add-Member -InputObject $$obj -NotePropertyName ('Command') -NotePropertyValue $$_data[0]; Add-Member -InputObject $$obj -NotePropertyName ('Description') -NotePropertyValue $$_data[1]; $$obj } | Format-Table -HideTableHeaders @{Expression={ $$e = [char]27; "$$e[36m$$($$_.Command)$${e}[0m" }}, Description
	RM_F_CMD = Remove-Item -erroraction silentlycontinue -Force
	RM_RF_CMD = ${RM_F_CMD} -Recurse
else
	SHELL := bash
	SHELL_VERSION = $(shell echo $$BASH_VERSION)
	UNAME := $(shell uname -s)
	VERSION_AND_ARCH = $(shell uname -rm)
	ifeq ($(UNAME),Darwin)
		OS = macos ${VERSION_AND_ARCH}
	else ifeq ($(UNAME),Linux)
		OS = linux ${VERSION_AND_ARCH}
	else
		$(error OS not supported by this Makefile)
	endif
	HELP_CMD = grep -E '^[a-zA-Z_-]+:.*?\#\# .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?\#\# "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'
	RM_F_CMD = rm -f
	RM_RF_CMD = ${RM_F_CMD} -r
endif

.DEFAULT_GOAL := help
.PHONY: help build_all generate_migration apply_migration run_cron_interval run_read_index run_read_detail run_read_link run_read_episode

generate_migration: ## Generate migration
	@clear

	@if [ -z "$1" ]; then \
		yarn typeorm migration:generate ./db/migrations/Migration_$(date +%s).ts -d ./db/datasource/anime_data.datasource.ts; \
	else \
		yarn typeorm migration:generate ./db/migrations/$1 -d ./db/datasource/anime_data.datasource.ts; \
	fi

apply_migration: ## Apply uncommitted migrations
	@clear
	
	@yarn typeorm migration:run -d ./db/datasource/anime_data.datasource.ts

build_all: ## Build all services
	@clear
	@date +%s > .start_time
	
	@echo -e "\033[32m>> Building pattern-dashboard...\033[0m"
	@yarn build pattern-dashboard > /dev/null

	@echo -e "\033[32m>> Building cron-interval...\033[0m"
	@yarn build cron-interval > /dev/null

	@echo -e "\033[32m>> Building read-index...\033[0m"
	@yarn build read-index > /dev/null

	@echo -e "\033[32m>> Building read-detail...\033[0m"
	@yarn build read-detail > /dev/null

	@echo -e "\033[32m>> Building read-link...\033[0m"
	@yarn build read-link > /dev/null

	@echo -e "\033[32m>> Building read-episode...\033[0m"
	@yarn build read-episode > /dev/null

	@echo -e "\033[32m>> All services successfully built!!\033[0m"
	@echo -e "\033[35m>> Elapsed time: $$(expr $$(date +%s) - $$(cat .start_time)) seconds\033[0m"
	@rm .start_time

run_cron_interval:
	@clear

	@yarn start:dev cron-interval

run_read_index:
	@clear

	@yarn start:dev read-index

run_read_detail:
	@clear

	@yarn start:dev read-detail

run_read_link:
	@clear

	@yarn start:dev read-link

run_read_episode:
	@clear

	@yarn start:dev read-episode

help: ## Show this help
	@${HELP_CMD}
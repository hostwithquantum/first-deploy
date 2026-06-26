RUNWAY_APP ?= test-app
PORT ?= 3000

.PHONY: test lint format build run-dev run-dev-docker

test:
	node --test

lint:
	node --check server.js
	node --check server.test.js
	npm run format:check

format:
	npm run format

build:
	docker build -t first-deploy .

run-dev:
	RUNWAY_APP="$(RUNWAY_APP)" PORT="$(PORT)" \
		node --watch --watch-path . server.js

run-dev-docker: build
	docker run --rm --name first-deploy \
		-e "RUNWAY_APP=$(RUNWAY_APP)" \
		-e "PORT=$(PORT)" \
		-p $(PORT):$(PORT) \
		first-deploy
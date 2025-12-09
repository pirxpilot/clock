PROJECT=clock
NODE_BIN=./node_modules/.bin
SRC = $(wildcard lib/*.js)
CSS = lib/clock.css

all: check compile

check: lint test

compile: build/build.js build/build.css

build:
	mkdir -p $@

build/build.css: $(CSS) | build
	cat $^ > $@

build/build.js: $(SRC) | build
	$(NODE_BIN)/esbuild \
		--bundle \
		--global-name=clock \
		--outfile=$@ \
		lib/clock.js

lint:
	$(NODE_BIN)/biome ci

format:
	$(NODE_BIN)/biome check --fix

test:
	node --test $(TEST_OPTS)

test-cov: TEST_OPTS := --experimental-test-coverage
test-cov: test


clean:
	rm -fr build

.PHONY: clean lint format check all compile test test-cov

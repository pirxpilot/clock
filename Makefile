PROJECT=clock
NODE_BIN=./node_modules/.bin
SRC = index.js $(wildcard lib/*.js)
CSS = lib/clock.css

all: check compile

check: lint test

compile: build/build.js build/build.css

build:
	mkdir -p $@

build/build.css: $(CSS) | build
	cat $^ > $@

build/build.js: node_modules $(SRC) | build
	$(NODE_BIN)/browserify --require ./index.js:$(PROJECT) --outfile $@

.DELETE_ON_ERROR: build/build.js

node_modules: package.json
	yarn && touch $@

lint: | node_modules
	$(NODE_BIN)/jshint $(SRC) test

test: | node_modules
	$(NODE_BIN)/mocha --reporter spec

clean:
	rm -fr build node_modules

.PHONY: clean lint check all compile test

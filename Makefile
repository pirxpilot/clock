PROJECT=clock
SRC=index.js lib/clock.js
BIN=./node_modules/.bin

all: check compile

check: lint test

lint: node_modules
	$(BIN)/jshint $(SRC)

test: node_modules
	$(BIN)/mocha --reporter spec

compile: build/build.js build/build.css

build:
	mkdir -p $@

build/build.js: node_modules index.js | build
	$(BIN)/browserify --require ./index.js:$(PROJECT) --outfile $@

.DELETE_ON_ERROR: build/build.js

build/build.css: lib/clock.css | build
	cp $< $@

node_modules: package.json
	npm install

clean:
	rm -fr build node_modules

.PHONY: clean test lint check all

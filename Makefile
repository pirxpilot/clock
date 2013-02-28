SRC=index.js lib/clock.js

all: lint test build

build: components lib/clock.css $(SRC)
	@component build --dev

components: component.json
	@component install --dev

lint:
	@./node_modules/.bin/jshint $(SRC)

test:
	@./node_modules/.bin/mocha \
		--reporter spec

clean:
	rm -fr build components template.js

.PHONY: clean test lint

SRC=index.js lib/clock.js

all: lint build

build: components lib/clock.css $(SRC)
	@component build --dev

components: component.json
	@component install --dev

lint:
	@jshint $(SRC)

clean:
	rm -fr build components template.js

.PHONY: clean lint

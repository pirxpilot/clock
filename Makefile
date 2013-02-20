SRC=index.js

build: components clock.css template.js $(SRC)
	@component build --dev

template.js: template.html
	@component convert $<

components: component.json
	@component install --dev

lint:
	@jshint $(SRC)

clean:
	rm -fr build components template.js

.PHONY: clean lint

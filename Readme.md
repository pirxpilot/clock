[![NPM version][npm-image]][npm-url]
[![Build Status][travis-image]][travis-url]
[![Dependency Status][deps-image]][deps-url]
[![Dev Dependency Status][deps-dev-image]][deps-dev-url]


# clock

  Clock UI component for use in time-picker

  ![Clock](https://gist.github.com/pirxpilot/5011178/raw/9da0b4c2194444a6a3965d71adaf2b8c59f1faba/preview.png)

  Click [here](http://pirxpilot.github.io/clock/) to see online demo.

## Installation

    $ npm install --save component-clock

## Example

```js
const Clock = require('component-clock');
const clock = new Clock();
clock.el.appendTo('body');
clock.select({
	hour: 11,
	minute: 30
});
```

## Events

  - `change` (time, complete) - when the selected time is modified
  	`time` is an object with `hour` and `minute` properties,
  	`complete` is true only if both hours and minutes have been clicked by the user

## API

### Clock({ captions })

- `captions` - optional dictionary { hours, minutes, am, pm } - entries will be used by clock to render
captions for Hours, Minutes, AM and PM - `Object` or [`HTMLElement.dataset`][dataset] can be used as a dictionary

### Clock#select(time)

Select the given `time` ({ hour, minute }).

### Clock#min(minTime)

Define the minimum time selectable with this clock (inclusive). Time values smaller than `minTime`
are rendered with `invalid` class. All `change` events are generated only for values larger or equal
to `minTime`.

### Clock#max(maxTime)

Define the maximum time selectable with this clock (inclusive). Time values larger than `maxTime`
are rendered with `invalid` class. All `change` events are generated only for values smaller or equal
to `maxTime`.

### Clock#type(type)

Set type to `12` to display 12 hour am/pm type of clock. Any other value resets the clock display
to standard 24 hour display.

## License

  MIT

[dataset]: https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/dataset

[npm-image]: https://img.shields.io/npm/v/component-clock.svg
[npm-url]: https://npmjs.org/package/component-clock

[travis-url]: https://travis-ci.org/pirxpilot/clock
[travis-image]: https://img.shields.io/travis/pirxpilot/clock.svg

[deps-image]: https://img.shields.io/david/pirxpilot/clock.svg
[deps-url]: https://david-dm.org/pirxpilot/clock

[deps-dev-image]: https://img.shields.io/david/dev/pirxpilot/clock.svg
[deps-dev-url]: https://david-dm.org/pirxpilot/clock?type=dev

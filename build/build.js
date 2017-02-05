require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var Emitter = require('emitter');
var inGroupsOf = require('in-groups-of');
var range = require('range');
var domify = require('domify');
var events = require('events');
var dataset = require('dataset');
var classes = require('classes');
var timerange = require('./timerange');
var el = require('el');

module.exports = Clock;

var minuteStep = 5;

var format = {
  table: function(caption, type, tbody) {
    return el('table',
      el('caption', caption) + el('tbody', tbody),
      { 'class': type });
  },
  cell: function(value, type) {
    var attribs = {
      href: '#'
    };
    attribs['data-' + type] = value;
    return el('td', el('a', attribs));
  },
  query: function(kind, value) {
    return 'a[data-' + kind + '="' + value + '"]';
  }
};

function renderTable(caption, type, rows, attrs) {
  var tbody = rows.map(function(row) {
      return el('tr', row.join(''), attrs);
    }).join('');
  return format.table(caption, type, tbody);
}

function renderHours(captions) {
  var hours = range(0, 24).map(function(hour) {
    return format.cell(hour, 'hour');
  });
  return renderTable(captions.hours, 'hour', inGroupsOf(hours, 6), {
    'data-am': captions.am,
    'data-pm': captions.pm
  });
}

function renderMinutes(captions) {
  var minutes = range(0, 12).map(function(minute) {
    return format.cell(minute * minuteStep, 'minute');
  });
  return renderTable(captions.minutes, 'minute', inGroupsOf(minutes, 3));
}

function defaultCaptions(captions) {
  var my = {
    hours: 'Hours',
    minutes: 'Minutes',
    am: 'AM',
    pm: 'PM'
  };
  if (!captions) {
    return my;
  }
  Object.keys(my).forEach(function(key) {
    if (key in captions) {
      my[key] = captions[key];
    }
  });
  return my;
}

function renderClock(captions) {
  captions = defaultCaptions(captions);
  var html = [
    '<table class="clock"><tr>',
    '<td>' + renderHours(captions) + '</td>',
    '<td>' + renderMinutes(captions) + '</td>',
    '</tr></table>'
  ].join('');
  return domify(html);
}

function coerceMinutes(minutes) {
  if (!minutes) {
    return 0;
  }
  minutes -= (minutes % minuteStep);
  return minutes;
}

function markInvalid(nodes, kind, isValid) {
  function mark(node) {
    var cl = classes(node),
      v = dataset(node, kind);
    if (isValid(v)) {
      cl.remove('invalid');
    } else {
      cl.add('invalid');
    }
  }

  var i;
  for(i = 0; i < nodes.length; i++) {
    mark(nodes[i]);
  }
}

function Clock(options) {
  Emitter.call(this);
  this.selected = {};
  this.el = renderClock(options && options.captions);
  this.events = events(this.el, this);
  this.events.bind('click .hour a', 'onhour');
  this.events.bind('click .minute a', 'onminute');
  this.valid = timerange();
}

Emitter(Clock.prototype);

Clock.prototype.onhour = function(e) {
  this.onclick('hour', e.target);
  e.preventDefault();
};

Clock.prototype.onminute = function(e) {
  this.onclick('minute', e.target);
  e.preventDefault();
};

Clock.prototype.onclick = function(kind, a) {
  var value = dataset(a, kind);
  if (!classes(a).has('invalid')) {
    this.selected[kind] = parseInt(value, 10);
    this.selectImpl(kind, this.selected[kind]);
    if (kind === 'hour') {
      this.selected = this.adjustMinutes(this.selected);
      this.markInvalid(this.selected.hour);
    }
    this.emit('change', this.selected, this.isComplete(kind));
  }
};

Clock.prototype.select = function(hm) {
  hm.minute = coerceMinutes(hm.minute);
  this.selectImpl('hour', hm.hour);
  this.selectImpl('minute',  hm.minute);
  this.selected = hm;
  this.markInvalid(this.selected.hour);
  return this;
};

Clock.prototype.querySelector = function(kind, selector) {
  return this.el.querySelector('.' + kind + ' ' + selector);
};

Clock.prototype.querySelectorAll = function(kind, selector) {
  return this.el.querySelectorAll('.' + kind + ' ' + selector);
};

Clock.prototype.selectImpl = function(kind, value) {
  var selected = this.querySelector(kind, '.selected a');
  // deselect
  if (selected) {
    if (value === dataset(selected, kind)) {
      // all is well
      return;
    }
    classes(selected.parentNode).remove('selected');
  }
  // select
  selected = this.querySelector(kind, format.query(kind, value));
  if (selected) {
    classes(selected.parentNode).add('selected');
  }
};

/**
 * Called when hour changes as a result of select, or as a result of the click on the calendar.
 * It may means that we might need to adjust minute value and recalculate 'invalid' state of
 * minute cells.
 */
Clock.prototype.adjustMinutes = function(hm) {
    var adjusted;
    if (hm.minute !== undefined) {
      adjusted = this.valid.restrict(hm);
      if (adjusted.minute != hm.minute) {
        this.selectImpl('minute', adjusted.minute);
      }
    }
    return adjusted ? adjusted : hm;
};

Clock.prototype.markInvalid = function(selectedHour, both) {
  var valid = this.valid;
  if (both) {
    markInvalid(this.querySelectorAll('hour', 'a'), 'hour', function(hour) {
      return valid.isValidHour(hour);
    });
  }
  markInvalid(this.querySelectorAll('minute', 'a'), 'minute', function(minute) {
    return valid.isValidMinute(selectedHour, minute);
  });
};

Clock.prototype.isComplete = function(kind) {
  this._complete = this._complete || {};
  if (kind) {
    this._complete[kind] = true;
  }
  if (this._complete.hour && this._complete.minute) {
    this._complete = {}; // reset complete
    return true;
  }
};

Clock.prototype.resetComplete = function() {
  this._complete = {};
  return this;
};

Clock.prototype.min = function(v) {
  if (!arguments.length) {
    return this.valid.min();
  }
  this.valid.min(v);
  this.markInvalid(this.selected.hour, true);
  return this;
};

Clock.prototype.max = function(v) {
  if (!arguments.length) {
    return this.valid.max();
  }
  this.valid.max(v);
  this.markInvalid(this.selected.hour, true);
  return this;
};

Clock.prototype.type = function(t) {
  var ampm = (t == 12);
  classes(this.el).toggle('ampm', ampm);
  return this;
};

},{"./timerange":2,"classes":6,"dataset":17,"domify":9,"el":18,"emitter":10,"events":12,"in-groups-of":5,"range":20}],2:[function(require,module,exports){
var Bounds = require('bounds');
var inherits = require('inherits');

module.exports = timeRange;


function timeCompare(a, b) {
  if(a.hour < b.hour) {
    return -1;
  }
  if(a.hour > b.hour) {
    return 1;
  }
  if(a.minute < b.minute) {
    return -1;
  }
  if(a.minute > b.minute) {
    return 1;
  }
  return 0;
}

function timeDistance(a, b) {
  return 60 * Math.abs(a.hour - b.hour) + Math.abs(a.minute - b.minute);
}

function TimeRange(obj) {
  Bounds.call(this, obj);
  this.compare(timeCompare);
  this.distance(timeDistance);
}

inherits(TimeRange, Bounds);

var validTime = new TimeRange()
.min({
  hour: 0, minute: 0
})
.max({
  hour: 23, minute: 59
});

function timeRange() {
  var self = new TimeRange();

  /**
   * For standard range:
   * Hour is valid if any of the hour:minute combination is in bounds
   * it is invalid, if its 59th minute is before or if the 0th minute is after
   */
  function isValidHour(hour) {
    var min, max;
    min = self.min() ? self.min().hour : 0;
    max = self.max() ? self.max().hour : 23;
    if (self.reversed()) {
      return hour <= max || min <= hour;
    }
    return min <= hour && hour <= max;
  }

  function isValidMinute(hour, minute) {
    var v = {
      hour: hour,
      minute: minute
    };
    if (hour === undefined) {
      return true;
    }
    if (self.reversed()) {
      return !self.after(v) || !self.before(v);
    }
    return self.in(v);
  }

  function valid(v) {
    return validTime.valid(v) && TimeRange.prototype.valid.call(self, v);
  }

  function restrict(v) {
    return validTime.restrict(TimeRange.prototype.restrict.call(self, v));
  }

  self.isValidHour = isValidHour;
  self.isValidMinute = isValidMinute;
  self.valid = valid;
  self.restrict = restrict;

  return self;
}
},{"bounds":3,"inherits":19}],3:[function(require,module,exports){
var clone;

if ('undefined' == typeof window) {
  clone = require('clone-component');
} else {
  clone = require('clone');
}

module.exports = Bounds;


function calculateReversed(self) {
  return self._min
    && self._max
    && self.before(self._max);
}

function Bounds(obj) {
  if (obj) return mixin(obj);
}

function mixin(obj) {
  for (var key in Bounds.prototype) {
    obj[key] = Bounds.prototype[key];
  }
  return obj;
}

Bounds.prototype.compare = function(fn) {
  this._compare = fn;
  return this;
};

Bounds.prototype.distance = function(fn) {
  this._distance = fn;
  return this;
};

Bounds.prototype.min = function(v) {
  if (!arguments.length) {
    return this._min;
  }
  this._min = v;
  delete this._reversed;
  return this;
};

Bounds.prototype.max = function(v) {
  if (!arguments.length) {
    return this._max;
  }
  this._max = v;
  delete this._reversed;
  return this;
};

Bounds.prototype.before = function(v) {
  return this._min && (this._compare(v, this._min) < 0);
};

Bounds.prototype.after = function(v) {
  return this._max && (this._compare(v, this._max) > 0);
};

Bounds.prototype.out = function(v) {
  return this.before(v) || this.after(v);
};

Bounds.prototype.in = function(v) {
  return !this.out(v);
};

Bounds.prototype.valid = function(v) {
  if (this.reversed()) {
    return !this.after(v) || !this.before(v);
  }
  return this.in(v);
};

Bounds.prototype.invalid = function(v) {
  return !this.valid(v);
};

Bounds.prototype.reversed = function() {
  if (this._reversed === undefined) {
    this._reversed = calculateReversed(this);
  }
  return this._reversed;
};

Bounds.prototype.restrict = function(v) {
  if (this.reversed()) {
    if(this.after(v) && this.before(v)) {
      // select closer bound
      return (this._distance(this._max, v) < this._distance(v, this._min))
        ? clone(this._max)
        : clone(this._min);
    }
    return v;
  }
  if(this.before(v)) {
    return clone(this._min);
  }
  if(this.after(v)) {
    return clone(this._max);
  }
  return v;
};

},{"clone":4,"clone-component":4}],4:[function(require,module,exports){
/**
 * Module dependencies.
 */

var type;
try {
  type = require('component-type');
} catch (_) {
  type = require('type');
}

/**
 * Module exports.
 */

module.exports = clone;

/**
 * Clones objects.
 *
 * @param {Mixed} any object
 * @api public
 */

function clone(obj){
  switch (type(obj)) {
    case 'object':
      var copy = {};
      for (var key in obj) {
        if (obj.hasOwnProperty(key)) {
          copy[key] = clone(obj[key]);
        }
      }
      return copy;

    case 'array':
      var copy = new Array(obj.length);
      for (var i = 0, l = obj.length; i < l; i++) {
        copy[i] = clone(obj[i]);
      }
      return copy;

    case 'regexp':
      // from millermedeiros/amd-utils - MIT
      var flags = '';
      flags += obj.multiline ? 'm' : '';
      flags += obj.global ? 'g' : '';
      flags += obj.ignoreCase ? 'i' : '';
      return new RegExp(obj.source, flags);

    case 'date':
      return new Date(obj.getTime());

    default: // string, number, boolean, …
      return obj;
  }
}

},{"component-type":16,"type":16}],5:[function(require,module,exports){

module.exports = function(arr, n){
  var i, ret = [];

  if (n < 1) {
    return arr;
  }

  for (i = 0; i < arr.length; i += n) {
    ret.push(arr.slice(i, i + n));
  }

  return ret;
};
},{}],6:[function(require,module,exports){
/**
 * Module dependencies.
 */

try {
  var index = require('indexof');
} catch (err) {
  var index = require('component-indexof');
}

/**
 * Whitespace regexp.
 */

var re = /\s+/;

/**
 * toString reference.
 */

var toString = Object.prototype.toString;

/**
 * Wrap `el` in a `ClassList`.
 *
 * @param {Element} el
 * @return {ClassList}
 * @api public
 */

module.exports = function(el){
  return new ClassList(el);
};

/**
 * Initialize a new ClassList for `el`.
 *
 * @param {Element} el
 * @api private
 */

function ClassList(el) {
  if (!el || !el.nodeType) {
    throw new Error('A DOM element reference is required');
  }
  this.el = el;
  this.list = el.classList;
}

/**
 * Add class `name` if not already present.
 *
 * @param {String} name
 * @return {ClassList}
 * @api public
 */

ClassList.prototype.add = function(name){
  // classList
  if (this.list) {
    this.list.add(name);
    return this;
  }

  // fallback
  var arr = this.array();
  var i = index(arr, name);
  if (!~i) arr.push(name);
  this.el.className = arr.join(' ');
  return this;
};

/**
 * Remove class `name` when present, or
 * pass a regular expression to remove
 * any which match.
 *
 * @param {String|RegExp} name
 * @return {ClassList}
 * @api public
 */

ClassList.prototype.remove = function(name){
  if ('[object RegExp]' == toString.call(name)) {
    return this.removeMatching(name);
  }

  // classList
  if (this.list) {
    this.list.remove(name);
    return this;
  }

  // fallback
  var arr = this.array();
  var i = index(arr, name);
  if (~i) arr.splice(i, 1);
  this.el.className = arr.join(' ');
  return this;
};

/**
 * Remove all classes matching `re`.
 *
 * @param {RegExp} re
 * @return {ClassList}
 * @api private
 */

ClassList.prototype.removeMatching = function(re){
  var arr = this.array();
  for (var i = 0; i < arr.length; i++) {
    if (re.test(arr[i])) {
      this.remove(arr[i]);
    }
  }
  return this;
};

/**
 * Toggle class `name`, can force state via `force`.
 *
 * For browsers that support classList, but do not support `force` yet,
 * the mistake will be detected and corrected.
 *
 * @param {String} name
 * @param {Boolean} force
 * @return {ClassList}
 * @api public
 */

ClassList.prototype.toggle = function(name, force){
  // classList
  if (this.list) {
    if ("undefined" !== typeof force) {
      if (force !== this.list.toggle(name, force)) {
        this.list.toggle(name); // toggle again to correct
      }
    } else {
      this.list.toggle(name);
    }
    return this;
  }

  // fallback
  if ("undefined" !== typeof force) {
    if (!force) {
      this.remove(name);
    } else {
      this.add(name);
    }
  } else {
    if (this.has(name)) {
      this.remove(name);
    } else {
      this.add(name);
    }
  }

  return this;
};

/**
 * Return an array of classes.
 *
 * @return {Array}
 * @api public
 */

ClassList.prototype.array = function(){
  var className = this.el.getAttribute('class') || '';
  var str = className.replace(/^\s+|\s+$/g, '');
  var arr = str.split(re);
  if ('' === arr[0]) arr.shift();
  return arr;
};

/**
 * Check if class `name` is present.
 *
 * @param {String} name
 * @return {ClassList}
 * @api public
 */

ClassList.prototype.has =
ClassList.prototype.contains = function(name){
  return this.list
    ? this.list.contains(name)
    : !! ~index(this.array(), name);
};

},{"component-indexof":13,"indexof":13}],7:[function(require,module,exports){
/**
 * Module Dependencies
 */

try {
  var matches = require('matches-selector')
} catch (err) {
  var matches = require('component-matches-selector')
}

/**
 * Export `closest`
 */

module.exports = closest

/**
 * Closest
 *
 * @param {Element} el
 * @param {String} selector
 * @param {Element} scope (optional)
 */

function closest (el, selector, scope) {
  scope = scope || document.documentElement;

  // walk up the dom
  while (el && el !== scope) {
    if (matches(el, selector)) return el;
    el = el.parentNode;
  }

  // check scope for match
  return matches(el, selector) ? el : null;
}

},{"component-matches-selector":14,"matches-selector":14}],8:[function(require,module,exports){
/**
 * Module dependencies.
 */

try {
  var closest = require('closest');
} catch(err) {
  var closest = require('component-closest');
}

try {
  var event = require('event');
} catch(err) {
  var event = require('component-event');
}

/**
 * Delegate event `type` to `selector`
 * and invoke `fn(e)`. A callback function
 * is returned which may be passed to `.unbind()`.
 *
 * @param {Element} el
 * @param {String} selector
 * @param {String} type
 * @param {Function} fn
 * @param {Boolean} capture
 * @return {Function}
 * @api public
 */

exports.bind = function(el, selector, type, fn, capture){
  return event.bind(el, type, function(e){
    var target = e.target || e.srcElement;
    e.delegateTarget = closest(target, selector, true, el);
    if (e.delegateTarget) fn.call(el, e);
  }, capture);
};

/**
 * Unbind event `type`'s callback `fn`.
 *
 * @param {Element} el
 * @param {String} type
 * @param {Function} fn
 * @param {Boolean} capture
 * @api public
 */

exports.unbind = function(el, type, fn, capture){
  event.unbind(el, type, fn, capture);
};

},{"closest":7,"component-closest":7,"component-event":11,"event":11}],9:[function(require,module,exports){

/**
 * Expose `parse`.
 */

module.exports = parse;

/**
 * Wrap map from jquery.
 */

var map = {
  legend: [1, '<fieldset>', '</fieldset>'],
  tr: [2, '<table><tbody>', '</tbody></table>'],
  col: [2, '<table><tbody></tbody><colgroup>', '</colgroup></table>'],
  _default: [0, '', '']
};

map.td =
map.th = [3, '<table><tbody><tr>', '</tr></tbody></table>'];

map.option =
map.optgroup = [1, '<select multiple="multiple">', '</select>'];

map.thead =
map.tbody =
map.colgroup =
map.caption =
map.tfoot = [1, '<table>', '</table>'];

map.text =
map.circle =
map.ellipse =
map.line =
map.path =
map.polygon =
map.polyline =
map.rect = [1, '<svg xmlns="http://www.w3.org/2000/svg" version="1.1">','</svg>'];

/**
 * Parse `html` and return the children.
 *
 * @param {String} html
 * @return {Array}
 * @api private
 */

function parse(html) {
  if ('string' != typeof html) throw new TypeError('String expected');
  
  // tag name
  var m = /<([\w:]+)/.exec(html);
  if (!m) return document.createTextNode(html);

  html = html.replace(/^\s+|\s+$/g, ''); // Remove leading/trailing whitespace

  var tag = m[1];

  // body support
  if (tag == 'body') {
    var el = document.createElement('html');
    el.innerHTML = html;
    return el.removeChild(el.lastChild);
  }

  // wrap map
  var wrap = map[tag] || map._default;
  var depth = wrap[0];
  var prefix = wrap[1];
  var suffix = wrap[2];
  var el = document.createElement('div');
  el.innerHTML = prefix + html + suffix;
  while (depth--) el = el.lastChild;

  // one element
  if (el.firstChild == el.lastChild) {
    return el.removeChild(el.firstChild);
  }

  // several elements
  var fragment = document.createDocumentFragment();
  while (el.firstChild) {
    fragment.appendChild(el.removeChild(el.firstChild));
  }

  return fragment;
}

},{}],10:[function(require,module,exports){

/**
 * Expose `Emitter`.
 */

if (typeof module !== 'undefined') {
  module.exports = Emitter;
}

/**
 * Initialize a new `Emitter`.
 *
 * @api public
 */

function Emitter(obj) {
  if (obj) return mixin(obj);
};

/**
 * Mixin the emitter properties.
 *
 * @param {Object} obj
 * @return {Object}
 * @api private
 */

function mixin(obj) {
  for (var key in Emitter.prototype) {
    obj[key] = Emitter.prototype[key];
  }
  return obj;
}

/**
 * Listen on the given `event` with `fn`.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.on =
Emitter.prototype.addEventListener = function(event, fn){
  this._callbacks = this._callbacks || {};
  (this._callbacks['$' + event] = this._callbacks['$' + event] || [])
    .push(fn);
  return this;
};

/**
 * Adds an `event` listener that will be invoked a single
 * time then automatically removed.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.once = function(event, fn){
  function on() {
    this.off(event, on);
    fn.apply(this, arguments);
  }

  on.fn = fn;
  this.on(event, on);
  return this;
};

/**
 * Remove the given callback for `event` or all
 * registered callbacks.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.off =
Emitter.prototype.removeListener =
Emitter.prototype.removeAllListeners =
Emitter.prototype.removeEventListener = function(event, fn){
  this._callbacks = this._callbacks || {};

  // all
  if (0 == arguments.length) {
    this._callbacks = {};
    return this;
  }

  // specific event
  var callbacks = this._callbacks['$' + event];
  if (!callbacks) return this;

  // remove all handlers
  if (1 == arguments.length) {
    delete this._callbacks['$' + event];
    return this;
  }

  // remove specific handler
  var cb;
  for (var i = 0; i < callbacks.length; i++) {
    cb = callbacks[i];
    if (cb === fn || cb.fn === fn) {
      callbacks.splice(i, 1);
      break;
    }
  }
  return this;
};

/**
 * Emit `event` with the given args.
 *
 * @param {String} event
 * @param {Mixed} ...
 * @return {Emitter}
 */

Emitter.prototype.emit = function(event){
  this._callbacks = this._callbacks || {};
  var args = [].slice.call(arguments, 1)
    , callbacks = this._callbacks['$' + event];

  if (callbacks) {
    callbacks = callbacks.slice(0);
    for (var i = 0, len = callbacks.length; i < len; ++i) {
      callbacks[i].apply(this, args);
    }
  }

  return this;
};

/**
 * Return array of callbacks for `event`.
 *
 * @param {String} event
 * @return {Array}
 * @api public
 */

Emitter.prototype.listeners = function(event){
  this._callbacks = this._callbacks || {};
  return this._callbacks['$' + event] || [];
};

/**
 * Check if this emitter has `event` handlers.
 *
 * @param {String} event
 * @return {Boolean}
 * @api public
 */

Emitter.prototype.hasListeners = function(event){
  return !! this.listeners(event).length;
};

},{}],11:[function(require,module,exports){
var bind = window.addEventListener ? 'addEventListener' : 'attachEvent',
    unbind = window.removeEventListener ? 'removeEventListener' : 'detachEvent',
    prefix = bind !== 'addEventListener' ? 'on' : '';

/**
 * Bind `el` event `type` to `fn`.
 *
 * @param {Element} el
 * @param {String} type
 * @param {Function} fn
 * @param {Boolean} capture
 * @return {Function}
 * @api public
 */

exports.bind = function(el, type, fn, capture){
  el[bind](prefix + type, fn, capture || false);
  return fn;
};

/**
 * Unbind `el` event `type`'s callback `fn`.
 *
 * @param {Element} el
 * @param {String} type
 * @param {Function} fn
 * @param {Boolean} capture
 * @return {Function}
 * @api public
 */

exports.unbind = function(el, type, fn, capture){
  el[unbind](prefix + type, fn, capture || false);
  return fn;
};
},{}],12:[function(require,module,exports){

/**
 * Module dependencies.
 */

try {
  var events = require('event');
} catch(err) {
  var events = require('component-event');
}

try {
  var delegate = require('delegate');
} catch(err) {
  var delegate = require('component-delegate');
}

/**
 * Expose `Events`.
 */

module.exports = Events;

/**
 * Initialize an `Events` with the given
 * `el` object which events will be bound to,
 * and the `obj` which will receive method calls.
 *
 * @param {Object} el
 * @param {Object} obj
 * @api public
 */

function Events(el, obj) {
  if (!(this instanceof Events)) return new Events(el, obj);
  if (!el) throw new Error('element required');
  if (!obj) throw new Error('object required');
  this.el = el;
  this.obj = obj;
  this._events = {};
}

/**
 * Subscription helper.
 */

Events.prototype.sub = function(event, method, cb){
  this._events[event] = this._events[event] || {};
  this._events[event][method] = cb;
};

/**
 * Bind to `event` with optional `method` name.
 * When `method` is undefined it becomes `event`
 * with the "on" prefix.
 *
 * Examples:
 *
 *  Direct event handling:
 *
 *    events.bind('click') // implies "onclick"
 *    events.bind('click', 'remove')
 *    events.bind('click', 'sort', 'asc')
 *
 *  Delegated event handling:
 *
 *    events.bind('click li > a')
 *    events.bind('click li > a', 'remove')
 *    events.bind('click a.sort-ascending', 'sort', 'asc')
 *    events.bind('click a.sort-descending', 'sort', 'desc')
 *
 * @param {String} event
 * @param {String|function} [method]
 * @return {Function} callback
 * @api public
 */

Events.prototype.bind = function(event, method){
  var e = parse(event);
  var el = this.el;
  var obj = this.obj;
  var name = e.name;
  var method = method || 'on' + name;
  var args = [].slice.call(arguments, 2);

  // callback
  function cb(){
    var a = [].slice.call(arguments).concat(args);
    obj[method].apply(obj, a);
  }

  // bind
  if (e.selector) {
    cb = delegate.bind(el, e.selector, name, cb);
  } else {
    events.bind(el, name, cb);
  }

  // subscription for unbinding
  this.sub(name, method, cb);

  return cb;
};

/**
 * Unbind a single binding, all bindings for `event`,
 * or all bindings within the manager.
 *
 * Examples:
 *
 *  Unbind direct handlers:
 *
 *     events.unbind('click', 'remove')
 *     events.unbind('click')
 *     events.unbind()
 *
 * Unbind delegate handlers:
 *
 *     events.unbind('click', 'remove')
 *     events.unbind('click')
 *     events.unbind()
 *
 * @param {String|Function} [event]
 * @param {String|Function} [method]
 * @api public
 */

Events.prototype.unbind = function(event, method){
  if (0 == arguments.length) return this.unbindAll();
  if (1 == arguments.length) return this.unbindAllOf(event);

  // no bindings for this event
  var bindings = this._events[event];
  if (!bindings) return;

  // no bindings for this method
  var cb = bindings[method];
  if (!cb) return;

  events.unbind(this.el, event, cb);
};

/**
 * Unbind all events.
 *
 * @api private
 */

Events.prototype.unbindAll = function(){
  for (var event in this._events) {
    this.unbindAllOf(event);
  }
};

/**
 * Unbind all events for `event`.
 *
 * @param {String} event
 * @api private
 */

Events.prototype.unbindAllOf = function(event){
  var bindings = this._events[event];
  if (!bindings) return;

  for (var method in bindings) {
    this.unbind(event, method);
  }
};

/**
 * Parse `event`.
 *
 * @param {String} event
 * @return {Object}
 * @api private
 */

function parse(event) {
  var parts = event.split(/ +/);
  return {
    name: parts.shift(),
    selector: parts.join(' ')
  }
}

},{"component-delegate":8,"component-event":11,"delegate":8,"event":11}],13:[function(require,module,exports){
module.exports = function(arr, obj){
  if (arr.indexOf) return arr.indexOf(obj);
  for (var i = 0; i < arr.length; ++i) {
    if (arr[i] === obj) return i;
  }
  return -1;
};
},{}],14:[function(require,module,exports){
/**
 * Module dependencies.
 */

try {
  var query = require('query');
} catch (err) {
  var query = require('component-query');
}

/**
 * Element prototype.
 */

var proto = Element.prototype;

/**
 * Vendor function.
 */

var vendor = proto.matches
  || proto.webkitMatchesSelector
  || proto.mozMatchesSelector
  || proto.msMatchesSelector
  || proto.oMatchesSelector;

/**
 * Expose `match()`.
 */

module.exports = match;

/**
 * Match `el` to `selector`.
 *
 * @param {Element} el
 * @param {String} selector
 * @return {Boolean}
 * @api public
 */

function match(el, selector) {
  if (!el || el.nodeType !== 1) return false;
  if (vendor) return vendor.call(el, selector);
  var nodes = query.all(selector, el.parentNode);
  for (var i = 0; i < nodes.length; ++i) {
    if (nodes[i] == el) return true;
  }
  return false;
}

},{"component-query":15,"query":15}],15:[function(require,module,exports){
function one(selector, el) {
  return el.querySelector(selector);
}

exports = module.exports = function(selector, el){
  el = el || document;
  return one(selector, el);
};

exports.all = function(selector, el){
  el = el || document;
  return el.querySelectorAll(selector);
};

exports.engine = function(obj){
  if (!obj.one) throw new Error('.one callback required');
  if (!obj.all) throw new Error('.all callback required');
  one = obj.one;
  exports.all = obj.all;
  return exports;
};

},{}],16:[function(require,module,exports){
/**
 * toString ref.
 */

var toString = Object.prototype.toString;

/**
 * Return the type of `val`.
 *
 * @param {Mixed} val
 * @return {String}
 * @api public
 */

module.exports = function(val){
  switch (toString.call(val)) {
    case '[object Date]': return 'date';
    case '[object RegExp]': return 'regexp';
    case '[object Arguments]': return 'arguments';
    case '[object Array]': return 'array';
    case '[object Error]': return 'error';
  }

  if (val === null) return 'null';
  if (val === undefined) return 'undefined';
  if (val !== val) return 'nan';
  if (val && val.nodeType === 1) return 'element';

  if (isBuffer(val)) return 'buffer';

  val = val.valueOf
    ? val.valueOf()
    : Object.prototype.valueOf.apply(val);

  return typeof val;
};

// code borrowed from https://github.com/feross/is-buffer/blob/master/index.js
function isBuffer(obj) {
  return !!(obj != null &&
    (obj._isBuffer || // For Safari 5-7 (missing Object.prototype.constructor)
      (obj.constructor &&
      typeof obj.constructor.isBuffer === 'function' &&
      obj.constructor.isBuffer(obj))
    ))
}

},{}],17:[function(require,module,exports){
module.exports=dataset;

/*global document*/


// replace namesLikeThis with names-like-this
function toDashed(name) {
  return name.replace(/([A-Z])/g, function(u) {
    return "-" + u.toLowerCase();
  });
}

var fn;

if (typeof document !== "undefined" && document.head && document.head.dataset) {
  fn = {
    set: function(node, attr, value) {
      node.dataset[attr] = value;
    },
    get: function(node, attr) {
      return node.dataset[attr];
    },
    del: function (node, attr) {
      delete node.dataset[attr];
    }
  };
} else {
  fn = {
    set: function(node, attr, value) {
      node.setAttribute('data-' + toDashed(attr), value);
    },
    get: function(node, attr) {
      return node.getAttribute('data-' + toDashed(attr));
    },
    del: function (node, attr) {
      node.removeAttribute('data-' + toDashed(attr));
    }
  };
}

function dataset(node, attr, value) {
  var self = {
    set: set,
    get: get,
    del: del
  };

  function set(attr, value) {
    fn.set(node, attr, value);
    return self;
  }

  function del(attr) {
    fn.del(node, attr);
    return self;
  }

  function get(attr) {
    return fn.get(node, attr);
  }

  if (arguments.length === 3) {
    return set(attr, value);
  }
  if (arguments.length == 2) {
    return get(attr);
  }

  return self;
}

},{}],18:[function(require,module,exports){
// see: http://www.w3.org/html/wg/drafts/html/master/single-page.html#void-elements
var voids = [
  'area', 'base', 'br', 'col', 'embed',
  'hr', 'img', 'input', 'keygen', 'link',
  'menuitem', 'meta', 'param', 'source', 'track', 'wbr'
].reduce(function(o, v) {
  o[v] = true;
  return o;
}, Object.create(null));

function htmlTag(tag, content, attrStr) {
  var text = ['<',
    tag,
    attrStr ? ' ' + attrStr :  '',
    '>'
  ];
  if(!voids[tag]) {
    text = text.concat([
      content || '',
      '</',
      tag,
      '>'
    ]);
  }
  return text;
}

function xmlTag(tag, content, attrStr) {
  var text = ['<',
    tag,
    attrStr ? ' ' + attrStr :  '',
  ];
  if (!content || !content.length) {
    text.push('/>');
  } else {
    text = text.concat([
      '>',
      content,
      '</',
      tag,
      '>'
    ]);
  }
  return text;
}

function toStr(tagFn, tag, content, attrs) {
  var attrStr, classes, ids;

  if (typeof content !== 'string') {
    attrs = content;
    content = '';
  }

  tag = tag || '';
  attrs = attrs || {};

  classes = tag.split('.');
  tag = classes.shift() || 'div';
  if (classes.length) {
    classes = classes.join(' ');
    if (attrs['class']) {
      attrs['class'] += ' ' + classes;
    } else {
      attrs['class'] = classes;
    }
  }
  ids = tag.split('#');
  if (ids.length > 1) {
    tag = ids[0] || 'div';
    attrs.id = ids[1];
  }

  attrStr = Object.keys(attrs).map(function(attr) {
    return attr +  '="' + attrs[attr] + '"';
  }).join(' ');

  return tagFn(tag, content, attrStr).join('');
}

module.exports = toStr.bind(null, htmlTag);
module.exports.xml = toStr.bind(null, xmlTag);
},{}],19:[function(require,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}

},{}],20:[function(require,module,exports){

module.exports = function(from, to, inclusive){
  var ret = [];
  if (inclusive) to++;

  for (var n = from; n < to; ++n) {
    ret.push(n);
  }

  return ret;
}
},{}],"clock":[function(require,module,exports){
module.exports = require('./lib/clock.js');
},{"./lib/clock.js":1}]},{},[]);

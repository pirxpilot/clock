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

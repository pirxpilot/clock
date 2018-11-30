const Emitter = require('component-emitter');
const inGroupsOf = require('@pirxpilot/in-groups-of');
const range = require('range-component');
const domify = require('component-domify');
const timerange = require('./timerange');
const el = require('el-component');

const minuteStep = 5;

const format = {
  table(caption, type, tbody) {
    return el(
      'table',
      el('caption', caption) + el('tbody', tbody),
      { 'class': type }
    );
  },
  cell(value, type) {
    const attribs = {
      href: '#',
      [`data-${type}`]: value
    };
    return el('td', el('a', attribs));
  },
  query(kind, value) {
    return `a[data-${kind}="${value}"]`;
  }
};

function renderTable(caption, type, rows, attrs) {
  const tbody = rows.map(function(row) {
      return el('tr', row.join(''), attrs);
    }).join('');
  return format.table(caption, type, tbody);
}

function renderHours(captions) {
  const hours = range(0, 24).map(function(hour) {
    return format.cell(hour, 'hour');
  });
  return renderTable(captions.hours, 'hour', inGroupsOf(hours, 6), {
    'data-am': captions.am,
    'data-pm': captions.pm
  });
}

function renderMinutes(captions) {
  const minutes = range(0, 12).map(minute => format.cell(minute * minuteStep, 'minute'));
  return renderTable(captions.minutes, 'minute', inGroupsOf(minutes, 3));
}

function defaultCaptions(captions) {
  const my = {
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
  const html = [
    '<table class="clock"><tr>',
    `<td>${renderHours(captions)}</td>`,
    `<td>${renderMinutes(captions)}</td>`,
    '</tr></table>'
  ].join('');
  return domify(html);
}

function getKind(el) {
  if (el.hasAttribute('data-minute')) {
    return 'minute';
  }
  if (el.hasAttribute('data-hour')) {
    return 'hour';
  }
}

function coerceMinutes(minutes) {
  if (!minutes) {
    return 0;
  }
  minutes -= (minutes % minuteStep);
  return minutes;
}

function markInvalid(nodes, kind, isValid) {
  nodes.forEach(function(node) {
    const v = node.dataset[kind];
    node.classList.toggle('invalid', !isValid(v));
  });
}

class Clock extends Emitter{
  constructor({ captions } = {}) {
    super();
    this.selected = {};
    this.el = renderClock(captions);
    this.el.addEventListener('click', e => this.onclick(e));
    this.valid = timerange();
  }

  onclick(e) {
    const a = e.target;
    const kind = getKind(a);
    if (!kind) { return; }
    e.preventDefault();

    const value = a.dataset[kind];
    if (!a.classList.contains('invalid')) {
      this.selected[kind] = parseInt(value, 10);
      this.selectImpl(kind, this.selected[kind]);
      if (kind === 'hour') {
        this.selected = this.adjustMinutes(this.selected);
        this.markInvalid(this.selected.hour);
      }
      this.emit('change', this.selected, this.isComplete(kind));
    }
  }

  select(hm) {
    hm.minute = coerceMinutes(hm.minute);
    this.selectImpl('hour', hm.hour);
    this.selectImpl('minute',  hm.minute);
    this.selected = hm;
    this.markInvalid(this.selected.hour);
    return this;
  }

  querySelector(kind, selector) {
    return this.el.querySelector(`.${kind} ${selector}`);
  }

  querySelectorAll(kind, selector) {
    return this.el.querySelectorAll(`.${kind} ${selector}`);
  }

  selectImpl(kind, value) {
    let selected = this.querySelector(kind, '.selected a');
    // deselect
    if (selected) {
      if (value === selected.dataset[kind]) {
        // all is well
        return;
      }
      selected.parentNode.classList.remove('selected');
    }
    // select
    selected = this.querySelector(kind, format.query(kind, value));
    if (selected) {
      selected.parentNode.classList.add('selected');
    }
  }

  /**
   * Called when hour changes as a result of select, or as a result of the click on the calendar.
   * It may means that we might need to adjust minute value and recalculate 'invalid' state of
   * minute cells.
   */
  adjustMinutes(hm) {
      let adjusted;
      if (hm.minute !== undefined) {
        adjusted = this.valid.restrict(hm);
        if (adjusted.minute !== hm.minute) {
          this.selectImpl('minute', adjusted.minute);
        }
      }
      return adjusted ? adjusted : hm;
  }

  markInvalid(selectedHour, both) {
    const valid = this.valid;
    if (both) {
      markInvalid(this.querySelectorAll('hour', 'a'), 'hour', function(hour) {
        return valid.isValidHour(hour);
      });
    }
    markInvalid(this.querySelectorAll('minute', 'a'), 'minute', function(minute) {
      return valid.isValidMinute(selectedHour, minute);
    });
  }

  isComplete(kind) {
    this._complete = this._complete || {};
    if (kind) {
      this._complete[kind] = true;
    }
    if (this._complete.hour && this._complete.minute) {
      this._complete = {}; // reset complete
      return true;
    }
  }

  resetComplete() {
    this._complete = {};
    return this;
  }

  min(v) {
    if (!arguments.length) {
      return this.valid.min();
    }
    this.valid.min(v);
    this.markInvalid(this.selected.hour, true);
    return this;
  }

  max(v) {
    if (!arguments.length) {
      return this.valid.max();
    }
    this.valid.max(v);
    this.markInvalid(this.selected.hour, true);
    return this;
  }

  type(t) {
    const ampm = (t === 12);
    this.el.classList.toggle('ampm', ampm);
    return this;
  }
}

module.exports = Clock;

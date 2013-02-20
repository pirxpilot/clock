var Emitter = require('emitter');
var inGroupsOf = require('in-groups-of');
var range = require('range');
var formatter = require('formatter');
var domify = require('domify');
var delegates = require('delegates');
var dataset = require('dataset');
var classes = require('classes');

module.exports = Clock;

var format = {
	table: formatter('<table class="{{ 1 }}"><caption>{{ 0 }}</caption><tbody>{{ 2 }}</tbody></table>'),
	cell: formatter('<td><a href="#" data-{{ 1 }}="{{ 0 }}">{{ 0 }}</a></td>'),
	query: formatter('.{{ 0 }} a[data-{{ 0 }}="{{ 1 }}"]')
};

function renderTable(caption, type, rows) {
	var tbody = rows.map(function(row) {
			return '<tr>' + row.join('') + '</tr>';
		}).join('');
	return format.table(caption, type, tbody);
}

function renderHours() {
	var hours = range(0, 24).map(function(hour) {
		return format.cell(hour, 'hour');
	});
	return renderTable('Hours', 'hour', inGroupsOf(hours, 6));
}

function renderMinutes() {
	var minutes = range(0, 12).map(function(minute) {
		return format.cell(minute * 5, 'minute');
	});
	return renderTable('Minutes', 'minute', inGroupsOf(minutes, 3));
}

function renderClock() {
	var html = [
		'<table class="clock"><tr>',
		'<td>' + renderHours() + '</td>',
		'<td>' + renderMinutes() + '</td>',
		'</tr></table>'
	].join('');
	return domify(html)[0];
}

function coerceMinutes(minutes, step) {
	if (!minutes) {
		return 0;
	}
	var rem = minutes % step;
	if (rem < (step / 2)) {
		minutes -= rem;
	} else {
		minutes += step - rem;
	}
	return minutes;
}

function Clock() {
  Emitter.call(this);
  this.selected = {};
  this.el = renderClock();
  this.events = delegates(this.el, this);
  this.events.bind('click .hour a', 'onhour');
  this.events.bind('click .minute a', 'onminute');
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
	this.selected[kind] = parseInt(value, 10);
	this.selectImpl(kind, this.selected[kind]);
	this.emit('change', this.selected, this.isComplete(kind));
};

Clock.prototype.select = function(hm) {
	this.selectImpl('hour', hm.hour);
	hm.minute = coerceMinutes(hm.minute, 5);
	this.selectImpl('minute',  hm.minute);
	this.selected = hm;
	return this;
};

Clock.prototype.selectImpl = function(kind, value) {
	var selected = this.el.querySelector('.' + kind + ' .selected a');
	// deselect
	if (selected) {
		if (value === dataset(selected, kind)) {
			// all is well
			return;
		}
		classes(selected.parentNode).remove('selected');
	}
	// select
	selected = this.el.querySelector(format.query(kind, value));
	if (selected) {
		classes(selected.parentNode).add('selected');
	}
};

Clock.prototype.isComplete = function(kind) {
	this._complete = this._complete || {};
	this._complete[kind] = true;
	if (this._complete.hour && this._complete.minute) {
		this._complete = {}; // reset complete
		return true;
	}
};
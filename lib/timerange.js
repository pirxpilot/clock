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
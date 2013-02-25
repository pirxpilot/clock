var bounds = require('bounds');
var clone = require('clone');

module.exports = timeRange;

function timeRange() {
  var self;

  /**
   * If min and max are both defined and min > max we consider the outside range as valid.
   */
  function isReversed() {
    return self.min()
      && self.max()
      && self.before(self.max());
  }

  function restrict(v) {
    if (isReversed()) {
      if(self.after(v) && self.before(v)) {
        // try not to change 'hour' value when restricting
        if (v.hour === self.min().hour) {
          return clone(self.min());
        }
        return clone(self.max());
      }
      return v;
    }
    if(self.before(v)) {
      return clone(self.min());
    }
    if(self.after(v)) {
      return clone(self.max());
    }
    return v;
  }

  /**
   * For standard range:
   * Hour is valid if any of the hour:minute combination is in bounds
   * it is invalid, if its 59th minute is before or if the 0th minute is after
   */
  function isValidHour(hour) {
    var min, max;
    min = self.min() ? self.min().hour : 0;
    max = self.max() ? self.max().hour : 23;
    if (isReversed()) {
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
    if (isReversed()) {
      return !self.after(v) || !self.before(v);
    }
    return self.in(v);
  }

  // mixin bounds
  self = bounds({
    restrict: restrict,
    isValidHour: isValidHour,
    isValidMinute: isValidMinute
  });

  self.compare(function(a, b) {
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
  });


  return self;
}
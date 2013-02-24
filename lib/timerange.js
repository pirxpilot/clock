var bounds = require('bounds');
var clone = require('clone');

module.exports = timeRange;

function timeRange() {
  var self, my = {
    reversed: false
  };

  function restrict(v) {
    if(self.before(v)) {
      return clone(self.min());
    }
    if(self.after(v)) {
      return clone(self.max());
    }
    return v;
  }

  /**
   * hour is valid if any of the hour:minute combination is in bounds
   * it is invalid, if its 59th minute is before or if the 0th minute is after
   */
  function isValidHour(hour) {
    var min, max;
    min = self.min() ? self.min().hour : 0;
    max = self.max() ? self.max().hour : 23;
    return min <= hour && hour <= max;
  }

  function isValidMinute(hour, minute) {
    var valid;
    if (hour === undefined) {
      return true;
    }
    valid = self.in({
      hour: hour,
      minute: minute
    });
    return valid;
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
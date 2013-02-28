var timerange = require('../lib/timerange.js');
var assert = require('assert');


describe('timerange', function(){
  it('should consider all times as valid if no min/max specified', function() {
    var t = timerange();
    assert.ok(t.valid({ hour: 10, minute: 15}));
  });

  it('should consider hours inside of the range as valid', function() {
    var t = timerange()
      .min({ hour: 9, minute: 15 })
      .max({ hour: 20, minute: 35 });
    assert.ok(!t.isValidHour(8));
    assert.ok(t.isValidHour(9));
    assert.ok(t.isValidHour(15));
    assert.ok(t.isValidHour(20));
    assert.ok(!t.isValidHour(21));
  });

  it('should consider hours outside of the range as valid, when reversed', function() {
    var t = timerange()
      .max({ hour: 9, minute: 15 })
      .min({ hour: 20, minute: 35 });
    assert.ok(t.isValidHour(8));
    assert.ok(t.isValidHour(9));
    assert.ok(!t.isValidHour(15));
    assert.ok(t.isValidHour(20));
    assert.ok(t.isValidHour(21));
  });

  it('should consider minutes inside of the range as valid', function() {
    var t = timerange()
      .min({ hour: 9, minute: 15 })
      .max({ hour: 20, minute: 35 });
    assert.ok(!t.isValidMinute(8, 0));
    assert.ok(!t.isValidMinute(9, 10));
    assert.ok(t.isValidMinute(9, 15));
    assert.ok(t.isValidMinute(9, 20));
    assert.ok(t.isValidMinute(15, 30));
    assert.ok(t.isValidMinute(20, 35));
    assert.ok(!t.isValidMinute(20, 40));
    assert.ok(!t.isValidMinute(21, 10));
  });

  it('should consider minutes outside of the range as valid, when reversed', function() {
    var t = timerange()
      .max({ hour: 9, minute: 15 })
      .min({ hour: 20, minute: 35 });
    assert.ok(t.isValidMinute(8, 0));
    assert.ok(t.isValidMinute(9, 10));
    assert.ok(t.isValidMinute(9, 15));
    assert.ok(!t.isValidMinute(9, 20));
    assert.ok(!t.isValidMinute(15, 30));
    assert.ok(t.isValidMinute(20, 35));
    assert.ok(t.isValidMinute(20, 40));
    assert.ok(t.isValidMinute(21, 10));
  });

  it('should restrict time properly', function() {
    var t = timerange()
      .min({ hour: 9, minute: 15 })
      .max({ hour: 20, minute: 35 });
    assert.deepEqual(t.restrict({ hour: 8,  minute: 0  }), { hour: 9,  minute: 15 });
    assert.deepEqual(t.restrict({ hour: 9,  minute: 10 }), { hour: 9,  minute: 15 });
    assert.deepEqual(t.restrict({ hour: 9,  minute: 15 }), { hour: 9,  minute: 15 });
    assert.deepEqual(t.restrict({ hour: 9,  minute: 20 }), { hour: 9,  minute: 20 });
    assert.deepEqual(t.restrict({ hour: 15, minute: 30 }), { hour: 15, minute: 30 });
    assert.deepEqual(t.restrict({ hour: 20, minute: 35 }), { hour: 20, minute: 35 });
    assert.deepEqual(t.restrict({ hour: 20, minute: 40 }), { hour: 20, minute: 35 });
    assert.deepEqual(t.restrict({ hour: 21, minute: 10 }), { hour: 20, minute: 35 });
  });

  it('should restrict time properly', function() {
    var t = timerange()
      .max({ hour: 9, minute: 15 })
      .min({ hour: 20, minute: 35 });
    assert.deepEqual(t.restrict({ hour: 8,  minute: 0  }), { hour: 8,  minute: 0  });
    assert.deepEqual(t.restrict({ hour: 9,  minute: 10 }), { hour: 9,  minute: 10 });
    assert.deepEqual(t.restrict({ hour: 9,  minute: 15 }), { hour: 9,  minute: 15 });
    assert.deepEqual(t.restrict({ hour: 9,  minute: 20 }), { hour: 9,  minute: 15 });
    assert.deepEqual(t.restrict({ hour: 15, minute: 30 }), { hour: 20, minute: 35 });
    assert.deepEqual(t.restrict({ hour: 20, minute: 35 }), { hour: 20, minute: 35 });
    assert.deepEqual(t.restrict({ hour: 20, minute: 40 }), { hour: 20, minute: 40 });
    assert.deepEqual(t.restrict({ hour: 21, minute: 10 }), { hour: 21, minute: 10 });
  });
});

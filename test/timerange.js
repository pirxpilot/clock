import assert from 'node:assert/strict';
import test from 'node:test';
import timerange from '../lib/timerange.js';

test('should consider all times between 0:00 and 23:59 as valid if no min/max specified', function () {
  const t = timerange();
  assert.ok(t.valid({ hour: 0, minute: 0 }));
  assert.ok(t.valid({ hour: 23, minute: 59 }));
  assert.ok(t.valid({ hour: 10, minute: 15 }));
});

test('should consider all times outside of 0:00 and 23:59 as invalid', function () {
  const t = timerange();
  assert.ok(!t.valid({ hour: -1, minute: 15 }));
  assert.ok(!t.valid({ hour: 24, minute: 0 }));
});

test('should consider hours inside of the range as valid', function () {
  const t = timerange().min({ hour: 9, minute: 15 }).max({ hour: 20, minute: 35 });
  assert.ok(!t.isValidHour(8));
  assert.ok(t.isValidHour(9));
  assert.ok(t.isValidHour(15));
  assert.ok(t.isValidHour(20));
  assert.ok(!t.isValidHour(21));
});

test('should consider hours outside of the range as valid, when reversed', function () {
  const t = timerange().max({ hour: 9, minute: 15 }).min({ hour: 20, minute: 35 });
  assert.ok(t.isValidHour(8));
  assert.ok(t.isValidHour(9));
  assert.ok(!t.isValidHour(15));
  assert.ok(t.isValidHour(20));
  assert.ok(t.isValidHour(21));
});

test('should consider minutes inside of the range as valid', function () {
  const t = timerange().min({ hour: 9, minute: 15 }).max({ hour: 20, minute: 35 });
  assert.ok(!t.isValidMinute(8, 0));
  assert.ok(!t.isValidMinute(9, 10));
  assert.ok(t.isValidMinute(9, 15));
  assert.ok(t.isValidMinute(9, 20));
  assert.ok(t.isValidMinute(15, 30));
  assert.ok(t.isValidMinute(20, 35));
  assert.ok(!t.isValidMinute(20, 40));
  assert.ok(!t.isValidMinute(21, 10));
});

test('should consider minutes outside of the range as valid, when reversed', function () {
  const t = timerange().max({ hour: 9, minute: 15 }).min({ hour: 20, minute: 35 });
  assert.ok(t.isValidMinute(8, 0));
  assert.ok(t.isValidMinute(9, 10));
  assert.ok(t.isValidMinute(9, 15));
  assert.ok(!t.isValidMinute(9, 20));
  assert.ok(!t.isValidMinute(15, 30));
  assert.ok(t.isValidMinute(20, 35));
  assert.ok(t.isValidMinute(20, 40));
  assert.ok(t.isValidMinute(21, 10));
});

test('should restrict time properly', function () {
  const t = timerange().min({ hour: 9, minute: 15 }).max({ hour: 20, minute: 35 });
  assert.deepEqual(t.restrict({ hour: 8, minute: 0 }), { hour: 9, minute: 15 });
  assert.deepEqual(t.restrict({ hour: 9, minute: 10 }), { hour: 9, minute: 15 });
  assert.deepEqual(t.restrict({ hour: 9, minute: 15 }), { hour: 9, minute: 15 });
  assert.deepEqual(t.restrict({ hour: 9, minute: 20 }), { hour: 9, minute: 20 });
  assert.deepEqual(t.restrict({ hour: 15, minute: 30 }), { hour: 15, minute: 30 });
  assert.deepEqual(t.restrict({ hour: 20, minute: 35 }), { hour: 20, minute: 35 });
  assert.deepEqual(t.restrict({ hour: 20, minute: 40 }), { hour: 20, minute: 35 });
  assert.deepEqual(t.restrict({ hour: 21, minute: 10 }), { hour: 20, minute: 35 });
});

test('should restrict time properly', function () {
  const t = timerange().max({ hour: 9, minute: 15 }).min({ hour: 20, minute: 35 });
  assert.deepEqual(t.restrict({ hour: -1, minute: 3 }), { hour: 0, minute: 0 });
  assert.deepEqual(t.restrict({ hour: 8, minute: 0 }), { hour: 8, minute: 0 });
  assert.deepEqual(t.restrict({ hour: 9, minute: 10 }), { hour: 9, minute: 10 });
  assert.deepEqual(t.restrict({ hour: 9, minute: 15 }), { hour: 9, minute: 15 });
  assert.deepEqual(t.restrict({ hour: 9, minute: 20 }), { hour: 9, minute: 15 });
  assert.deepEqual(t.restrict({ hour: 15, minute: 30 }), { hour: 20, minute: 35 });
  assert.deepEqual(t.restrict({ hour: 20, minute: 35 }), { hour: 20, minute: 35 });
  assert.deepEqual(t.restrict({ hour: 20, minute: 40 }), { hour: 20, minute: 40 });
  assert.deepEqual(t.restrict({ hour: 21, minute: 10 }), { hour: 21, minute: 10 });
  assert.deepEqual(t.restrict({ hour: 24, minute: 10 }), { hour: 23, minute: 59 });
});

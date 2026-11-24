const test = require('node:test');
const assert = require('node:assert');
const L = require('../logic.js');
test('dailyWaterGoal', () => {
  assert.strictEqual(L.dailyWaterGoal(60), 1800);
  assert.strictEqual(L.dailyWaterGoal(30), 1500);
  assert.strictEqual(L.dailyWaterGoal(200), 3500);
  assert.strictEqual(L.dailyWaterGoal('abc'), 2000);
});
test('buildPlan', () => {
  const p = L.buildPlan({ focus: 25, rest: 5, longRest: 15, longEvery: 4, rounds: 4, goal: 2000 });
  assert.strictEqual(p.steps.length, 8);
  assert.strictEqual(p.steps[7].type, 'longRest');
  assert.strictEqual(p.totalMinutes, 25 * 4 + 5 * 3 + 15);
  assert.strictEqual(p.perSip, 500);
  assert.throws(() => L.buildPlan({ focus: 0 }));
});
test('formatClock & summarize', () => {
  assert.strictEqual(L.formatClock(1500), '25:00');
  assert.strictEqual(L.formatClock(61), '01:01');
  const s = L.summarize([{ type: 'focus', minutes: 25 }, { type: 'water', ml: 300 }, { type: 'water', ml: 200 }], 2000);
  assert.deepStrictEqual(s, { focusMin: 25, water: 500, percent: 25 });
});

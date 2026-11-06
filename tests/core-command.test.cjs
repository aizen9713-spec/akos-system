const assert = require('node:assert/strict');
const Core = require('../js/features/core-command-data.js');
const original = {
  activeDay: '2026-11-06',
  player: { streak: 45, bestStreak: 45, xp: 65 },
  achievements: [{ id: 'streak-30', unlockedAt: '2026-10-31' }],
  calendar: { version: 1, events: [] },
  training: { history: [] },
  history: [
    { date: '2026-11-05', completedQuests: 2, totalQuests: 3 },
    { date: '2026-11-06', completedQuests: 99, totalQuests: 99 },
    { date: '2026-11-07', completedQuests: 99, totalQuests: 99 }
  ],
  quests: [{ id: 'a', title: 'Submit', completed: false }, { id: 'b', title: 'Read', completed: true }]
};
const snapshot = JSON.stringify(original);
assert.deepEqual(Core.questTotals(original, ['2026-11-05', '2026-11-06', '2026-11-07'], original.activeDay), { done: 3, total: 5 });
assert.deepEqual(Core.suggestions(original.quests, [
  { title: 'Workout', kind: 'training' }, { title: 'Holiday', official: true }, { title: 'Done', completed: true }
], [
  { title: 'Submit', questId: 'a' }, { title: 'Ignore done quest', questId: 'b' }
]), ['Submit', 'Workout']);
const first = Core.withDay(original, '2026-11-06', { focus: 'Submit', priorities: ['One', '', 'Three'] }, 'first');
const second = Core.withDay(first, '2026-11-07', { focus: '', priorities: null }, 'second');
assert.equal(JSON.stringify(original), snapshot);
assert.equal(second.corePlan.days['2026-11-06'].priorities[1], '');
assert.equal(second.corePlan.days['2026-11-07'].priorities, null);
assert.throws(() => Core.withDay(second, '2026-02-30', { focus: '', priorities: null }, 'bad'));
assert.throws(() => Core.withDay(second, '2026-11-06', { focus: '', priorities: ['Too few'] }, 'bad'));
const { corePlan, lastSavedAt, ...unchanged } = second;
assert.deepEqual(unchanged, original);
console.log('PASS: CORE suggestions, weekly counts, distinct daily plans, validation, and whole-save preservation.');

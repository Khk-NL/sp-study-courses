import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const source = html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(source, 'inline plugin script exists');

const elements = new Map();
const element = (id) => {
  if (!elements.has(id)) elements.set(id, {
    id, value: '', innerHTML: '', textContent: '', hidden: false,
    style: { setProperty() {} }, classList: { toggle() {} },
    showModal() {}, close() {}, addEventListener() {},
  });
  return elements.get(id);
};
let nextId = 0;
const persisted = new Map();
const context = {
  console, Date, TextDecoder, Blob, URL,
  crypto: { randomUUID: () => `test-${++nextId}` },
  navigator: { language: 'en-US' },
  matchMedia: () => ({ matches: false }),
  setInterval() {}, setTimeout() {}, clearTimeout() {},
  confirm: () => true,
  document: {
    body: { dataset: {}, style: { setProperty() {} } },
    visibilityState: 'visible',
    addEventListener() {},
    getElementById: element,
    querySelectorAll: () => [],
    createElement: () => ({ textContent: '', get innerHTML() { return this.textContent; } }),
  },
  window: { parent: { postMessage() {} } },
  PluginAPI: {
    cfg: { platform: 'desktop', lang: { code: 'en' } },
    loadSyncedData: async (key) => persisted.get(key) || null,
    persistDataSynced: async (value, key) => persisted.set(key, value),
    getAllProjects: async () => [], getTasks: async () => [],
    translate: async (key) => key, showSnack() {},
  },
};
runInNewContext(source, context, { filename: 'index.inline.js' });
const evaluate = (expression) => runInNewContext(expression, context);

assert.equal(evaluate("weekdayFromText('Monday')"), 1);
assert.equal(evaluate("weekdayFromText('月曜日')"), 1);
assert.equal(evaluate("weekdayFromText('星期五')"), 5);
assert.deepEqual(Array.from(evaluate("parseWeekSpec('1~3,5~16周').weeks")), [1,2,3,5,6,7,8,9,10,11,12,13,14,15,16]);
assert.equal(evaluate("parseWeekSpec('单周').pattern"), 'odd');
assert.equal(evaluate("parseWeekSpec('双周').pattern"), 'even');

const structured = '课程名称,教师,地点,星期,开始时间,结束时间,开始周,结束周\n现代软件工程,吴老师,文附楼211,周一,09:50,11:25,1,16';
context.structured = structured;
assert.equal(evaluate('rowsToCourses(parseCsv(structured)).length'), 1);
assert.equal(evaluate('rowsToCourses(parseCsv(structured))[0].name'), '现代软件工程');

const grid = '节次,Monday,Tuesday\n1,Software Engineering\\nTeacher: Wu\\nRoom 211\\n1~3,5~16周,\n2,,Statistics 1~8周';
context.grid = grid;
assert.ok(evaluate('rowsToCourses(parseCsv(grid)).length') >= 1);

evaluate("state.semester = { name: 'Test', startDate: '2026-09-07', weeks: 16 }");
evaluate("state.courses = [{ id:'a', name:'A', weekday:1, startTime:'09:00', endTime:'10:00', startWeek:1, endWeek:16, pattern:'every', customWeeks:[], color:'#3f51b5' }, { id:'b', name:'B', weekday:1, startTime:'09:30', endTime:'10:30', startWeek:1, endWeek:16, pattern:'every', customWeeks:[], color:'#3f51b5' }]");
assert.equal(evaluate('conflictIds(state.courses, 1).size'), 2);
evaluate("state.exceptions = [{ id:'x', courseId:'a', week:1, cancelled:true }]");
assert.equal(evaluate('conflictIds(state.courses, 1).size'), 0);
assert.equal(evaluate('occurrenceFor(state.courses[0], 1)'), null);
evaluate("state.exceptions = [{ id:'x', courseId:'a', week:1, cancelled:false, weekday:2, startTime:'14:00', endTime:'15:00', location:'New room' }]");
assert.equal(evaluate('occurrenceFor(state.courses[0], 1).course.weekday'), 2);
assert.ok(evaluate("buildIcs().includes('20260908T140000')"));

await evaluate('save()');
assert.ok(JSON.parse(persisted.get('courses')).semesters.default.exceptions.length === 1);
const beforePreview = persisted.get('courses');
await evaluate('addImportedCourses(rowsToCourses(parseCsv(structured + "\\n现代软件工程,吴老师,文附楼211,周一,09:50,11:25,1,16")))');
assert.equal(evaluate('pendingImport.entries.length'), 2);
assert.equal(evaluate('pendingImport.entries[0].conflict'), true);
assert.equal(evaluate('pendingImport.entries[1].duplicate'), true);
assert.equal(persisted.get('courses'), beforePreview, 'preview does not save');
element('import-edit-index').value = '0';
element('import-edit-name').value = 'Software Engineering Edited';
element('import-edit-weekday').value = '2';
element('import-edit-start').value = '14:00';
element('import-edit-end').value = '15:30';
element('import-edit-start-week').value = '1';
element('import-edit-end-week').value = '16';
element('import-edit-teacher').value = 'Wu';
element('import-edit-location').value = 'Room 211';
context.submitEvent = { preventDefault() {} };
evaluate("$('import-edit-form').onsubmit(submitEvent)");
assert.equal(evaluate('pendingImport.entries[0].course.name'), 'Software Engineering Edited');
assert.equal(evaluate('pendingImport.entries[0].course.weekday'), 2);
assert.equal(persisted.get('courses'), beforePreview, 'editing preview does not save');
console.log('parser, preview, conflicts, exceptions, ICS, synced persistence smoke passed');

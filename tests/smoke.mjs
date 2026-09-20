import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const html = readFileSync(process.argv[2] || new URL('../index.html', import.meta.url), 'utf8');
const source = html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(source, 'inline plugin script exists');

const elements = new Map();
const weekdaySelectIds = new Set(['weekday', 'exception-weekday', 'import-edit-weekday']);
const element = (id) => {
  if (!elements.has(id)) {
    const node = {
      id, value: '', innerHTML: '', textContent: '', hidden: false,
      style: { setProperty() {} }, classList: { toggle() {} },
      showModal() {}, close() {}, addEventListener() {},
    };
    if (weekdaySelectIds.has(id)) {
      // The plugin reads weekday selections through `selectedOptions` and writes
      // them through `option.selected`, so the stub keeps a real option list.
      node.options = [1, 2, 3, 4, 5, 6, 7].map((day) => ({ value: String(day), selected: false }));
      Object.defineProperty(node, 'selectedOptions', { get() { return this.options.filter((option) => option.selected); } });
      Object.defineProperty(node, 'value', {
        get() { return this.selectedOptions[0]?.value || ''; },
        set(next) { this.options.forEach((option) => { option.selected = option.value === String(next); }); },
      });
    }
    elements.set(id, node);
  }
  return elements.get(id);
};
let nextId = 0;
const persisted = new Map();
const mockTags = [];
let tagCreates = 0;
let addedTask = null;
let updatedTask = null;
let hostDownload = null;
let postedDownload = null;
let darkTheme = false;
const context = {
  console, Date, TextDecoder, Blob, URL,
  crypto: { randomUUID: () => `test-${++nextId}` },
  navigator: { language: 'en-US' },
  matchMedia: () => ({ matches: false }),
  getComputedStyle: () => ({ getPropertyValue: (name) => (name === '--is-dark-theme' && darkTheme ? '1' : '') }),
  setInterval() {}, setTimeout() {}, clearTimeout() {},
  confirm: () => true,
  document: {
    body: { dataset: {}, style: { setProperty() {} } },
    documentElement: { style: {} },
    visibilityState: 'visible',
    addEventListener() {},
    getElementById: element,
    querySelectorAll: () => [],
    createElement: () => ({ textContent: '', get innerHTML() { return String(this.textContent).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\u00a0/g, '&nbsp;'); } }),
  },
  window: { parent: { postMessage: (data) => { postedDownload = data; } } },
  PluginAPI: {
    cfg: { platform: 'desktop', lang: { code: 'en' } },
    loadSyncedData: async (key) => persisted.get(key) || null,
    persistDataSynced: async (value, key) => persisted.set(key, value),
    getAllProjects: async () => [], getAllTags: async () => mockTags, getTasks: async () => [],
    addTag: async ({ title }) => { tagCreates++; mockTags.push({ id: 'course-tag', title }); return 'course-tag'; },
    addTask: async (task) => { addedTask = task; return 'sp-course-task'; },
    updateTask: async (id, task) => { updatedTask = { id, ...task }; },
    downloadFile: async (filename, data) => { hostDownload = { filename, data }; }, translate: async (key) => key, showSnack() {},
  },
};
runInNewContext(source, context, { filename: 'index.inline.js' });
const evaluate = (expression) => runInNewContext(expression, context);

context.hostileName = 'A" onmouseover="alert(1)';
assert.equal(evaluate('esc(hostileName)'), 'A&quot; onmouseover=&quot;alert(1)');
context.hostileName = "'><img src=x onerror=alert(1)>";
assert.equal(evaluate('esc(hostileName)'), '&#39;&gt;&lt;img src=x onerror=alert(1)&gt;');
assert.equal(evaluate("safeObsidianUrl('javascript:alert(1)')"), '');
assert.equal(evaluate("safeObsidianUrl('obsidian://open?vault=notes')"), 'obsidian://open?vault=notes');
evaluate('applySettings()');
assert.equal(context.document.documentElement.style.colorScheme, 'light', 'a light host theme keeps light form controls');
darkTheme = true;
evaluate('applySettings()');
assert.equal(context.document.documentElement.style.colorScheme, 'dark', 'a dark host theme switches form controls to dark');
darkTheme = false;
evaluate('applySettings()');
assert.equal(evaluate("weekdayFromText('Monday')"), 1);
assert.equal(evaluate("weekdayFromText('月曜日')"), 1);
assert.equal(evaluate("weekdayFromText('星期五')"), 5);
assert.deepEqual(Array.from(evaluate("parseWeekSpec('1~3,5~16周').weeks")), [1,2,3,5,6,7,8,9,10,11,12,13,14,15,16]);
assert.equal(evaluate("parseWeekSpec('单周').pattern"), 'odd');
assert.equal(evaluate("parseWeekSpec('双周').pattern"), 'even');
evaluate("settings.language = 'zh'");
assert.equal(evaluate("localText('UI.EVENT_EXAM')"), '考试');
assert.ok(evaluate("eventLabel({ type:'quiz', title:'测验' })").includes('小测'));
evaluate("pendingImport = { entries:[], corrected:2 }; renderImportPreview()");
assert.equal(element('import-summary').textContent, '有效 0 · 已修正 2 · 无效 0');
evaluate("settings.language = 'auto'; PluginAPI.cfg.lang.code = 'zh-CN'");
assert.equal(evaluate("localText('UI.NONE')"), '无');
evaluate("settings.language = 'en'; PluginAPI.cfg.lang.code = 'en'");
assert.equal(evaluate("localText('UI.EVENT_EXAM')"), 'Exam');
evaluate('pendingImport = null');
await evaluate("sendDownload('timetable.csv', 'course data', 'DOWNLOAD_TEXT')");
assert.deepEqual(hostDownload, { filename: 'timetable.csv', data: 'course data' });
delete context.PluginAPI.downloadFile;
await evaluate("sendDownload('bridge.json', '{\"ok\":true}', 'DOWNLOAD_TEXT')");
assert.equal(postedDownload.filename, 'bridge.json');
assert.equal(postedDownload.data, '{"ok":true}');
let messageHandler;
let bridgedHostDownload;
const pluginIframe = { contentWindow: {} };
const hostWindow = { addEventListener: (_, handler) => { messageHandler = handler; }, removeEventListener() {} };
runInNewContext(readFileSync(new URL('../plugin.js', import.meta.url), 'utf8'), {
  window: hostWindow,
  document: { querySelectorAll: (selector) => selector === 'iframe[data-plugin-id="study-courses"]' ? [pluginIframe] : [] },
  PluginAPI: { downloadFile: (filename, data) => { bridgedHostDownload = { filename, data }; } },
});
messageHandler({ data: postedDownload, source: pluginIframe.contentWindow });
assert.deepEqual(bridgedHostDownload, { filename: 'bridge.json', data: '{"ok":true}' });
bridgedHostDownload = null;
messageHandler({ data: postedDownload, source: {} });
assert.equal(bridgedHostDownload, null, 'a foreign window cannot trigger a download');
messageHandler({ data: postedDownload });
assert.equal(bridgedHostDownload, null, 'a message without a source cannot trigger a download');

const structured = readFileSync(new URL('./fixtures/structured.csv', import.meta.url), 'utf8').trimEnd();
context.structured = structured;
assert.equal(evaluate('rowsToCourses(parseCsv(structured)).length'), 2);
assert.equal(evaluate('rowsToCourses(parseCsv(structured))[0].name'), '现代软件工程');

const template = readFileSync(new URL('../course-import-template.csv', import.meta.url), 'utf8').trimEnd();
context.template = template;
context.templateCourses = evaluate('validateImportedCourses(rowsToCourses(parseCsv(template))).courses');
assert.equal(context.templateCourses.length, 3, 'the shipped CSV template imports');
assert.deepEqual(Array.from(context.templateCourses[2].weekdays), [1, 3], 'the template shows a multi-weekday course');

const grid = readFileSync(new URL('./fixtures/weekly.csv', import.meta.url), 'utf8').trimEnd();
context.grid = grid;
assert.ok(evaluate('rowsToCourses(parseCsv(grid)).length') >= 1);

evaluate("state.semester = { name: 'Test', startDate: '2026-09-07', weeks: 16 }");
evaluate("state.courses = [{ id:'short', name:'Same course', weekday:1, startTime:'09:00', endTime:'09:45', startWeek:1, endWeek:16, pattern:'every', customWeeks:[] }, { id:'long', name:'Same course', weekday:1, startTime:'09:00', endTime:'10:30', startWeek:1, endWeek:16, pattern:'every', customWeeks:[] }]");
assert.deepEqual(Array.from(evaluate('coursesForWeek(1).map((course) => course.id)')), ['long']);
assert.equal(evaluate('conflictIds(state.courses, 1).size'), 0);
assert.equal(evaluate('courseGroups()[0].representative.id'), 'long');
evaluate("state.courses.push({ id:'other', name:'Different course', weekday:1, startTime:'10:00', endTime:'11:00', startWeek:1, endWeek:16, pattern:'every', customWeeks:[] })");
assert.deepEqual(Array.from(evaluate('conflictIds(state.courses, 1)')).sort(), ['long', 'other']);
evaluate("settings.hiddenStats = ['UI.STAT_EARLY']");
assert.ok(!(await evaluate('statisticsHtml(1)')).includes('Early classes'));
assert.ok((await evaluate('statisticsHtml(1)')).includes('This week'));
evaluate('settings.hiddenStats = []');
evaluate("state.courses = [{ id:'a', name:'A', weekday:1, startTime:'09:00', endTime:'10:00', startWeek:1, endWeek:16, pattern:'every', customWeeks:[], color:'#3f51b5' }, { id:'b', name:'B', weekday:1, startTime:'09:30', endTime:'10:30', startWeek:1, endWeek:16, pattern:'every', customWeeks:[], color:'#3f51b5' }]");
assert.ok(evaluate("buildCsv().startsWith('name,teacher,location,weekday')"));
assert.ok(evaluate("buildCsv().includes('\\\"A\\\"')"));
assert.ok(evaluate("JSON.stringify({ ...state, settings }).includes('\\\"courses\\\"')"));
assert.equal(evaluate('conflictIds(state.courses, 1).size'), 2);
assert.equal(evaluate('weekStatistics(1).totalMinutes'), 120);
evaluate("state.courses[0].taskPrefix = '[A]'; state.courses[0].tagIds = ['tag-one']");
assert.equal(evaluate('taskForCourse(state.courses[0]).tagIds[0]'), 'tag-one');
await evaluate('syncCourseGroup(courseGroups()[0])');
assert.deepEqual(Array.from(addedTask.tagIds), ['tag-one', 'course-tag']);
assert.equal(tagCreates, 1);
await evaluate('syncCourseGroup(courseGroups()[0])');
assert.ok(updatedTask.tagIds.includes('course-tag'));
assert.equal(tagCreates, 1, 'existing category tag is reused');
evaluate('tags = []; PluginAPI.getAllTags = undefined; PluginAPI.addTag = undefined');
assert.deepEqual(Array.from(await evaluate('courseTaskTagIds(state.courses[0])')), ['tag-one'], 'tag API fallback keeps selected tags');
evaluate("state.exceptions = [{ id:'x', courseId:'a', week:1, cancelled:true }]");
assert.equal(evaluate('conflictIds(state.courses, 1).size'), 0);
assert.equal(evaluate('weekStatistics(1).totalMinutes'), 60);
assert.equal(evaluate('occurrenceFor(state.courses[0], 1)'), null);
evaluate("state.exceptions = [{ id:'x', courseId:'a', week:1, cancelled:false, weekday:2, startTime:'14:00', endTime:'15:00', location:'New room' }]");
assert.equal(evaluate('occurrenceFor(state.courses[0], 1).course.weekday'), 2);
assert.ok(evaluate("buildIcs().includes('20260908T140000')"));

await evaluate('save()');
assert.ok(JSON.parse(persisted.get('courses')).semesters.default.exceptions.length === 1);
const beforePreview = persisted.get('courses');
await evaluate('addImportedCourses(rowsToCourses(parseCsv(structured + "\\n现代软件工程,吴老师,文附楼211,周一,09:50,11:25,1,16")))');
assert.equal(evaluate('pendingImport.entries.length'), 3);
assert.equal(evaluate('pendingImport.entries[0].conflict'), true);
assert.equal(evaluate('pendingImport.entries[2].duplicate'), true);
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
evaluate("state.courses[1].startTime = '08:00'; settings.courseSort = 'time'");
assert.deepEqual(Array.from(evaluate('sortedCourseGroups().map((group) => group.key)')), ['b', 'a']);
evaluate("settings.courseSort = 'name'");
assert.deepEqual(Array.from(evaluate('sortedCourseGroups().map((group) => group.key)')), ['a', 'b']);

// Multi-weekday courses: one stored record, one occurrence per selected day.
const multiCourse = "{ id:'multi', name:'Multi', weekday:1, weekdays:[1,3], startTime:'08:00', endTime:'09:40', startWeek:1, endWeek:16, pattern:'every', customWeeks:[], color:'#3f51b5', location:'A101' }";
evaluate(`state.exceptions = []; state.courses = [${multiCourse}]`);
assert.deepEqual(Array.from(evaluate('courseWeekdays(state.courses[0])')), [1, 3]);
assert.deepEqual(Array.from(evaluate('coursesForWeek(1).map((course) => course.weekday)')), [1, 3]);
assert.deepEqual(Array.from(evaluate('coursesForWeek(2).map((course) => course.weekday)')), [1, 3]);
assert.equal(evaluate('weekStatistics(1).totalMinutes'), 200, 'both weekly occurrences count');
context.multiIcs = evaluate('buildIcs()');
assert.equal((context.multiIcs.match(/BEGIN:VEVENT/g) || []).length, 32, 'two events for each of the 16 teaching weeks');
assert.ok(context.multiIcs.includes('DTSTART:20260907T080000'), 'Monday occurrence in the calendar');
assert.ok(context.multiIcs.includes('DTSTART:20260909T080000'), 'Wednesday occurrence in the calendar');
assert.ok(context.multiIcs.includes('UID:multi-1-1@super-productivity') && context.multiIcs.includes('UID:multi-1-3@super-productivity'), 'multi-day events keep distinct UIDs');
// A single-weekday record keeps the UID its earlier exports already published.
evaluate("state.courses = [{ id:'single', name:'Single', weekday:1, startTime:'08:00', endTime:'09:40', startWeek:1, endWeek:16, pattern:'every', customWeeks:[], color:'#3f51b5' }]");
assert.ok(evaluate('buildIcs()').includes('UID:single-1@super-productivity'));
// A class exception covers the whole course in its teaching week.
evaluate(`state.courses = [${multiCourse}]; state.exceptions = [{ id:'x', courseId:'multi', week:1, cancelled:true }]`);
assert.equal(evaluate('coursesForWeek(1).length'), 0);
evaluate("state.exceptions = [{ id:'x', courseId:'multi', week:1, cancelled:false, weekday:5, startTime:'14:00', endTime:'15:00' }]");
assert.deepEqual(Array.from(evaluate('coursesForWeek(1).map((course) => course.weekday)')), [5]);
evaluate('state.exceptions = []');
// Different weekdays never conflict; a shared weekday still does.
evaluate("state.courses = [{ id:'a', name:'A', weekday:1, weekdays:[1,3], startTime:'09:00', endTime:'10:00', startWeek:1, endWeek:16, pattern:'every', customWeeks:[], color:'#3f51b5' }, { id:'b', name:'B', weekday:2, weekdays:[2], startTime:'09:00', endTime:'10:00', startWeek:1, endWeek:16, pattern:'every', customWeeks:[], color:'#3f51b5' }]");
assert.equal(evaluate('conflictIds(state.courses, 1).size'), 0, 'Tuesday and Monday+Wednesday do not conflict');
evaluate('state.courses[1].weekdays = [3]');
assert.deepEqual(Array.from(evaluate('conflictIds(state.courses, 1)')).sort(), ['a', 'b']);
// Dropping a shorter same-name overlap must not drop that course's other days.
evaluate("state.courses = [{ id:'x1', name:'Same', weekday:1, weekdays:[1,3], startTime:'09:00', endTime:'09:30', startWeek:1, endWeek:16, pattern:'every', customWeeks:[], color:'#3f51b5' }, { id:'x2', name:'Same', weekday:1, startTime:'09:00', endTime:'10:30', startWeek:1, endWeek:16, pattern:'every', customWeeks:[], color:'#3f51b5' }]");
assert.deepEqual(Array.from(evaluate('coursesForWeek(1).map((course) => `${course.id}:${course.weekday}`)')), ['x2:1', 'x1:3']);
context.overlapIcs = evaluate('buildIcs()');
assert.ok(context.overlapIcs.includes('UID:x2-1@super-productivity'), 'the retained Monday overlap is exported');
assert.ok(context.overlapIcs.includes('UID:x1-1-3@super-productivity'), 'the dropped Monday overlap keeps its Wednesday event');
assert.ok(!context.overlapIcs.includes('UID:x1-1-1@super-productivity'), 'the shorter Monday overlap is excluded from ICS');
// A weekday list in one import column becomes one multi-day course.
context.listCsv = 'name,teacher,location,weekday,start time,end time,start week,end week\nDesign,Wu,A101,"Mon,Wed",08:00,09:40,1,16';
context.listed = evaluate('validateImportedCourses(rowsToCourses(parseCsv(listCsv)))');
assert.equal(context.listed.courses.length, 1);
assert.deepEqual(Array.from(context.listed.courses[0].weekdays), [1, 3]);
assert.equal(context.listed.courses[0].weekday, 1);
evaluate(`state.courses = [${multiCourse}]; settings.courseSort = 'time'`);
assert.ok(evaluate('buildCsv()').includes('"1,3"'), 'CSV export writes the weekday list');
// The course dialog round-trips every selected day.
evaluate('openCourse(null)');
assert.deepEqual(Array.from(element('weekday').selectedOptions).map((option) => option.value), ['1']);
evaluate('openCourse(state.courses[0])');
assert.deepEqual(Array.from(element('weekday').selectedOptions).map((option) => option.value), ['1', '3']);
element('course-id').value = '';
element('course-name').value = 'Saved multi';
element('start-time').value = '08:00';
element('end-time').value = '09:40';
element('start-week').value = '1';
element('end-week').value = '16';
await evaluate("$('course-form').onsubmit({ preventDefault() {} })");
const saved = evaluate("state.courses.find((course) => course.name === 'Saved multi')");
assert.deepEqual(Array.from(saved.weekdays), [1, 3]);
assert.equal(saved.weekday, 1, 'the first selected day stays readable to older plugin builds');
console.log('parser, preview, conflicts, exceptions, ICS, synced persistence smoke passed');

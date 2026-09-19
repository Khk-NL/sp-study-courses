import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { readFileSync, mkdtempSync, rmSync } from 'node:fs';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { promisify } from 'node:util';
import { deflateRawSync } from 'node:zlib';

function zip(files) {
  const local = [], central = []; let offset = 0;
  for (const [name, content] of Object.entries(files)) {
    const path = Buffer.from(name), plain = Buffer.from(content), compressed = deflateRawSync(plain);
    const header = Buffer.alloc(30); header.writeUInt32LE(0x04034b50); header.writeUInt16LE(20, 4); header.writeUInt16LE(8, 8); header.writeUInt32LE(compressed.length, 18); header.writeUInt32LE(plain.length, 22); header.writeUInt16LE(path.length, 26);
    local.push(header, path, compressed);
    const directory = Buffer.alloc(46); directory.writeUInt32LE(0x02014b50); directory.writeUInt16LE(20, 4); directory.writeUInt16LE(20, 6); directory.writeUInt16LE(8, 10); directory.writeUInt32LE(compressed.length, 20); directory.writeUInt32LE(plain.length, 24); directory.writeUInt16LE(path.length, 28); directory.writeUInt32LE(offset, 42);
    central.push(directory, path); offset += header.length + path.length + compressed.length;
  }
  const centralSize = central.reduce((sum, item) => sum + item.length, 0);
  const footer = Buffer.alloc(22); footer.writeUInt32LE(0x06054b50); footer.writeUInt16LE(Object.keys(files).length, 8); footer.writeUInt16LE(Object.keys(files).length, 10); footer.writeUInt32LE(centralSize, 12); footer.writeUInt32LE(offset, 16);
  return Buffer.concat([...local, ...central, footer]).toString('base64');
}

const workbook = zip({
  'xl/workbook.xml': '<workbook xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Notes" r:id="rId1"/><sheet name="Timetable" r:id="rId2"/></sheets></workbook>',
  'xl/_rels/workbook.xml.rels': '<Relationships><Relationship Id="rId1" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Target="worksheets/sheet2.xml"/></Relationships>',
  'xl/worksheets/sheet1.xml': '<worksheet><sheetData><row r="1"><c r="A1" t="inlineStr"><is><t>Notes</t></is></c></row></sheetData></worksheet>',
  'xl/worksheets/sheet2.xml': '<worksheet><sheetData><row r="1"><c r="A1" t="inlineStr"><is><t>节次</t></is></c><c r="B1" t="inlineStr"><is><t>Monday</t></is></c><c r="C1" t="inlineStr"><is><t>Tuesday</t></is></c></row><row r="2"><c r="A2"><v>1</v></c><c r="B2" t="inlineStr"><is><t>Software Engineering 1~3周</t></is></c></row><row r="3"><c r="A3"><v>2</v></c></row></sheetData><mergeCells><mergeCell ref="B2:B3"/></mergeCells></worksheet>',
});
const word = zip({
  'word/document.xml': '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:tbl><w:tr><w:tc><w:p><w:r><w:t>节次</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:t>周一</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:t>周二</w:t></w:r></w:p></w:tc></w:tr><w:tr><w:tc><w:p><w:r><w:t>1</w:t></w:r></w:p></w:tc><w:tc><w:tcPr><w:vMerge w:val="restart"/></w:tcPr><w:p><w:r><w:t>Statistics 1~8周</w:t></w:r></w:p></w:tc><w:tc><w:p/></w:tc></w:tr><w:tr><w:tc><w:p><w:r><w:t>2</w:t></w:r></w:p></w:tc><w:tc><w:tcPr><w:vMerge/></w:tcPr><w:p/></w:tc><w:tc><w:p/></w:tc></w:tr></w:tbl></w:body></w:document>',
});
const stub = `<script>window.__pluginErrors=[];window.addEventListener('error',event=>window.__pluginErrors.push(event.message));window.addEventListener('unhandledrejection',event=>window.__pluginErrors.push(String(event.reason)));window.PluginAPI={cfg:{platform:'desktop',lang:{code:'en'}},loadSyncedData:async()=>null,persistDataSynced:async()=>{},getAllProjects:async()=>[],getTasks:async()=>[],translate:async key=>key,showSnack:()=>{}};</script>`;
const htmlFixture = readFileSync(new URL('./fixtures/timetable.html', import.meta.url), 'utf8');
const exercise = `<script>(async()=>{try{const decode=x=>Uint8Array.from(atob(x),c=>c.charCodeAt(0)).buffer;const x=await parseXlsx(decode('${workbook}'));const d=await parseDocx(decode('${word}'));const h=parseHtml(${JSON.stringify(htmlFixture)});if(x.length!==1||d.length!==1||h.length!==1)throw Error('wrong course count '+x.length+'/'+d.length+'/'+h.length);if(x[0].weekday!==1||d[0].weekday!==1||h[0].weekday!==1)throw Error('wrong weekday');document.body.insertAdjacentHTML('beforeend','<pre id="office-smoke">PASS XLSX DOCX HTML merged cells multi-sheet</pre>')}catch(error){document.body.insertAdjacentHTML('beforeend','<pre id="office-smoke">FAIL '+error.stack+'</pre>')}})()</script>`;
const mobileExercise = `<script>setTimeout(async()=>{try{if(!isMobile())throw Error('mobile layout not detected');if(activeView!=='today')throw Error('Today is not the default view');if(getComputedStyle(document.querySelector('.bottom-nav')).display!=='grid')throw Error('bottom nav hidden');state.semester={name:'Test',startDate:'2026-09-07',weeks:16};selectedWeek=1;state.courses=[{id:'a',name:'Alpha',weekday:1,startTime:'09:00',endTime:'10:00',startWeek:1,endWeek:16,pattern:'every',customWeeks:[],color:'#3b82f6'},{id:'b',name:'Beta',weekday:3,startTime:'14:00',endTime:'15:00',startWeek:1,endWeek:16,pattern:'every',customWeeks:[],color:'#3b82f6'}];activeView='timetable';await render();const days=[...document.querySelectorAll('#timetable .day')];const names=days.map(el=>el.querySelector('strong')?.textContent).join(',');if(days.length!==2)throw Error('mobile timetable shows '+days.length+' day(s) instead of the 2 with classes');if(!names.includes('Alpha')||!names.includes('Beta'))throw Error('mobile timetable missed a course: '+names);document.body.insertAdjacentHTML('beforeend','<pre id="mobile-smoke">PASS mobile Today and week timetable</pre>')}catch(error){document.body.insertAdjacentHTML('beforeend','<pre id="mobile-smoke">FAIL '+error.stack+'</pre>')}},100)</script>`;
const courseListExercise = `<script>setTimeout(async()=>{if(isMobile())return;try{state.semester={name:'Test',startDate:'2026-09-07',weeks:16};selectedWeek=1;state.courses=[{id:'a',name:'Alpha',weekday:1,startTime:'14:00',endTime:'15:00',startWeek:1,endWeek:16,pattern:'every',customWeeks:[],color:'#3b82f6'},{id:'b',name:'Beta',weekday:1,startTime:'09:00',endTime:'10:00',startWeek:1,endWeek:16,pattern:'every',customWeeks:[],color:'#3b82f6'}];activeView='timetable';settings.courseSort='time';await render();const order=()=>[...document.querySelectorAll('#courses .course')].map(el=>el.dataset.courseGroup).join(',');if(order()!=='beta,alpha')throw Error('time sort: '+order());document.querySelector('#timetable [data-course-id="a"]').click();if(!document.querySelector('#courses [data-course-group="alpha"]').classList.contains('course-jump-highlight'))throw Error('course jump failed');$('course-sort').value='name';await $('course-sort').onchange();if(order()!=='alpha,beta')throw Error('name sort: '+order());if(getComputedStyle(document.querySelector('.course-bottom')).display!=='grid')throw Error('course layout failed');const menus=[...document.querySelectorAll('.course-more')];if(menus.length!==2)throw Error('expected two More menus, got '+menus.length);menus[0].open=true;menus[1].querySelector('summary').click();if(menus[0].open)throw Error('the previously open More menu stayed open');document.body.insertAdjacentHTML('beforeend','<pre id="course-list-smoke">PASS course list layout sorting jump</pre>')}catch(error){document.body.insertAdjacentHTML('beforeend','<pre id="course-list-smoke">FAIL '+error.stack+'</pre>')}},200)</script>`;
const mergedJumpExercise = `<script>setTimeout(async()=>{if(isMobile())return;try{settings.mergeNames=true;state.courses.push({...state.courses[0],id:'c',startTime:'16:00',endTime:'17:00'});await render();document.querySelector('#timetable [data-course-id="c"]').click();if(!document.querySelector('#courses [data-course-group="alpha"]').classList.contains('course-jump-highlight'))throw Error('merged course jump failed');document.body.insertAdjacentHTML('beforeend','<pre id="merged-jump-smoke">PASS merged course jump</pre>')}catch(error){document.body.insertAdjacentHTML('beforeend','<pre id="merged-jump-smoke">FAIL '+error.stack+'</pre>')}},500)</script>`;
const packagedExercise = `<script>setTimeout(()=>{try{if(window.__pluginErrors.length)throw Error(window.__pluginErrors.join('; '));if(matchMedia('(max-width:680px)').matches){if(document.querySelector('#view-today').hidden)throw Error('mobile Today view hidden')}else if(!document.querySelector('#timetable .day'))throw Error('timetable did not render');if(!document.querySelector('#course-sort'))throw Error('course sorting control missing');if(getComputedStyle(document.querySelector('dialog')).backgroundColor!=='rgb(255, 255, 255)')throw Error('dialog is not white');document.body.insertAdjacentHTML('beforeend','<pre id="package-smoke">PASS packaged plugin renders</pre>')}catch(error){document.body.insertAdjacentHTML('beforeend','<pre id="package-smoke">FAIL '+error.stack+'</pre>')}},300)</script>`;
// Dark values are the real ones from Super Productivity's dark-base theme:
// --card-bg #141414 and --text-color-muted rgba(224,224,224,.54), the off-white
// that was unreadable on the hardcoded white dialog reported in issue #4.
const darkThemeCss = `<style>:root{--bg:#0a0a0a;--bg-lighter:#1a1a1a;--card-bg:#141414;--text-color:#e0e0e0;--text-color-muted:rgba(224, 224, 224, 0.54);--divider-color:#3a3a3a;--is-dark-theme:1}label{color:var(--text-color-muted)}</style>`;
const darkExercise = `<script>setTimeout(()=>{try{const parse=(c)=>{const n=(c.match(/[\\d.]+/g)||[0,0,0,1]).map(Number);return [n[0],n[1],n[2],n[3]===undefined?1:n[3]]};const over=(fg,bg)=>[0,1,2].map((i)=>fg[i]*fg[3]+bg[i]*(1-fg[3]));const lum=(rgb)=>{const [r,g,b]=rgb.map((v)=>{v/=255;return v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4)});return 0.2126*r+0.7152*g+0.0722*b};const contrast=(a,b)=>{const x=lum(a),y=lum(b);return (Math.max(x,y)+0.05)/(Math.min(x,y)+0.05)};const panel=document.getElementById('settings-dialog');panel.showModal();const panelStyle=getComputedStyle(panel);const bg=parse(panelStyle.backgroundColor);if(bg.slice(0,3).join()!=='20,20,20')throw Error('settings dialog background is '+panelStyle.backgroundColor);if(panelStyle.color!=='rgb(224, 224, 224)')throw Error('settings dialog text is '+panelStyle.color);if(getComputedStyle(document.getElementById('course-name')).backgroundColor!=='rgb(20, 20, 20)')throw Error('input background is '+getComputedStyle(document.getElementById('course-name')).backgroundColor);const labelStyle=getComputedStyle(panel.querySelector('label'));const ratio=contrast(over(parse(labelStyle.color),bg),bg);if(ratio<4.5)throw Error('settings label contrast is '+ratio.toFixed(2)+' ('+labelStyle.color+' on '+panelStyle.backgroundColor+')');if(document.documentElement.style.colorScheme!=='dark')throw Error('color-scheme is '+document.documentElement.style.colorScheme);document.body.insertAdjacentHTML('beforeend','<pre id="dark-smoke">PASS dark theme adaptation and settings contrast '+ratio.toFixed(2)+'</pre>')}catch(error){document.body.insertAdjacentHTML('beforeend','<pre id="dark-smoke">FAIL '+error.stack+'</pre>')}},300)</script>`;
const source = readFileSync(process.argv[2] || new URL('../index.html', import.meta.url), 'utf8');
const packaged = Boolean(process.argv[2]);
const page = source.replace('<script>', `${stub}<script>`).replace('</body>', `${packaged ? packagedExercise : exercise + mobileExercise + courseListExercise + mergedJumpExercise}</body>`);
const darkPage = source.replace('<script>', `${stub}<script>`).replace('</head>', `${darkThemeCss}</head>`).replace('</body>', `${darkExercise}</body>`);
const server = createServer((request, response) => { response.setHeader('Content-Type', 'text/html; charset=utf-8'); response.end(request.url.includes('dark') ? darkPage : page); });
await new Promise((done) => server.listen(0, '127.0.0.1', done));
const profile = mkdtempSync(join(tmpdir(), 'sp-study-courses-browser-smoke-'));
// --dump-dom returns the exercise <script> verbatim, so a bare /PASS .../ match
// would also hit the literal PASS string in that source and pass even when the
// exercise threw. Drop script bodies, then require the rendered marker.
const domOnly = (dump) => dump.replace(/<script[\s\S]*?<\/script>/g, '');
const expectMarker = (dump, id, label) => {
  const dom = domOnly(dump);
  const marker = dom.match(new RegExp(`<pre id="${id}">([^<]*)</pre>`));
  if (marker && marker[1].startsWith('PASS')) return;
  const seen = [...dom.matchAll(/<pre id="([^"]+)">([^<]*)/g)].map((m) => `${m[1]}=${m[2].slice(0, 60)}`);
  assert.fail(`${label} failed: ${marker ? marker[1] : `no #${id} marker (saw: ${seen.join(' | ') || 'none'})`}`);
};
try {
  const browser = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const { stdout } = await promisify(execFile)(browser, ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', `--user-data-dir=${profile}`, '--virtual-time-budget=10000', '--dump-dom', `http://127.0.0.1:${server.address().port}/`], { maxBuffer: 4 * 1024 * 1024, timeout: 30000 });
  if (packaged) expectMarker(stdout, 'package-smoke', 'packaged plugin');
  else {
    expectMarker(stdout, 'office-smoke', 'Office and HTML import');
    expectMarker(stdout, 'course-list-smoke', 'course list');
    expectMarker(stdout, 'merged-jump-smoke', 'merged course jump');
  }
  const mobile = await promisify(execFile)(browser, ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--window-size=390,844', `--user-data-dir=${profile}`, '--virtual-time-budget=10000', '--dump-dom', `http://127.0.0.1:${server.address().port}/`], { maxBuffer: 4 * 1024 * 1024, timeout: 30000 });
  if (!packaged) expectMarker(mobile.stdout, 'mobile-smoke', 'mobile layout');
  else expectMarker(mobile.stdout, 'package-smoke', 'packaged plugin on mobile');
  const dark = await promisify(execFile)(browser, ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', `--user-data-dir=${profile}`, '--virtual-time-budget=10000', '--dump-dom', `http://127.0.0.1:${server.address().port}/dark`], { maxBuffer: 4 * 1024 * 1024, timeout: 30000 });
  expectMarker(dark.stdout, 'dark-smoke', 'dark theme');
  console.log(packaged ? 'packaged plugin desktop/mobile/dark smoke passed' : 'browser Office, HTML, mobile and dark smoke passed');
} finally {
  server.close();
  if (resolve(profile).startsWith(resolve(tmpdir()) + '\\') && profile.includes('sp-study-courses-browser-smoke-')) rmSync(profile, { recursive: true, force: true });
}

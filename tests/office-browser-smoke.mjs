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
const stub = `<script>window.PluginAPI={cfg:{platform:'desktop',lang:{code:'en'}},loadSyncedData:async()=>null,persistDataSynced:async()=>{},getAllProjects:async()=>[],getTasks:async()=>[],translate:async key=>key,showSnack:()=>{}};</script>`;
const exercise = `<script>(async()=>{try{const decode=x=>Uint8Array.from(atob(x),c=>c.charCodeAt(0)).buffer;const x=await parseXlsx(decode('${workbook}'));const d=await parseDocx(decode('${word}'));const h=parseHtml('<table><tr><td>unrelated</td></tr></table><table><tr><th>节次</th><th>Monday</th><th>Tuesday</th></tr><tr><td>1</td><td rowspan="2">Physics 1~8周<br>Room 101</td><td></td></tr><tr><td>2</td><td></td></tr></table>');if(x.length!==1||d.length!==1||h.length!==1)throw Error('wrong course count '+x.length+'/'+d.length+'/'+h.length);if(x[0].weekday!==1||d[0].weekday!==1||h[0].weekday!==1)throw Error('wrong weekday');document.body.insertAdjacentHTML('beforeend','<pre id="office-smoke">PASS XLSX DOCX HTML merged cells multi-sheet</pre>')}catch(error){document.body.insertAdjacentHTML('beforeend','<pre id="office-smoke">FAIL '+error.stack+'</pre>')}}</script>`;
const mobileExercise = `<script>setTimeout(async()=>{try{if(!isMobile())throw Error('mobile layout not detected');if(activeView!=='today')throw Error('Today is not the default view');if(getComputedStyle(document.querySelector('.bottom-nav')).display!=='grid')throw Error('bottom nav hidden');activeView='timetable';await render();if(document.querySelectorAll('#timetable .day').length!==1)throw Error('mobile timetable is not single-day');document.body.insertAdjacentHTML('beforeend','<pre id="mobile-smoke">PASS mobile Today and single-day timetable</pre>')}catch(error){document.body.insertAdjacentHTML('beforeend','<pre id="mobile-smoke">FAIL '+error.stack+'</pre>')}},100)</script>`;
const source = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const page = source.replace('<script>', `${stub}<script>`).replace('</body>', `${exercise}${mobileExercise}</body>`);
const server = createServer((request, response) => { response.setHeader('Content-Type', 'text/html; charset=utf-8'); response.end(page); });
await new Promise((done) => server.listen(0, '127.0.0.1', done));
const profile = mkdtempSync(join(tmpdir(), 'sp-study-courses-browser-smoke-'));
try {
  const browser = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const { stdout } = await promisify(execFile)(browser, ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', `--user-data-dir=${profile}`, '--virtual-time-budget=10000', '--dump-dom', `http://127.0.0.1:${server.address().port}/`], { maxBuffer: 4 * 1024 * 1024, timeout: 30000 });
  assert.match(stdout, /PASS XLSX DOCX HTML merged cells multi-sheet/);
  const mobile = await promisify(execFile)(browser, ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--window-size=390,844', `--user-data-dir=${profile}`, '--virtual-time-budget=10000', '--dump-dom', `http://127.0.0.1:${server.address().port}/`], { maxBuffer: 4 * 1024 * 1024, timeout: 30000 });
  assert.match(mobile.stdout, /PASS mobile Today and single-day timetable/);
  console.log('browser Office and HTML import smoke passed');
  console.log('browser mobile viewport smoke passed');
} finally {
  server.close();
  if (resolve(profile).startsWith(resolve(tmpdir()) + '\\') && profile.includes('sp-study-courses-browser-smoke-')) rmSync(profile, { recursive: true, force: true });
}

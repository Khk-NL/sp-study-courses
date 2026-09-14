# Student Course Workbench Requirements

## 1. Product goal

Turn `sp-study-courses` from a timetable viewer into a student course workbench while preserving the existing iframe-plugin architecture and Super Productivity (SP) Core.

Core principles:

- Keep existing course import, semester, current/next class, SP sync, ICS, parser, theme, and bilingual behavior.
- Use `PluginAPI` only for SP integration; do not patch SP Core.
- Store all non-secret user data through `persistDataSynced` and reload it through `loadSyncedData`.
- Keep the plugin self-contained and browser-compatible. Do not depend on Electron, Node.js, or desktop-only APIs for core functions.
- Validate and preview imports before changing saved data.
- Feature-detect optional platform capabilities and degrade without breaking the whole plugin.

## 2. Data model

### Semester

- Multiple semesters, one active semester.
- Name, first Monday, total teaching weeks.
- Contains courses, assignments, course events, and class exceptions.
- Home screen shows only current semester plus New, Edit, and Clear actions.

### Course

- Name, teacher, location, weekday, start/end time.
- Start/end week and every/odd/even/custom weeks.
- Default project, task-title prefix, color, Obsidian URL, and optional tag IDs.
- May link to one primary synced SP task and multiple related SP tasks.

### Course event

- Course ID, title, type, date/time, notes, optional SP task ID.
- Types: assignment, exam, quiz, report, presentation, custom.

### Class exception

- Course ID and teaching week.
- Cancelled flag or overridden weekday, time, location, and teacher.
- Must affect timetable, current/next matching, plan, today, conflict detection, ICS, and statistics.

## 3. Workspace views

### Timetable

- Top-level `Timetable | Plan | Today` navigation.
- Desktop week timeline uses real clock positions and keeps free gaps.
- Show current-time line and highlight the active course.
- Place overlapping classes side by side and warn about conflicts.
- Offer compact list fallback.
- Timetable cards jump to their matching course-list card, including merged-name groups; course-list cards place details at lower left and actions on the right.
- Sort the course list by weekday/start time or by course name, and sync the selected display preference.

### Plan

- Semantic chronological view combining classes, SP tasks, assignments, exams, quizzes, reports, presentations, DDLs, and custom events.
- Associate SP tasks using course ID, saved task mappings, project ID, notes, and course name/title matching.
- Nest related tasks under the course when possible; keep unassociated tasks in the day stream.

### Today

- Current class, next class, all classes today, remaining classes, today's SP tasks, today's DDLs, and upcoming events.
- Prominent course-note link when an Obsidian URL exists.
- Default mobile entry view.

## 4. SP task integration

- Read existing SP tasks with `getTasks` when available.
- A course can show multiple related tasks and an unfinished count.
- Add assignments/tasks from a course card.
- Save `courseId <-> taskId` associations in synced plugin data.
- Update a mapped course task after course information changes.
- Inherit course project, title prefix, and optional tag IDs.
- Synced course plans and course assignments also carry a shared `课程` SP tag when tag APIs are available; reuse an existing tag before creating one.
- Never delete SP tasks when deleting plugin data.

## 5. Import pipeline

All sources convert to one Grid or structured-course representation, then reuse weekday, period, course-cell, week-spec, cleaning, validation, duplicate, and conflict logic.

### Supported inputs

- Pasted web timetable: prefer clipboard HTML, then plain text.
- CSV and TSV: weekly grids plus legacy one-course-per-row files.
- HTML: multiple tables, `rowspan`, `colspan`, `<br>`, Chinese/English weekdays, and common timetable layouts.
- XLSX: cell values, merged cells, row/column layout, and multiple sheets.
- DOCX: Word tables first, including merged cells and paragraph breaks; simple structured paragraphs as fallback.
- Image-only DOCX is not OCRed and must return a clear message.
- PDF and image imports are not primary supported formats.

### Import preview

- Never save immediately after parsing.
- Show course name, weekday, time, weeks, teacher, and location.
- Mark valid, duplicate, conflicting, invalid, and auto-corrected rows.
- Allow the user to include/exclude individual rows before confirmation.
- Desktop uses a table; mobile uses readable course cards.
- If several workbook sheets/tables are plausible, choose the best score and allow selection when useful.

### Accepted week expressions

- `1周`, `1~8周`, `1,3,5周`, `1~3,5~16周`, odd weeks, even weeks, and one-off weeks.

### Accepted weekday expressions

- `周一`, `星期一`, `Monday`, `Mon`, `月曜日`, numeric weekday labels, and equivalent supported days.

## 6. Conflict detection

- Compare courses only when they occur in the same teaching week and weekday.
- Detect time interval overlap after applying class exceptions.
- Warn during manual save and import preview, but allow explicit confirmation.

## 7. Import and export operations

- Import menu: Paste Web Timetable, XLSX, CSV/TSV, HTML, DOCX.
- Export menu: ICS, CSV, JSON.
- ICS includes class exceptions/cancellations.
- CSV supports exchange and inspection.
- JSON contains complete semester, course, event, exception, mapping, template, and settings data.

## 8. Help center

Bilingual in-app help must include:

- Six-step quick start.
- Supported import methods and their limitations.
- Week and weekday examples.
- Semester management and clearing behavior.
- SP course/task mapping and update behavior.
- ICS/CSV/JSON exports.
- Troubleshooting for missing courses, missing weeks, HTML/DOCX failures, conflicts, rescheduling, and cancellations.

## 9. Mobile plugin compatibility

### Installation versus data sync

- Plugin code is installed separately on each device unless SP adds an official synced-install mechanism.
- Never implement remote executable-code auto-download.
- After the same plugin ID is installed, semesters, courses, events, exceptions, task mappings, and settings sync through SP plugin data.
- Documentation must state: install the plugin once per device; user data then follows normal SP synchronization.

### Platform behavior

- Iframe UI and filtered Plugin API are the portable contract.
- Feature-detect file inputs, downloads, clipboard event data, task APIs, dialogs, hooks, and URL opening.
- File import fallback: paste timetable or choose a simpler CSV/HTML file.
- Clipboard fallback: visible textarea when clipboard HTML is unavailable.
- Download fallback: show/copy generated text or use browser Blob download when host download fails.
- Obsidian fallback: show/copy the URL if the OS does not handle `obsidian://`.
- XLSX/DOCX parsers must be self-contained; remote CDN availability cannot be a core dependency.
- Uploaded/community plugin installation is a trust-sensitive manual action.

Official references:

- https://github.com/super-productivity/super-productivity/blob/master/docs/plugin-development.md
- https://github.com/super-productivity/super-productivity/blob/master/packages/plugin-api/README.md
- https://github.com/super-productivity/super-productivity/blob/master/docs/wiki/2.15-Develop-a-Plugin.md

## 10. Mobile UX

- Breakpoints cover narrow phone, phone landscape, tablet, and desktop.
- Mobile defaults to Today; timetable defaults to a single-day or compact list view.
- Bottom navigation: Today, Timetable, Plan, Courses.
- Mobile top bar keeps Add Course and Import; Export, Sync, Help, and Settings move into More.
- Plan becomes a vertical chronological stream.
- Dialogs become full-screen/bottom-sheet-like and forms become one column.
- Preview becomes selectable course cards instead of a wide table.
- Course cards expand before exposing destructive/secondary actions.
- Touch targets are at least approximately 44 px and no feature depends on hover.
- Render only the current day/week/plan range.

## 11. Statistics and course templates

- Weekly and daily class hours, early classes, late classes, semester progress, busiest and freest periods.
- Keep calculations lightweight and based on resolved class occurrences.
- Course defaults flow into new SP course tasks and assignments.

## 12. Tests

Parser fixtures must cover:

- Structured CSV, weekly CSV/TSV, HTML, XLSX, DOCX.
- `rowspan`/`colspan` and spreadsheet merged cells.
- Chinese, English, Japanese, and numeric weekday labels.
- Odd/even weeks, `1~3,5~16周`, and one-week classes.
- Broken-line times, duplicates, conflicts, cancellations, and rescheduling.
- Legacy state migration and synced multi-semester round trips.

## 13. Delivery and versioning

- Group changes into independently usable releases.
- Update manifest and package versions together.
- Run syntax, JSON, parser, state-migration, and focused UI smoke checks before each push.
- Release ZIPs must contain the built `dist/index.html`, and CI must reject a packaged iframe file of 100,000 bytes or more.
- Push normal fast-forward commits to `main`; never overwrite remote history with force push.

Planned release groups:

1. `2.1.x`: workspace views, SP task association, events, exceptions, conflicts, and preview foundation.
2. `2.2.x`: self-contained XLSX/DOCX import and import-source selection.
3. `2.3.x`: complete help center, mobile fallbacks, and responsive/mobile navigation.
4. `2.4.x`: templates, statistics, Obsidian refinements, fixtures, and maintenance cleanup.

## 14. Mobile compatibility audit (2026-09-13)

This matrix separates the documented SP interface from actual Android verification. A narrow-screen desktop WebView test is useful evidence for layout, not proof of Android installation or Capacitor file handling.

| Capability | Current implementation / fallback | Verification |
| --- | --- | --- |
| Plugin install and iframe | Official docs describe ZIP upload and `srcdoc` iframe; no auto-install-by-sync contract was found. Install the ZIP on each device. | Official documentation only; Android installation and iframe loading need device test. |
| Synced user data | `loadSyncedData` / `persistDataSynced` store semesters, courses, events, exceptions and UI settings. | Local round-trip smoke passes; cross-device delivery needs device test. |
| File chooser | HTML file input supports CSV/HTML/XLSX/DOCX; web paste remains available. | Browser path tested; Android picker needs device test. |
| XLSX / DOCX | Inline ZIP/XML parser; no CDN, Electron, or Node.js runtime dependency. If `DecompressionStream` is unavailable, offer CSV/HTML/paste. | Headless Edge archive tests pass; Android WebView needs device test. |
| Clipboard | Paste event reads HTML first, plain text second; textarea is always visible. | Browser logic inspected; Android clipboard HTML needs device test. |
| ICS / CSV / JSON export | `downloadFile` if injected, otherwise Blob download; mobile also shows copyable contents when using fallback. | Browser path inspected; Android download handoff needs device test. |
| Obsidian URL | Open through a user-tapped `obsidian://` link, with a copyable-link dialog. Rejects other schemes at click time. | External-app dispatch needs device test. |
| SP task/project API | Feature-detect `getTasks`, `getAllProjects`, `addTask`, `updateTask`; manifest requests permissions. | API documented and local mocks pass; Android host behavior needs device test. |
| Dialogs and hooks | HTML dialogs become full-screen on narrow screens; hook registration is optional. | Narrow-screen Edge test passes; Android WebView needs device test. |
| Official discoverability | Upstream suggests a PR to `community-plugins.json`; this is not a secure automatic code-sync mechanism. | Documented upstream; no marketplace submission was made. |

Official sources: [plugin guide](https://github.com/super-productivity/super-productivity/blob/master/docs/plugin-development.md), [Plugin API](https://github.com/super-productivity/super-productivity/blob/master/packages/plugin-api/README.md), [plugin management](https://github.com/super-productivity/super-productivity/blob/master/docs/wiki/2.21-Manage-Plugins.md), [platform differences](https://github.com/super-productivity/super-productivity/blob/master/docs/wiki/3.05-Web-App-vs-Desktop.md).

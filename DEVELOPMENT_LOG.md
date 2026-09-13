# Development Log

## 2026-09-13

### Repository reconciliation

- Fetched `origin/main` and found that remote `v2.0.0` already contained a larger implementation than the interrupted local `v1.4.0` work.
- Preserved the earlier local commit on `codex/course-import-sync-v1.3` instead of overwriting remote work.
- Started `codex/student-course-workbench` from current `origin/main` commit `f18c45f`.
- Confirmed the plugin remains a self-contained iframe plugin and does not request `nodeExecution`.

### Existing remote v2 capabilities verified

- Multi-semester state and semester dialogs.
- Real-time week timeline and compact list.
- Current/next class calculation.
- CSV/TSV/HTML parser with merged-cell support and data cleaning.
- Pasted timetable flow.
- XLSX import foundation.
- ICS, CSV, and JSON export.
- Course-to-SP-task synchronization.

### Work in progress for v2.1.0

- Added top-level Timetable, Plan, and Today view shells.
- Added synced event and class-exception state.
- Added existing-SP-task loading and semantic course association.
- Added course-card task counts, task lists, sync state, event, and exception actions.
- Added plan/today rendering foundation.
- Added real-time line, overlap lanes, and conflict-detection foundation.
- Added event and single-week exception dialogs.
- Added import-preview dialog shell.

### v2.1.0 implementation checkpoint

- Replaced the broken direct import action with an import menu and restored the web-paste entry; DOCX is explicitly marked pending instead of treating ZIP bytes as text.
- Completed event create/edit/delete and per-week exception create/edit/reset flows. The resolved occurrence is shared by timetable, current/next class, plan, conflict checks, and ICS export.
- Import now previews before persistence, labels invalid/duplicate/conflicting/corrected rows, and detects conflicts and duplicates inside the imported batch as well as against saved courses.
- Added mobile Today-first entry, one-day compact timetable, vertical plan, full-screen dialogs, preview cards, bottom navigation, More menu, and collapsed course actions.
- Added bilingual in-app help and a documented per-device plugin-install/data-sync distinction.
- Added `tests/smoke.mjs` covering structured and weekly CSV, weekday and week parsing, conflicts, exceptions, ICS, and synced persistence.
- Kept the existing CDN-based XLSX code unchanged for now. Offline/self-contained XLSX and DOCX parsing remain for the next checkpoint, so Android import compatibility is not yet proven.

### Mobile compatibility research

- Official SP plugin docs describe iframe `srcdoc` plus a filtered Plugin API as the portable interface.
- `persistDataSynced`/`loadSyncedData` are explicitly intended for data that follows SP sync; direct iframe storage is not the portable contract.
- Official installation guidance remains ZIP upload through Settings -> Plugins; no synced executable-plugin installation contract was found.
- The official plugin guide suggests a PR to `community-plugins.json` for discoverability, but still documents uploaded ZIP as the install route; no remote-code auto-installer was added.
- Remote assets depend on runtime CSP and should not be required. The existing CDN-loaded XLSX parser must therefore be replaced or given a self-contained/fallback path.
- Task/project APIs, synced persistence, iframe dialogs, and hooks are part of the documented iframe surface; all optional APIs still need runtime feature detection.

### Verification status

- `node tests/smoke.mjs` passes.
- Inline JavaScript syntax, JSON, and DOM ID checks pass; `git diff --check` passes.
- `npm run build` could not run because `npm` is not on PATH in this shell; this package's build script is only a no-op echo, and runtime syntax checks were run with Node directly.
- Physical Android plugin install, iframe loading, file-picker, download, Obsidian URL, and SP task API behavior remain unverified. No mobile-compatibility claim should be made until device testing.

### v2.1.0 delivery

- Commit `153fb7c` was pushed to `main` and tag `v2.1.0` was pushed for the release ZIP workflow.

### v2.2.0 Office import

- Removed the CDN-loaded SheetJS path. The iframe now reads ZIP central-directory entries and uses browser `DecompressionStream` plus `DOMParser` to parse Office XML without Electron or Node.js runtime APIs.
- XLSX supports shared/inline strings, styled time cells, merged ranges, multiple sheets, and automatic best-sheet selection.
- DOCX prioritizes Word tables, including `gridSpan`, vertical merges, paragraphs and line breaks; simple weekday/time paragraphs are a fallback. Image-only documents receive a clear no-OCR message.
- Both formats convert to the existing Grid and timetable parser, then use the same validation and preview gate as CSV/HTML.
- Added a headless Edge browser smoke test for compressed Office archives, XLSX multi-sheet selection, XLSX merged cells, DOCX vertical merges, and HTML multi-table/rowspan import. Physical Android validation is still pending.

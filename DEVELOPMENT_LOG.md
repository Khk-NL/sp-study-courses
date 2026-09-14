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

### v2.2.0 delivery

- Commit `7f783cf` was pushed to `main` and tag `v2.2.0` was pushed for the release ZIP workflow.

### v2.3.0 mobile UX and import-preview completion

- Import preview now supports editing each recognized row before saving; invalid rows can be repaired, while duplicate rows stay excluded. Import selection is never persisted until confirmation.
- Plan items are ordered by time within each day, keeping associated SP tasks under the matching class.
- Obsidian links open through a user-tapped dialog that also exposes a copyable URL; unsafe schemes are not followed.
- Mobile export fallback shows copyable ICS/CSV/JSON content if the Plugin API download method is unavailable.
- Added narrow-screen browser checks for Today-first navigation, visible bottom navigation, and single-day timetable rendering.
- Added a capability-by-capability Android audit matrix to `REQUIREMENTS.md`. Actual Android installation, iframe, file picker, native downloads and external-link dispatch remain unverified without a device.

### v2.3.0 delivery

- Commit `163ae2c` was pushed to `main` and tag `v2.3.0` was pushed for the release ZIP workflow.

### v2.4.0 course templates and statistics

- Added default course tags when `getAllTags` is available; new SP course tasks and assignments inherit project, prefix, and tag IDs. Existing course color and Obsidian URL remain available.
- Added selected-week and Today statistics for clock hours, early/evening class counts, semester progress, longest free gap, and busiest two-hour interval.
- Statistics resolve single-week cancellations and reschedules first. Smoke tests cover totals under both conditions and tag inheritance.
- Added inspectable, anonymized structured CSV, weekly-grid CSV (including a broken-line time), and HTML timetable fixtures. Browser tests continue to generate compressed XLSX/DOCX OOXML samples in memory for multi-sheet and merged-cell coverage.
- No Android device or emulator/`adb` was available in this environment, so mobile installation and native handoff remain a user-device verification item.

### v2.4.1 course-list layout and navigation

- Moved course metadata, related task summaries, notes, and Obsidian entry to the left side of each course card; aligned action buttons on the right, with a single-column mobile layout.
- Timetable cards now jump to and briefly highlight the matching course-list card, including when same-name sections are merged. Click and keyboard activation work in compact and timeline layouts.
- Added course-list sorting by weekly time or name. The selected order is saved in synced UI settings without changing stored course order.
- Added sort assertions to parser smoke checks and a desktop browser interaction check for layout, sorting, and jump behavior.

### v2.4.2 automatic course category on SP plans

- Synced course plans and assignments now include the SP `课程` tag in addition to each course's selected default tags.
- Reuse an existing tag and create it through `PluginAPI.addTag` only when needed; if tag APIs are unavailable, keep task creation usable with existing tags.
- Declared the new `addTag` permission. No core, Electron, or Node-only capability is required by the plugin.

## 2026-09-14

### v2.4.3 install-size repair

- A user installation exposed a missed release constraint: v2.4.2 packaged the 141,601-byte source `index.html`, exceeding SP's 100,000-byte iframe-file limit. ZIP compression does not change the contained file's size.
- Added a build step that minifies inline CSS, JavaScript, and HTML into `dist/index.html` while keeping the readable root source. The generated file is 99,690 bytes and the build fails if it reaches 100,000 bytes.
- Updated the release workflow to package only built files and inspect the ZIP entry size before publishing. Updated both packaging examples in the README.
- Source parser and browser tests pass; the built file also passes desktop and narrow-screen startup checks. Android installation still needs device verification.

### v2.5.0 course overlap and display controls

- Resolve same-name, same-day overlapping course occurrences per teaching week by retaining the longest time span. Different-name overlaps still show as real conflicts. Source records are preserved to avoid losing task and exception links.
- Group same-name course sections in the lower list; show only visible sections, aggregate linked tasks, and use two direct actions plus a More menu.
- Add independent show/hide switches for all seven statistics in synced UI settings. The chosen visibility applies to timetable and Today.
- Added overlap and statistics regression checks. The packaged HTML remains below the 100,000-byte installation limit.

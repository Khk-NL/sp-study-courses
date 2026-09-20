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

## 2026-09-15

### v2.5.1 language-switch repair

- Translate previously hard-coded event types, import-preview counts/status header, course section count, JSON export label, and accessibility labels.
- Use the selected or SP-following language for dynamically rendered event badges and import preview, including the language-change hook.
- Strip redundant fallback text only from built HTML elements with `data-i18n`; readable source text remains. Packaged iframe still stays below 100,000 bytes.
- Added Chinese, English, and automatic-language regression checks.

### v2.6.0 export save-location picker

- Verified the current upstream Plugin API: `downloadFile(filename, data)` has no directory or save-dialog option. On Android, the host writes to cache and opens the system share sheet; its fallback writes to Documents. Desktop/web uses a normal browser download, except the Snap host which owns its native save dialog.
- Export now tries the browser File System Access save picker on non-mobile platforms when `showSaveFilePicker` is available, allowing the user to choose a filename and folder.
- If the picker API is unavailable or rejected by the runtime/iframe, export falls back to `PluginAPI.downloadFile`, then the existing Blob or copy flow. Canceling the picker does not start an unwanted fallback download.
- Added a save-picker smoke check. The built iframe remains below the 100,000-byte plugin limit.

### v2.6.1 dialog and empty-export repair

- Give every plugin dialog an explicit white background, dark text, light border, and dimmed backdrop instead of relying on a possibly missing host background variable.
- Write save-picker exports as a Blob, close the stream, then verify the selected file has non-zero size. A zero-byte or failed write falls back to the official SP download path; explicit user cancellation remains cancellation.
- Added tests for successful content writes, zero-byte fallback, and the packaged dialog background.
- Condensed repetitive mobile/FAQ help prose without removing any core feature. The packaged iframe is 98,618 bytes, leaving more headroom below the 100,000-byte limit.

### v2.6.2 host-bridge export repair

- Confirmed the actual cause of zero-byte exports in upstream SP: `downloadFile` is a host-side API and is not included in the iframe API allow-list, while the iframe sandbox does not grant browser downloads.
- Removed the incompatible save picker. When the iframe cannot call `downloadFile` directly, it now sends the complete generated payload to the bundled host-side `plugin.js`, which validates it and calls the official download API.
- Keep ordinary Blob download only for standalone, non-iframe use. Added checks for CSV headers and rows, JSON structure, iframe message contents, and the host bridge receiving identical non-empty data.
- The packaged iframe is 98,360 bytes, below the 100,000-byte limit.

## 2026-09-19

### v2.6.3 attribute-safe escaping and packaging environment

- Review of the Super Productivity community-plugin PR found that `esc()` serialized through a text node, which escapes `&`, `<`, `>` and U+00A0 but leaves `"` and `'` intact; four interpolations used it inside quoted attributes. `esc()` now also writes `&quot;` and `&#39;`, closing the `href`, `data-course-group`, `data-group`, and `data-course-id` sinks for imported `obsidianLink` values and course names.
- `safeObsidianUrl()` is applied while rendering the Today and course-list note links, so an unvalidated scheme cannot reach an `href`. The delegated click handler remains a second gate.
- `plugin.js` compares `event.source` against this plugin's own iframe `contentWindow` values (`iframe[data-plugin-id="study-courses"]`) before downloading. The origin is not used: packaged builds run from `file:`, where the origin a frame reports is browser-dependent and therefore not a reliable identity check.
- Added `package.cmd` for local packaging and `.github/workflows/package.yml` for remote packaging. Both build `dist/`, run the smoke tests, and write `sp-study-courses.zip` with `manifest.json` at its root. The dependency-free ZIP writer uses a fixed timestamp, so identical sources produce identical bytes. Tag pushes additionally check the tag against the `manifest.json` version and publish the release.
- Added `.github/workflows/release.yml`, run by hand from the Actions tab, which writes the next `current`/`patch`/`minor`/`major` version into `manifest.json` and `package.json`, commits it, tags it and publishes the release. It builds and attaches the ZIP itself because a push made with the workflow token does not start another workflow, so the tag cannot hand off to `package.yml`; that workflow still publishes tags a person pushes by hand. Re-running with `current` republishes the same tag, and a tag pointing at a different commit is refused. The job refuses to run outside `main`. Passing a `tag` input instead rebuilds and publishes that existing tag, which retries a release whose publish step failed without moving the tag.
- Added smoke checks for attribute escaping, `safeObsidianUrl()`, and rejection of download messages from a foreign window.
- Dark theme: dialogs and inputs now read the host theme variables SP injects (`--card-bg`, `--text-color`, `--divider-color`, `--color-warning`, `--color-danger`) instead of the hardcoded white palette, keeping the earlier light values as fallbacks. `applySettings` maps `--is-dark-theme` onto `color-scheme`, so native `<select>` popups and scrollbars follow the host theme as well.
- Mobile timetable: the phone layout rendered only the current weekday, which left the Timetable view empty on every day without a class. It now lists each weekday that has a class in the selected week, marks today, and falls back to the empty state when the whole week is clear.
- Updated `REQUIREMENTS.md` section 14 and both README languages to record the author's physical-device verification on Android and iOS. The Obsidian external-app handoff is the remaining row without a device test.
- Took one fix from PR #2 (`codex/fix-language-switch`): opening a course card's More menu now closes the others, which is the overlapping-popup behaviour that PR was opened for. The rest of it is superseded — its `Canvas` dialog and menu backgrounds predate the v2.6.1 explicit dialog background and the v2.6.3 host theme variables, `package.bat` duplicates `package.cmd` and `scripts/package.mjs` without running the tests or verifying the archive, and its `build.mjs` flags were measured at 333 bytes (`removeOptionalTags` also deletes the `</body>` the browser smoke harness injects into) or 37 bytes without that flag.
- Fixed issue #4, "Settings page is unreadable": v2.6.1 gave every dialog a hardcoded `#fff`, and Super Productivity's dark-base `--text-color-muted` is `rgba(224, 224, 224, 0.54)`, which composites to a near-white label on that white panel. The dialog now takes `var(--card-bg, #fff)` and `var(--text-color, #222)`, which is 4.79:1 against SP's `#141414` dark card instead of roughly 1.1:1. The dark-theme browser check computes the ratio and requires 4.5.
- Repaired the browser smoke harness, whose assertions matched the literal `PASS ...` text inside the injected `<script>` source and therefore passed even when the exercise threw; they now strip script bodies and read the rendered marker. That exposed three defects it had been hiding: the XLSX/DOCX/HTML exercise was missing the `)()` invoking its async function and had never run at all; the course-list check expected the old id-based group keys (`b,a`) rather than the lower-cased course names (`beta,alpha`); and the jump check queried `data-course-group="a"` for a group keyed `alpha`. The dark-theme exercise also called the plugin's `$` helper, which is mangled in the packaged build, so it now uses `document.getElementById`.

## 2026-09-20

### v2.7.0 multi-weekday courses

- Fixed issue #5, "Assign class to multiple weekdays". A course now stores a `weekdays` array selected in the course dialog, and resolves to one occurrence per selected weekday in exactly the places that already resolved one occurrence per course: timetable, plan, today, current/next class, statistics, conflict detection, same-name overlap handling, task due dates, and ICS export.
- `courseForWeek()` became `courseSessions()`, returning the resolved occurrences of one course in one teaching week. `resolvedCoursesForWeek()` flattens those sessions and now returns the retained sessions themselves; its previous final filter rebuilt the result from course ids, which would have restored a dropped occurrence of a course whose other weekday was still shown.
- `weekday` is still written as the first selected weekday, so a course saved by this build still renders on an older plugin build, and a course saved before this build keeps working without a migration pass.
- The stored weekday list stays in the record while `weekday` remains the readable single value. A CSV or HTML weekday cell accepts a separated list (`周一,周三`, `Mon;Wed`, `1,3`), the import preview shows every day, and the JSON/CSV/ICS exports carry the full list.
- A class exception still covers the whole course in its teaching week: cancelling clears every weekday, and rescheduling replaces them with the overridden weekday and time. Per-day exceptions are out of scope; splitting a course into same-name sections already gives per-day records and per-day reschedule actions.
- ICS identity is preserved for single-weekday courses, so a calendar that already imported an earlier export updates instead of gaining a duplicate event. Multi-weekday courses add the resolved weekday to the UID because one course-week now produces several events.
- The course and import-edit weekday fields became `<select multiple>` controls built from the existing weekday option list, so no new dialog, translation-table entry, or stylesheet rule was needed. The course dialog relies on the native `required` constraint instead of a new validation message.
- The packaged iframe stayed below the 100,000-byte limit. Removing four translation keys that no code or markup referenced (`ACTIONS`, `EXPORT_ICS`, `IMPORT_CONFIRM`, `NEW_SEMESTER_NAME`; the dynamic `EVERY`, `ODD`, `EVEN` and `CUSTOM` lookups were checked and kept) and dropping an unreferenced `gridToCourses` alias paid for most of the new feature code.
- Added smoke checks for multi-weekday parsing, per-day conflicts, per-day statistics, ICS occurrences and UIDs, whole-course exceptions, same-name overlap retention, CSV round trip, and dialog round trip. Added a headless Edge check that selects two weekdays in the real dialog and requires both day sections and both day names in the course list.

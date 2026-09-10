# Study Courses & Timetable for Super Productivity

A semester-aware timetable plugin for [Super Productivity](https://github.com/johannesjo/super-productivity), designed for courses, teaching weeks, assignments, and calendar export.

中文说明见下方。

## Features

- Manage semester name, first Monday, and total teaching weeks
- Create courses with weekday, time, location, teacher, week range, and odd/even/custom week rules
- Browse the timetable week by week
- Import courses from CSV or an ordinary HTML table and skip duplicates
- Export the timetable as an `.ics` calendar file
- Create assignment tasks in a selected Super Productivity project
- Store course notes and optional Obsidian links
- English and Chinese translations that follow the SP language
- Synced plugin storage for course data and display settings

## Installation

1. Download `sp-study-courses.zip` from GitHub Releases.
2. Open Super Productivity → Settings → Plugins.
3. Import the ZIP file and restart Super Productivity if requested.
4. Open **Courses & Timetable** from the plugin entry.

Requires Super Productivity **18.21.2 or later**.

## CSV / HTML import

Start with [`course-import-template.csv`](course-import-template.csv). Supported Chinese headers include:

```text
课程名称,教师,地点,星期,开始时间,结束时间,开始周,结束周,周次模式,自定义周次,颜色,备注,Obsidian链接,项目
```

Equivalent English headers are accepted. A course with the same name, weekday, start time, and end time as an existing course is skipped.

## Data and permissions

The plugin reads project names, creates an assignment only after the user submits its form, saves its own plugin data, and exports a user-requested ICS file. It does not delete Super Productivity tasks or projects.

## 中文说明

该插件用于管理大学课程表、学期周次、单双周课程和课程作业，支持 CSV/HTML 导入与 ICS 日历导出，也可以把课程作业创建到指定的 SP 项目中。界面会跟随 SP 的中英文语言设置。

## Development and packaging

This is a dependency-free iframe plugin. Package these files with `manifest.json` at the ZIP root:

```text
manifest.json
plugin.js
index.html
icon.svg
i18n/
course-import-template.csv
```

```powershell
Compress-Archive -Path manifest.json,plugin.js,index.html,icon.svg,i18n,course-import-template.csv -DestinationPath sp-study-courses.zip
```

## License

[MIT](LICENSE)

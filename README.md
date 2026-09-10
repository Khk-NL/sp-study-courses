# Study Courses & Timetable for Super Productivity

面向学生的学期课程表插件，支持周次、单双周、课程作业、CSV/HTML 导入、ICS 导出、中英文和独立界面设置。

A semester-aware timetable plugin for students, with odd/even weeks, assignments, CSV/HTML import, ICS export, Chinese/English translations, and display settings.

## Install / 安装

1. Download the release ZIP, or zip the files in this directory with `manifest.json` at the archive root.
2. In Super Productivity, open Settings → Plugins and import the ZIP.
3. Restart Super Productivity.

Requires Super Productivity 18.21.2 or later. The plugin appears in the app sidebar and opens as a full page.

## CSV / HTML import

Use `course-import-template.csv` as the starting point. Supported Chinese headers include:

`课程名称, 教师, 地点, 星期, 开始时间, 结束时间, 开始周, 结束周, 周次模式, 自定义周次, 颜色, 备注, Obsidian链接, 项目`

Equivalent English headers are also accepted. HTML import reads ordinary table headers and rows. Existing courses with the same course name, weekday, start time and end time are skipped.

## Data and permissions / 数据与权限

Course data is stored through `persistDataSynced`. The plugin can read project names and create a Super Productivity task when the user explicitly creates an assignment. It does not delete tasks or projects.

## License

MIT

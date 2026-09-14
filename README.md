# Study Courses & Timetable for Super Productivity

> 🎓 A semester-aware timetable and coursework management plugin for [Super Productivity](https://github.com/johannesjo/super-productivity).

Manage university courses, teaching weeks, assignments, timetable imports, and calendar exports directly inside Super Productivity.

Version `2.4.0` includes the Timetable, Plan, and Today workbench, self-contained XLSX/DOCX import, editable import preview, course task templates, and lightweight week statistics. Image-only Word documents are not OCRed. See [requirements and Android audit](REQUIREMENTS.md) and the [development log](DEVELOPMENT_LOG.md).

[English](#english) | [中文](#中文)

---

## English

### ✨ Features

#### Semester management
- Set semester name
- Configure the first Monday of the semester
- Set the total number of teaching weeks
- Browse the timetable week by week

#### Course management
- Create courses with:
  - Weekday
  - Start and end time
  - Location
  - Teacher
  - Start and end week
  - Odd / even / custom week rules
- Store course notes
- Add optional Obsidian links

#### Course import
- Import courses from CSV
- Import courses from ordinary HTML tables
- Automatically skip duplicate courses
- Includes a reusable CSV import template

#### Assignments
- Create assignment tasks directly in a selected Super Productivity project
- Keep course-related work connected with your normal task workflow

#### Calendar export
- Export the timetable as an `.ics` calendar file
- Import the exported calendar into compatible calendar applications

#### Integration
- English and Chinese translations
- Automatically follows the Super Productivity language
- Uses synced plugin storage for course data and display settings

---

### 📦 Installation

1. Go to **GitHub Releases**.
2. Download `sp-study-courses.zip`.
3. Open Super Productivity.
4. Go to:

   `Settings → Plugins`

5. Import the ZIP file.
6. Restart Super Productivity if requested.
7. Open **Courses & Timetable** from the plugin entry.

Install the plugin ZIP separately on each computer or phone where you use it. Once the same plugin ID is installed and SP sync is configured, semester, course, event, exception, mapping, and display data use SP synced plugin storage. Syncing data does not install plugin code. Android compatibility depends on whether your SP build exposes plugin installation and the iframe Plugin API; this has not yet been verified on a physical device.

### Compatibility

Requires:

```text
Super Productivity >= 18.21.2
```

---

### 📥 CSV / HTML Import

A CSV template is included:

[`course-import-template.csv`](course-import-template.csv)

Supported Chinese headers include:

```text
课程名称,教师,地点,星期,开始时间,结束时间,开始周,结束周,周次模式,自定义周次,颜色,备注,Obsidian链接,项目
```

Equivalent English headers are also accepted.

A course is treated as a duplicate and skipped when the following fields match an existing course:

- Course name
- Weekday
- Start time
- End time

---

### 🔐 Data & Permissions

The plugin:

- Reads Super Productivity project names
- Creates assignment tasks only after user confirmation
- Stores its own course data and display settings
- Exports ICS files only when requested by the user

The plugin does **not**:

- Delete Super Productivity tasks
- Delete projects
- Modify unrelated task data

Mobile fallbacks: paste plain text if clipboard HTML is unavailable; use CSV/HTML or paste if the WebView cannot decompress Office files. XLSX and DOCX parsing use browser APIs and do not load a remote parser. Downloads use the Plugin API when available and a browser download fallback otherwise. The plugin does not use Electron or Node.js APIs at runtime.

---

### 🛠 Development & Packaging

This is a dependency-free iframe plugin.

The release ZIP should contain the following files at its root:

```text
manifest.json
plugin.js
index.html
icon.svg
i18n/
course-import-template.csv
```

Example packaging command:

```powershell
pnpm install --frozen-lockfile --ignore-scripts
pnpm run build
Push-Location dist
Compress-Archive -Path manifest.json,plugin.js,index.html,icon.svg,i18n,course-import-template.csv -DestinationPath ../sp-study-courses.zip
Pop-Location
```

Package the generated `dist/index.html`, not the readable source at the repository root. The build fails if the generated file reaches Super Productivity's 100 KB iframe limit.

---

## 中文

### ✨ 功能

#### 学期管理
- 设置学期名称
- 设置学期第一周星期一
- 设置总教学周数
- 按周浏览课程表

#### 课程管理
支持为课程设置：

- 星期
- 上课时间
- 上课地点
- 教师
- 起止周次
- 单周 / 双周 / 自定义周次

同时支持：

- 课程备注
- Obsidian 链接

#### 课程导入
- 支持 CSV 导入
- 支持普通 HTML 表格导入
- 自动跳过重复课程
- 提供课程导入模板

#### 课程作业
- 可将课程作业创建为 Super Productivity 任务
- 可选择作业所属的 SP 项目
- 将课程管理与日常任务管理结合

#### 日历导出
- 支持导出 `.ics` 日历文件
- 可导入兼容 ICS 的日历应用

#### 集成
- 支持中文和英文
- 自动跟随 Super Productivity 的语言设置
- 使用 SP 插件同步存储保存课程数据与显示设置

---

### 📦 安装

1. 前往 GitHub **Releases**
2. 下载：

   `sp-study-courses.zip`

3. 打开 Super Productivity
4. 进入：

   `设置 → 插件`

5. 导入 ZIP 插件
6. 如有提示，重启 Super Productivity
7. 从插件入口打开 **Courses & Timetable**

电脑和手机需分别安装一次插件 ZIP。安装相同插件 ID 并配置 SP 同步后，学期、课程、事件、调课、任务对应关系和界面设置使用 SP 插件同步存储；数据同步不会自动安装插件代码。Android 端能否安装并加载插件还需在实际设备和对应 SP 版本上验证。

### 兼容性

需要：

```text
Super Productivity >= 18.21.2
```

---

### 📥 CSV / HTML 导入

项目中提供：

[`course-import-template.csv`](course-import-template.csv)

支持的中文表头包括：

```text
课程名称,教师,地点,星期,开始时间,结束时间,开始周,结束周,周次模式,自定义周次,颜色,备注,Obsidian链接,项目
```

同时支持对应的英文表头。

如果以下字段均与现有课程一致，则该课程会被视为重复课程并跳过：

- 课程名称
- 星期
- 开始时间
- 结束时间

---

### 🔐 数据与权限

插件会：

- 读取 Super Productivity 项目名称
- 在用户确认后创建课程作业任务
- 保存插件自身的课程数据与显示设置
- 在用户主动操作时导出 ICS 文件

插件不会：

- 删除 Super Productivity 任务
- 删除项目
- 修改无关任务数据

`2.4.0` 已包含「课表 / 计划 / 今日」、课程事件、单周调课与停课、可逐项编辑的导入预览、冲突提示、课程任务模板、轻量统计和手机端导航。XLSX 与 DOCX 课表直接在插件内解析，不再从 CDN 加载解析库；多工作表 / 多表格会自动选择识别结果最多的一项。图片型 Word 不做 OCR。旧版 WebView 若不能解压 Office 文件，可改用 CSV、HTML 或粘贴。文件下载优先使用 Plugin API，移动端失败时提供可复制内容；插件运行时不依赖 Electron 或 Node.js。完整任务和 Android 兼容性审计见 [需求文档](REQUIREMENTS.md)，开发过程见 [开发日志](DEVELOPMENT_LOG.md)。

---

### 🛠 开发与打包

该插件为无外部依赖的 iframe 插件。

发布 ZIP 根目录应包含：

```text
manifest.json
plugin.js
index.html
icon.svg
i18n/
course-import-template.csv
```

打包示例：

```powershell
pnpm install --frozen-lockfile --ignore-scripts
pnpm run build
Push-Location dist
Compress-Archive -Path manifest.json,plugin.js,index.html,icon.svg,i18n,course-import-template.csv -DestinationPath ../sp-study-courses.zip
Pop-Location
```

请打包生成的 `dist/index.html`，不要直接打包仓库根目录的可读源码。构建会检查 100 KB 限制，超限时直接报错。

---

## 📄 License

[MIT](LICENSE)
```

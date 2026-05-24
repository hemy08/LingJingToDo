# 灵境待办 (LingJingToDo)

<div align="center">

一个基于 **Tauri 2 + Vue 3 + TypeScript + Rust** 构建的现代化跨平台桌面任务管理应用

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Tauri](https://img.shields.io/badge/Tauri-2.x-blue.svg)](https://tauri.app/)
[![Vue](https://img.shields.io/badge/Vue-3.5.13-brightgreen.svg)](https://vuejs.org/)
[![Rust](https://img.shields.io/badge/Rust-Edition%202021-orange.svg)](https://www.rust-lang.org/)

[功能特性](#功能特性) • [快速开始](#快速开始) • [技术架构](#技术架构) • [文档](#文档)

</div>

---

## 项目简介

**灵境待办** 是一款功能强大、界面美观的跨平台桌面任务管理应用。它采用现代化的技术栈构建，提供流畅的用户体验和丰富的功能特性。

### 核心亮点

- 🚀 **高性能**: Rust 后端提供卓越性能
- 🎨 **现代化UI**: Vue 3 + Composition API 构建流畅界面
- 📦 **跨平台**: 支持 Windows、macOS、Linux
- 💾 **多格式支持**: JSON、XML、Excel 导入导出
- 🔄 **自动保存**: 定时自动保存，数据安全可靠
- 🎯 **灵活布局**: 瀑布流、列表、树形三种视图

---

## 功能特性

### 任务管理

```mermaid
graph LR
    A[任务管理] --> B[基础操作]
    A --> C[高级功能]
    A --> D[子任务]
    
    B --> B1[创建任务]
    B --> B2[编辑任务]
    B --> B3[删除任务]
    B --> B4[完成任务]
    
    C --> C1[拖拽排序]
    C --> C2[批量操作]
    C --> C3[任务筛选]
    C --> C4[任务统计]
    
    D --> D1[添加子任务]
    D --> D2[管理子任务]
    D --> D3[子任务统计]
    
    style A fill:#4ecdc4
    style B fill:#ff6b6b
    style C fill:#f9a825
    style D fill:#45b7d1
```

### 多视图布局

```mermaid
graph TB
    A[三种布局模式] --> B[瀑布流布局]
    A --> C[列表布局]
    A --> D[树形布局]
    
    B --> B1[多列卡片展示]
    B --> B2[适合浏览大量任务]
    B --> B3[支持拖拽排序]
    
    C --> C1[单列紧凑展示]
    C --> C2[适合快速查看]
    C --> C3[信息密度高]
    
    D --> D1[层级结构展示]
    D --> D2[父子关系清晰]
    D --> D3[适合复杂任务]
    
    style A fill:#4ecdc4
    style B fill:#ff6b6b
    style C fill:#f9a825
    style D fill:#45b7d1
```

### 配置系统

- **状态管理**: 待规划、已启动、进行中、已完成、已延期、已关闭
- **类型管理**: 工作、学习、生活（可自定义）
- **优先级管理**: P0-致命 ~ 不紧急（7个级别）
- **主题系统**: 亮色/暗色主题，支持自定义

### 文件操作

```mermaid
graph TB
    A[文件操作] --> B[导入]
    A --> C[导出]
    A --> D[历史记录]
    
    B --> B1[JSON格式]
    B --> B2[XML格式]
    B --> B3[Excel格式]
    
    C --> C1[JSON格式]
    C --> C2[XML格式]
    C --> C3[Excel格式]
    
    D --> D1[最近文件列表]
    D --> D2[快速访问]
    
    style A fill:#4ecdc4
    style B fill:#ff6b6b
    style C fill:#f9a825
```

---

## 技术架构

### 整体架构

```mermaid
graph TB
    subgraph "前端层 (Vue 3 + TypeScript)"
        A[App.vue<br/>应用入口]
        B[LingJingToDo.vue<br/>主应用组件]
        C[TaskPanel<br/>任务面板]
        D[CalendarPanel<br/>日历面板]
        E[ConfigModals<br/>配置模态框]
    end
    
    subgraph "API 连接层"
        F[task_apis.ts<br/>任务API]
        G[config_apis.ts<br/>配置API]
    end
    
    subgraph "Tauri IPC 桥梁"
        H[Tauri Commands<br/>IPC 通信]
    end
    
    subgraph "后端层 (Rust)"
        I[lib.rs<br/>主库入口]
        J[tasks.rs<br/>任务管理]
        K[config.rs<br/>配置管理]
        L[file_ops.rs<br/>文件操作]
    end
    
    subgraph "数据存储层"
        M[(tasks/<br/>日期文件)]
        N[(config.json<br/>配置文件)]
    end
    
    A --> B
    B --> C
    B --> D
    B --> E
    
    C --> F
    E --> G
    
    F --> H
    G --> H
    
    H --> I
    I --> J
    I --> K
    I --> L
    
    J --> M
    K --> N
    
    style A fill:#42b883
    style B fill:#42b883
    style I fill:#dea584
    style J fill:#dea584
    style K fill:#dea584
    style L fill:#dea584
```

### 技术栈

```mermaid
graph LR
    subgraph "前端技术栈"
        A1[Vue 3.5.13<br/>Composition API]
        A2[TypeScript 5.6.2]
        A3[Vite 6.0.3]
        A4[SortableJS 1.15.7]
    end
    
    subgraph "桌面框架"
        B1[Tauri 2.x]
        B2[WebView]
        B3[Rust Runtime]
    end
    
    subgraph "后端技术栈"
        C1[Rust Edition 2021]
        C2[serde + serde_json]
        C3[chrono 0.4.44]
        C4[rust_xlsxwriter]
        C5[calamine]
    end
    
    A1 --> B2
    A3 --> B1
    B1 --> B3
    B3 --> C1
    
    C1 --> C2
    C1 --> C3
    C1 --> C4
    C1 --> C5
    
    style A1 fill:#42b883
    style B1 fill:#24292e
    style C1 fill:#dea584
```

### 前端组件架构

```mermaid
graph TB
    A[App.vue<br/>根组件] --> B[HistoryFiles.vue<br/>历史文件选择]
    A --> C[LingJingToDo.vue<br/>主应用]
    
    C --> D[CustomTitleBar.vue<br/>自定义标题栏]
    C --> E[CalendarPanel.vue<br/>日历面板]
    C --> F[TaskPanel.vue<br/>任务面板]
    C --> G[TaskStatistics.vue<br/>任务统计]
    C --> H[配置模态框]
    
    F --> F1[TaskAddArea.vue<br/>任务添加区域]
    F --> F2[SettingsPanel.vue<br/>设置面板]
    F --> F3[布局组件]
    F --> F4[TaskCard.vue<br/>任务卡片]
    
    F3 --> F3a[MasonryLayout]
    F3 --> F3b[ListLayout]
    F3 --> F3c[TreeLayout]
    
    H --> H1[StatusModal]
    H --> H2[TypeModal]
    H --> H3[PriorityModal]
    
    style A fill:#ff6b6b
    style C fill:#4ecdc4
    style F fill:#45b7d1
```

### 后端模块架构

```mermaid
graph TB
    A[lib.rs<br/>主库入口] --> B[命令注册<br/>28个命令]
    A --> C[状态管理]
    A --> D[自动保存定时任务]
    
    B --> B1[任务命令<br/>14个]
    B --> B2[配置命令<br/>10个]
    B --> B3[文件命令<br/>4个]
    
    C --> C1[ConfigState<br/>配置状态]
    C --> C2[TaskData<br/>任务数据]
    
    E[tasks.rs] --> E1[任务CRUD]
    E --> E2[任务重排序]
    E --> E3[任务查询]
    E --> E4[任务统计]
    
    F[config.rs] --> F1[状态管理]
    F --> F2[类型管理]
    F --> F3[优先级管理]
    
    G[file_ops.rs] --> G1[JSON格式]
    G --> G2[XML格式]
    G --> G3[Excel格式]
    
    style A fill:#dea584
    style E fill:#f9a825
    style F fill:#f9a825
    style G fill:#f9a825
```

### 数据模型

```mermaid
erDiagram
    Task ||--o{ Task : "包含子任务"
    Task }o--|| TaskStatus : "具有状态"
    Task }o--|| TaskType : "具有类型"
    Task }o--|| TaskPriority : "具有优先级"
    
    Task {
        string id PK "任务ID"
        string title "任务标题"
        string status_id FK "状态ID"
        string type_id FK "类型ID"
        string priority_id FK "优先级ID"
        date due_date "截止日期"
        string remark "备注"
        date created_date "创建日期"
        date closed_date "关闭日期"
    }
    
    TaskStatus {
        string id PK "状态ID"
        string name "状态名称"
        string color "颜色"
        string emoji "图标"
    }
    
    TaskType {
        string id PK "类型ID"
        string name "类型名称"
        string color "颜色"
        string emoji "图标"
    }
    
    TaskPriority {
        string id PK "优先级ID"
        string name "优先级名称"
        string color "颜色"
        string emoji "图标"
    }
```

### API 调用流程

```mermaid
sequenceDiagram
    participant U as 用户界面
    participant V as Vue组件
    participant A as API层
    participant T as Tauri IPC
    participant R as Rust后端
    participant D as 数据存储
    
    U->>V: 用户操作
    V->>A: 调用API方法
    A->>T: invoke(command)
    T->>R: 执行Rust命令
    R->>D: 读取/写入数据
    D-->>R: 返回数据
    R-->>T: 返回结果
    T-->>A: Promise结果
    A-->>V: 更新状态
    V-->>U: 更新UI
```

---

## 快速开始

### 环境要求

```mermaid
graph LR
    A[开发环境] --> B[Node.js >= 18]
    A --> C[Rust >= 1.70]
    A --> D[pnpm/npm/yarn]
    
    B --> E[前端构建]
    C --> F[后端编译]
    D --> G[包管理]
    
    style A fill:#4ecdc4
```

### 安装步骤

1. **克隆项目**
```bash
git clone https://github.com/hemy08/LingJingToDo.git
cd LingJingToDo
```

2. **安装依赖**
```bash
# 使用 pnpm（推荐）
pnpm install

# 或使用 npm
npm install

# 或使用 yarn
yarn install
```

3. **开发模式运行**
```bash
pnpm tauri dev
```

4. **生产构建**
```bash
pnpm tauri build
```

构建完成后，安装包位于 `lingjing_server/src-tauri/target/release/bundle/` 目录。

---

## 项目结构

```mermaid
graph TB
    A[LingJingToDo/] --> B[lingjing_uiux/<br/>前端UI层]
    A --> C[lingjing_server/<br/>后端服务层]
    A --> D[docs/<br/>项目文档]
    A --> E[package.json]
    A --> F[vite.config.ts]
    
    B --> B1[components/<br/>Vue组件]
    B --> B2[assets/<br/>样式资源]
    B --> B3[connections/<br/>API连接]
    B --> B4[App.vue]
    B --> B5[types.ts]
    
    C --> C1[src/<br/>Rust源码]
    C --> C2[data/<br/>数据存储]
    C --> C3[Cargo.toml]
    C --> C4[tauri.conf.json]
    
    D --> D1[architecture.md<br/>架构文档]
    D --> D2[developer-guide.md<br/>开发指南]
    D --> D3[api-reference.md<br/>API文档]
    D --> D4[user-manual.md<br/>用户手册]
    
    style A fill:#f9f9f9,stroke:#333,stroke-width:4px
    style B fill:#42b883
    style C fill:#dea584
    style D fill:#45b7d1
```

---

## API 概览

项目提供了 **28 个 Tauri 命令**，分为三大模块：

```mermaid
graph TB
    A[API 总览<br/>28个命令] --> B[任务API<br/>14个命令]
    A --> C[配置API<br/>10个命令]
    A --> D[文件API<br/>4个命令]
    
    B --> B1[CRUD操作]
    B --> B2[批量操作]
    B --> B3[子任务管理]
    B --> B4[查询统计]
    
    C --> C1[状态管理]
    C --> C2[类型管理]
    C --> C3[优先级管理]
    
    D --> D1[文件导入]
    D --> D2[文件导出]
    D --> D3[历史记录]
    
    style A fill:#4ecdc4
    style B fill:#ff6b6b
    style C fill:#f9a825
    style D fill:#45b7d1
```

### 任务 API（14个）

| 命令 | 说明 |
|------|------|
| `get_tasks` | 获取指定日期的任务列表 |
| `add_task` | 添加新任务 |
| `update_task` | 更新任务 |
| `delete_task` | 删除任务 |
| `reorder_tasks` | 重排序任务 |
| `get_all_tasks` | 获取所有任务 |
| `import_tasks` | 批量导入任务 |
| `generate_main_task_id` | 生成主任务ID |
| `generate_subtask_id` | 生成子任务ID |
| `add_subtask` | 添加子任务 |
| `update_subtask` | 更新子任务 |
| `delete_subtask` | 删除子任务 |
| `query_tasks` | 查询任务 |
| `get_task_statistics` | 获取任务统计 |

### 配置 API（10个）

| 命令 | 说明 |
|------|------|
| `get_all_statuses` | 获取所有状态 |
| `update_statuses` | 更新状态配置 |
| `delete_status` | 删除状态 |
| `get_all_types` | 获取所有类型 |
| `update_types` | 更新类型配置 |
| `delete_type` | 删除类型 |
| `get_all_priorities` | 获取所有优先级 |
| `update_priorities` | 更新优先级配置 |
| `delete_priority` | 删除优先级 |

### 文件 API（4个）

| 命令 | 说明 |
|------|------|
| `open_file` | 打开文件（JSON/XML/Excel） |
| `save_file` | 保存文件 |
| `get_recent_files` | 获取最近文件列表 |
| `add_recent_file` | 添加到最近文件 |

---

## 数据存储

### 存储结构

```mermaid
graph LR
    A[数据存储] --> B[tasks/ 目录]
    A --> C[config.json]
    A --> D[recent_files.json]
    
    B --> B1[2024-01-01.json]
    B --> B2[2024-01-02.json]
    B --> B3[...]
    
    C --> C1[状态配置]
    C --> C2[类型配置]
    C --> C3[优先级配置]
    
    D --> D1[文件路径列表]
    
    style A fill:#f9f9f9,stroke:#333,stroke-width:2px
    style B fill:#42b883
    style C fill:#dea584
```

### 自动保存机制

```mermaid
sequenceDiagram
    participant App as 应用启动
    participant Timer as 定时器线程
    participant State as 全局状态
    participant FS as 文件系统
    
    App->>Timer: 启动自动保存线程
    
    loop 每日凌晨1点
        Timer->>Timer: 计算下次保存时间
        Timer->>Timer: sleep等待
        Timer->>State: 获取TaskData锁
        State-->>Timer: 返回数据
        Timer->>FS: 保存所有任务数据
        FS-->>Timer: 保存成功
        Timer->>State: 释放锁
    end
```

---

## 文档

完整文档位于 `docs/` 目录：

- 📚 [项目架构文档](./docs/architecture.md) - 系统架构、技术栈、组件设计
- 👨‍💻 [开发者指南](./docs/developer-guide.md) - 开发流程、调试技巧、贡献指南
- 🔌 [API 参考文档](./docs/api-reference.md) - 完整的 API 接口说明
- 📖 [用户手册](./docs/user-manual.md) - 安装、使用、配置指南

---

## 开发路线图

### 功能扩展规划

```mermaid
gantt
    title 功能扩展路线图
    dateFormat YYYY-MM
    axisFormat %Y年%m月
    
    section 基础优化
    状态管理优化     :2024-01, 1m
    虚拟滚动实现     :2024-01, 1m
    单元测试覆盖     :2024-02, 1m
    
    section 核心功能
    标签系统         :2024-02, 1m
    任务模板         :2024-02, 1m
    搜索增强         :2024-03, 1m
    批量操作         :2024-03, 1m
    
    section 高级功能
    时间追踪         :2024-03, 1m
    重复任务         :2024-04, 1m
    项目管理         :2024-04, 1m
    数据可视化       :2024-04, 1m
    
    section 生态扩展
    多语言支持       :2024-05, 1m
    主题市场         :2024-05, 1m
    日历集成         :2024-06, 1m
```

### 性能优化方向

```mermaid
graph TB
    A[性能优化] --> B[前端优化]
    A --> C[后端优化]
    A --> D[存储优化]
    
    B --> B1[引入Pinia状态管理]
    B --> B2[虚拟滚动]
    B --> B3[组件懒加载]
    
    C --> C1[异步操作]
    C --> C2[数据缓存]
    
    D --> D1[SQLite存储]
    D --> D2[增量保存]
    D --> D3[数据压缩]
    
    style A fill:#4ecdc4
    style B fill:#ff6b6b
    style C fill:#f9a825
    style D fill:#45b7d1
```

---

## 贡献指南

我们欢迎所有形式的贡献！

### 贡献流程

```mermaid
graph LR
    A[Fork项目] --> B[创建分支]
    B --> C[提交代码]
    C --> D[推送分支]
    D --> E[创建PR]
    E --> F[代码审查]
    F --> G[合并代码]
    
    style A fill:#4ecdc4
    style G fill:#45b7d1
```

### 开发规范

- **代码风格**: 遵循 Vue 官方风格指南和 Rust 编码规范
- **提交信息**: 使用约定式提交格式
- **测试覆盖**: 新功能需添加测试
- **文档更新**: 重要功能需更新文档

---

## 常见问题

### Q: 如何在不同平台安装？

**A**: 
- **Windows**: 下载 `.msi` 安装包
- **macOS**: 下载 `.dmg` 安装包
- **Linux**: 下载 `.deb` 或 `.AppImage` 安装包

### Q: 数据存储在哪里？

**A**: 
- **Windows**: `C:\Users\用户名\AppData\Local\lingjingtodo\`
- **macOS**: `~/Library/Application Support/lingjingtodo/`
- **Linux**: `~/.local/share/lingjingtodo/`

### Q: 如何备份数据？

**A**: 使用导出功能，支持 JSON、XML、Excel 三种格式

---

## 许可证

本项目采用 [MIT](LICENSE) 许可证。

---

## 致谢

感谢以下开源项目：

- [Tauri](https://tauri.app/) - 跨平台桌面应用框架
- [Vue.js](https://vuejs.org/) - 渐进式 JavaScript 框架
- [Rust](https://www.rust-lang.org/) - 系统编程语言
- [SortableJS](https://sortablejs.github.io/Sortable/) - 拖拽库

---

## 联系方式

- **作者**: Hemy08
- **GitHub**: https://github.com/hemy08/LingJingToDo
- **问题反馈**: [GitHub Issues](https://github.com/hemy08/LingJingToDo/issues)

---

<div align="center">

**如果这个项目对你有帮助，请给一个 ⭐ Star 支持一下！**

Made with ❤️ by Hemy08

</div>

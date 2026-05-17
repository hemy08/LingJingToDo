# 灵境待办 (LingJingToDo)

一个基于 Tauri + Vue 3 + TypeScript + Rust 构建的现代化跨平台桌面任务管理应用。

## 项目简介

灵境待办是一款功能完善的任务管理和待办事项管理桌面应用，支持任务的增删改查、层级管理、多维度分类、多视图展示等功能。采用 Tauri 框架，实现了轻量级、高性能的桌面应用体验。

## 技术栈

### 前端
- **Vue 3.5.13** - 使用 Composition API 和 `<script setup>` 语法
- **TypeScript 5.6.2** - 类型安全
- **Vite 6.0.3** - 快速构建工具
- **SortableJS 1.15.7** - 拖拽排序功能

### 后端
- **Rust (Edition 2021)** - 高性能系统编程语言
- **Tauri 2.x** - 跨平台桌面应用框架
- **serde** - 序列化/反序列化框架
- **chrono** - 日期时间处理
- **calamine 0.26** - Excel 文件读取
- **rust_xlsxwriter 0.79** - Excel 文件写入
- **regex** - 正则表达式（XML 解析）

## 核心功能

### 任务管理
- ✅ 任务的创建、编辑、删除
- ✅ 任务层级管理（主任务和子任务）
- ✅ 多维度分类（状态、类型、优先级）
- ✅ 任务拖拽排序
- ✅ 任务搜索和过滤
- ✅ 任务统计和概览

### 数据存储
- ✅ **JSON 格式** - 默认存储格式，完整支持所有字段
- ✅ **Excel 格式** - 支持导入导出，可视化编辑
  - 平铺存储结构，主任务和子任务关系清晰
  - 支持多工作表（按日期分组）
  - 完整保存所有任务信息
- ✅ **XML 格式** - 结构化存储，易于阅读和版本控制
  - 支持特殊字符转义
  - 层级结构清晰
  - UTF-8 编码支持中文

### 视图展示
- ✅ 卡片视图 - 任务卡片展示
- ✅ 列表视图 - 紧凑列表展示
- ✅ 树形视图 - 层级结构展示
- ✅ 瀑布流布局 - 自适应布局

### 其他功能
- ✅ 自定义窗口标题栏
- ✅ 任务统计面板
- ✅ 任务导航树
- ✅ 底部状态栏
- ✅ 自动保存功能
- ✅ 文件导入导出

## 项目结构

```
LingJingToDo/
├── lingjing_uiux/              # 前端 Vue 3 项目
│   ├── components/             # Vue 组件
│   │   ├── common/            # 通用组件
│   │   │   ├── CustomTitleBar.vue      # 自定义标题栏
│   │   │   ├── TaskStatistics.vue      # 任务统计
│   │   │   ├── TaskTree.vue            # 任务树
│   │   │   └── BottomStatusBar.vue     # 底部状态栏
│   │   └── tasks/             # 任务相关组件
│   │       ├── TaskPanel.vue           # 任务面板
│   │       ├── TaskCard.vue            # 任务卡片
│   │       ├── SubtaskCard.vue         # 子任务卡片
│   │       ├── SubtaskTable.vue        # 子任务表格
│   │       ├── SubtaskModal.vue        # 子任务模态框
│   │       ├── MasonryLayout.vue       # 瀑布流布局
│   │       ├── ListLayout.vue          # 列表布局
│   │       ├── TreeLayout.vue          # 树形布局
│   │       └── tasks_common.ts         # 任务操作公共函数
│   ├── types.ts                # TypeScript 类型定义
│   └── App.vue                 # 根组件
│
├── lingjing_server/            # 后端 Rust 项目
│   ├── src/
│   │   ├── main.rs            # 主入口
│   │   ├── lib.rs             # 库入口
│   │   ├── tasks.rs           # 任务管理逻辑
│   │   ├── file_ops.rs        # 文件操作（JSON/Excel/XML）
│   │   └── config.rs          # 配置管理
│   └── Cargo.toml             # Rust 依赖配置
│
├── src-tauri/                  # Tauri 配置
│   └── tauri.conf.json        # Tauri 应用配置
│
└── package.json               # Node.js 依赖配置
```

## 数据格式说明

### Excel 格式（新）

采用平铺存储结构，通过"主任务ID"列关联子任务：

| 任务ID | 主任务ID | 任务描述 | 任务类型 | 任务状态 | 任务优先级 | 创建日期 | 截止日期 | 备注 |
|--------|----------|----------|----------|----------|------------|----------|----------|------|
| TASK001 | | 主任务1 | ty_work | st_doing | p3 | 2026-05-16T10:00:00 | 2026-05-20 | 重要任务 |
| SUB001 | TASK001 | 子任务1 | ty_work | st_done | p3 | 2026-05-16T11:00:00 | | |
| SUB002 | TASK001 | 子任务2 | ty_work | st_doing | p3 | 2026-05-16T12:00:00 | | |

**特点**：
- 主任务的"主任务ID"列为空
- 子任务的"主任务ID"列填写对应主任务ID
- 所有任务信息完整保存
- 支持多工作表（按日期分组）

### XML 格式

```xml
<?xml version="1.0" encoding="UTF-8"?>
<tasks>
  <date value="2026-05-16">
    <task id="TASK001" title="主任务1" status="st_doing" type="ty_work" priority="p3">
      <due_date>2026-05-20</due_date>
      <remark>重要任务</remark>
      <created_date>2026-05-16T10:00:00</created_date>
      <subtasks>
        <task id="SUB001" title="子任务1" status="st_done" type="ty_work" priority="p3"/>
        <task id="SUB002" title="子任务2" status="st_doing" type="ty_work" priority="p3"/>
      </subtasks>
    </task>
  </date>
</tasks>
```

**特点**：
- 层级结构清晰
- 支持特殊字符转义
- UTF-8 编码支持中文
- 易于版本控制和差异比较

### JSON 格式

```json
{
  "2026-05-16": [
    {
      "id": "TASK001",
      "title": "主任务1",
      "status_id": "st_doing",
      "type_id": "ty_work",
      "priority_id": "p3",
      "due_date": "2026-05-20",
      "remark": "重要任务",
      "created_date": "2026-05-16T10:00:00",
      "subtasks": [
        {
          "id": "SUB001",
          "title": "子任务1",
          "status_id": "st_done",
          "type_id": "ty_work",
          "priority_id": "p3",
          "created_date": "2026-05-16T11:00:00"
        }
      ]
    }
  ]
}
```

## 快速开始

### 环境要求

- Node.js >= 18
- Rust >= 1.70
- pnpm 或 npm

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
# 启动前端开发服务器
npm run dev

# 启动 Tauri 开发模式（推荐）
npm run tauri:dev
```

### 构建应用

```bash
# 构建前端
npm run build

# 构建桌面应用
npm run tauri:build
```

## 推荐的 IDE 设置

- [VS Code](https://code.visualstudio.com/)
- [Vue - Official](https://marketplace.visualstudio.com/items?itemName=Vue.volar)
- [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode)
- [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)

## 技术亮点

### 为什么选择 Tauri？

- **轻量级**: 打包体积小（~10MB vs Electron ~150MB）
- **高性能**: Rust 后端，内存占用低
- **安全性**: Rust 内存安全保证
- **原生体验**: 更接近原生应用的性能和体验

### 为什么选择 Vue 3？

- **Composition API**: 更好的逻辑复用和代码组织
- **TypeScript 支持**: 完善的类型推断
- **性能提升**: 相比 Vue 2 更快的渲染性能
- **生态成熟**: 丰富的插件和工具链

### 文件格式支持

- **多格式支持**: JSON、Excel、XML 三种格式
- **完整数据保存**: 所有格式都支持完整的任务信息
- **Excel 可视化**: 平铺结构，易于手动编辑
- **XML 结构化**: 层级清晰，适合版本控制

## 项目统计

- Vue 组件: 20个
- Rust 源文件: 5个
- 样式文件: 9个
- 总代码量: 约 50,000+ 行
- 核心业务代码: 约 30,000 行

## 最近更新

### v1.1.0 (2026-05-16)

#### 新功能
- ✅ 实现 Excel 文件读取功能（使用 calamine 库）
- ✅ 改进 Excel 文件写入功能（平铺存储结构）
- ✅ 实现 XML 文件读写功能
- ✅ 添加 XML 特殊字符转义/反转义

#### 改进
- ✅ 重构任务操作函数到公共模块
- ✅ 提取通用组件（标题栏、统计、树、状态栏）
- ✅ 统一字段命名（created_at → created_date）
- ✅ 改进 Excel 存储格式（主任务ID关联）

#### 修复
- ✅ 修复子任务编辑自动保存问题
- ✅ 修复前端数据更新问题
- ✅ 修复文件存储参数命名问题
- ✅ 修复 Tauri 2.x 参数命名规范

## 适用场景

- 个人任务管理和待办事项跟踪
- 项目任务规划和进度管理
- 团队任务分配和协作（单机版）
- 学习计划和生活安排
- 工作任务优先级管理

## 许可证

MIT License

## 贡献指南

欢迎提交 Issue 和 Pull Request！

## 联系方式

如有问题或建议，请通过 GitHub Issues 联系。

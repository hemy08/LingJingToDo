# 灵境待办 - 项目架构文档

## 项目概述

**灵境待办** 是一个基于 **Tauri 2 + Vue 3 + TypeScript + Rust** 构建的现代化跨平台桌面任务管理应用。

- **版本**: 0.1.0
- **技术栈**: Tauri 2, Vue 3, TypeScript, Rust
- **支持平台**: Windows, macOS, Linux

---

## 系统架构

### 整体架构图

```mermaid
graph TB
    subgraph "前端层 (Vue 3 + TypeScript)"
        A[App.vue<br/>应用入口]
        B[LingJingToDo.vue<br/>主应用组件]
        C[CalendarPanel<br/>日历面板]
        D[TaskPanel<br/>任务面板]
        E[ConfigModals<br/>配置模态框]
    end
    
    subgraph "API 连接层"
        F[task_apis.ts<br/>任务API]
        G[config_apis.ts<br/>配置API]
        H[file_apis.ts<br/>文件API]
    end
    
    subgraph "Tauri IPC 桥梁"
        I[Tauri Commands<br/>IPC 通信]
    end
    
    subgraph "后端层 (Rust)"
        J[lib.rs<br/>主库入口]
        K[tasks.rs<br/>任务管理]
        L[config.rs<br/>配置管理]
        M[file_ops.rs<br/>文件操作]
    end
    
    subgraph "数据存储层"
        N[(tasks/<br/>日期文件)]
        O[(config.json<br/>配置文件)]
        P[(历史文件<br/>记录)]
    end
    
    A --> B
    B --> C
    B --> D
    B --> E
    
    D --> F
    E --> G
    B --> H
    
    F --> I
    G --> I
    H --> I
    
    I --> J
    J --> K
    J --> L
    J --> M
    
    K --> N
    L --> O
    M --> P
    
    style A fill:#42b883
    style B fill:#42b883
    style J fill:#dea584
    style K fill:#dea584
    style L fill:#dea584
    style M fill:#dea584
```

### 技术栈架构

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
    
    subgraph "Tauri 插件"
        D1[tauri-plugin-opener]
        D2[tauri-plugin-dialog]
        D3[tauri-plugin-process]
        D4[tauri-plugin-fs]
    end
    
    A1 --> B2
    A3 --> B1
    B1 --> B3
    B3 --> C1
    
    C1 --> C2
    C1 --> C3
    C1 --> C4
    C1 --> C5
    
    B1 --> D1
    B1 --> D2
    B1 --> D3
    B1 --> D4
    
    style A1 fill:#42b883
    style B1 fill:#24292e
    style C1 fill:#dea584
```

---

## 目录结构

```mermaid
graph TB
    A[LingJingToDo/] --> B[lingjing_uiux/<br/>前端UI层]
    A --> C[lingjing_server/<br/>后端服务层]
    A --> D[docs/<br/>项目文档]
    A --> E[public/<br/>静态资源]
    A --> F[package.json]
    A --> G[vite.config.ts]
    
    B --> B1[components/<br/>Vue组件]
    B --> B2[assets/<br/>样式资源]
    B --> B3[composables/<br/>组合式函数]
    B --> B4[connections/<br/>API连接]
    B --> B5[App.vue]
    B --> B6[main.ts]
    B --> B7[types.ts]
    
    B1 --> B1a[calendar/<br/>日历组件]
    B1 --> B1b[tasks/<br/>任务组件]
    B1 --> B1c[config/<br/>配置组件]
    B1 --> B1d[themes/<br/>主题组件]
    B1 --> B1e[common/<br/>通用组件]
    
    C --> C1[src/<br/>Rust源码]
    C --> C2[data/<br/>数据存储]
    C --> C3[capabilities/<br/>权限配置]
    C --> C4[Cargo.toml]
    C --> C5[tauri.conf.json]
    
    C1 --> C1a[lib.rs]
    C1 --> C1b[tasks.rs]
    C1 --> C1c[config.rs]
    C1 --> C1d[file_ops.rs]
    
    style A fill:#f9f9f9,stroke:#333,stroke-width:4px
    style B fill:#42b883
    style C fill:#dea584
```

---

## 核心组件架构

### 前端组件层次结构

```mermaid
graph TB
    A[App.vue<br/>根组件] --> B[HistoryFiles.vue<br/>历史文件选择]
    A --> C[LingJingToDo.vue<br/>主应用]
    
    C --> D[CustomTitleBar.vue<br/>自定义标题栏]
    C --> E[CalendarPanel.vue<br/>日历面板]
    C --> F[TaskPanel.vue<br/>任务面板]
    C --> G[TaskStatistics.vue<br/>任务统计]
    C --> H[StatusModal.vue<br/>状态配置]
    C --> I[TypeModal.vue<br/>类型配置]
    C --> J[PriorityModal.vue<br/>优先级配置]
    
    F --> F1[TaskAddArea.vue<br/>任务添加区域]
    F --> F2[SettingsPanel.vue<br/>设置面板]
    F --> F3[MasonryLayout.vue<br/>瀑布流布局]
    F --> F4[ListLayout.vue<br/>列表布局]
    F --> F5[TreeLayout.vue<br/>树形布局]
    F --> F6[TaskCard.vue<br/>任务卡片]
    
    F6 --> F6a[SubtaskCard.vue<br/>子任务卡片]
    F6 --> F6b[SubtaskTable.vue<br/>子任务表格]
    F6 --> F6c[SubtaskModal.vue<br/>子任务模态框]
    
    E --> E1[CalendarHeader.vue<br/>日历头部]
    E --> E2[CalendarGrid.vue<br/>日历网格]
    
    style A fill:#ff6b6b
    style C fill:#4ecdc4
    style F fill:#45b7d1
```

### 后端模块架构

```mermaid
graph TB
    A[lib.rs<br/>主库入口] --> B[命令注册]
    A --> C[状态管理]
    A --> D[自动保存定时任务]
    
    B --> B1[任务命令<br/>14个]
    B --> B2[配置命令<br/>10个]
    B --> B3[文件命令<br/>4个]
    
    C --> C1[ConfigState<br/>配置状态]
    C --> C2[TaskData<br/>任务数据]
    
    E[tasks.rs<br/>任务模块] --> E1[任务CRUD]
    E --> E2[任务重排序]
    E --> E3[任务查询]
    E --> E4[任务统计]
    E --> E5[子任务管理]
    
    F[config.rs<br/>配置模块] --> F1[状态管理]
    F --> F2[类型管理]
    F --> F3[优先级管理]
    F --> F4[主题管理]
    
    G[file_ops.rs<br/>文件操作] --> G1[JSON格式]
    G --> G2[XML格式]
    G --> G3[Excel格式]
    G --> G4[历史文件管理]
    
    style A fill:#dea584
    style E fill:#f9a825
    style F fill:#f9a825
    style G fill:#f9a825
```

---

## 数据模型

### 核心数据模型关系

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

### 数据存储结构

```mermaid
graph LR
    A[数据存储] --> B[tasks/ 目录]
    A --> C[config.json]
    A --> D[recent_files.json]
    
    B --> B1[2024-01-01.json]
    B --> B2[2024-01-02.json]
    B --> B3[2024-01-03.json]
    B --> B4[...]
    
    C --> C1[状态配置]
    C --> C2[类型配置]
    C --> C3[优先级配置]
    C --> C4[主题配置]
    
    D --> D1[文件路径1]
    D --> D2[文件路径2]
    D --> D3[...]
    
    style A fill:#f9f9f9,stroke:#333,stroke-width:2px
    style B fill:#42b883
    style C fill:#dea584
```

---

## API 接口设计

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

### 任务 API 接口

```mermaid
graph TB
    subgraph "任务 API (14个命令)"
        A[getTasks<br/>获取任务列表]
        B[addTask<br/>添加任务]
        C[updateTask<br/>更新任务]
        D[deleteTask<br/>删除任务]
        E[reorderTasks<br/>重排序任务]
        F[getAllTasks<br/>获取所有任务]
        G[importTasks<br/>导入任务]
        
        H[generateMainTaskId<br/>生成主任务ID]
        I[generateSubtaskId<br/>生成子任务ID]
        
        J[addSubtask<br/>添加子任务]
        K[updateSubtask<br/>更新子任务]
        L[deleteSubtask<br/>删除子任务]
        
        M[queryTasks<br/>查询任务]
        N[getTaskStatistics<br/>任务统计]
    end
    
    style A fill:#4ecdc4
    style B fill:#4ecdc4
    style C fill:#4ecdc4
    style D fill:#4ecdc4
```

### 配置 API 接口

```mermaid
graph TB
    subgraph "配置 API (10个命令)"
        A[状态管理]
        B[类型管理]
        C[优先级管理]
        
        A --> A1[getAll]
        A --> A2[update]
        A --> A3[delete]
        
        B --> B1[getAll]
        B --> B2[update]
        B --> B3[delete]
        
        C --> C1[getAll]
        C --> C2[update]
        C --> C3[delete]
    end
    
    style A fill:#ff6b6b
    style B fill:#4ecdc4
    style C fill:#f9a825
```

---

## 状态管理流程

### 前端状态管理

```mermaid
stateDiagram-v2
    [*] --> 初始化
    初始化 --> 加载配置
    加载配置 --> 加载任务数据
    加载任务数据 --> 就绪
    
    就绪 --> 添加任务: 用户添加
    添加任务 --> 更新UI
    更新UI --> 保存数据
    保存数据 --> 就绪
    
    就绪 --> 编辑任务: 用户编辑
    编辑任务 --> 更新UI
    
    就绪 --> 删除任务: 用户删除
    删除任务 --> 更新UI
    
    就绪 --> 切换日期: 日期选择
    切换日期 --> 加载任务数据
    
    就绪 --> 导入数据: 文件导入
    导入数据 --> 更新UI
    
    就绪 --> 导出数据: 文件导出
    导出数据 --> 就绪
```

### 数据同步流程

```mermaid
sequenceDiagram
    participant U as 用户
    participant V as Vue状态
    participant R as Rust状态
    participant F as 文件系统
    
    Note over U,F: 初始化流程
    U->>V: 启动应用
    V->>R: 加载配置
    R->>F: 读取config.json
    F-->>R: 配置数据
    R-->>V: 配置状态
    V->>R: 加载今日任务
    R->>F: 读取tasks/今日.json
    F-->>R: 任务数据
    R-->>V: 任务列表
    
    Note over U,F: 自动保存流程
    loop 每日凌晨1点
        R->>F: 保存所有数据
        F-->>R: 保存成功
    end
```

---

## 布局系统

### 三种布局模式

```mermaid
graph TB
    A[TaskPanel<br/>任务面板] --> B{布局模式}
    
    B -->|瀑布流| C[MasonryLayout]
    B -->|列表| D[ListLayout]
    B -->|树形| E[TreeLayout]
    
    C --> C1[多列瀑布流展示]
    C --> C2[拖拽排序]
    C --> C3[响应式列数]
    
    D --> D1[单列列表展示]
    D --> D2[紧凑布局]
    D --> D3[快速浏览]
    
    E --> E1[父子层级展示]
    E --> E2[展开/折叠]
    E --> E3[层级缩进]
    
    C1 --> F[TaskCard<br/>任务卡片]
    D1 --> F
    E1 --> F
    
    style A fill:#4ecdc4
    style C fill:#ff6b6b
    style D fill:#f9a825
    style E fill:#45b7d1
```

---

## 文件导入导出流程

### 多格式支持

```mermaid
graph TB
    A[文件操作] --> B[导入]
    A --> C[导出]
    
    B --> B1{文件格式}
    B1 -->|JSON| B2[解析JSON]
    B1 -->|XML| B3[解析XML]
    B1 -->|Excel| B4[解析Excel<br/>calamine]
    
    B2 --> B5[验证数据结构]
    B3 --> B5
    B4 --> B5
    
    B5 --> B6[合并到当前数据]
    B6 --> B7[更新UI]
    
    C --> C1{导出格式}
    C1 -->|JSON| C2[序列化JSON]
    C1 -->|XML| C3[生成XML]
    C1 -->|Excel| C4[生成Excel<br/>rust_xlsxwriter]
    
    C2 --> C5[保存文件]
    C3 --> C5
    C4 --> C5
    
    style A fill:#f9f9f9,stroke:#333,stroke-width:2px
    style B fill:#4ecdc4
    style C fill:#ff6b6b
```

---

## 自动保存机制

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

## 性能优化建议

### 当前性能瓶颈

```mermaid
graph TB
    A[性能瓶颈分析] --> B[前端]
    A --> C[后端]
    A --> D[数据存储]
    
    B --> B1[大量任务渲染<br/>缺少虚拟滚动]
    B --> B2[深层响应式<br/>性能开销]
    B --> B3[重复计算<br/>缺少缓存]
    
    C --> C1[文件IO频繁<br/>每次切换日期]
    C --> C2[全量保存<br/>无增量更新]
    
    D --> D1[大量小文件<br/>长期使用]
    D --> D2[JSON解析<br/>性能一般]
    
    style A fill:#ff6b6b
    style B1 fill:#f9a825
    style C1 fill:#f9a825
    style D1 fill:#f9a825
```

### 优化方案

```mermaid
graph LR
    A[优化方案] --> B[引入Pinia<br/>状态管理]
    A --> C[虚拟滚动<br/>大量数据]
    A --> D[数据缓存<br/>减少IO]
    A --> E[SQLite存储<br/>替代JSON]
    A --> F[增量保存<br/>只保存变更]
    
    B --> G[性能提升 30%]
    C --> G
    D --> H[性能提升 50%]
    E --> H
    F --> H
    
    style A fill:#4ecdc4
    style G fill:#45b7d1
    style H fill:#45b7d1
```

---

## 扩展方向

### 功能扩展路线图

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
    移动端支持       :2024-06, 1m
```

### 技术架构演进

```mermaid
graph TB
    A[当前架构] --> B[优化架构]
    B --> C[协作架构]
    
    subgraph "当前架构"
        A1[Vue 3] --> A2[Tauri IPC]
        A2 --> A3[Rust]
        A3 --> A4[JSON文件]
    end
    
    subgraph "优化架构"
        B1[Vue 3 + Pinia] --> B2[Tauri IPC]
        B2 --> B3[Rust]
        B3 --> B4[SQLite]
        B3 --> B5[缓存层]
    end
    
    subgraph "协作架构"
        C1[Vue 3 + Pinia] --> C2[Tauri IPC]
        C2 --> C3[Rust]
        C3 --> C4[SQLite]
        C3 --> C5[云服务API]
        C5 --> C6[实时同步]
    end
    
    style A fill:#f9a825
    style B fill:#4ecdc4
    style C fill:#45b7d1
```

---

## 技术选型建议

### 推荐技术栈

```mermaid
graph TB
    A[技术选型] --> B[前端库]
    A --> C[后端库]
    A --> D[工具链]
    
    B --> B1[Pinia<br/>状态管理]
    B --> B2[VueUse<br/>组合式函数]
    B --> B3[Vitest<br/>单元测试]
    B --> B4[UnoCSS<br/>原子化CSS]
    B --> B5[Vue I18n<br/>国际化]
    B --> B6[ECharts<br/>数据可视化]
    
    C --> C1[thiserror<br/>错误处理]
    C --> C2[sqlx<br/>数据库]
    C --> C3[tokio<br/>异步运行时]
    
    D --> D1[VitePress<br/>文档]
    D --> D2[Playwright<br/>E2E测试]
    
    style A fill:#f9f9f9,stroke:#333,stroke-width:2px
    style B fill:#42b883
    style C fill:#dea584
```

---

## 总结

本项目采用现代化的技术架构，具有以下特点：

1. **清晰的分层架构**：前端、API连接层、后端、数据存储层职责明确
2. **类型安全**：TypeScript + Rust 双重类型保障
3. **高性能**：Rust 后端提供卓越性能
4. **跨平台**：Tauri 实现一次开发，多平台部署
5. **可扩展**：模块化设计，易于功能扩展

通过系统化的优化和功能扩展，本项目可以成长为一款优秀的跨平台任务管理工具。

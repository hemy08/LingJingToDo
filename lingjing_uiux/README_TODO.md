# 灵境待办 - Vue版本

## 文件结构

```
lingjing_uiux/
├── App.vue              # 主应用组件
├── components/
│   └── TodoApp.vue      # 待办应用主组件 (115KB)
├── assets/
│   └── todo.css         # 样式文件 (18KB)
├── main.ts              # Vue应用入口
└── README_TODO.md       # 本说明文件
```

## 技术栈

- **Vue 3** - 使用Composition API
- **TypeScript** - 类型安全
- **SortableJS** - 拖拽排序功能
- **SheetJS** - Excel导入导出
- **Font Awesome** - 图标库

## 功能特性

### 1. 任务管理
- ✅ 主任务和子任务管理
- ✅ 清单模式切换
- ✅ 拖拽排序
- ✅ 任务标题编辑
- ✅ 任务描述/备注

### 2. 元数据管理
- ✅ 自定义状态(待规划、已启动、进行中、已完成、已延期)
- ✅ 自定义类型(工作、学习、生活)
- ✅ 自定义优先级(最高优先级到不紧急)
- ✅ 截止时间设置

### 3. 日历功能
- ✅ 月历视图
- ✅ 日期导航
- ✅ 任务导航树
- ✅ 今日快捷按钮

### 4. 数据管理
- ✅ Excel导入导出
- ✅ 本地存储持久化
- ✅ 未保存提醒
- ✅ 数据脏标记

### 5. 主题和样式
- ✅ 9种主题(浅色、深色、护眼、橙色、紫色、红色、天蓝、海军蓝、深紫)
- ✅ 4种字体大小
- ✅ 响应式布局
- ✅ 侧边栏可拖拽调整宽度

### 6. 清单功能
- ✅ 子任务清单
- ✅ 主任务清单模式
- ✅ 清单项编辑
- ✅ 勾选状态管理

## 使用方式

### 开发模式
```bash
npm run dev
```

### 生产构建
```bash
npm run build
```

## 组件说明

### App.vue
主应用入口组件,负责:
- 引入TodoApp组件
- 设置全局样式
- 配置应用容器

### TodoApp.vue
核心业务组件,包含:
- 完整的待办应用逻辑
- 所有UI模板
- 样式定义
- 外部库集成

## 数据结构

### 主任务
```typescript
interface MainTask {
  id: number;
  title: string;
  statusId: string;
  typeId: string | null;
  priorityId: string | null;
  dueDate: string | null;
  description: string;
  useSubtasks: boolean;
  subtasks: SubTask[];
  checklist: ChecklistItem[];
  createdAt: number;
}
```

### 子任务
```typescript
interface SubTask {
  id: number;
  title: string;
  statusId: string;
  typeId: string | null;
  priorityId: string | null;
  dueDate: string | null;
  checklist: ChecklistItem[];
  createdAt: number;
}
```

### 清单项
```typescript
interface ChecklistItem {
  id: string | number;
  text: string;
  checked: boolean;
}
```

## 注意事项

1. **外部依赖**: 应用需要网络连接来加载Font Awesome、SortableJS和SheetJS
2. **本地存储**: 数据保存在浏览器的localStorage中
3. **浏览器兼容**: 建议使用现代浏览器(Chrome、Firefox、Edge、Safari)
4. **数据备份**: 建议定期使用Excel导出功能备份数据

## 迁移说明

本应用已从原生HTML/JS迁移到Vue 3:
- ✅ HTML模板已整合到Vue组件
- ✅ JavaScript逻辑已迁移到Vue的onMounted钩子
- ✅ CSS样式已整合到Vue组件的style标签
- ✅ 保持了所有原有功能完整性

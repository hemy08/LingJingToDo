# Pinia 状态管理迁移指南

## 概述

本项目已从 Vue 3 的 `reactive`/`ref` 状态管理迁移到 **Pinia**，提供更好的性能、开发体验和类型支持。

---

## 安装

Pinia 已安装完成：

```bash
npm install pinia
```

---

## Store 结构

### 目录结构

```
lingjing_uiux/stores/
├── index.ts           # Pinia 实例
├── taskStore.ts       # 任务状态管理
└── configStore.ts     # 配置状态管理
```

---

## 使用示例

### 1. 任务状态管理 (taskStore)

#### 在组件中使用

```vue
<template>
  <div>
    <!-- 显示加载状态 -->
    <div v-if="taskStore.loading">加载中...</div>
    
    <!-- 显示错误信息 -->
    <div v-if="taskStore.error" class="error">
      {{ taskStore.error }}
    </div>
    
    <!-- 显示任务列表 -->
    <div v-for="task in taskStore.tasks" :key="task.id">
      {{ task.title }}
    </div>
    
    <!-- 显示统计信息 -->
    <p>总任务数: {{ taskStore.taskCount }}</p>
    <p>已完成: {{ taskStore.completedTasks.length }}</p>
    <p>待处理: {{ taskStore.pendingTasks.length }}</p>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useTaskStore } from '../stores/taskStore'

const taskStore = useTaskStore()

// 组件挂载时加载任务
onMounted(async () => {
  await taskStore.loadTasks('2024-01-15')
})

// 添加任务
async function handleAddTask() {
  const newTask = {
    id: await generateId(),
    title: 'New Task',
    status_id: 'pending',
    type_id: 'work',
    priority_id: 'p2'
  }
  await taskStore.addTask(newTask)
}

// 更新任务
async function handleUpdateTask(task) {
  const updatedTask = { ...task, title: 'Updated Title' }
  await taskStore.updateTask(updatedTask)
}

// 删除任务
async function handleDeleteTask(taskId) {
  await taskStore.deleteTask(taskId)
}
</script>
```

#### Store API

**State**:
- `tasks`: Task[] - 任务列表
- `currentDate`: string - 当前日期
- `loading`: boolean - 加载状态
- `error`: string | null - 错误信息

**Getters**:
- `completedTasks`: Task[] - 已完成任务
- `pendingTasks`: Task[] - 待处理任务
- `taskCount`: number - 任务总数
- `mainTasks`: Task[] - 主任务（无子任务）
- `tasksWithSubtasks`: Task[] - 包含子任务的任务

**Actions**:
- `loadTasks(date)` - 加载指定日期的任务
- `addTask(task)` - 添加任务
- `updateTask(task)` - 更新任务
- `deleteTask(taskId)` - 删除任务
- `reorderTasks(reorderedTasks)` - 重排序任务
- `addSubtask(parentId, subtask)` - 添加子任务
- `updateSubtask(parentId, subtask)` - 更新子任务
- `deleteSubtask(parentId, subtaskId)` - 删除子任务
- `queryTasks(options)` - 查询任务
- `clearError()` - 清除错误

---

### 2. 配置状态管理 (configStore)

#### 在组件中使用

```vue
<template>
  <div>
    <!-- 显示状态列表 -->
    <div v-for="status in configStore.statuses" :key="status.id">
      {{ status.emoji }} {{ status.name }}
    </div>
    
    <!-- 显示类型列表 -->
    <div v-for="type in configStore.types" :key="type.id">
      {{ type.emoji }} {{ type.name }}
    </div>
    
    <!-- 显示优先级列表 -->
    <div v-for="priority in configStore.priorities" :key="priority.id">
      {{ priority.emoji }} {{ priority.name }}
    </div>
    
    <!-- 使用 getter 快速查找 -->
    <p>默认状态: {{ configStore.defaultStatus?.name }}</p>
    <p>默认类型: {{ configStore.defaultType?.name }}</p>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useConfigStore } from '../stores/configStore'

const configStore = useConfigStore()

// 组件挂载时加载配置
onMounted(async () => {
  await configStore.loadAllConfig()
})

// 获取状态对象
function getStatusName(statusId: string) {
  return configStore.getStatusById(statusId)?.name || 'Unknown'
}

// 更新状态配置
async function handleUpdateStatus() {
  const newStatuses = [
    ...configStore.statuses,
    { id: 'new', name: '新状态', color: '#fff', emoji: '🆕' }
  ]
  await configStore.updateStatuses(newStatuses)
}
</script>
```

#### Store API

**State**:
- `statuses`: TaskStatus[] - 状态列表
- `types`: TaskType[] - 类型列表
- `priorities`: TaskPriority[] - 优先级列表
- `loading`: boolean - 加载状态
- `error`: string | null - 错误信息

**Getters**:
- `statusMap`: Map<string, TaskStatus> - 状态映射
- `typeMap`: Map<string, TaskType> - 类型映射
- `priorityMap`: Map<string, TaskPriority> - 优先级映射
- `defaultStatus`: TaskStatus - 默认状态
- `defaultType`: TaskType - 默认类型
- `defaultPriority`: TaskPriority - 默认优先级

**Actions**:
- `loadStatuses()` - 加载状态配置
- `loadTypes()` - 加载类型配置
- `loadPriorities()` - 加载优先级配置
- `loadAllConfig()` - 加载所有配置
- `updateStatuses(statuses)` - 更新状态配置
- `updateTypes(types)` - 更新类型配置
- `updatePriorities(priorities)` - 更新优先级配置
- `deleteStatus(id)` - 删除状态
- `deleteType(id)` - 删除类型
- `deletePriority(id)` - 删除优先级
- `getStatusById(id)` - 根据ID获取状态
- `getTypeById(id)` - 根据ID获取类型
- `getPriorityById(id)` - 根据ID获取优先级
- `clearError()` - 清除错误

---

## 迁移步骤

### 从 reactive/ref 迁移到 Pinia

#### 迁移前（使用 reactive）

```vue
<script setup>
import { reactive, onMounted } from 'vue'
import { taskApi } from '../connections/task_apis'

const state = reactive({
  tasks: [],
  currentDate: new Date().toISOString().split('T')[0],
  loading: false
})

onMounted(async () => {
  state.loading = true
  state.tasks = await taskApi.getTasks(state.currentDate)
  state.loading = false
})
</script>
```

#### 迁移后（使用 Pinia）

```vue
<script setup>
import { onMounted } from 'vue'
import { useTaskStore } from '../stores/taskStore'

const taskStore = useTaskStore()

onMounted(async () => {
  await taskStore.loadTasks(taskStore.currentDate)
})
</script>
```

---

## 最佳实践

### 1. 组件中只使用 Store

```vue
<script setup>
import { useTaskStore } from '../stores/taskStore'
import { useConfigStore } from '../stores/configStore'

const taskStore = useTaskStore()
const configStore = useConfigStore()

// ✅ 推荐：直接使用 store
console.log(taskStore.tasks)

// ❌ 不推荐：不要在组件中维护重复状态
const localTasks = ref([])
</script>
```

### 2. 使用 computed 缓存计算结果

```vue
<script setup>
import { computed } from 'vue'
import { useTaskStore } from '../stores/taskStore'

const taskStore = useTaskStore()

// ✅ 推荐：使用 computed 缓存
const highPriorityTasks = computed(() => 
  taskStore.tasks.filter(t => t.priority_id === 'p1')
)

// ❌ 不推荐：每次都重新计算
function getHighPriorityTasks() {
  return taskStore.tasks.filter(t => t.priority_id === 'p1')
}
</script>
```

### 3. 错误处理

```vue
<template>
  <div v-if="taskStore.error" class="error-message">
    {{ taskStore.error }}
    <button @click="taskStore.clearError()">关闭</button>
  </div>
</template>
```

### 4. 加载状态

```vue
<template>
  <div v-if="taskStore.loading" class="loading">
    加载中...
  </div>
  <div v-else>
    <!-- 内容 -->
  </div>
</template>
```

---

## 性能优化

### 1. 使用 shallowRef 减少响应式开销

对于大型数组，可以使用 `shallowRef`：

```typescript
import { shallowRef } from 'vue'

export const useTaskStore = defineStore('tasks', () => {
  const tasks = shallowRef<Task[]>([])
  
  // 更新时重新赋值
  async function loadTasks(date: string) {
    tasks.value = await taskApi.getTasks(date)
  }
  
  return { tasks, loadTasks }
})
```

### 2. 使用 computed 缓存派生状态

```typescript
// ✅ 自动缓存，依赖不变时不重新计算
const completedCount = computed(() => 
  tasks.value.filter(t => t.status_id === 'completed').length
)
```

### 3. 按需加载配置

```typescript
// ✅ 只在需要时加载
onMounted(async () => {
  if (configStore.statuses.length === 0) {
    await configStore.loadAllConfig()
  }
})
```

---

## 调试

### Vue DevTools

Pinia 完全支持 Vue DevTools，可以：
- 查看所有 store 的状态
- 实时修改状态
- 查看 actions 调用历史
- 时间旅行调试

### 控制台调试

```typescript
// 在组件中
const taskStore = useTaskStore()
console.log('当前任务:', taskStore.tasks)
console.log('任务数量:', taskStore.taskCount)
```

---

## 类型支持

Pinia 提供完整的 TypeScript 支持：

```typescript
// ✅ 自动类型推断
const taskStore = useTaskStore()
taskStore.tasks // Task[]
taskStore.taskCount // number

// ✅ Actions 参数类型检查
await taskStore.addTask({
  id: '1',
  title: 'Task',
  status_id: 'pending',
  type_id: 'work',
  priority_id: 'p2'
})
```

---

## 下一步

1. **迁移现有组件**: 将使用 `reactive`/`ref` 的组件迁移到 Pinia
2. **添加更多 Store**: 根据需要创建新的 store（如 uiStore、userStore）
3. **添加持久化**: 使用 `pinia-plugin-persistedstate` 实现状态持久化
4. **添加插件**: 使用 Pinia 插件扩展功能

---

## 相关资源

- [Pinia 官方文档](https://pinia.vuejs.org/)
- [Vue 3 Composition API](https://vuejs.org/api/composition-api.html)
- [TypeScript 官方文档](https://www.typescriptlang.org/)

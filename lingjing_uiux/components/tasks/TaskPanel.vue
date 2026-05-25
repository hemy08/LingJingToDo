<template>
  <div class="task-panel">
    <!-- 任务添加区域 -->
    <TaskAddArea
      :statuses="statuses"
      :current-date="currentDate"
      :is-dirty="isDirty"
      @update:is-dirty="emit('update:isDirty', $event)"
      @task-added="emit('task-added', $event)"
    />

    <!-- 图例说明 -->
    <div class="legend-bar">
      <span class="legend-emoji">任务属性说明：</span>
      <div class="legend-item">
        <span class="legend-emoji">🕐</span>
        <span class="legend-text">创建日期</span>
      </div>
      <div class="legend-item">
        <span class="legend-emoji">📅</span>
        <span class="legend-text">截止时间</span>
      </div>
      <div class="legend-item">
        <span class="legend-emoji">🏷️</span>
        <span class="legend-text">类型</span>
      </div>
      <div class="legend-item">
        <span class="legend-emoji">📌</span>
        <span class="legend-text">状态</span>
      </div>
      <div class="legend-item">
        <span class="legend-emoji">📁</span>
        <span class="legend-text">优先级</span>
      </div>
    </div>

    <!-- 设置区域 -->
    <SettingsPanel :config="config" @update:config="handleConfigUpdate" />

    <!-- 统一搜索筛选面板 -->
    <UnifiedSearchFilter
      v-if="showFilterPanel"
      :tasks="tasks"
      :statuses="statuses"
      :priorities="priorities"
      :types="types"
      @filter-change="handleFilterChange"
    />

    <!-- 任务列表容器（可滚动） -->
    <div class="task-list-container">
      <!-- 任务列表 -->
      <MasonryLayout
        v-if="layoutMode === 'masonry' && tasks.length > 0"
        :tasks="tasks"
        :drag-mode="dragMode"
        :current-date="currentDate || ''"
        :tasks-ref="tasks"
      >
        <TaskCard
          v-for="task in tasks"
          :key="task.id"
          :task="task"
          :statuses="statuses"
          :types="types"
          :priorities="priorities"
          :subtask-display-mode="getSubtaskDisplayMode(task.id)"
          :selected-task-id="selectedTaskId"
          :current-date="currentDate || ''"
          :tasks="tasks"
          @add-subtask="openSubtaskModal"
          @toggle-subtask-mode="toggleSubtaskDisplayMode"
          @select="$emit('select-task', String($event))"
          @update="handleTaskUpdate"
          @delete="handleTaskDelete"
        >
          <template #subtasks="{ subtasks, displayMode }">
            <SubtaskTable
              v-if="displayMode === 'table'"
              :subtasks="subtasks"
              :statuses="statuses"
              :types="types"
              :priorities="priorities"
              :parent-id="task.id"
              :current-date="currentDate || ''"
              :tasks="tasks"
              @update="handleSubtaskCardUpdate(task.id, $event)"
              @delete="handleSubtaskCardDelete(task.id, $event)"
            />
            <div v-else class="subtasks-list">
              <SubtaskCard
                v-for="subtask in subtasks"
                :key="subtask.id"
                :subtask="subtask"
                :statuses="statuses"
                :types="types"
                :priorities="priorities"
                :parent-id="task.id"
                :current-date="currentDate || ''"
                :tasks="tasks"
                @update="handleSubtaskCardUpdate(task.id, $event)"
                @delete="handleSubtaskCardDelete(task.id, $event)"
              />
            </div>
          </template>
        </TaskCard>
      </MasonryLayout>

      <ListLayout
        v-if="layoutMode === 'list' && tasks.length > 0"
        :tasks="tasks"
        :drag-mode="dragMode"
        :columns="listColumns"
        :current-date="currentDate || ''"
        :tasks-ref="tasks"
      >
        <TaskCard
          v-for="task in tasks"
          :key="task.id"
          :task="task"
          :statuses="statuses"
          :types="types"
          :priorities="priorities"
          :subtask-display-mode="getSubtaskDisplayMode(task.id)"
          :selected-task-id="selectedTaskId"
          :current-date="currentDate || ''"
          :tasks="tasks"
          @add-subtask="openSubtaskModal"
          @toggle-subtask-mode="toggleSubtaskDisplayMode"
          @select="$emit('select-task', String($event))"
          @update="handleTaskUpdate"
          @delete="handleTaskDelete"
        >
          <template #subtasks="{ subtasks, displayMode }">
            <SubtaskTable
              v-if="displayMode === 'table'"
              :subtasks="subtasks"
              :statuses="statuses"
              :types="types"
              :priorities="priorities"
              :parent-id="task.id"
              :current-date="currentDate || ''"
              :tasks="tasks"
              @update="handleSubtaskCardUpdate(task.id, $event)"
              @delete="handleSubtaskCardDelete(task.id, $event)"
            />
            <div v-else class="subtasks-list">
              <SubtaskCard
                v-for="subtask in subtasks"
                :key="subtask.id"
                :subtask="subtask"
                :statuses="statuses"
                :types="types"
                :priorities="priorities"
                :parent-id="task.id"
                :current-date="currentDate || ''"
                :tasks="tasks"
                @update="handleSubtaskCardUpdate(task.id, $event)"
                @delete="handleSubtaskCardDelete(task.id, $event)"
              />
            </div>
          </template>
        </TaskCard>
      </ListLayout>

      <TreeLayout
        v-if="layoutMode === 'tree' && tasks.length > 0"
        :tasks="tasks"
        :drag-mode="dragMode"
        :current-date="currentDate || ''"
        :tasks-ref="tasks"
      >
        <TaskCard
          v-for="task in tasks"
          :key="task.id"
          :task="task"
          :statuses="statuses"
          :types="types"
          :priorities="priorities"
          :subtask-display-mode="getSubtaskDisplayMode(task.id)"
          :selected-task-id="selectedTaskId"
          :current-date="currentDate || ''"
          :tasks="tasks"
          @add-subtask="openSubtaskModal"
          @toggle-subtask-mode="toggleSubtaskDisplayMode"
          @select="$emit('select-task', String($event))"
          @update="handleTaskUpdate"
          @delete="handleTaskDelete"
        >
          <template #subtasks="{ subtasks, displayMode }">
            <SubtaskTable
              v-if="displayMode === 'table'"
              :subtasks="subtasks"
              :statuses="statuses"
              :types="types"
              :priorities="priorities"
              :parent-id="task.id"
              :current-date="currentDate || ''"
              :tasks="tasks"
              @update="handleSubtaskCardUpdate(task.id, $event)"
              @delete="handleSubtaskCardDelete(task.id, $event)"
            />
            <div v-else class="subtasks-list">
              <SubtaskCard
                v-for="subtask in subtasks"
                :key="subtask.id"
                :subtask="subtask"
                :statuses="statuses"
                :types="types"
                :priorities="priorities"
                :parent-id="task.id"
                :current-date="currentDate || ''"
                :tasks="tasks"
                @update="handleSubtaskCardUpdate(task.id, $event)"
                @delete="handleSubtaskCardDelete(task.id, $event)"
              />
            </div>
          </template>
        </TaskCard>
      </TreeLayout>

      <!-- 空状态 -->
      <div v-if="tasks.length === 0" class="empty-state">
        <i class="fas fa-clipboard-list"></i>
        <p>暂无任务</p>
        <p class="empty-hint">在上方输入框添加新任务</p>
      </div>
    </div>
    <!-- 结束 task-list-container -->
  </div>

  <!-- 子任务模态窗口 -->
  <SubtaskModal
    :visible="showSubtaskModal"
    :parent-task="currentParentTask"
    :statuses="statuses"
    :types="types"
    :priorities="priorities"
    :current-date="currentDate || ''"
    :tasks="tasks"
    @close="closeSubtaskModal"
    @update="handleSubtaskUpdate"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'

import type { Task, TaskStatus, TaskType, TaskPriority } from '../../types'
import UnifiedSearchFilter from '../common/UnifiedSearchFilter.vue'

import SettingsPanel from './common/SettingsPanel.vue'
import TaskAddArea from './common/TaskAddArea.vue'
import TaskCard from './common/TaskCard.vue'
import ListLayout from './layout/ListLayout.vue'
import MasonryLayout from './layout/MasonryLayout.vue'
import TreeLayout from './layout/TreeLayout.vue'
import SubtaskCard from './subtask/SubtaskCard.vue'
import SubtaskModal from './subtask/SubtaskModal.vue'
import SubtaskTable from './subtask/SubtaskTable.vue'
const props = defineProps<{
  selectedTaskId?: string | null
  tasks: Task[]
  statuses: TaskStatus[]
  types: TaskType[]
  priorities: TaskPriority[]
  currentDate: string | null
  isDirty: boolean
  showFilterPanel?: boolean
  config?: {
    fontSize?: string
    dragMode?: 'insert' | 'swap'
    layoutMode?: 'masonry' | 'list' | 'tree'
    listColumns?: number
  }
}>()

const emit = defineEmits<{
  'update:isDirty': [value: boolean]
  'select-task': [taskId: string | null]
  'show-status': [message: string, detail?: string, type?: 'success' | 'error' | 'warning' | 'info']
  'task-added': [task: Task]
  'task-updated': [task: Task]
  'task-deleted': [taskId: string]
  'filter-change': [filteredTasks: Task[]]
}>()

// 本地状态

// 子任务显示模式
const subtaskDisplayMode = ref<Record<string, 'card' | 'table'>>({})

// 子任务模态窗口
const showSubtaskModal = ref(false)
const currentParentTask = ref<Task | null>(null)

// 处理任务添加
// 处理配置更新
const handleConfigUpdate = (newConfig: any) => {
  // 更新本地配置状态
  fontSize.value = newConfig.fontSize
  dragMode.value = newConfig.dragMode
  layoutMode.value = newConfig.layoutMode
  listColumns.value = newConfig.listColumns
}
const fontSize = ref(props.config?.fontSize || 'medium')
const dragMode = ref<'insert' | 'swap'>(props.config?.dragMode || 'insert')
const layoutMode = ref<'masonry' | 'list' | 'tree'>(props.config?.layoutMode || 'masonry')
const listColumns = ref(props.config?.listColumns || 2)

const handleFilterChange = (filteredTasks: Task[]) => {
  emit('filter-change', filteredTasks)
}

// 切换子任务显示模式
const toggleSubtaskDisplayMode = (taskId: string) => {
  const currentMode = subtaskDisplayMode.value[taskId] || 'table'
  subtaskDisplayMode.value[taskId] = currentMode === 'table' ? 'card' : 'table'
}

// 获取子任务显示模式
const getSubtaskDisplayMode = (taskId: string): 'card' | 'table' => {
  return subtaskDisplayMode.value[taskId] || 'table'
}

// 打开子任务模态窗口
const openSubtaskModal = (task: Task) => {
  currentParentTask.value = task
  showSubtaskModal.value = true
}

// 关闭子任务模态窗口
const closeSubtaskModal = () => {
  showSubtaskModal.value = false
  currentParentTask.value = null
}

// 处理任务更新
const handleTaskUpdate = (updatedTask: Task) => {
  emit('task-updated', updatedTask)
}

// 处理子任务更新
const handleSubtaskUpdate = (updatedTask: Task) => {
  emit('task-updated', updatedTask)
  closeSubtaskModal()
}

// 处理子任务卡片更新
const handleSubtaskCardUpdate = (parentId: string, updatedSubtask: Task) => {
  // 找到父任务并更新子任务
  const parentTask = props.tasks.find(t => t.id === parentId)
  if (!parentTask) return

  const updatedSubtasks = (parentTask.subtasks || []).map(s =>
    s.id === updatedSubtask.id ? updatedSubtask : s
  )

  const updatedTask = {
    ...parentTask,
    subtasks: updatedSubtasks,
  }

  emit('task-updated', updatedTask)
}

// 处理子任务卡片删除
const handleSubtaskCardDelete = (parentId: string, subtaskId: string) => {
  // 找到父任务并删除子任务
  const parentTask = props.tasks.find(t => t.id === parentId)
  if (!parentTask) return

  const updatedSubtasks = (parentTask.subtasks || []).filter(s => s.id !== subtaskId)

  const updatedTask = {
    ...parentTask,
    subtasks: updatedSubtasks,
  }

  emit('task-updated', updatedTask)
}

// 处理任务删除
const handleTaskDelete = (taskId: string) => {
  emit('task-deleted', taskId)
}
</script>

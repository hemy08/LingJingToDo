<template>
  <div class="task-panel">
    <!-- 任务添加区域 -->
    <div class="task-add-area">
      <input
        v-model="newTaskTitle"
        class="task-input"
        placeholder="输入任务标题,按回车添加..."
        @keyup.enter="handleAddTask"
      />
      <button class="btn-primary" @click="handleAddTask">
        <i class="fas fa-plus"></i>
        添加
      </button>
    </div>

    <!-- 设置区域 -->
    <div class="settings-area">
      <div class="setting-item">
        <label>🔤 字体大小:</label>
        <select v-model="fontSize">
          <option value="small">小</option>
          <option value="medium">中</option>
          <option value="large">大</option>
        </select>
      </div>
      <div class="setting-item">
        <label>🔄 拖动方式:</label>
        <select v-model="dragMode">
          <option value="insert">插入方式</option>
          <option value="swap">交换方式</option>
        </select>
      </div>
      <div class="setting-item">
        <label>📐 布局方式:</label>
        <select v-model="layoutMode">
          <option value="masonry">瀑布流</option>
          <option value="list">列表</option>
          <option value="tree">树形</option>
        </select>
      </div>
    </div>

    <!-- 任务列表 -->
    <MasonryLayout
      v-if="layoutMode === 'masonry' && tasks.length > 0"
      :tasks="tasks"
      :drag-mode="dragMode"
      @reorder="handleReorderTasks($event)"
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
        @update="handleUpdateTask($event)"
        @delete="handleDeleteTask($event)"
        @add-subtask="openSubtaskModal"
        @toggle-subtask-mode="toggleSubtaskDisplayMode"
        @select="$emit('select-task', $event)"
      >
        <template #subtasks="{ subtasks, displayMode }">
          <SubtaskTable
            v-if="displayMode === 'table'"
            :subtasks="subtasks"
            :statuses="statuses"
            :types="types"
            :priorities="priorities"
            @update="handleUpdateTask($event)"
            @delete="handleDeleteSubtask(task.id, $event)"
          />
          <div v-else class="subtasks-list">
            <SubtaskCard
              v-for="subtask in subtasks"
              :key="subtask.id"
              :subtask="subtask"
              :statuses="statuses"
              :types="types"
              :priorities="priorities"
              @update="handleUpdateTask($event)"
              @delete="handleDeleteSubtask(task.id, $event)"
            />
          </div>
        </template>
      </TaskCard>
    </MasonryLayout>

    <ListLayout
      v-if="layoutMode === 'list' && tasks.length > 0"
      :tasks="tasks"
      :drag-mode="dragMode"
      @reorder="handleReorderTasks($event)"
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
        @update="handleUpdateTask($event)"
        @delete="handleDeleteTask($event)"
        @add-subtask="openSubtaskModal"
        @toggle-subtask-mode="toggleSubtaskDisplayMode"
        @select="$emit('select-task', $event)"
      >
        <template #subtasks="{ subtasks, displayMode }">
          <SubtaskTable
            v-if="displayMode === 'table'"
            :subtasks="subtasks"
            :statuses="statuses"
            :types="types"
            :priorities="priorities"
            @update="handleUpdateTask($event)"
            @delete="handleDeleteSubtask(task.id, $event)"
          />
          <div v-else class="subtasks-list">
            <SubtaskCard
              v-for="subtask in subtasks"
              :key="subtask.id"
              :subtask="subtask"
              :statuses="statuses"
              :types="types"
              :priorities="priorities"
              @update="handleUpdateTask($event)"
              @delete="handleDeleteSubtask(task.id, $event)"
            />
          </div>
        </template>
      </TaskCard>
    </ListLayout>

    <TreeLayout
      v-if="layoutMode === 'tree' && tasks.length > 0"
      :tasks="tasks"
      :drag-mode="dragMode"
      @reorder="handleReorderTasks($event)"
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
        @update="handleUpdateTask($event)"
        @delete="handleDeleteTask($event)"
        @add-subtask="openSubtaskModal"
        @toggle-subtask-mode="toggleSubtaskDisplayMode"
        @select="$emit('select-task', $event)"
      >
        <template #subtasks="{ subtasks, displayMode }">
          <SubtaskTable
            v-if="displayMode === 'table'"
            :subtasks="subtasks"
            :statuses="statuses"
            :types="types"
            :priorities="priorities"
            @update="handleUpdateTask($event)"
            @delete="handleDeleteSubtask(task.id, $event)"
          />
          <div v-else class="subtasks-list">
            <SubtaskCard
              v-for="subtask in subtasks"
              :key="subtask.id"
              :subtask="subtask"
              :statuses="statuses"
              :types="types"
              :priorities="priorities"
              @update="handleUpdateTask($event)"
              @delete="handleDeleteSubtask(task.id, $event)"
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

    <!-- 子任务模态窗口 -->
    <SubtaskModal
      :visible="showSubtaskModal"
      :parent-task="currentParentTask"
      :statuses="statuses"
      :types="types"
      :priorities="priorities"
      @close="closeSubtaskModal"
      @submit="addSubtask"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { Task, TaskStatus, TaskType, TaskPriority } from '../../types'
import TaskCard from './TaskCard.vue'
import SubtaskCard from './SubtaskCard.vue'
import SubtaskTable from './SubtaskTable.vue'
import MasonryLayout from './MasonryLayout.vue'
import ListLayout from './ListLayout.vue'
import TreeLayout from './TreeLayout.vue'
import SubtaskModal from './SubtaskModal.vue'

const props = defineProps<{
  selectedTaskId?: number | null
  tasks: Task[]
  statuses: TaskStatus[]
  types: TaskType[]
  priorities: TaskPriority[]
  currentDate: string | null
  config?: {
    fontSize?: string
    dragMode?: 'insert' | 'swap'
    layoutMode?: 'masonry' | 'list' | 'tree'
  }
}>()

const emit = defineEmits<{
  dirty: []
  'select-task': [taskId: number | null]
}>()

// 本地状态
const newTaskTitle = ref('')
const fontSize = ref(props.config?.fontSize || 'medium')
const dragMode = ref<'insert' | 'swap'>(props.config?.dragMode || 'insert')
const layoutMode = ref<'masonry' | 'list' | 'tree'>(props.config?.layoutMode || 'masonry')

// 子任务显示模式
const subtaskDisplayMode = ref<Record<number, 'card' | 'table'>>({})

// 子任务模态窗口
const showSubtaskModal = ref(false)
const currentParentTask = ref<Task | null>(null)

// 添加任务
const handleAddTask = () => {
  if (!newTaskTitle.value.trim()) return
  if (!props.currentDate) return
  
  const newTask: Task = {
    id: Date.now() + Math.random() * 10000,
    title: newTaskTitle.value.trim(),
    statusId: props.statuses[0].id,
    typeId: "",
    priorityId: "",
    dueDate: undefined
  }
  
  // 直接修改 props.tasks（因为它是响应式的）
  props.tasks.push(newTask)
  emit('dirty')
  newTaskTitle.value = ''
}

// 切换子任务显示模式
const toggleSubtaskDisplayMode = (taskId: number) => {
  const currentMode = subtaskDisplayMode.value[taskId] || 'card'
  subtaskDisplayMode.value[taskId] = currentMode === 'card' ? 'table' : 'card'
}

// 获取子任务显示模式
const getSubtaskDisplayMode = (taskId: number): 'card' | 'table' => {
  return subtaskDisplayMode.value[taskId] || 'card'
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

// 添加子任务
const addSubtask = (newSubtask: Task) => {
  if (!currentParentTask.value) return

  const updatedTask = {
    ...currentParentTask.value,
    subtasks: [...(currentParentTask.value.subtasks || []), newSubtask]
  }

  handleUpdateTask(updatedTask)
  closeSubtaskModal()
}

const handleDeleteSubtask = (parentId: number, subtaskId: number) => {
  const parentTask = props.tasks.find(t => t.id === parentId)
  if (!parentTask) return

  const updatedTask = {
    ...parentTask,
    subtasks: parentTask.subtasks?.filter(s => s.id !== subtaskId) || []
  }

  handleUpdateTask(updatedTask)
}

// 更新任务
const handleUpdateTask = (updatedTask: Task) => {
  const taskIndex = props.tasks.findIndex(t => t.id === updatedTask.id)
  if (taskIndex !== -1) {
    props.tasks[taskIndex] = updatedTask
    emit('dirty')
  }
}

// 删除任务
const handleDeleteTask = (taskId: number) => {
  const index = props.tasks.findIndex(t => t.id === taskId)
  if (index !== -1) {
    props.tasks.splice(index, 1)
    emit('dirty')
  }
}

// 重排序任务
const handleReorderTasks = (reorderedTasks: Task[]) => {
  props.tasks.length = 0
  props.tasks.push(...reorderedTasks)
  emit('dirty')
}
</script>

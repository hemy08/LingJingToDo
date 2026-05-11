<template>
  <div class="task-panel">
    <!-- 任务添加区域 -->
    <TaskAddArea
      :statuses="statuses"
      :current-date="currentDate"
      :is-dirty="isDirty"
      @update:is-dirty="emit('update:isDirty', $event)"
      @task-added="handleTaskAdded"
    />

    <!-- 设置区域 -->
    <SettingsPanel :config="config" @update:config="handleConfigUpdate" />


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
        @select="$emit('select-task', String($event))"
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
        @select="$emit('select-task', String($event))"
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
        @select="$emit('select-task', String($event))"
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
import { taskApi } from '../../connections/task_apis'
import TaskAddArea from './TaskAddArea.vue'
import SettingsPanel from './SettingsPanel.vue'
import TaskCard from './TaskCard.vue'
import SubtaskCard from './SubtaskCard.vue'
import SubtaskTable from './SubtaskTable.vue'
import MasonryLayout from './MasonryLayout.vue'
import ListLayout from './ListLayout.vue'
import TreeLayout from './TreeLayout.vue'
import SubtaskModal from './SubtaskModal.vue'

const props = defineProps<{
  selectedTaskId?: string | null
  tasks: Task[]
  statuses: TaskStatus[]
  types: TaskType[]
  priorities: TaskPriority[]
  currentDate: string | null
  isDirty: boolean
  config?: {
    fontSize?: string
    dragMode?: 'insert' | 'swap'
    layoutMode?: 'masonry' | 'list' | 'tree'
  }
}>()

const emit = defineEmits<{
  'update:isDirty': [value: boolean]
  'select-task': [taskId: string | null]
}>()

// 本地状态

// 子任务显示模式
const subtaskDisplayMode = ref<Record<string, 'card' | 'table'>>({})

// 子任务模态窗口
const showSubtaskModal = ref(false)
const currentParentTask = ref<Task | null>(null)


// 处理任务添加
const handleTaskAdded = async (newTask: Task) => {
  try {
    const updatedTasks = await taskApi.addTask(props.currentDate || '', newTask)
    // 更新本地任务列表
    props.tasks.length = 0
    props.tasks.push(...updatedTasks)
  } catch (error) {
    console.error('添加任务失败:', error)
  }
}

// 处理配置更新
const handleConfigUpdate = (newConfig: any) => {
  // 更新本地配置状态
  fontSize.value = newConfig.fontSize
  dragMode.value = newConfig.dragMode
  layoutMode.value = newConfig.layoutMode
}
const fontSize = ref(props.config?.fontSize || 'medium')
const dragMode = ref<'insert' | 'swap'>(props.config?.dragMode || 'insert')
const layoutMode = ref<'masonry' | 'list' | 'tree'>(props.config?.layoutMode || 'masonry')


// 切换子任务显示模式
const toggleSubtaskDisplayMode = (taskId: string) => {
  const currentMode = subtaskDisplayMode.value[taskId] || 'card'
  subtaskDisplayMode.value[taskId] = currentMode === 'card' ? 'table' : 'card'
}

// 获取子任务显示模式
const getSubtaskDisplayMode = (taskId: string): 'card' | 'table' => {
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

const handleDeleteSubtask = (parentId: string, subtaskId: string) => {
  const parentTask = props.tasks.find(t => String(t.id) === String(parentId))
  if (!parentTask) return

  const updatedTask = {
    ...parentTask,
    subtasks: parentTask.subtasks?.filter(s => s.id !== subtaskId) || []
  }

  handleUpdateTask(updatedTask)
}

// 更新任务
const handleUpdateTask = async (updatedTask: Task) => {
  try {
    const updatedTasks = await taskApi.updateTask(props.currentDate || '', updatedTask)
    if (updatedTasks) {
      props.tasks.length = 0
      props.tasks.push(...updatedTasks)
    }
  } catch (error) {
    console.error('更新任务失败:', error)
  }
}

// 删除任务
const handleDeleteTask = async (taskId: string) => {
  try {
    const updatedTasks = await taskApi.deleteTask(props.currentDate || '', taskId)
    if (updatedTasks) {
      props.tasks.length = 0
      props.tasks.push(...updatedTasks)
    }
  } catch (error) {
    console.error('删除任务失败:', error)
  }
}

// 重排序任务
const handleReorderTasks = async (reorderedTasks: Task[]) => {
  try {
    const updatedTasks = await taskApi.reorderTasks(props.currentDate || '', reorderedTasks)
    if (updatedTasks) {
      props.tasks.length = 0
      props.tasks.push(...updatedTasks)
    }
  } catch (error) {
    console.error('重排序任务失败:', error)
  }
}
</script>

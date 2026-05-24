<script setup lang="ts">
import type { Task, TaskStatus, TaskType, TaskPriority } from '../../types'
import TaskPanel from '../tasks/TaskPanel.vue'

export interface MainContentAreaProps {
  tasks: Task[]
  currentDate: string
  statuses: TaskStatus[]
  types: TaskType[]
  priorities: TaskPriority[]
  isDirty: boolean
}

export interface MainContentAreaEmits {
  (e: 'update:isDirty', value: boolean): void
  (e: 'task-added', task: Task): void
  (e: 'task-updated', task: Task): void
  (e: 'task-deleted', taskId: string): void
}

defineProps<MainContentAreaProps>()
const emit = defineEmits<MainContentAreaEmits>()

const handleTaskAdded = (task: Task) => {
  emit('task-added', task)
}

const handleTaskUpdated = (task: Task) => {
  emit('task-updated', task)
}

const handleTaskDeleted = (taskId: string) => {
  emit('task-deleted', taskId)
}
</script>

<template>
  <div class="main-content-area">
    <slot name="toolbar"></slot>

    <TaskPanel
      v-model:is-dirty="isDirty"
      :tasks="tasks"
      :current-date="currentDate"
      :statuses="statuses"
      :types="types"
      :priorities="priorities"
      @task-added="handleTaskAdded"
      @task-updated="handleTaskUpdated"
      @task-deleted="handleTaskDeleted"
    />
  </div>
</template>

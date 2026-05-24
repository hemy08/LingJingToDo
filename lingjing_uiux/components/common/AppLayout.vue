<script setup lang="ts">
import type { Task } from '../../types'
import SidebarContainer from '../sidebar/SidebarContainer.vue'
import TaskPanel from '../tasks/TaskPanel.vue'

defineProps<{
  currentDate: string
  tasksFromDate: Task[]
  taskStatistics: any
  sidebarWidthPercent: number
  isSplitterActive: boolean
  config: any
  isDirty: boolean
  showFilterPanel?: boolean
}>()

const emit = defineEmits<{
  'date-change': [date: string]
  'splitter-drag': [event: MouseEvent]
  'task-added': [task: Task]
  'task-updated': [task: Task]
  'task-deleted': [taskId: string]
  'update:isDirty': [value: boolean]
}>()
</script>

<template>
  <div class="main-area">
    <SidebarContainer
      :current-date="currentDate"
      :tasks-from-date="tasksFromDate"
      :task-statistics="taskStatistics"
      :sidebar-width-percent="sidebarWidthPercent"
      :is-splitter-active="isSplitterActive"
      @date-change="emit('date-change', $event)"
      @splitter-drag="emit('splitter-drag', $event)"
    />

    <div class="main-content">
      <slot name="header"></slot>

      <TaskPanel
        :tasks="tasksFromDate"
        :current-date="currentDate"
        :statuses="config.statuses"
        :types="config.types"
        :priorities="config.priorities"
        :is-dirty="isDirty"
        :show-filter-panel="showFilterPanel"
        @update:is-dirty="emit('update:isDirty', $event)"
        @task-added="emit('task-added', $event)"
        @task-updated="emit('task-updated', $event)"
        @task-deleted="emit('task-deleted', $event)"
      />
    </div>
  </div>
</template>

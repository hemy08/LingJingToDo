<script setup lang="ts">
import type { Task } from '../../types'
import CalendarPanel from '../calendar/CalendarPanel.vue'
import TaskStatistics from '../tasks/common/TaskStatistics.vue'
import TaskTree from '../tasks/tasktree/TaskTree.vue'

export interface TaskStatisticsData {
  total_count: number
  main_task_count: number
  subtask_count: number
  due_today_count: number
  overdue_count: number
}

export interface SidebarContainerProps {
  currentDate: string
  tasksFromDate: Task[]
  taskStatistics: TaskStatisticsData
  sidebarWidthPercent: number
  isSplitterActive: boolean
}

export interface SidebarContainerEmits {
  (e: 'date-change', date: string): void
  (e: 'task-selected', taskId: string): void
  (e: 'splitter-drag', event: MouseEvent): void
}

defineProps<SidebarContainerProps>()
const emit = defineEmits<SidebarContainerEmits>()

const handleDateChange = (date: string) => {
  emit('date-change', date)
}

const handleTaskSelected = (taskId: string) => {
  emit('task-selected', taskId)
}

const handleSplitterDrag = (event: MouseEvent) => {
  emit('splitter-drag', event)
}
</script>

<template>
  <div class="sidebar" :style="{ width: sidebarWidthPercent + '%' }">
    <CalendarPanel :current-date="currentDate" @date-change="handleDateChange" />

    <TaskStatistics :statistics="taskStatistics" />

    <TaskTree :tasks="tasksFromDate" @task-selected="handleTaskSelected" />
  </div>

  <div class="splitter" :class="{ active: isSplitterActive }" @mousedown="handleSplitterDrag"></div>
</template>

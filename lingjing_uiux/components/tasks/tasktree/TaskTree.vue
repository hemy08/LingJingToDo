<template>
  <div class="task-tree">
    <div class="task-tree-title"><i class="fas fa-diagram-project"></i> 任务导航树</div>
    <div class="task-tree-container">
      <TaskTreeItem
        v-for="task in tasks"
        :key="task.id"
        :task="task"
        :depth="0"
        @task-click="handleTaskClick"
      />
      <div v-if="tasks.length === 0" class="empty-tree">暂无任务</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useTaskHighlightStore } from '../../../stores/taskHighlight'
import type { Task } from '../../../types'

import TaskTreeItem from './TaskTreeItem.vue'

const props = defineProps<{
  tasks: Task[]
}>()

void props

const taskHighlight = useTaskHighlightStore()

function handleTaskClick(task: Task) {
  taskHighlight.highlightAndScroll(task.id, 3000)
}
</script>

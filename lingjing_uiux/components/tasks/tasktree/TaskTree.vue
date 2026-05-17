<template>
  <div class="task-tree">
    <div class="task-tree-title">
      <i class="fas fa-diagram-project"></i> 任务导航树
    </div>
    <div class="task-tree-container">
      <TaskTreeItem
        v-for="task in tasks"
        :key="task.id"
        :task="task"
        :depth="0"
        @task-click="handleTaskClick"
      />
      <div v-if="tasks.length === 0" class="empty-tree">
        暂无任务
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Task } from '../../../types'
import { useTaskHighlightStore } from '../../../stores/taskHighlight'
import TaskTreeItem from './TaskTreeItem.vue'

const props = defineProps<{
  tasks: Task[]
}>()

void props;

const taskHighlight = useTaskHighlightStore()

function handleTaskClick(task: Task) {
  taskHighlight.highlightAndScroll(task.id, 3000)
}
</script>

<style scoped>
.task-tree {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background: var(--card-bg);
  border-radius: 8px;
  padding: 12px;
}

.task-tree-title {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 12px;
  color: var(--text-color);
  display: flex;
  align-items: center;
  gap: 8px;
}

.task-tree-title i {
  color: var(--primary-color);
}

.task-tree-container {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
}

/* 自定义滚动条 */
.task-tree-container::-webkit-scrollbar {
  width: 8px;
}

.task-tree-container::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.05);
  border-radius: 4px;
}

.task-tree-container::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
}

.task-tree-container::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.3);
}

.empty-tree {
  text-align: center;
  color: var(--text-secondary);
  padding: 20px;
  font-size: 13px;
}
</style>
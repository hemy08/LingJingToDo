<template>
  <div class="task-tree">
    <div class="task-tree-title">
      <i class="fas fa-diagram-project"></i> 任务导航树
    </div>
    <div class="task-tree-container">
      <div
        v-for="task in tasks"
        :key="task.id"
        class="tree-node"
        :class="{ 'is-active': isHighlighted(task.id) }"
        @click="handleTaskClick(task)"
      >
        📌 {{ task.title }}
        <!-- 子任务 -->
        <div v-if="task.subtasks && task.subtasks.length > 0" class="subtask-nodes">
          <div
            v-for="subtask in task.subtasks"
            :key="subtask.id"
            class="tree-node subtask-node"
            :class="{ 'is-active': isHighlighted(subtask.id) }"
            @click.stop="handleTaskClick(subtask)"
          >
            📎 {{ subtask.title }}
          </div>
        </div>
      </div>
      <div v-if="!tasks?.length" class="empty-tree">暂无任务</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Task } from '../../types.ts'
import { useTaskHighlightStore } from '../../stores/taskHighlight'

defineProps<{
  tasks: Task[]
}>()

const taskHighlight = useTaskHighlightStore()

// 检查是否高亮
function isHighlighted(taskId: string): boolean {
  return taskHighlight.isHighlighted(taskId)
}

// 处理任务点击
function handleTaskClick(task: Task) {
  // 高亮并滚动到任务
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
}

.tree-node {
  padding: 6px 8px;
  font-size: 13px;
  color: var(--text-color);
  cursor: pointer;
  border-radius: 4px;
  transition: background 0.2s;
}

.tree-node:hover {
  background: var(--hover-bg);
}

/* 高亮激活状态 */
.tree-node.is-active {
  background: rgba(33, 150, 243, 0.15);
  font-weight: 600;
  color: #1976d2;
  animation: highlight-node 2s ease-in-out;
}

.subtask-nodes {
  margin-left: 16px;
  margin-top: 4px;
}

.subtask-node {
  font-size: 12px;
  color: var(--text-secondary);
}

.empty-tree {
  text-align: center;
  color: var(--text-secondary);
  padding: 20px;
  font-size: 13px;
}

/* 高亮动画 */
@keyframes highlight-node {
  0%, 100% {
    background: rgba(33, 150, 243, 0.15);
  }
  50% {
    background: rgba(33, 150, 243, 0.25);
  }
}
</style>

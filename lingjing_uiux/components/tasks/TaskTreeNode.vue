<template>
  <div class="task-tree-node">
    <div 
      class="tree-node-content"
      :class="{
        'tree-node--active': isActive,
        'tree-node--highlighted': isHighlighted
      }"
      @click="handleClick"
    >
      <span class="node-icon">{{ getNodeIcon() }}</span>
      <span class="node-title">{{ task.title }}</span>
      <span class="node-status">{{ getStatusEmoji() }}</span>
    </div>
    
    <!-- 子任务 -->
    <div v-if="task.subtasks && task.subtasks.length > 0" class="subtasks">
      <TaskTreeNode
        v-for="subtask in task.subtasks"
        :key="subtask.id"
        :task="subtask"
        :depth="depth + 1"
        @task-click="handleSubtaskClick"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useTaskHighlightStore } from '../../stores/taskHighlightStore'
import type { Task } from '../../types'

interface Props {
  task: Task
  depth?: number
}

const props = withDefaults(defineProps<Props>(), {
  depth: 0
})

const emit = defineEmits<{
  'task-click': [task: Task]
}>()

const taskHighlightStore = useTaskHighlightStore()

// 计算是否高亮
const isHighlighted = computed(() => 
  taskHighlightStore.isHighlighted(props.task.id)
)

// 计算是否激活（当前选中的任务）
const isActive = computed(() => 
  taskHighlightStore.currentHighlight === props.task.id
)

// 获取节点图标
function getNodeIcon(): string {
  if (props.task.subtasks && props.task.subtasks.length > 0) {
    return '📁'
  }
  return '📄'
}

// 获取状态图标
function getStatusEmoji(): string {
  switch (props.task.status_id) {
    case 'completed':
      return '✅'
    case 'in_progress':
      return '🔄'
    case 'pending':
      return '⏳'
    default:
      return '📋'
  }
}

// 处理点击
function handleClick() {
  // 设置高亮并滚动到任务
  taskHighlightStore.highlightAndScroll(props.task.id, 3000)
  
  // 触发事件
  emit('task-click', props.task)
}

// 处理子任务点击
function handleSubtaskClick(subtask: Task) {
  emit('task-click', subtask)
}
</script>

<style scoped>
.task-tree-node {
  margin-left: v-bind('depth * 20 + "px"');
}

.tree-node-content {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  user-select: none;
}

.tree-node-content:hover {
  background: #f5f5f5;
}

.tree-node--active {
  background: #e3f2fd;
  font-weight: 500;
}

.tree-node--highlighted {
  background: #fff3e0;
  animation: highlight-node 2s ease-in-out;
}

.node-icon {
  font-size: 16px;
  flex-shrink: 0;
}

.node-title {
  flex: 1;
  font-size: 14px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.node-status {
  font-size: 14px;
  flex-shrink: 0;
}

.subtasks {
  margin-top: 4px;
}

/* 高亮动画 */
@keyframes highlight-node {
  0%, 100% {
    background: #fff3e0;
  }
  50% {
    background: #ffe0b2;
  }
}

/* 暗色主题 */
@media (prefers-color-scheme: dark) {
  .tree-node-content:hover {
    background: #252525;
  }

  .tree-node--active {
    background: #1a3a52;
  }

  .tree-node--highlighted {
    background: #3d2f1f;
  }
}
</style>

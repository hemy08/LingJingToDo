<template>
  <div class="task-tree-item">
    <div
      class="tree-item-content"
      :class="{
        'is-active': isActive,
        'is-highlighted': isHighlighted
      }"
      @click="handleClick"
    >
      <!-- 展开/折叠图标 -->
      <span 
        v-if="hasSubtasks" 
        class="expand-icon"
        @click.stop="toggleExpand"
      >
        {{ isExpanded ? '▼' : '▶' }}
      </span>
      <span v-else class="expand-icon-placeholder"></span>
      
      <!-- 任务标题 -->
      <span class="task-title">{{ task.title }}</span>
    </div>
    
    <!-- 子任务列表 -->
    <div v-if="hasSubtasks && isExpanded" class="subtasks">
      <TaskTreeItem
        v-for="subtask in task.subtasks"
        :key="subtask.id"
        :task="subtask"
        :depth="depth + 1"
        @task-click="emit('task-click', $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useTaskHighlightStore } from '../../../stores/taskHighlight.ts'
import type { Task } from '../../../types.ts'

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

const taskHighlight = useTaskHighlightStore()
const isExpanded = ref(true)

// 是否有子任务
const hasSubtasks = computed(() => 
  props.task.subtasks && props.task.subtasks.length > 0
)

// 是否高亮
const isHighlighted = computed(() => 
  taskHighlight.isHighlighted(props.task.id)
)

// 是否激活（当前选中）
const isActive = computed(() => 
  taskHighlight.highlightedTaskId === props.task.id
)

// 切换展开/折叠
function toggleExpand() {
  isExpanded.value = !isExpanded.value
}

// 处理点击
function handleClick() {
  // 高亮并滚动到任务
  taskHighlight.highlightAndScroll(props.task.id, 3000)
  
  // 触发事件
  emit('task-click', props.task)
}
</script>

<style scoped>
.task-tree-item {
  margin-left: v-bind('depth * 16 + "px"');
}

.tree-item-content {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  user-select: none;
}

.tree-item-content:hover {
  background: #f5f5f5;
}

.is-active {
  background: #e3f2fd;
  font-weight: 600;
  color: #1976d2;
}

.is-highlighted {
  background: #fff3e0;
  animation: highlight-node 2s ease-in-out;
}

.expand-icon {
  font-size: 10px;
  width: 16px;
  text-align: center;
  cursor: pointer;
  color: #666;
}

.expand-icon:hover {
  color: #333;
}

.expand-icon-placeholder {
  width: 16px;
}

.task-title {
  flex: 1;
  font-size: 14px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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
  .tree-item-content:hover {
    background: #252525;
  }

  .is-active {
    background: #1a3a52;
    color: #64b5f6;
  }

  .is-highlighted {
    background: #3d2f1f;
  }

  .expand-icon {
    color: #aaa;
  }

  .expand-icon:hover {
    color: #fff;
  }
}
</style>

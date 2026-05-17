<template>
  <div
    :data-task-id="task.id"
    class="highlightable-task-card"
    :class="{
      'is-highlighted': isHighlighted,
      'is-hovered': isHovered
    }"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
  >
    <slot></slot>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useTaskHighlightStore } from '../../stores/taskHighlight'
import type { Task } from '../../types'

interface Props {
  task: Task
}

const props = defineProps<Props>()

const taskHighlight = useTaskHighlightStore()
const isHovered = ref(false)

// 检查是否高亮
const isHighlighted = computed(() => 
  taskHighlight.isHighlighted(props.task.id)
)
</script>

<style scoped>
.highlightable-task-card {
  position: relative;
  transition: all 0.3s ease;
  border-radius: 8px;
}

/* 悬停效果 */
.is-hovered {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* 高亮效果 */
.is-highlighted {
  animation: highlight-pulse 2s ease-in-out;
  box-shadow: 0 0 0 3px rgba(33, 150, 243, 0.6),
              0 4px 16px rgba(33, 150, 243, 0.4);
  z-index: 10;
  background: rgba(33, 150, 243, 0.05);
}

/* 高亮脉冲动画 */
@keyframes highlight-pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(33, 150, 243, 0.8);
    background: rgba(33, 150, 243, 0.1);
  }
  50% {
    box-shadow: 0 0 0 8px rgba(33, 150, 243, 0.2),
                0 4px 16px rgba(33, 150, 243, 0.5);
    background: rgba(33, 150, 243, 0.08);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(33, 150, 243, 0),
                0 4px 16px rgba(33, 150, 243, 0.4);
    background: rgba(33, 150, 243, 0.05);
  }
}

/* 暗色主题 */
@media (prefers-color-scheme: dark) {
  .is-highlighted {
    box-shadow: 0 0 0 3px rgba(33, 150, 243, 0.8),
                0 4px 16px rgba(33, 150, 243, 0.6);
    background: rgba(33, 150, 243, 0.1);
  }
}
</style>

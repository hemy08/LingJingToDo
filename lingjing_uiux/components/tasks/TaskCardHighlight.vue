<template>
  <div 
    :id="`task-${task.id}`"
    class="task-card"
    :class="{
      'task-card--highlighted': isHighlighted,
      'task-card--hover': isHovered
    }"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
  >
    <slot></slot>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useTaskHighlightStore } from '../../stores/taskHighlightStore'
import type { Task } from '../../types'

interface Props {
  task: Task
}

const props = defineProps<Props>()

const taskHighlightStore = useTaskHighlightStore()
const isHovered = ref(false)

// 计算是否高亮
const isHighlighted = computed(() => 
  taskHighlightStore.isHighlighted(props.task.id)
)

// 监听高亮变化，添加动画效果
onMounted(() => {
  // 可以在这里添加额外的动画逻辑
})

onUnmounted(() => {
  // 清理
})
</script>

<style scoped>
.task-card {
  position: relative;
  transition: all 0.3s ease;
}

/* 高亮状态 */
.task-card--highlighted {
  animation: highlight-pulse 2s ease-in-out;
  box-shadow: 0 0 0 3px rgba(33, 150, 243, 0.5),
              0 4px 12px rgba(33, 150, 243, 0.3);
  z-index: 10;
}

/* 悬停状态 */
.task-card--hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
}

/* 高亮动画 */
@keyframes highlight-pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(33, 150, 243, 0.7);
  }
  50% {
    box-shadow: 0 0 0 10px rgba(33, 150, 243, 0),
                0 4px 12px rgba(33, 150, 243, 0.5);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(33, 150, 243, 0),
                0 4px 12px rgba(33, 150, 243, 0.3);
  }
}

/* 暗色主题 */
@media (prefers-color-scheme: dark) {
  .task-card--highlighted {
    box-shadow: 0 0 0 3px rgba(33, 150, 243, 0.7),
                0 4px 12px rgba(33, 150, 243, 0.5);
  }
}
</style>

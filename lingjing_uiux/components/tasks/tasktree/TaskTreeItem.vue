<template>
  <div class="task-tree-item">
    <div
      class="tree-item-content"
      :class="{
        'is-active': isActive,
        'is-highlighted': isHighlighted,
      }"
      @click="handleClick"
    >
      <!-- 展开/折叠图标 -->
      <span v-if="hasSubtasks" class="expand-icon" @click.stop="toggleExpand">
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
  depth: 0,
})

const emit = defineEmits<{
  'task-click': [task: Task]
}>()

const taskHighlight = useTaskHighlightStore()
const isExpanded = ref(true)

// 是否有子任务
const hasSubtasks = computed(() => props.task.subtasks && props.task.subtasks.length > 0)

// 是否高亮
const isHighlighted = computed(() => taskHighlight.isHighlighted(props.task.id))

// 是否激活（当前选中）
const isActive = computed(() => taskHighlight.highlightedTaskId === props.task.id)

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

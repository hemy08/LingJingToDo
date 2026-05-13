<template>
  <div ref="layoutRef" class="task-list list-layout" :style="listStyle">
    <slot></slot>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import Sortable from 'sortablejs'
import type { Task } from '../../types'

const props = defineProps<{
  tasks: Task[]
  dragMode: 'insert' | 'swap'
  columns?: number
}>()

const emit = defineEmits<{
  reorder: [tasks: Task[]]
}>()

const layoutRef = ref<HTMLElement | null>(null)
let sortableInstance: Sortable | null = null

// 计算列表样式
const listStyle = computed(() => {
  const cols = props.columns || 2
  return {
    '--list-columns': cols
  }
})

const initSortable = () => {
  if (!layoutRef.value) return

  if (sortableInstance) {
    sortableInstance.destroy()
  }

  sortableInstance = new Sortable(layoutRef.value, {
    animation: 150,
    ghostClass: 'sortable-ghost',
    chosenClass: 'sortable-chosen',
    dragClass: 'sortable-drag',
    handle: '.task-title',
    forceFallback: true,
    fallbackTolerance: 3,
    swap: props.dragMode === 'swap',
    swapThreshold: 0.65,
    onEnd: (evt) => {
      if (evt.oldIndex === evt.newIndex) return

      const reorderedTasks = [...props.tasks]
      const [movedTask] = reorderedTasks.splice(evt.oldIndex!, 1)
      reorderedTasks.splice(evt.newIndex!, 0, movedTask)

      emit('reorder', reorderedTasks)
    }
  })
}

onMounted(() => {
  initSortable()
})

watch(() => props.dragMode, () => {
  initSortable()
})
</script>

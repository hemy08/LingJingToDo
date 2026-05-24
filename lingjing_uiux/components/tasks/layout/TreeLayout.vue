<template>
  <div ref="layoutRef" class="task-list tree-layout">
    <slot></slot>
  </div>
</template>

<script setup lang="ts">
import Sortable from 'sortablejs'
import { ref, onMounted, watch, type Ref } from 'vue'

import type { Task } from '../../../types.ts'
import { handleReorderTasks } from '../common/tasks_common.ts'

const props = defineProps<{
  tasks: Task[]
  dragMode: 'insert' | 'swap'
  currentDate: string
  tasksRef: Task[] | Ref<Task[]>
}>()

const layoutRef = ref<HTMLElement | null>(null)
let sortableInstance: Sortable | null = null

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
    onEnd: evt => {
      if (evt.oldIndex === evt.newIndex) return

      const reorderedTasks = [...props.tasks]
      const [movedTask] = reorderedTasks.splice(evt.oldIndex!, 1)
      if (!movedTask) return
      reorderedTasks.splice(evt.newIndex!, 0, movedTask)

      // 直接调用公共函数处理重排序
      handleReorderTasks(props.currentDate, reorderedTasks, props.tasksRef)
    },
  })
}

onMounted(() => {
  initSortable()
})

watch(
  () => props.dragMode,
  () => {
    initSortable()
  }
)
</script>

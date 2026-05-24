<template>
  <div
    ref="containerRef"
    class="virtual-scroller"
    :style="{ height: `${containerHeight}px`, overflowY: 'auto', position: 'relative' }"
  >
    <div
      class="virtual-scroller-content"
      :style="{
        paddingTop: `${state.paddingTop}px`,
        paddingBottom: `${state.paddingBottom}px`,
        minHeight: `${state.totalHeight}px`,
      }"
    >
      <div
        v-for="(task, index) in visibleItems"
        :key="task.id"
        :ref="el => el && setItemRef(el as Element, task.id)"
        class="virtual-scroller-item"
      >
        <slot :task="task" :index="state.startIndex + index"></slot>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'

import { useVirtualScroll } from '../../composables/useVirtualScroll'
import { PERFORMANCE_CONFIG } from '../../config/performance.config'
import type { Task } from '../../types'

const props = defineProps<{
  tasks: Task[]
  containerHeight?: number
  itemHeightEstimate?: number
  bufferSize?: number
}>()

const emit = defineEmits<{
  'visible-change': [startIndex: number, endIndex: number]
  'height-update': [taskId: string, height: number]
}>()

const containerHeight = props.containerHeight || PERFORMANCE_CONFIG.virtualScroll.containerHeight

const tasksRef = ref(props.tasks)
const { state, containerRef, updateItemHeight, init, destroy } = useVirtualScroll(tasksRef, {
  containerHeight,
  itemHeightEstimate: props.itemHeightEstimate,
  bufferSize: props.bufferSize,
})

const visibleItems = computed(() => {
  return props.tasks.slice(state.value.startIndex, state.value.endIndex)
})

const itemRefs = new Map<string, HTMLElement>()

function setItemRef(el: Element | null, taskId: string) {
  if (el) {
    itemRefs.set(taskId, el as HTMLElement)

    nextTick(() => {
      measureItemHeight(taskId)
    })
  } else {
    itemRefs.delete(taskId)
  }
}

function measureItemHeight(taskId: string) {
  const el = itemRefs.get(taskId)
  if (el) {
    const height = el.offsetHeight
    updateItemHeight(taskId, height)
    emit('height-update', taskId, height)
  }
}

watch(
  () => props.tasks,
  newTasks => {
    tasksRef.value = newTasks
  },
  { deep: true }
)

watch([() => state.value.startIndex, () => state.value.endIndex], ([start, end]) => {
  emit('visible-change', start, end)
})

onMounted(() => {
  if (containerRef.value) {
    init(containerRef.value)
  }
})

onUnmounted(() => {
  destroy()
  itemRefs.clear()
})
</script>

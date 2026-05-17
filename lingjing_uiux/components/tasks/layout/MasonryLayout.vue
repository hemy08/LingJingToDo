<template>
  <div ref="layoutRef" class="task-list">
    <slot></slot>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, onUpdated, nextTick, onUnmounted, type Ref } from 'vue'
import Sortable from 'sortablejs'
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

// 瀑布流布局计算
const layoutMasonry = () => {
  if (!layoutRef.value) return
  
  const container = layoutRef.value
  const items = Array.from(container.children) as HTMLElement[]
  
  if (items.length === 0) return
  
  const containerWidth = container.clientWidth
  const gap = 16
  const minColumnWidth = 400 // 最小列宽，确保任务卡片有足够宽度显示内容
  
  // 根据容器宽度自适应列数，但最多2列
  const calculatedColumns = Math.max(1, Math.floor((containerWidth + gap) / (minColumnWidth + gap)))
  const columnCount = Math.min(2, calculatedColumns) // 最多2列
  const columnWidth = (containerWidth - gap * (columnCount - 1)) / columnCount
  
  console.log('瀑布流布局:', {
    containerWidth,
    minColumnWidth,
    calculatedColumns,
    columnCount,
    columnWidth
  })
  
  // 初始化列高度数组
  const columnHeights = new Array(columnCount).fill(0)
  
  // 为每个元素计算位置
  items.forEach((item) => {
    // 找到最短的列
    const minHeight = Math.min(...columnHeights)
    const columnIndex = columnHeights.indexOf(minHeight)
    
    // 设置元素位置
    const left = columnIndex * (columnWidth + gap)
    const top = columnHeights[columnIndex]
    
    item.style.position = 'absolute'
    item.style.width = `${columnWidth}px`
    item.style.left = `${left}px`
    item.style.top = `${top}px`
    
    // 更新列高度
    columnHeights[columnIndex] += item.offsetHeight + gap
  })
  
  // 设置容器高度
  const maxHeight = Math.max(...columnHeights)
  container.style.height = `${maxHeight}px`
  container.style.position = 'relative'
}

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

      // 直接调用公共函数处理重排序
      handleReorderTasks(
        props.currentDate,
        reorderedTasks,
        props.tasksRef
      )
    }
  })
}

onMounted(() => {
  initSortable()
  nextTick(() => {
    layoutMasonry()
  })
  
  // 监听窗口大小变化
  window.addEventListener('resize', handleResize)
})

onUpdated(() => {
  nextTick(() => {
    layoutMasonry()
  })
})

// 窗口大小变化处理
const handleResize = () => {
  layoutMasonry()
}

// 组件卸载时移除监听
onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})

watch(() => props.dragMode, () => {
  initSortable()
})

// 监听窗口大小变化
watch(() => props.tasks, () => {
  nextTick(() => {
    layoutMasonry()
  })
}, { deep: true })
</script>

<style scoped>
.task-list {
  width: 100%;
  position: relative;
}
</style>

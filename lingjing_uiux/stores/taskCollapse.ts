import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useTaskCollapseStore = defineStore('taskCollapse', () => {
  const collapsedTaskIds = ref<Set<string>>(new Set())
  const globalCollapseMode = ref<boolean | null>(null)

  const isTaskCollapsed = (taskId: string): boolean => {
    return collapsedTaskIds.value.has(taskId)
  }

  const toggleTaskCollapse = (taskId: string) => {
    globalCollapseMode.value = null
    if (collapsedTaskIds.value.has(taskId)) {
      collapsedTaskIds.value.delete(taskId)
    } else {
      collapsedTaskIds.value.add(taskId)
    }
  }

  const collapseAll = (taskIds: string[]) => {
    globalCollapseMode.value = true
    collapsedTaskIds.value = new Set(taskIds)
  }

  const expandAll = () => {
    globalCollapseMode.value = false
    collapsedTaskIds.value.clear()
  }

  const getGlobalButtonText = (totalTasks: number): string => {
    if (globalCollapseMode.value === true) {
      return '一键展开'
    }
    if (globalCollapseMode.value === false) {
      return '一键折叠'
    }
    return collapsedTaskIds.value.size === totalTasks && totalTasks > 0 ? '一键展开' : '一键折叠'
  }

  return {
    collapsedTaskIds,
    globalCollapseMode,
    isTaskCollapsed,
    toggleTaskCollapse,
    collapseAll,
    expandAll,
    getGlobalButtonText,
  }
})

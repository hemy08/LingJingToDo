import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

/**
 * 任务高亮状态管理 Store
 *
 * 用于管理任务导航树和任务面板之间的交互
 */
export const useTaskHighlightStore = defineStore('taskHighlight', () => {
  // ==================== State ====================

  /**
   * 当前高亮的任务 ID
   */
  const highlightedTaskId = ref<string | null>(null)

  /**
   * 高亮模式
   */
  const highlightMode = ref<'highlight' | 'scroll' | 'both'>('both')

  /**
   * 高亮持续时间（毫秒）
   */
  const highlightDuration = ref<number>(3000)

  /**
   * 高亮定时器
   */
  let highlightTimer: number | null = null

  // ==================== Getters ====================

  /**
   * 是否有高亮任务
   */
  const hasHighlight = computed(() => highlightedTaskId.value !== null)

  /**
   * 获取当前高亮任务 ID
   */
  const currentHighlight = computed(() => highlightedTaskId.value)

  // ==================== Actions ====================

  /**
   * 设置高亮任务
   */
  function setHighlight(
    taskId: string,
    options?: {
      mode?: 'highlight' | 'scroll' | 'both'
      duration?: number
    }
  ) {
    // 清除之前的定时器
    clearHighlightTimer()

    // 设置高亮
    highlightedTaskId.value = taskId

    // 设置选项
    if (options?.mode) {
      highlightMode.value = options.mode
    }
    if (options?.duration) {
      highlightDuration.value = options.duration
    }

    // 设置自动清除定时器
    if (highlightDuration.value > 0) {
      highlightTimer = window.setTimeout(() => {
        clearHighlight()
      }, highlightDuration.value)
    }
  }

  /**
   * 清除高亮
   */
  function clearHighlight() {
    clearHighlightTimer()
    highlightedTaskId.value = null
  }

  /**
   * 清除高亮定时器
   */
  function clearHighlightTimer() {
    if (highlightTimer) {
      clearTimeout(highlightTimer)
      highlightTimer = null
    }
  }

  /**
   * 检查任务是否高亮
   */
  function isHighlighted(taskId: string): boolean {
    return highlightedTaskId.value === taskId
  }

  /**
   * 切换高亮
   */
  function toggleHighlight(taskId: string) {
    if (highlightedTaskId.value === taskId) {
      clearHighlight()
    } else {
      setHighlight(taskId)
    }
  }

  /**
   * 滚动到任务
   */
  function scrollToTask(taskId: string) {
    // 触发滚动事件
    const element = document.getElementById(`task-${taskId}`)
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      })
    }
  }

  /**
   * 高亮并滚动到任务
   */
  function highlightAndScroll(taskId: string, duration = 3000) {
    setHighlight(taskId, { mode: 'both', duration })
    scrollToTask(taskId)
  }

  return {
    // State
    highlightedTaskId,
    highlightMode,
    highlightDuration,

    // Getters
    hasHighlight,
    currentHighlight,

    // Actions
    setHighlight,
    clearHighlight,
    isHighlighted,
    toggleHighlight,
    scrollToTask,
    highlightAndScroll,
  }
})

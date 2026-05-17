import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

/**
 * 任务高亮状态管理
 */
export const useTaskHighlightStore = defineStore('taskHighlight', () => {
  // 当前高亮的任务ID
  const highlightedTaskId = ref<string | null>(null)
  
  // 高亮持续时间（毫秒）
  const highlightDuration = ref<number>(3000)
  
  // 定时器
  let highlightTimer: number | null = null

  // 是否有高亮
  const hasHighlight = computed(() => highlightedTaskId.value !== null)

  /**
   * 设置高亮任务
   */
  function setHighlight(taskId: string, duration?: number) {
    // 清除之前的定时器
    if (highlightTimer) {
      clearTimeout(highlightTimer)
      highlightTimer = null
    }
    
    // 设置高亮
    highlightedTaskId.value = taskId
    
    // 设置自动清除
    const timeout = duration ?? highlightDuration.value
    if (timeout > 0) {
      highlightTimer = window.setTimeout(() => {
        clearHighlight()
      }, timeout)
    }
  }

  /**
   * 清除高亮
   */
  function clearHighlight() {
    if (highlightTimer) {
      clearTimeout(highlightTimer)
      highlightTimer = null
    }
    highlightedTaskId.value = null
  }

  /**
   * 检查是否高亮
   */
  function isHighlighted(taskId: string): boolean {
    return highlightedTaskId.value === taskId
  }

  /**
   * 滚动到任务
   */
  function scrollToTask(taskId: string) {
    // 使用任务ID查找元素
    const element = document.querySelector(`[data-task-id="${taskId}"]`)
    if (!element) {
      console.warn(`未找到任务元素: ${taskId}`)
      return
    }

    // 查找 TaskPanel 的滚动容器
    const scrollContainer = element.closest('.task-list-container') as HTMLElement
    
    if (scrollContainer) {
      // 获取容器和元素的边界信息
      const containerRect = scrollContainer.getBoundingClientRect()
      const elementRect = element.getBoundingClientRect()
      
      // 计算元素相对于容器的垂直位置
      const relativeTop = elementRect.top - containerRect.top
      
      // 计算元素在容器内的绝对垂直位置
      const elementAbsoluteTop = scrollContainer.scrollTop + relativeTop
      
      // 计算垂直居中位置
      const containerHeight = containerRect.height
      const elementHeight = elementRect.height
      const centerPosition = elementAbsoluteTop - (containerHeight / 2) + (elementHeight / 2)
      
      // 平滑滚动到垂直居中位置（水平位置不变）
      scrollContainer.scrollTo({
        top: Math.max(0, centerPosition),
        behavior: 'smooth'
      })
      
      console.log(`滚动到任务 ${taskId}:`, {
        containerHeight,
        elementHeight,
        relativeTop,
        elementAbsoluteTop,
        centerPosition
      })
    } else {
      // 如果找不到滚动容器，使用默认滚动
      console.warn('未找到滚动容器，使用默认滚动')
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest' // 水平方向保持最近位置，不做限制
      })
    }
  }

  /**
   * 高亮并滚动
   */
  function highlightAndScroll(taskId: string, duration?: number) {
    setHighlight(taskId, duration)
    
    // 延迟滚动，确保DOM已更新
    setTimeout(() => {
      scrollToTask(taskId)
    }, 100)
  }

  return {
    highlightedTaskId,
    hasHighlight,
    setHighlight,
    clearHighlight,
    isHighlighted,
    scrollToTask,
    highlightAndScroll
  }
})

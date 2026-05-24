import { ref, computed, watch, type Ref } from 'vue'

import { PERFORMANCE_CONFIG } from '../config/performance.config'
import type { Task } from '../types'
import type {
  VirtualScrollConfig,
  VirtualScrollState,
  ViewportRange,
} from '../types/performance.types'
import { throttle } from '../utils/performance.utils'

export function useVirtualScroll(tasks: Ref<Task[]>, config?: Partial<VirtualScrollConfig>) {
  const mergedConfig: VirtualScrollConfig = {
    ...PERFORMANCE_CONFIG.virtualScroll,
    ...config,
  }

  const state = ref<VirtualScrollState>({
    startIndex: 0,
    endIndex: 0,
    heightCache: new Map<string, number>(),
    totalHeight: 0,
    paddingTop: 0,
    paddingBottom: 0,
    scrollTop: 0,
  })

  const containerRef = ref<HTMLElement | null>(null)
  const isVirtualScrollEnabled = computed(() => tasks.value.length > mergedConfig.threshold)

  function calculateViewport(scrollTop: number, containerHeight: number): ViewportRange {
    const itemCount = tasks.value.length
    if (itemCount === 0) {
      return {
        startIndex: 0,
        endIndex: 0,
        paddingTop: 0,
        paddingBottom: 0,
        visibleItems: [],
      }
    }

    const avgHeight = calculateAverageHeight()

    const viewportStart = scrollTop
    const viewportEnd = scrollTop + containerHeight

    const startIndex = Math.max(0, Math.floor(viewportStart / avgHeight) - mergedConfig.bufferSize)
    let endIndex = Math.min(itemCount, Math.ceil(viewportEnd / avgHeight) + mergedConfig.bufferSize)

    if (endIndex - startIndex < mergedConfig.bufferSize * 2) {
      endIndex = Math.min(itemCount, startIndex + mergedConfig.bufferSize * 4)
    }

    const paddingTop = calculateAccumulatedHeight(0, startIndex)
    const paddingBottom = calculateAccumulatedHeight(endIndex, itemCount)

    const visibleItems = tasks.value.slice(startIndex, endIndex)

    return {
      startIndex,
      endIndex,
      paddingTop,
      paddingBottom,
      visibleItems,
    }
  }

  function calculateAverageHeight(): number {
    const cacheSize = state.value.heightCache.size
    if (cacheSize === 0) {
      return mergedConfig.itemHeightEstimate
    }

    const totalHeight = Array.from(state.value.heightCache.values()).reduce((sum, h) => sum + h, 0)
    return totalHeight / cacheSize
  }

  function calculateAccumulatedHeight(start: number, end: number): number {
    const avgHeight = calculateAverageHeight()
    let accumulated = 0

    for (let i = start; i < end; i++) {
      const task = tasks.value[i]
      if (task && state.value.heightCache.has(task.id)) {
        accumulated += state.value.heightCache.get(task.id)!
      } else {
        accumulated += avgHeight
      }
    }

    return accumulated
  }

  function updateItemHeight(taskId: string, height: number): void {
    const oldHeight = state.value.heightCache.get(taskId) || mergedConfig.itemHeightEstimate
    state.value.heightCache.set(taskId, height)

    state.value.totalHeight += height - oldHeight
  }

  function handleScroll(event: Event): void {
    const target = event.target as HTMLElement
    const scrollTop = target.scrollTop
    const containerHeight = target.clientHeight

    state.value.scrollTop = scrollTop

    const viewport = calculateViewport(scrollTop, containerHeight)
    state.value.startIndex = viewport.startIndex
    state.value.endIndex = viewport.endIndex
    state.value.paddingTop = viewport.paddingTop
    state.value.paddingBottom = viewport.paddingBottom
  }

  const throttledHandleScroll = throttle(handleScroll, mergedConfig.throttleInterval)

  function scrollToItem(taskId: string): void {
    if (!containerRef.value) return

    const index = tasks.value.findIndex(t => t.id === taskId)
    if (index === -1) return

    const scrollTop = calculateAccumulatedHeight(0, index)
    containerRef.value.scrollTop = scrollTop
  }

  function init(container: HTMLElement): void {
    containerRef.value = container
    container.addEventListener('scroll', throttledHandleScroll)

    const viewport = calculateViewport(0, container.clientHeight)
    state.value.startIndex = viewport.startIndex
    state.value.endIndex = viewport.endIndex
    state.value.paddingTop = viewport.paddingTop
    state.value.paddingBottom = viewport.paddingBottom
    state.value.totalHeight = calculateAccumulatedHeight(0, tasks.value.length)
  }

  function destroy(): void {
    if (containerRef.value) {
      containerRef.value.removeEventListener('scroll', throttledHandleScroll)
      containerRef.value = null
    }
    state.value.heightCache.clear()
  }

  watch(tasks, () => {
    if (!containerRef.value) return

    const viewport = calculateViewport(state.value.scrollTop, containerRef.value.clientHeight)
    state.value.startIndex = viewport.startIndex
    state.value.endIndex = viewport.endIndex
    state.value.paddingTop = viewport.paddingTop
    state.value.paddingBottom = viewport.paddingBottom
    state.value.totalHeight = calculateAccumulatedHeight(0, tasks.value.length)
  })

  return {
    state,
    containerRef,
    isVirtualScrollEnabled,
    calculateViewport,
    updateItemHeight,
    scrollToItem,
    init,
    destroy,
  }
}

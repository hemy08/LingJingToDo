import { PERFORMANCE_CONFIG } from '../config/performance.config'
import type { Task } from '../types'

export class HeightCalculator {
  private heightCache: Map<string, number> = new Map()
  private itemHeightEstimate: number

  constructor(itemHeightEstimate?: number) {
    this.itemHeightEstimate =
      itemHeightEstimate || PERFORMANCE_CONFIG.virtualScroll.itemHeightEstimate
  }

  estimateHeight(task: Task): number {
    if (this.heightCache.has(task.id)) {
      return this.heightCache.get(task.id)!
    }

    let height = this.itemHeightEstimate

    const titleLines = Math.ceil(task.title.length / 30)
    height += (titleLines - 1) * 20

    if (task.subtasks && task.subtasks.length > 0) {
      const subtaskHeight = task.subtasks.length * 40
      height += subtaskHeight
    }

    if (task.remark) {
      const noteLines = Math.ceil(task.remark.length / 50)
      height += noteLines * 18
    }

    return height
  }

  measureActualHeight(element: HTMLElement, taskId: string): number {
    const actualHeight = element.offsetHeight
    this.heightCache.set(taskId, actualHeight)
    return actualHeight
  }

  updateHeight(taskId: string, height: number): void {
    this.heightCache.set(taskId, height)
  }

  getCachedHeight(taskId: string): number | undefined {
    return this.heightCache.get(taskId)
  }

  calculateTotalHeight(tasks: Task[]): number {
    return tasks.reduce((total, task) => {
      return total + this.estimateHeight(task)
    }, 0)
  }

  findVisibleRange(
    tasks: Task[],
    scrollTop: number,
    containerHeight: number,
    bufferSize: number
  ): { start: number; end: number } {
    let accumulatedHeight = 0
    let startIndex = 0
    let endIndex = tasks.length

    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i]
      if (!task) continue
      const taskHeight = this.estimateHeight(task)

      if (accumulatedHeight + taskHeight > scrollTop - bufferSize * this.itemHeightEstimate) {
        startIndex = i
        break
      }

      accumulatedHeight += taskHeight
    }

    accumulatedHeight = 0
    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i]
      if (!task) continue
      const taskHeight = this.estimateHeight(task)

      if (accumulatedHeight > scrollTop + containerHeight + bufferSize * this.itemHeightEstimate) {
        endIndex = i
        break
      }

      accumulatedHeight += taskHeight
    }

    return {
      start: Math.max(0, startIndex - bufferSize),
      end: Math.min(tasks.length, endIndex + bufferSize),
    }
  }

  clear(): void {
    this.heightCache.clear()
  }
}

import { PERFORMANCE_CONFIG } from '../../config/performance.config'
import { taskCacheManager } from '../cache/TaskCacheManager'

import { dataLoader } from './DataLoader'

export class Prefetcher {
  private prefetchQueue: string[] = []
  private activePrefetchCount: number = 0
  private maxConcurrent: number
  private prefetchSet: Set<string> = new Set()

  constructor(maxConcurrent?: number) {
    this.maxConcurrent = maxConcurrent || PERFORMANCE_CONFIG.loader.prefetchMaxConcurrent
  }

  prefetchAdjacentDates(currentDate: string): void {
    const date = new Date(currentDate)

    const prevDate = new Date(date)
    prevDate.setDate(prevDate.getDate() - 1)
    const prevDateStr = prevDate.toISOString().split('T')[0]

    const nextDate = new Date(date)
    nextDate.setDate(nextDate.getDate() + 1)
    const nextDateStr = nextDate.toISOString().split('T')[0]

    if (prevDateStr) {
      this.enqueuePrefetch(prevDateStr)
    }
    if (nextDateStr) {
      this.enqueuePrefetch(nextDateStr)
    }

    this.processQueue()
  }

  prefetchMultiple(dates: string[]): void {
    dates.forEach(date => this.enqueuePrefetch(date))
    this.processQueue()
  }

  private enqueuePrefetch(date: string): void {
    if (this.prefetchSet.has(date)) return
    if (taskCacheManager.get(date)) return

    this.prefetchQueue.push(date)
    this.prefetchSet.add(date)
  }

  private async processQueue(): Promise<void> {
    while (this.prefetchQueue.length > 0 && this.activePrefetchCount < this.maxConcurrent) {
      const date = this.prefetchQueue.shift()
      if (!date) continue

      this.activePrefetchCount++

      try {
        await dataLoader.loadTasks(date, { silent: true, priority: 'low' })
      } catch (error) {
        console.warn('预加载失败:', date, error)
      } finally {
        this.activePrefetchCount--
        this.prefetchSet.delete(date)

        if (this.prefetchQueue.length > 0) {
          setTimeout(() => this.processQueue(), 100)
        }
      }
    }
  }

  clear(): void {
    this.prefetchQueue = []
    this.prefetchSet.clear()
  }

  getQueueLength(): number {
    return this.prefetchQueue.length
  }

  isActive(): boolean {
    return this.activePrefetchCount > 0
  }
}

export const prefetcher = new Prefetcher()

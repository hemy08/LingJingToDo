import { PERFORMANCE_CONFIG } from '../../config/performance.config'
import type { Task } from '../../types'
import type { TaskCacheItem, CacheConfig, CacheManager } from '../../types/performance.types'

export class TaskCacheManager implements CacheManager {
  cache: Map<string, TaskCacheItem> = new Map()
  maxCapacity: number
  currentSize: number = 0
  hitCount: number = 0
  missCount: number = 0

  private config: CacheConfig
  private accessOrder: string[] = []

  constructor(config?: Partial<CacheConfig>) {
    this.config = {
      ...PERFORMANCE_CONFIG.cache,
      ...config,
    }
    this.maxCapacity = this.config.maxCapacity
  }

  get(date: string): Task[] | null {
    const cached = this.cache.get(date)

    if (!cached) {
      this.missCount++
      return null
    }

    const now = Date.now()
    if (now - cached.timestamp > cached.expires) {
      this.cache.delete(date)
      this.currentSize -= cached.size
      this.missCount++
      return null
    }

    this.hitCount++
    this.updateAccessOrder(date)

    return cached.tasks
  }

  set(date: string, tasks: Task[], ttl?: number): void {
    const size = this.calculateSize(tasks)

    while (this.currentSize + size > this.maxCapacity && this.cache.size > 0) {
      this.evictLRU()
    }

    if (this.cache.has(date)) {
      const oldItem = this.cache.get(date)!
      this.currentSize -= oldItem.size
    }

    const cacheItem: TaskCacheItem = {
      tasks,
      timestamp: Date.now(),
      expires: ttl || this.config.ttl,
      size,
    }

    this.cache.set(date, cacheItem)
    this.currentSize += size
    this.updateAccessOrder(date)
  }

  clear(date?: string): void {
    if (date) {
      const item = this.cache.get(date)
      if (item) {
        this.currentSize -= item.size
        this.cache.delete(date)
        this.accessOrder = this.accessOrder.filter(d => d !== date)
      }
    } else {
      this.cache.clear()
      this.currentSize = 0
      this.accessOrder = []
      this.hitCount = 0
      this.missCount = 0
    }
  }

  getHitRate(): number {
    const total = this.hitCount + this.missCount
    if (total === 0) return 0
    return this.hitCount / total
  }

  getSize(): number {
    return this.currentSize
  }

  isExpired(date: string): boolean {
    const cached = this.cache.get(date)
    if (!cached) return true

    const now = Date.now()
    return now - cached.timestamp > cached.expires
  }

  private calculateSize(tasks: Task[]): number {
    try {
      const jsonStr = JSON.stringify(tasks)
      return new Blob([jsonStr]).size
    } catch (e) {
      return tasks.length * 1024
    }
  }

  private updateAccessOrder(date: string): void {
    const index = this.accessOrder.indexOf(date)
    if (index !== -1) {
      this.accessOrder.splice(index, 1)
    }
    this.accessOrder.push(date)

    if (this.accessOrder.length > this.config.maxItems) {
      const toRemove = this.accessOrder.slice(0, this.accessOrder.length - this.config.maxItems)
      toRemove.forEach(d => {
        const item = this.cache.get(d)
        if (item) {
          this.currentSize -= item.size
          this.cache.delete(d)
        }
      })
      this.accessOrder = this.accessOrder.slice(-this.config.maxItems)
    }
  }

  private evictLRU(): void {
    if (this.accessOrder.length === 0) return

    const oldest = this.accessOrder.shift()
    if (oldest) {
      const item = this.cache.get(oldest)
      if (item) {
        this.currentSize -= item.size
        this.cache.delete(oldest)
      }
    }
  }

  getStats(): {
    hitRate: number
    size: number
    itemCount: number
    hitCount: number
    missCount: number
  } {
    return {
      hitRate: this.getHitRate(),
      size: this.currentSize,
      itemCount: this.cache.size,
      hitCount: this.hitCount,
      missCount: this.missCount,
    }
  }
}

export const taskCacheManager = new TaskCacheManager()

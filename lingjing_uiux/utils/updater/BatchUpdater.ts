import { PERFORMANCE_CONFIG } from '../../config/performance.config'
import type { TaskUpdate } from '../../types/performance.types'
import { debounce } from '../performance.utils'

export class BatchUpdater {
  private updateQueue: TaskUpdate[] = []
  private flushCallback: ((updates: TaskUpdate[]) => Promise<void>) | null = null
  private debouncedFlush: () => void

  constructor(flushCallback?: (updates: TaskUpdate[]) => Promise<void>) {
    this.flushCallback = flushCallback || null
    this.debouncedFlush = debounce(
      () => this.flush(),
      PERFORMANCE_CONFIG.batchUpdate.debounceInterval
    )
  }

  enqueue(update: TaskUpdate): void {
    const existingIndex = this.updateQueue.findIndex(u => u.taskId === update.taskId)

    if (existingIndex !== -1) {
      const existingUpdate = this.updateQueue[existingIndex]
      if (existingUpdate) {
        this.updateQueue[existingIndex] = {
          ...existingUpdate,
          changes: {
            ...existingUpdate.changes,
            ...update.changes,
          },
          timestamp: Date.now(),
        }
      }
    } else {
      this.updateQueue.push({
        ...update,
        timestamp: Date.now(),
      })
    }

    this.debouncedFlush()
  }

  async flush(): Promise<void> {
    if (this.updateQueue.length === 0) return
    if (!this.flushCallback) return

    const updates = [...this.updateQueue]
    this.updateQueue = []

    try {
      await this.flushCallback(updates)
    } catch (error) {
      console.error('批量更新失败:', error)
      updates.forEach(update => this.updateQueue.push(update))
      throw error
    }
  }

  setFlushCallback(callback: (updates: TaskUpdate[]) => Promise<void>): void {
    this.flushCallback = callback
  }

  clear(): void {
    this.updateQueue = []
  }

  getQueueLength(): number {
    return this.updateQueue.length
  }

  getPendingUpdates(): TaskUpdate[] {
    return [...this.updateQueue]
  }
}

export const batchUpdater = new BatchUpdater()

import { PERFORMANCE_CONFIG } from '../../config/performance.config'
import { taskApi } from '../../connections/task_apis'
import type { Task } from '../../types'
import type { LoadOptions } from '../../types/performance.types'
import { requestDeduplicator } from '../cache/RequestDeduplicator'
import { taskCacheManager } from '../cache/TaskCacheManager'

export class DataLoader {
  private currentAbortController: AbortController | null = null

  async loadTasks(date: string, options?: LoadOptions): Promise<Task[]> {
    if (!options?.forceRefresh) {
      const cached = taskCacheManager.get(date)
      if (cached) {
        return cached
      }
    }

    const cacheKey = `tasks:${date}`

    if (requestDeduplicator.has(cacheKey)) {
      return requestDeduplicator.execute(cacheKey, () => this.fetchTasksFromBackend(date, options))
    }

    return requestDeduplicator.execute(cacheKey, () => this.fetchTasksFromBackend(date, options))
  }

  private async fetchTasksFromBackend(date: string, _options?: LoadOptions): Promise<Task[]> {
    if (this.currentAbortController) {
      this.currentAbortController.abort()
    }

    this.currentAbortController = new AbortController()

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error('加载超时'))
      }, PERFORMANCE_CONFIG.loader.timeout)
    })

    try {
      const tasks = await Promise.race([taskApi.getTasks(date), timeoutPromise])

      taskCacheManager.set(date, tasks)

      return tasks
    } catch (error) {
      if (error instanceof Error && error.message === '加载超时') {
        console.error('任务加载超时:', date)
        throw error
      }

      console.error('任务加载失败:', error)
      throw error
    } finally {
      this.currentAbortController = null
    }
  }

  cancelPending(): void {
    if (this.currentAbortController) {
      this.currentAbortController.abort()
      this.currentAbortController = null
    }
    requestDeduplicator.clear()
  }

  async loadWithRetry(
    date: string,
    options?: LoadOptions,
    retries: number = PERFORMANCE_CONFIG.loader.maxRetries
  ): Promise<Task[]> {
    let lastError: Error | null = null

    for (let i = 0; i < retries; i++) {
      try {
        return await this.loadTasks(date, options)
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('加载失败')

        if (i < retries - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)))
        }
      }
    }

    throw lastError
  }
}

export const dataLoader = new DataLoader()

import { defineStore } from 'pinia'
import { ref, computed, shallowRef } from 'vue'

import { taskApi } from '../connections/task_apis'
import type { Task } from '../types'
import { taskCacheManager } from '../utils/cache/TaskCacheManager'
import { dataLoader } from '../utils/loader/DataLoader'
import { prefetcher } from '../utils/loader/Prefetcher'
import { metricsCollector } from '../utils/performance/MetricsCollector'
import { performanceMonitor } from '../utils/performance/PerformanceMonitor'
import { batchUpdater } from '../utils/updater/BatchUpdater'

/**
 * 任务缓存项
 */
interface TaskCacheItem {
  tasks: Task[]
  timestamp: number
  expires: number
}

/**
 * 任务状态管理 Store
 *
 * 特性：
 * - 数据缓存：避免重复请求，使用TaskCacheManager
 * - 增量更新：只更新变更的数据
 * - 性能优化：使用 shallowRef 减少响应式开销
 * - 批量更新：使用BatchUpdater减少渲染次数
 * - 性能监控：集成PerformanceMonitor
 * - 错误处理：统一的错误处理机制
 */
export const useTaskStore = defineStore('tasks', () => {
  // ==================== State ====================

  const tasks = shallowRef<Task[]>([])
  const currentDate = ref<string>(new Date().toISOString().split('T')[0] || '')
  const loading = ref<boolean>(false)
  const error = ref<string | null>(null)

  const taskIndex = new Map<string, number>()

  const CACHE_DURATION = 5 * 60 * 1000
  const taskCache = ref<Map<string, TaskCacheItem>>(new Map())

  const allTasksCache = shallowRef<Record<string, Task[]> | null>(null)
  const allTasksCacheTime = ref<number>(0)

  // ==================== Getters ====================

  /**
   * 已完成任务
   */
  const completedTasks = computed(() => tasks.value.filter(t => t.status_id === 'completed'))

  /**
   * 待处理任务
   */
  const pendingTasks = computed(() => tasks.value.filter(t => t.status_id !== 'completed'))

  /**
   * 任务总数
   */
  const taskCount = computed(() => tasks.value.length)

  /**
   * 主任务（无子任务）
   */
  const mainTasks = computed(() => tasks.value.filter(t => !t.subtasks || t.subtasks.length === 0))

  /**
   * 包含子任务的任务
   */
  const tasksWithSubtasks = computed(() =>
    tasks.value.filter(t => t.subtasks && t.subtasks.length > 0)
  )

  /**
   * 按状态分组的任务
   */
  const tasksByStatus = computed(() => {
    const grouped = new Map<string, Task[]>()
    tasks.value.forEach(task => {
      const list = grouped.get(task.status_id) || []
      list.push(task)
      grouped.set(task.status_id, list)
    })
    return grouped
  })

  /**
   * 按类型分组的任务
   */
  const tasksByType = computed(() => {
    const grouped = new Map<string, Task[]>()
    tasks.value.forEach(task => {
      const list = grouped.get(task.type_id) || []
      list.push(task)
      grouped.set(task.type_id, list)
    })
    return grouped
  })

  /**
   * 按优先级分组的任务
   */
  const tasksByPriority = computed(() => {
    const grouped = new Map<string, Task[]>()
    tasks.value.forEach(task => {
      const list = grouped.get(task.priority_id) || []
      list.push(task)
      grouped.set(task.priority_id, list)
    })
    return grouped
  })

  // ==================== Cache Methods ====================

  /**
   * 检查缓存是否有效
   */
  function isCacheValid(date: string): boolean {
    const cached = taskCache.value.get(date)
    if (!cached) return false

    const now = Date.now()
    return now - cached.timestamp < cached.expires
  }

  /**
   * 设置缓存数据
   */
  function setCache(date: string, taskList: Task[]): void {
    taskCache.value.set(date, {
      tasks: taskList,
      timestamp: Date.now(),
      expires: CACHE_DURATION,
    })
  }

  /**
   * 清除指定日期的缓存
   */
  function clearCache(date?: string): void {
    if (date) {
      taskCache.value.delete(date)
    } else {
      taskCache.value.clear()
      allTasksCache.value = null
      allTasksCacheTime.value = 0
    }
  }

  // ==================== Actions ====================

  /**
   * 加载指定日期的任务（带缓存）
   */
  async function loadTasks(date: string, forceRefresh = false) {
    const cached = taskCacheManager.get(date)
    if (!forceRefresh && cached) {
      tasks.value = cached
      currentDate.value = date
      rebuildTaskIndex()
      prefetcher.prefetchAdjacentDates(date)
      return
    }

    loading.value = true
    error.value = null

    performanceMonitor.startMeasure('loadTasks')

    try {
      const taskList = await metricsCollector.measureResponseTime('loadTasks', () =>
        dataLoader.loadTasks(date, { forceRefresh })
      )

      tasks.value = taskList
      currentDate.value = date

      rebuildTaskIndex()

      prefetcher.prefetchAdjacentDates(date)
    } catch (e) {
      error.value = e instanceof Error ? e.message : '加载任务失败'
      console.error('Failed to load tasks:', e)
    } finally {
      loading.value = false
      performanceMonitor.endMeasure('loadTasks')
    }
  }

  function rebuildTaskIndex(): void {
    taskIndex.clear()
    tasks.value.forEach((task, index) => {
      taskIndex.set(task.id, index)
    })
  }

  function updateTaskIncremental(taskId: string, changes: Partial<Task>): void {
    const index = taskIndex.get(taskId)
    if (index === undefined) return

    const currentTask = tasks.value[index]
    if (!currentTask) return
    const updatedTask = { ...currentTask, ...changes }

    const newTasks = [...tasks.value]
    newTasks[index] = updatedTask
    tasks.value = newTasks

    taskCacheManager.set(currentDate.value, newTasks)
  }

  function updateTasksBatch(updates: Array<{ taskId: string; changes: Partial<Task> }>): void {
    const newTasks = [...tasks.value]

    updates.forEach(({ taskId, changes }) => {
      const index = taskIndex.get(taskId)
      if (index !== undefined && newTasks[index]) {
        newTasks[index] = { ...newTasks[index]!, ...changes }
      }
    })

    tasks.value = newTasks
    rebuildTaskIndex()
    taskCacheManager.set(currentDate.value, newTasks)
  }

  /**
   * 添加任务（增量更新）
   */
  async function addTask(task: Task) {
    loading.value = true
    error.value = null
    try {
      const updatedTasks = await taskApi.addTask(currentDate.value, task)
      tasks.value = updatedTasks

      // 更新缓存
      setCache(currentDate.value, updatedTasks)
    } catch (e) {
      error.value = e instanceof Error ? e.message : '添加任务失败'
      console.error('Failed to add task:', e)
    } finally {
      loading.value = false
    }
  }

  /**
   * 更新任务（增量更新）
   */
  async function updateTask(task: Task) {
    loading.value = true
    error.value = null

    performanceMonitor.startMeasure('updateTask')

    try {
      const updatedTasks = await taskApi.updateTask(currentDate.value, task)
      if (updatedTasks) {
        tasks.value = updatedTasks
        rebuildTaskIndex()
        taskCacheManager.set(currentDate.value, updatedTasks)
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : '更新任务失败'
      console.error('Failed to update task:', e)
    } finally {
      loading.value = false
      performanceMonitor.endMeasure('updateTask')
    }
  }

  /**
   * 批量更新任务（使用批量更新器）
   */
  function enqueueUpdate(taskId: string, changes: Partial<Task>): void {
    batchUpdater.enqueue({
      taskId,
      changes,
      timestamp: Date.now(),
    })
  }

  async function flushBatchUpdates(): Promise<void> {
    await batchUpdater.flush()
  }

  /**
   * 删除任务（增量更新）
   */
  async function deleteTask(taskId: string) {
    loading.value = true
    error.value = null
    try {
      const updatedTasks = await taskApi.deleteTask(currentDate.value, taskId)
      if (updatedTasks) {
        tasks.value = updatedTasks

        // 更新缓存
        setCache(currentDate.value, updatedTasks)
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : '删除任务失败'
      console.error('Failed to delete task:', e)
    } finally {
      loading.value = false
    }
  }

  /**
   * 重排序任务
   */
  async function reorderTasks(reorderedTasks: Task[]) {
    error.value = null
    try {
      const updatedTasks = await taskApi.reorderTasks(currentDate.value, reorderedTasks)
      if (updatedTasks) {
        tasks.value = updatedTasks

        // 更新缓存
        setCache(currentDate.value, updatedTasks)
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : '重排序任务失败'
      console.error('Failed to reorder tasks:', e)
    }
  }

  /**
   * 添加子任务
   */
  async function addSubtask(parentId: string, subtask: Task) {
    loading.value = true
    error.value = null
    try {
      const updatedTasks = await taskApi.addSubtask(currentDate.value, parentId, subtask)
      if (updatedTasks) {
        tasks.value = updatedTasks

        // 更新缓存
        setCache(currentDate.value, updatedTasks)
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : '添加子任务失败'
      console.error('Failed to add subtask:', e)
    } finally {
      loading.value = false
    }
  }

  /**
   * 更新子任务
   */
  async function updateSubtask(parentId: string, subtask: Task) {
    loading.value = true
    error.value = null
    try {
      const updatedTasks = await taskApi.updateSubtask(currentDate.value, parentId, subtask)
      if (updatedTasks) {
        tasks.value = updatedTasks

        // 更新缓存
        setCache(currentDate.value, updatedTasks)
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : '更新子任务失败'
      console.error('Failed to update subtask:', e)
    } finally {
      loading.value = false
    }
  }

  /**
   * 删除子任务
   */
  async function deleteSubtask(parentId: string, subtaskId: string) {
    loading.value = true
    error.value = null
    try {
      const updatedTasks = await taskApi.deleteSubtask(currentDate.value, parentId, subtaskId)
      if (updatedTasks) {
        tasks.value = updatedTasks

        // 更新缓存
        setCache(currentDate.value, updatedTasks)
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : '删除子任务失败'
      console.error('Failed to delete subtask:', e)
    } finally {
      loading.value = false
    }
  }

  /**
   * 查询任务
   */
  async function queryTasks(options: { typeId?: string; statusId?: string; priorityId?: string }) {
    loading.value = true
    error.value = null
    try {
      const taskList = await taskApi.queryTasks(
        currentDate.value,
        options.typeId,
        options.statusId,
        options.priorityId
      )
      tasks.value = taskList
    } catch (e) {
      error.value = e instanceof Error ? e.message : '查询任务失败'
      console.error('Failed to query tasks:', e)
    } finally {
      loading.value = false
    }
  }

  /**
   * 获取所有任务（带缓存）
   */
  async function getAllTasks(forceRefresh = false): Promise<Record<string, Task[]>> {
    const now = Date.now()

    // 检查缓存（10分钟有效期）
    if (!forceRefresh && allTasksCache.value && now - allTasksCacheTime.value < 10 * 60 * 1000) {
      return allTasksCache.value
    }

    try {
      const allTasks = await taskApi.getAllTasks()
      allTasksCache.value = allTasks
      allTasksCacheTime.value = now
      return allTasks
    } catch (e) {
      error.value = e instanceof Error ? e.message : '获取所有任务失败'
      console.error('Failed to get all tasks:', e)
      throw e
    }
  }

  /**
   * 清除错误
   */
  function clearError() {
    error.value = null
  }

  return {
    // State
    tasks,
    currentDate,
    loading,
    error,

    // Getters
    completedTasks,
    pendingTasks,
    taskCount,
    mainTasks,
    tasksWithSubtasks,
    tasksByStatus,
    tasksByType,
    tasksByPriority,

    // Actions
    loadTasks,
    addTask,
    updateTask,
    deleteTask,
    reorderTasks,
    addSubtask,
    updateSubtask,
    deleteSubtask,
    queryTasks,
    getAllTasks,
    clearError,

    // Cache
    clearCache,
    isCacheValid,

    // Performance
    updateTaskIncremental,
    updateTasksBatch,
    enqueueUpdate,
    flushBatchUpdates,
    rebuildTaskIndex,
  }
})

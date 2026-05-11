import { invoke } from '@tauri-apps/api/core'
import type { TaskStatus, TaskType, TaskPriority } from '../types'

/**
 * 状态相关 API
 */
export const statusApi = {
  /**
   * 获取所有状态
   */
  async getAll(): Promise<TaskStatus[]> {
    return await invoke<TaskStatus[]>('get_statuses')
  },

  /**
   * 更新状态列表
   */
  async update(statuses: TaskStatus[]): Promise<TaskStatus[]> {
    return await invoke<TaskStatus[]>('update_statuses', { statuses })
  },

  /**
   * 删除状态
   */
  async delete(id: string): Promise<TaskStatus[]> {
    return await invoke<TaskStatus[]>('delete_status', { id })
  }
}

/**
 * 类型相关 API
 */
export const typeApi = {
  /**
   * 获取所有类型
   */
  async getAll(): Promise<TaskType[]> {
    return await invoke<TaskType[]>('get_types')
  },

  /**
   * 更新类型列表
   */
  async update(types: TaskType[]): Promise<TaskType[]> {
    return await invoke<TaskType[]>('update_types', { types })
  },

  /**
   * 删除类型
   */
  async delete(id: string): Promise<TaskType[]> {
    return await invoke<TaskType[]>('delete_type', { id })
  }
}

/**
 * 优先级相关 API
 */
export const priorityApi = {
  /**
   * 获取所有优先级
   */
  async getAll(): Promise<TaskPriority[]> {
    return await invoke<TaskPriority[]>('get_priorities')
  },

  /**
   * 更新优先级列表
   */
  async update(priorities: TaskPriority[]): Promise<TaskPriority[]> {
    return await invoke<TaskPriority[]>('update_priorities', { priorities })
  },

  /**
   * 删除优先级
   */
  async delete(id: string): Promise<TaskPriority[]> {
    return await invoke<TaskPriority[]>('delete_priority', { id })
  }
}

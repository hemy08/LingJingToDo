import { invoke } from '@tauri-apps/api/core'
import type { Task } from '../types'

export const taskApi = {
  // 获取指定日期的任务
  async getTasks(date: string): Promise<Task[]> {
    return await invoke<Task[]>('get_tasks', { date })
  },

  // 添加任务
  async addTask(date: string, task: Task): Promise<Task[]> {
    return await invoke<Task[]>('add_task', { date, task })
  },

  // 更新任务
  async updateTask(date: string, task: Task): Promise<Task[] | null> {
    return await invoke<Task[] | null>('update_task', { date, task })
  },

  // 删除任务
  async deleteTask(date: string, taskId: string): Promise<Task[] | null> {
    return await invoke<Task[] | null>('delete_task', { date, taskId })
  },

  // 重排序任务
  async reorderTasks(date: string, reorderedTasks: Task[]): Promise<Task[] | null> {
    return await invoke<Task[] | null>('reorder_tasks', { date, reorderedTasks })
  },

  // 获取所有任务
  async getAllTasks(): Promise<Record<string, Task[]>> {
    return await invoke<Record<string, Task[]>>('get_all_tasks')
  },

  // 导入任务
  async importTasks(tasksData: Record<string, Task[]>): Promise<void> {
    return await invoke('import_tasks', { tasksData })
  },

  // 生成主任务 ID
  async generateMainTaskId(): Promise<string> {
    return await invoke<string>('generate_main_task_id')
  },

  // 生成子任务 ID
  async generateSubtaskId(): Promise<string> {
    return await invoke<string>('generate_subtask_id')
  },

  // 子任务相关
  async addSubtask(date: string, parentId: string, subtask: Task): Promise<Task[] | null> {
    return await invoke<Task[] | null>('add_subtask', { date, parentId, subtask })
  },

  async updateSubtask(date: string, parentId: string, subtask: Task): Promise<Task[] | null> {
    return await invoke<Task[] | null>('update_subtask', { date, parentId, subtask })
  },

  async deleteSubtask(date: string, parentId: string, subtaskId: string): Promise<Task[] | null> {
    return await invoke<Task[] | null>('delete_subtask', { date, parentId, subtaskId })
  },

  // 查询任务
  async queryTasks(
    date: string,
    typeId?: string,
    statusId?: string,
    priorityId?: string
  ): Promise<Task[]> {
    return await invoke<Task[]>('query_tasks', {
      date,
      typeId,
      statusId,
      priorityId
    })
  }
}

import { type Ref } from 'vue'
import type { Task } from '../../types'
import { taskApi } from '../../connections/task_apis'

/**
 * 更新任务
 * @param currentDate 当前日期
 * @param updatedTask 更新后的任务
 * @param tasks 任务列表引用
 * @returns Promise<void>
 */
export const handleUpdateTask = async (
  currentDate: string,
  updatedTask: Task,
  tasks: Task[] | Ref<Task[]>
): Promise<void> => {
  try {
    const updatedTasks = await taskApi.updateTask(currentDate, updatedTask)
    if (updatedTasks) {
      const taskArray = Array.isArray(tasks) ? tasks : tasks.value
      taskArray.length = 0
      taskArray.push(...updatedTasks)
    }
  } catch (error) {
    console.error('更新任务失败:', error)
  }
}

/**
 * 删除任务
 * @param currentDate 当前日期
 * @param taskId 要删除的任务ID
 * @param tasks 任务列表引用
 * @returns Promise<void>
 */
export const handleDeleteTask = async (
  currentDate: string,
  taskId: string,
  tasks: Task[] | Ref<Task[]>
): Promise<void> => {
  try {
    const updatedTasks = await taskApi.deleteTask(currentDate, taskId)
    if (updatedTasks) {
      const taskArray = Array.isArray(tasks) ? tasks : tasks.value
      taskArray.length = 0
      taskArray.push(...updatedTasks)
    }
  } catch (error) {
    console.error('删除任务失败:', error)
  }
}

/**
 * 重排序任务
 * @param currentDate 当前日期
 * @param reorderedTasks 重排序后的任务列表
 * @param tasks 任务列表引用
 * @returns Promise<void>
 */
export const handleReorderTasks = async (
  currentDate: string,
  reorderedTasks: Task[],
  tasks: Task[] | Ref<Task[]>
): Promise<void> => {
  try {
    const updatedTasks = await taskApi.reorderTasks(currentDate, reorderedTasks)
    if (updatedTasks) {
      const taskArray = Array.isArray(tasks) ? tasks : tasks.value
      taskArray.length = 0
      taskArray.push(...updatedTasks)
    }
  } catch (error) {
    console.error('重排序任务失败:', error)
  }
}

/**
 * 更新子任务
 * @param currentDate 当前日期
 * @param parentId 父任务ID
 * @param subtask 要更新的子任务
 * @param tasks 任务列表引用
 * @returns Promise<void>
 */
export const handleUpdateSubtask = async (
  currentDate: string,
  parentId: string,
  subtask: Task,
  tasks: Task[] | Ref<Task[]>
): Promise<void> => {
  try {
    const updatedTasks = await taskApi.updateSubtask(
      currentDate,
      parentId,
      subtask
    )
    if (updatedTasks) {
      const taskArray = Array.isArray(tasks) ? tasks : tasks.value
      taskArray.length = 0
      taskArray.push(...updatedTasks)
    }
  } catch (error) {
    console.error('更新子任务失败:', error)
  }
}

/**
 * 删除子任务
 * @param currentDate 当前日期
 * @param parentId 父任务ID
 * @param subtaskId 要删除的子任务ID
 * @param tasks 任务列表引用
 * @returns Promise<void>
 */
export const handleDeleteSubtask = async (
  currentDate: string,
  parentId: string,
  subtaskId: string,
  tasks: Task[] | Ref<Task[]>
): Promise<void> => {
  const taskArray = Array.isArray(tasks) ? tasks : tasks.value
  const parentTask = taskArray.find(t => String(t.id) === String(parentId))
  if (!parentTask) return

  const updatedTask = {
    ...parentTask,
    subtasks: parentTask.subtasks?.filter(s => s.id !== subtaskId) || []
  }

  try {
    const updatedTasks = await taskApi.updateTask(currentDate, updatedTask)
    if (updatedTasks) {
      taskArray.length = 0
      taskArray.push(...updatedTasks)
    }
  } catch (error) {
    console.error('删除子任务失败:', error)
  }
}


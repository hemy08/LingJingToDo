import { ref, type Ref } from 'vue'
import type { Task } from '../../types'
import { taskApi } from '../../connections/task_apis'

/**
 * 创建任务处理函数
 */
export function createTaskHandlers(
  tasks: Ref<Task[]>,
  currentDate: Ref<string | null>,
  _isDirty: Ref<boolean>
) {
  // 更新任务
  const handleUpdateTask = async (updatedTask: Task) => {
    try {
      const updatedTasks = await taskApi.updateTask(currentDate.value || '', updatedTask)
      if (updatedTasks) {
        tasks.value = updatedTasks
      }
    } catch (error) {
      console.error('更新任务失败:', error)
    }
  }

  // 删除任务
  const handleDeleteTask = async (taskId: string) => {
    try {
      const updatedTasks = await taskApi.deleteTask(currentDate.value || '', taskId)
      if (updatedTasks) {
        tasks.value = updatedTasks
      }
    } catch (error) {
      console.error('删除任务失败:', error)
    }
  }

  // 重排序任务
  const handleReorderTasks = async (reorderedTasks: Task[]) => {
    try {
      const updatedTasks = await taskApi.reorderTasks(currentDate.value || '', reorderedTasks)
      if (updatedTasks) {
        tasks.value = updatedTasks
      }
    } catch (error) {
      console.error('重排序任务失败:', error)
    }
  }

  // 添加任务
  const handleTaskAdded = async (newTask: Task) => {
    try {
      const updatedTasks = await taskApi.addTask(currentDate.value || '', newTask)
      tasks.value = updatedTasks
    } catch (error) {
      console.error('添加任务失败:', error)
    }
  }

  return {
    handleUpdateTask,
    handleDeleteTask,
    handleReorderTasks,
    handleTaskAdded
  }
}

/**
 * 创建子任务处理函数
 */
export function createSubtaskHandlers(
  tasks: Ref<Task[]>,
  currentDate: Ref<string | null>,
  showStatus: (message: string, detail?: string, type?: 'success' | 'error' | 'warning' | 'info') => void
) {
  // 子任务模态窗口状态
  const showSubtaskModal = ref(false)
  const currentParentTask = ref<Task | null>(null)

  // 打开子任务模态窗口
  const openSubtaskModal = (task: Task) => {
    currentParentTask.value = task
    showSubtaskModal.value = true
  }

  // 关闭子任务模态窗口
  const closeSubtaskModal = () => {
    showSubtaskModal.value = false
    currentParentTask.value = null
  }

  // 添加子任务
  const addSubtask = async (newSubtask: Task) => {
    if (!currentParentTask.value) return

    try {
      const updatedTasks = await taskApi.addSubtask(
        currentDate.value || '',
        currentParentTask.value.id,
        newSubtask
      )
      if (updatedTasks) {
        tasks.value = updatedTasks
        showStatus('子任务添加成功', newSubtask.title, 'success')
      }
      closeSubtaskModal()
    } catch (error) {
      console.error('添加子任务失败:', error)
      showStatus('子任务添加失败', String(error), 'error')
    }
  }

  // 删除子任务
  const handleDeleteSubtask = async (parentId: string, subtaskId: string) => {
    try {
      const updatedTasks = await taskApi.deleteSubtask(
        currentDate.value || '',
        parentId,
        subtaskId
      )
      if (updatedTasks) {
        tasks.value = updatedTasks
        showStatus('子任务删除成功', '', 'success')
      }
    } catch (error) {
      console.error('删除子任务失败:', error)
      showStatus('子任务删除失败', String(error), 'error')
    }
  }

  // 更新子任务
  const handleUpdateSubtask = async (parentId: string, subtask: Task) => {
    try {
      const updatedTasks = await taskApi.updateSubtask(
        currentDate.value || '',
        parentId,
        subtask
      )
      if (updatedTasks) {
        tasks.value = updatedTasks
        showStatus('子任务更新成功', subtask.title, 'success')
      }
    } catch (error) {
      console.error('更新子任务失败:', error)
      showStatus('子任务更新失败', String(error), 'error')
    }
  }

  return {
    showSubtaskModal,
    currentParentTask,
    openSubtaskModal,
    closeSubtaskModal,
    addSubtask,
    handleDeleteSubtask,
    handleUpdateSubtask
  }
}

/**
 * 创建子任务显示模式处理函数
 */
export function createSubtaskDisplayModeHandlers() {
  const subtaskDisplayMode = ref<Record<string, 'card' | 'table'>>({})

  // 切换子任务显示模式
  const toggleSubtaskDisplayMode = (taskId: string) => {
    const currentMode = subtaskDisplayMode.value[taskId] || 'card'
    subtaskDisplayMode.value[taskId] = currentMode === 'card' ? 'table' : 'card'
  }

  // 获取子任务显示模式
  const getSubtaskDisplayMode = (taskId: string): 'card' | 'table' => {
    return subtaskDisplayMode.value[taskId] || 'card'
  }

  return {
    subtaskDisplayMode,
    toggleSubtaskDisplayMode,
    getSubtaskDisplayMode
  }
}

/**
 * 创建任务查询函数
 */
export function createTaskQueryHandlers() {
  // 按条件查询任务
  const queryTasks = async (
    date: string,
    typeId?: string,
    statusId?: string,
    priorityId?: string
  ): Promise<Task[]> => {
    try {
      return await taskApi.queryTasks(date, typeId, statusId, priorityId)
    } catch (error) {
      console.error('查询任务失败:', error)
      return []
    }
  }

  // 获取指定日期的任务
  const getTasksByDate = async (date: string): Promise<Task[]> => {
    try {
      return await taskApi.getTasks(date)
    } catch (error) {
      console.error('获取任务失败:', error)
      return []
    }
  }

  return {
    queryTasks,
    getTasksByDate
  }
}

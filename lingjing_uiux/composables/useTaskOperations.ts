import { ref, computed, watch } from 'vue'

import { taskApi } from '../connections/task_apis'
import type { Task } from '../types'

export function useTaskOperations() {
  const allTasks = ref<Task[]>([])
  const currentDate = ref('')
  const isDirty = ref(false)

  const getTodayStr = () => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }

  const taskStatistics = ref({
    total_count: 0,
    main_task_count: 0,
    subtask_count: 0,
    due_today_count: 0,
    overdue_count: 0,
  })

  const tasksFromDate = computed(() => {
    if (!currentDate.value) return allTasks.value

    const selectedDate = currentDate.value
    const today = new Date().toISOString().split('T')[0] || ''

    return allTasks.value.filter((task: Task) => {
      if (task.status_id === 'st_done' || task.status_id === 'st_closed') {
        return false
      }

      if (selectedDate <= today) {
        const createdDate = task.created_date?.split('T')[0] || ''
        return createdDate <= selectedDate
      }

      if (selectedDate > today) {
        if (!task.due_date) return true
        return task.due_date >= selectedDate
      }

      return true
    })
  })

  const tasksFromDateWithCompleted = computed(() => {
    if (!currentDate.value) return allTasks.value

    const selectedDate = currentDate.value
    const today = new Date().toISOString().split('T')[0] || ''

    return allTasks.value.filter((task: Task) => {
      if (selectedDate <= today) {
        const createdDate = task.created_date?.split('T')[0] || ''
        return createdDate <= selectedDate
      }

      if (selectedDate > today) {
        if (!task.due_date) return true
        return task.due_date >= selectedDate
      }

      return true
    })
  })

  const handleTaskAdded = async (newTask: Task) => {
    try {
      const date = currentDate.value || getTodayStr()
      const updatedTasks = await taskApi.addTask(date, newTask)
      allTasks.value = updatedTasks
      isDirty.value = true
    } catch (error) {
      console.error('添加任务失败:', error)
    }
  }

  const handleTaskUpdated = async (updatedTask: Task) => {
    try {
      const date = currentDate.value || getTodayStr()
      await taskApi.updateTask(date, updatedTask)
      const index = allTasks.value.findIndex(t => t.id === updatedTask.id)
      if (index !== -1) {
        allTasks.value[index] = updatedTask
      } else {
        allTasks.value.push(updatedTask)
      }
      isDirty.value = true
    } catch (error) {
      console.error('更新任务失败:', error)
    }
  }

  const handleTaskDeleted = async (taskId: string) => {
    try {
      const date = currentDate.value || getTodayStr()
      await taskApi.deleteTask(date, taskId)
      allTasks.value = allTasks.value.filter(t => t.id !== taskId)
      isDirty.value = true
    } catch (error) {
      console.error('删除任务失败:', error)
    }
  }

  const fetchTaskStatistics = async () => {
    try {
      const stats = await taskApi.getTaskStatistics()
      taskStatistics.value = stats
    } catch (error) {
      console.error('获取任务统计失败:', error)
    }
  }

  const loadTasksFromFile = async (data: Record<string, any[]>) => {
    const tasks: Task[] = []
    Object.values(data).forEach(taskList => {
      tasks.push(...taskList)
    })
    allTasks.value = tasks
    await taskApi.importTasks(data)
  }

  const loadAllTasks = async () => {
    try {
      const data = await taskApi.getAllTasks()
      const tasks: Task[] = []
      Object.values(data).forEach(taskList => {
        tasks.push(...taskList)
      })
      allTasks.value = tasks
    } catch (error) {
      console.error('加载全部任务失败:', error)
    }
  }

  const loadUnfinishedTasks = async () => {
    try {
      allTasks.value = await taskApi.getAllUnfinishedTasks()
    } catch (error) {
      console.error('加载任务失败:', error)
    }
  }

  watch(currentDate, () => {
    fetchTaskStatistics()
  })

  watch(
    allTasks,
    () => {
      fetchTaskStatistics()
    },
    { deep: true }
  )

  return {
    allTasks,
    currentDate,
    isDirty,
    taskStatistics,
    tasksFromDate,
    tasksFromDateWithCompleted,
    handleTaskAdded,
    handleTaskUpdated,
    handleTaskDeleted,
    fetchTaskStatistics,
    loadTasksFromFile,
    loadAllTasks,
    loadUnfinishedTasks,
  }
}

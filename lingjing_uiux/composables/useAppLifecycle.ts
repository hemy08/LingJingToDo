import { invoke } from '@tauri-apps/api/core'
import { exit } from '@tauri-apps/plugin-process'

import type { Task } from '../types'

export function useAppLifecycle(
  isDirty: { value: boolean },
  allTasks: { value: Task[] },
  showConfirmWithClose: (
    title: string,
    message: string,
    confirmText: string,
    cancelText: string,
    closeText: string
  ) => Promise<string>,
  handleSaveFile: (data: Record<string, Task[]>) => Promise<void>,
  showStatus: (title: string, message: string, type: string) => void
) {
  const getTodayStr = () => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }

  const closeWindow = async () => {
    if (isDirty.value) {
      const result = await showConfirmWithClose(
        '数据未保存',
        '当前有未保存的数据,请选择操作:',
        '保存并关闭',
        '取消',
        '不保存关闭'
      )

      if (result === 'confirm') {
        const dataToSave: Record<string, Task[]> = {}
        const today = getTodayStr()
        dataToSave[today] = allTasks.value
        await handleSaveFile(dataToSave)
        await exit(0)
      } else if (result === 'close') {
        await exit(0)
      }
    } else {
      await exit(0)
    }
  }

  const loadInitialFile = async (initialFilePath: string) => {
    try {
      const filePath = initialFilePath
      const fileType = filePath.endsWith('.json')
        ? 'json'
        : filePath.endsWith('.xlsx') || filePath.endsWith('.xls')
          ? 'excel'
          : 'xml'

      const result = await invoke('open_file', { filePath: filePath, fileType: fileType })
      const data = result as Record<string, any[]>

      const tasks: Task[] = []
      Object.values(data).forEach(taskList => {
        tasks.push(...taskList)
      })

      showStatus('打开成功', `文件 ${filePath} 已成功加载`, 'success')

      return { tasks, fileType, filePath, data }
    } catch (error) {
      showStatus('打开失败', `无法加载文件: ${error}`, 'error')
      return null
    }
  }

  const createExampleTask = (getTodayStr: () => string) => {
    return {
      id: '10001',
      title: '示例主任务',
      status_id: 'st_doing',
      type_id: 'ty_work',
      priority_id: 'p3',
      due_date: '2026-05-10',
      remark: '',
      created_date: getTodayStr(),
    }
  }

  return {
    getTodayStr,
    closeWindow,
    loadInitialFile,
    createExampleTask,
  }
}

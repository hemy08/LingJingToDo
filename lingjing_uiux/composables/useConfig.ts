import { invoke } from '@tauri-apps/api/core'
import { ref, reactive, type Ref } from 'vue'

import type { TaskStatus, TaskType, TaskPriority } from '../types'

export interface UseConfigReturn {
  config: {
    statuses: TaskStatus[]
    types: TaskType[]
    priorities: TaskPriority[]
  }
  showStatusModal: Ref<boolean>
  showTypeModal: Ref<boolean>
  showPriorityModal: Ref<boolean>
  loadConfig: () => Promise<void>
  handleStatusUpdated: (statuses: TaskStatus[]) => void
  handleTypeUpdated: (types: TaskType[]) => void
  handlePriorityUpdated: (priorities: TaskPriority[]) => void
}

export function useConfig(): UseConfigReturn {
  const config = reactive<{
    statuses: TaskStatus[]
    types: TaskType[]
    priorities: TaskPriority[]
  }>({
    statuses: [],
    types: [],
    priorities: [],
  })

  const showStatusModal = ref(false)
  const showTypeModal = ref(false)
  const showPriorityModal = ref(false)

  const loadConfig = async (): Promise<void> => {
    try {
      config.statuses = await invoke<TaskStatus[]>('get_statuses')
      config.types = await invoke<TaskType[]>('get_types')
      config.priorities = await invoke<TaskPriority[]>('get_priorities')
    } catch (error) {
      console.error('加载配置失败:', error)
      throw error
    }
  }

  const handleStatusUpdated = (statuses: TaskStatus[]): void => {
    config.statuses = statuses
  }

  const handleTypeUpdated = (types: TaskType[]): void => {
    config.types = types
  }

  const handlePriorityUpdated = (priorities: TaskPriority[]): void => {
    config.priorities = priorities
  }

  return {
    config,
    showStatusModal,
    showTypeModal,
    showPriorityModal,
    loadConfig,
    handleStatusUpdated,
    handleTypeUpdated,
    handlePriorityUpdated,
  }
}

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { statusApi, typeApi, priorityApi } from '../connections/config_apis'
import type { TaskStatus, TaskType, TaskPriority } from '../types'

export const useConfigStore = defineStore('config', () => {
  // State
  const statuses = ref<TaskStatus[]>([])
  const types = ref<TaskType[]>([])
  const priorities = ref<TaskPriority[]>([])
  const loading = ref<boolean>(false)
  const error = ref<string | null>(null)

  // Getters
  const statusMap = computed(() => {
    const map = new Map<string, TaskStatus>()
    statuses.value.forEach(s => map.set(s.id, s))
    return map
  })

  const typeMap = computed(() => {
    const map = new Map<string, TaskType>()
    types.value.forEach(t => map.set(t.id, t))
    return map
  })

  const priorityMap = computed(() => {
    const map = new Map<string, TaskPriority>()
    priorities.value.forEach(p => map.set(p.id, p))
    return map
  })

  const defaultStatus = computed(() => statuses.value[0])
  const defaultType = computed(() => types.value[0])
  const defaultPriority = computed(() => priorities.value[0])

  // Actions
  async function loadStatuses() {
    loading.value = true
    error.value = null
    try {
      statuses.value = await statusApi.getAll()
    } catch (e) {
      error.value = e instanceof Error ? e.message : '加载状态配置失败'
      console.error('Failed to load statuses:', e)
    } finally {
      loading.value = false
    }
  }

  async function loadTypes() {
    loading.value = true
    error.value = null
    try {
      types.value = await typeApi.getAll()
    } catch (e) {
      error.value = e instanceof Error ? e.message : '加载类型配置失败'
      console.error('Failed to load types:', e)
    } finally {
      loading.value = false
    }
  }

  async function loadPriorities() {
    loading.value = true
    error.value = null
    try {
      priorities.value = await priorityApi.getAll()
    } catch (e) {
      error.value = e instanceof Error ? e.message : '加载优先级配置失败'
      console.error('Failed to load priorities:', e)
    } finally {
      loading.value = false
    }
  }

  async function loadAllConfig() {
    await Promise.all([
      loadStatuses(),
      loadTypes(),
      loadPriorities()
    ])
  }

  async function updateStatuses(newStatuses: TaskStatus[]) {
    loading.value = true
    error.value = null
    try {
      statuses.value = await statusApi.update(newStatuses)
    } catch (e) {
      error.value = e instanceof Error ? e.message : '更新状态配置失败'
      console.error('Failed to update statuses:', e)
    } finally {
      loading.value = false
    }
  }

  async function updateTypes(newTypes: TaskType[]) {
    loading.value = true
    error.value = null
    try {
      types.value = await typeApi.update(newTypes)
    } catch (e) {
      error.value = e instanceof Error ? e.message : '更新类型配置失败'
      console.error('Failed to update types:', e)
    } finally {
      loading.value = false
    }
  }

  async function updatePriorities(newPriorities: TaskPriority[]) {
    loading.value = true
    error.value = null
    try {
      priorities.value = await priorityApi.update(newPriorities)
    } catch (e) {
      error.value = e instanceof Error ? e.message : '更新优先级配置失败'
      console.error('Failed to update priorities:', e)
    } finally {
      loading.value = false
    }
  }

  async function deleteStatus(id: string) {
    loading.value = true
    error.value = null
    try {
      statuses.value = await statusApi.delete(id)
    } catch (e) {
      error.value = e instanceof Error ? e.message : '删除状态失败'
      console.error('Failed to delete status:', e)
    } finally {
      loading.value = false
    }
  }

  async function deleteType(id: string) {
    loading.value = true
    error.value = null
    try {
      types.value = await typeApi.delete(id)
    } catch (e) {
      error.value = e instanceof Error ? e.message : '删除类型失败'
      console.error('Failed to delete type:', e)
    } finally {
      loading.value = false
    }
  }

  async function deletePriority(id: string) {
    loading.value = true
    error.value = null
    try {
      priorities.value = await priorityApi.delete(id)
    } catch (e) {
      error.value = e instanceof Error ? e.message : '删除优先级失败'
      console.error('Failed to delete priority:', e)
    } finally {
      loading.value = false
    }
  }

  function getStatusById(id: string): TaskStatus | undefined {
    return statusMap.value.get(id)
  }

  function getTypeById(id: string): TaskType | undefined {
    return typeMap.value.get(id)
  }

  function getPriorityById(id: string): TaskPriority | undefined {
    return priorityMap.value.get(id)
  }

  function clearError() {
    error.value = null
  }

  return {
    // State
    statuses,
    types,
    priorities,
    loading,
    error,
    
    // Getters
    statusMap,
    typeMap,
    priorityMap,
    defaultStatus,
    defaultType,
    defaultPriority,
    
    // Actions
    loadStatuses,
    loadTypes,
    loadPriorities,
    loadAllConfig,
    updateStatuses,
    updateTypes,
    updatePriorities,
    deleteStatus,
    deleteType,
    deletePriority,
    getStatusById,
    getTypeById,
    getPriorityById,
    clearError
  }
})

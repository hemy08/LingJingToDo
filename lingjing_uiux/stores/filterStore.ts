import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  Task,
  FilterCondition,
  DateRange,
} from '../types'
import { FilterType, FilterOperator, LogicOperator } from '../types'
import type { FilterScheme } from '../types/enhancements'

const STORAGE_KEY = 'lingjing-todo-filter-config'
const SCHEMES_KEY = 'lingjing-todo-filter-schemes'
const MAX_SCHEMES = 10

function generateId(): string {
  return `filter-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

function matchCondition(task: Task, condition: FilterCondition): boolean {
  const { type, operator, value } = condition

  switch (type) {
    case 'STATUS':
      if (typeof value === 'string') {
        return operator === 'EQUALS'
          ? task.status_id === value
          : task.status_id !== value
      }
      break

    case 'PRIORITY':
      if (typeof value === 'string') {
        return operator === 'EQUALS'
          ? task.priority_id === value
          : task.priority_id !== value
      }
      break

    case 'TYPE':
      if (typeof value === 'string') {
        return operator === 'EQUALS'
          ? task.type_id === value
          : task.type_id !== value
      } else if (Array.isArray(value)) {
        return operator === 'CONTAINS'
          ? value.includes(task.type_id)
          : !value.includes(task.type_id)
      }
      break

    case 'CREATE_DATE':
      if (task.created_date && typeof value === 'object' && 'start' in value) {
        const dateRange = value as DateRange
        const createdDate = new Date(task.created_date).getTime()
        const start = new Date(dateRange.start).getTime()
        const end = new Date(dateRange.end).getTime()
        return operator === 'IN_RANGE'
          ? createdDate >= start && createdDate <= end
          : createdDate < start || createdDate > end
      }
      break

    case 'DUE_DATE':
      if (task.due_date && typeof value === 'object' && 'start' in value) {
        const dateRange = value as DateRange
        const dueDate = new Date(task.due_date).getTime()
        const start = new Date(dateRange.start).getTime()
        const end = new Date(dateRange.end).getTime()
        return operator === 'IN_RANGE'
          ? dueDate >= start && dueDate <= end
          : dueDate < start || dueDate > end
      }
      break
  }

  return true
}

export const useFilterStore = defineStore('filter', () => {
  const conditions = ref<FilterCondition[]>([])
  const logicOperator = ref<LogicOperator>('AND')
  const enabled = ref<boolean>(true)
  const filteredTasks = ref<Task[]>([])

  const hasFilters = computed(() => conditions.value.some(c => c.enabled))
  const activeConditions = computed(() => conditions.value.filter(c => c.enabled))
  const activeConditionCount = computed(() => activeConditions.value.length)

  function addCondition(
    type: FilterType,
    operator: FilterOperator,
    value: string | string[] | DateRange,
    label: string
  ): FilterCondition {
    const condition: FilterCondition = {
      id: generateId(),
      type,
      operator,
      value,
      label,
      enabled: true,
    }
    conditions.value.push(condition)
    saveToLocalStorage()
    return condition
  }

  function removeCondition(conditionId: string): void {
    const index = conditions.value.findIndex(c => c.id === conditionId)
    if (index !== -1) {
      conditions.value.splice(index, 1)
      saveToLocalStorage()
    }
  }

  function updateCondition(conditionId: string, updates: Partial<FilterCondition>): void {
    const condition = conditions.value.find(c => c.id === conditionId)
    if (condition) {
      Object.assign(condition, updates)
      saveToLocalStorage()
    }
  }

  function toggleCondition(conditionId: string): void {
    const condition = conditions.value.find(c => c.id === conditionId)
    if (condition) {
      condition.enabled = !condition.enabled
      saveToLocalStorage()
    }
  }

  function setLogicOperator(operator: LogicOperator): void {
    logicOperator.value = operator
    saveToLocalStorage()
  }

  function clearAllConditions(): void {
    conditions.value = []
    saveToLocalStorage()
  }

  function applyFilters(tasks: Task[]): Task[] {
    if (!enabled.value || !hasFilters.value) {
      filteredTasks.value = tasks
      return tasks
    }

    const filtered = tasks.filter(task => {
      const active = activeConditions.value
      if (active.length === 0) return true

      if (logicOperator.value === 'AND') {
        return active.every(condition => matchCondition(task, condition))
      } else {
        return active.some(condition => matchCondition(task, condition))
      }
    })

    filteredTasks.value = filtered
    return filtered
  }

  function saveToLocalStorage(): void {
    try {
      const config = {
        conditions: conditions.value,
        logicOperator: logicOperator.value,
        enabled: enabled.value,
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
    } catch (error) {
      console.warn('Failed to save filter config to localStorage:', error)
    }
  }

  function loadFromLocalStorage(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const config = JSON.parse(stored)
        conditions.value = config.conditions || []
        logicOperator.value = config.logicOperator || 'AND'
        enabled.value = config.enabled ?? true
      }
    } catch (error) {
      console.warn('Failed to load filter config from localStorage:', error)
      conditions.value = []
      logicOperator.value = 'AND'
      enabled.value = true
    }
  }

  function setEnabled(value: boolean): void {
    enabled.value = value
    saveToLocalStorage()
  }

  function filterByStatus(statusId: string, statusName: string): void {
    addCondition(FilterType.STATUS, FilterOperator.EQUALS, statusId, `状态: ${statusName}`)
  }

  function filterByPriority(priorityId: string, priorityName: string): void {
    addCondition(FilterType.PRIORITY, FilterOperator.EQUALS, priorityId, `优先级: ${priorityName}`)
  }

  function filterByType(typeId: string, typeName: string): void {
    addCondition(FilterType.TYPE, FilterOperator.EQUALS, typeId, `类型: ${typeName}`)
  }

  function filterByDateRange(
    type: 'CREATE_DATE' | 'DUE_DATE',
    range: DateRange,
    label: string
  ): void {
    const filterType = type === 'CREATE_DATE' ? FilterType.CREATE_DATE : FilterType.DUE_DATE
    addCondition(filterType, FilterOperator.IN_RANGE, range, label)
  }

  const schemes = ref<FilterScheme[]>([])

  function loadSchemes(): void {
    try {
      const stored = localStorage.getItem(SCHEMES_KEY)
      if (stored) {
        schemes.value = JSON.parse(stored)
      }
    } catch {
      schemes.value = []
    }
  }

  function saveSchemesToStorage(): void {
    try {
      localStorage.setItem(SCHEMES_KEY, JSON.stringify(schemes.value))
    } catch {
      console.warn('Failed to save filter schemes')
    }
  }

  function saveScheme(name: string): FilterScheme | null {
    if (schemes.value.length >= MAX_SCHEMES) {
      console.warn('Maximum number of filter schemes reached')
      return null
    }

    const existing = schemes.value.find(s => s.name === name)
    if (existing) {
      existing.config = {
        conditions: [...conditions.value],
        logicOperator: logicOperator.value,
        enabled: enabled.value,
      }
      existing.updatedAt = new Date().toISOString()
      saveSchemesToStorage()
      return existing
    }

    const scheme: FilterScheme = {
      id: generateId(),
      name,
      config: {
        conditions: [...conditions.value],
        logicOperator: logicOperator.value,
        enabled: enabled.value,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    schemes.value.push(scheme)
    saveSchemesToStorage()
    return scheme
  }

  function loadScheme(schemeId: string): boolean {
    const scheme = schemes.value.find(s => s.id === schemeId)
    if (!scheme) {
      return false
    }

    conditions.value = scheme.config.conditions as FilterCondition[]
    logicOperator.value = scheme.config.logicOperator
    enabled.value = scheme.config.enabled
    saveToLocalStorage()
    return true
  }

  function deleteScheme(schemeId: string): void {
    const index = schemes.value.findIndex(s => s.id === schemeId)
    if (index !== -1) {
      schemes.value.splice(index, 1)
      saveSchemesToStorage()
    }
  }

  function renameScheme(schemeId: string, newName: string): boolean {
    const scheme = schemes.value.find(s => s.id === schemeId)
    if (!scheme) {
      return false
    }

    const existing = schemes.value.find(s => s.name === newName && s.id !== schemeId)
    if (existing) {
      return false
    }

    scheme.name = newName
    scheme.updatedAt = new Date().toISOString()
    saveSchemesToStorage()
    return true
  }

  function exportScheme(schemeId: string): string | null {
    const scheme = schemes.value.find(s => s.id === schemeId)
    if (!scheme) {
      return null
    }
    return JSON.stringify(scheme, null, 2)
  }

  function importScheme(jsonStr: string): FilterScheme | null {
    try {
      const scheme = JSON.parse(jsonStr) as FilterScheme
      if (!scheme.name || !scheme.config) {
        return null
      }

      scheme.id = generateId()
      scheme.createdAt = new Date().toISOString()
      scheme.updatedAt = new Date().toISOString()

      if (schemes.value.length >= MAX_SCHEMES) {
        schemes.value.shift()
      }

      schemes.value.push(scheme)
      saveSchemesToStorage()
      return scheme
    } catch {
      return null
    }
  }

  loadFromLocalStorage()
  loadSchemes()

  return {
    conditions,
    logicOperator,
    enabled,
    filteredTasks,
    hasFilters,
    activeConditions,
    activeConditionCount,
    addCondition,
    removeCondition,
    updateCondition,
    toggleCondition,
    setLogicOperator,
    clearAllConditions,
    applyFilters,
    saveToLocalStorage,
    loadFromLocalStorage,
    setEnabled,
    filterByStatus,
    filterByPriority,
    filterByType,
    filterByDateRange,
    schemes,
    saveScheme,
    loadScheme,
    deleteScheme,
    renameScheme,
    exportScheme,
    importScheme,
  }
})

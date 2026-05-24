import { watch } from 'vue'
import { useFilterStore } from '../stores/filterStore'
import { useTaskStore } from '../stores/taskStore'
import type { FilterType, DateRange, Task } from '../types'

export function useFilter() {
  const filterStore = useFilterStore()
  const taskStore = useTaskStore()

  function watchFilters() {
    watch(
      [() => filterStore.conditions, () => filterStore.enabled, () => taskStore.tasks],
      () => {
        filterStore.applyFilters(taskStore.tasks)
      },
      { deep: true, immediate: true }
    )
  }

  function generateConditionLabel(
    type: FilterType,
    value: string | string[] | DateRange
  ): string {
    switch (type) {
      case 'STATUS':
        return `状态: ${value}`
      case 'PRIORITY':
        return `优先级: ${value}`
      case 'TYPE':
        return `类型: ${Array.isArray(value) ? value.join(', ') : value}`
      case 'CREATE_DATE': {
        const range = value as DateRange
        return `创建日期: ${range.start} 至 ${range.end}`
      }
      case 'DUE_DATE': {
        const range = value as DateRange
        return `截止日期: ${range.start} 至 ${range.end}`
      }
      default:
        return ''
    }
  }

  function quickFilterByStatus(statusId: string, statusName: string): void {
    filterStore.filterByStatus(statusId, statusName)
  }

  function quickFilterByPriority(priorityId: string, priorityName: string): void {
    filterStore.filterByPriority(priorityId, priorityName)
  }

  function quickFilterByType(typeId: string, typeName: string): void {
    filterStore.filterByType(typeId, typeName)
  }

  function quickFilterByDateRange(
    type: 'CREATE_DATE' | 'DUE_DATE',
    range: DateRange
  ): void {
    const label =
      type === 'CREATE_DATE'
        ? `创建日期: ${range.start} 至 ${range.end}`
        : `截止日期: ${range.start} 至 ${range.end}`
    filterStore.filterByDateRange(type, range, label)
  }

  function getFilteredTasks(): Task[] {
    return filterStore.applyFilters(taskStore.tasks)
  }

  function hasActiveFilters(): boolean {
    return filterStore.hasFilters && filterStore.enabled
  }

  return {
    conditions: filterStore.conditions,
    logicOperator: filterStore.logicOperator,
    enabled: filterStore.enabled,
    filteredTasks: filterStore.filteredTasks,
    hasFilters: filterStore.hasFilters,
    activeConditions: filterStore.activeConditions,
    activeConditionCount: filterStore.activeConditionCount,
    addCondition: filterStore.addCondition,
    removeCondition: filterStore.removeCondition,
    updateCondition: filterStore.updateCondition,
    toggleCondition: filterStore.toggleCondition,
    setLogicOperator: filterStore.setLogicOperator,
    clearAllConditions: filterStore.clearAllConditions,
    setEnabled: filterStore.setEnabled,
    watchFilters,
    generateConditionLabel,
    quickFilterByStatus,
    quickFilterByPriority,
    quickFilterByType,
    quickFilterByDateRange,
    getFilteredTasks,
    hasActiveFilters,
  }
}

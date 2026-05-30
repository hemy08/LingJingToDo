import { ref, computed } from 'vue'

import { useSearchStore } from '../stores/searchStore'
import { useTaskStore } from '../stores/taskStore'
import type { Task } from '../types'
import type { AdvancedSearchConfig, SearchHistoryItem } from '../types/enhancements'

export function useAdvancedSearch() {
  const searchStore = useSearchStore()
  const taskStore = useTaskStore()

  const searchHistory = computed(() => searchStore.searchHistory)
  const isSearching = computed(() => searchStore.isSearching)

  const advancedConfig = ref<AdvancedSearchConfig>({
    conditions: [],
    logicOperator: 'AND',
    enableRegex: false,
    enableFuzzy: false,
    sortBy: 'RELEVANCE',
    sortOrder: 'DESC',
  })

  function executeAdvancedSearch(config: AdvancedSearchConfig, tasks?: Task[]): Task[] {
    const taskList = tasks || taskStore.tasks
    const matchedTasks: Task[] = []

    for (const task of taskList) {
      let isMatch = false

      if (config.conditions.length === 0) {
        isMatch = true
      } else {
        const results = config.conditions.map(condition => {
          const { field, value, caseSensitive, operator } = condition
          let fieldValue = ''

          switch (field) {
            case 'TITLE':
              fieldValue = task.title
              break
            case 'DESCRIPTION':
              fieldValue = task.remark || ''
              break
            case 'STATUS':
              fieldValue = task.status_id
              break
            case 'TYPE':
              fieldValue = task.type_id
              break
            case 'PRIORITY':
              fieldValue = task.priority_id
              break
          }

          const compareValue = caseSensitive ? value : value.toLowerCase()
          const compareField = caseSensitive ? fieldValue : fieldValue.toLowerCase()

          switch (operator) {
            case 'CONTAINS':
              return compareField.includes(compareValue)
            case 'EQUALS':
              return compareField === compareValue
            case 'STARTS_WITH':
              return compareField.startsWith(compareValue)
            case 'ENDS_WITH':
              return compareField.endsWith(compareValue)
            case 'REGEX':
              return searchStore.regexSearch(value, fieldValue)
            case 'FUZZY':
              return searchStore.fuzzySearch(value, fieldValue)
            default:
              return false
          }
        })

        isMatch =
          config.logicOperator === 'AND' ? results.every(r => r) : results.some(r => r)
      }

      if (isMatch) {
        matchedTasks.push(task)
      }
    }

    if (config.sortBy !== 'RELEVANCE') {
      matchedTasks.sort((a, b) => {
        let valueA: number | string = ''
        let valueB: number | string = ''

        switch (config.sortBy) {
          case 'CREATED_DATE':
            valueA = new Date(a.created_date || 0).getTime()
            valueB = new Date(b.created_date || 0).getTime()
            break
          case 'DUE_DATE':
            valueA = new Date(a.due_date || 0).getTime()
            valueB = new Date(b.due_date || 0).getTime()
            break
          case 'PRIORITY':
            valueA = a.priority_id
            valueB = b.priority_id
            break
          case 'STATUS':
            valueA = a.status_id
            valueB = b.status_id
            break
        }

        const result = valueA < valueB ? -1 : valueA > valueB ? 1 : 0
        return config.sortOrder === 'ASC' ? result : -result
      })
    }

    return matchedTasks
  }

  function saveHistory(keyword: string, resultCount: number): void {
    const item: SearchHistoryItem = {
      keyword,
      timestamp: new Date().toISOString(),
      resultCount,
    }
    searchStore.saveSearchHistory(item)
  }

  function clearHistory(): void {
    searchStore.clearSearchHistory()
  }

  function fuzzyMatch(keyword: string, text: string): boolean {
    return searchStore.fuzzySearch(keyword, text)
  }

  return {
    searchHistory,
    isSearching,
    advancedConfig,
    executeAdvancedSearch,
    saveHistory,
    clearHistory,
    fuzzyMatch,
  }
}

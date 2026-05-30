import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

import type { Task, HighlightRange, SearchResult } from '../types'
import { SearchScope } from '../types'
import type { SearchHistoryItem, AdvancedSearchCondition } from '../types/enhancements'

const SEARCH_HISTORY_KEY = 'lingjing-todo-search-history'
const MAX_SEARCH_HISTORY = 10

function escapeSpecialChars(keyword: string): string {
  return keyword.replace(/[\\^$*+?.|(){}[\]]/g, '\\$&')
}

function calculateHighlightPositions(
  task: Task,
  keyword: string,
  scope: SearchScope,
  caseSensitive: boolean
): HighlightRange[] {
  const positions: HighlightRange[] = []
  const flags = caseSensitive ? 'g' : 'gi'
  const escapedKeyword = escapeSpecialChars(keyword)
  const regex = new RegExp(escapedKeyword, flags)

  if (scope === SearchScope.TITLE || scope === SearchScope.ALL) {
    let match
    while ((match = regex.exec(task.title)) !== null) {
      positions.push({
        field: 'title',
        start: match.index,
        end: match.index + match[0].length,
        text: match[0],
      })
    }
  }

  if ((scope === SearchScope.DESCRIPTION || scope === SearchScope.ALL) && task.remark) {
    regex.lastIndex = 0
    let match
    while ((match = regex.exec(task.remark!)) !== null) {
      positions.push({
        field: 'remark',
        start: match.index,
        end: match.index + match[0].length,
        text: match[0],
      })
    }
  }

  if (scope === SearchScope.TYPE || scope === SearchScope.ALL) {
    regex.lastIndex = 0
    let match
    while ((match = regex.exec(task.type_id)) !== null) {
      positions.push({
        field: 'type_id',
        start: match.index,
        end: match.index + match[0].length,
        text: match[0],
      })
    }
  }

  return positions
}

export const useSearchStore = defineStore('search', () => {
  const keyword = ref<string>('')
  const searchScope = ref<SearchScope>(SearchScope.ALL)
  const caseSensitive = ref<boolean>(false)
  const enableHighlight = ref<boolean>(true)
  const isSearching = ref<boolean>(false)
  const searchResults = ref<SearchResult | null>(null)

  const hasKeyword = computed(() => keyword.value.trim().length > 0)
  const matchedCount = computed(() => searchResults.value?.totalMatches ?? 0)

  function updateKeyword(newKeyword: string): void {
    keyword.value = newKeyword
  }

  function setSearchScope(scope: SearchScope): void {
    searchScope.value = scope
  }

  function setCaseSensitive(value: boolean): void {
    caseSensitive.value = value
  }

  function executeSearch(tasks: Task[]): SearchResult {
    if (!hasKeyword.value) {
      const result: SearchResult = {
        matchedTasks: tasks,
        totalMatches: tasks.length,
        highlightPositions: new Map(),
      }
      searchResults.value = result
      return result
    }

    isSearching.value = true
    const startTime = Date.now()

    try {
      const trimmedKeyword = keyword.value.trim()
      const flags = caseSensitive.value ? '' : 'i'
      const escapedKeyword = escapeSpecialChars(trimmedKeyword)
      const regex = new RegExp(escapedKeyword, flags)

      const matchedTasks: Task[] = []
      const highlightPositions = new Map<string, HighlightRange[]>()
      let totalMatches = 0

      for (const task of tasks) {
        let isMatch = false

        if (searchScope.value === SearchScope.TITLE || searchScope.value === SearchScope.ALL) {
          if (regex.test(task.title)) {
            isMatch = true
          }
          regex.lastIndex = 0
        }

        if (
          !isMatch &&
          (searchScope.value === SearchScope.DESCRIPTION || searchScope.value === SearchScope.ALL) &&
          task.remark
        ) {
          if (regex.test(task.remark)) {
            isMatch = true
          }
          regex.lastIndex = 0
        }

        if (
          !isMatch &&
          (searchScope.value === SearchScope.TYPE || searchScope.value === SearchScope.ALL)
        ) {
          if (regex.test(task.type_id)) {
            isMatch = true
          }
          regex.lastIndex = 0
        }

        if (isMatch) {
          matchedTasks.push(task)
          totalMatches++

          if (enableHighlight.value) {
            const positions = calculateHighlightPositions(
              task,
              trimmedKeyword,
              searchScope.value,
              caseSensitive.value
            )
            if (positions.length > 0) {
              highlightPositions.set(task.id, positions)
            }
          }
        }
      }

      const duration = Date.now() - startTime

      const result: SearchResult = {
        matchedTasks,
        totalMatches,
        highlightPositions,
        duration,
      }

      searchResults.value = result
      return result
    } finally {
      isSearching.value = false
    }
  }

  function clearSearch(): void {
    keyword.value = ''
    searchResults.value = null
  }

  function getHighlightRanges(taskId: string): HighlightRange[] {
    return searchResults.value?.highlightPositions.get(taskId) ?? []
  }

  const searchHistory = ref<SearchHistoryItem[]>([])

  function loadSearchHistory(): void {
    try {
      const stored = localStorage.getItem(SEARCH_HISTORY_KEY)
      if (stored) {
        searchHistory.value = JSON.parse(stored)
      }
    } catch {
      searchHistory.value = []
    }
  }

  function saveSearchHistory(item: SearchHistoryItem): void {
    const existing = searchHistory.value.findIndex(h => h.keyword === item.keyword)
    if (existing !== -1) {
      searchHistory.value.splice(existing, 1)
    }

    searchHistory.value.unshift(item)

    if (searchHistory.value.length > MAX_SEARCH_HISTORY) {
      searchHistory.value = searchHistory.value.slice(0, MAX_SEARCH_HISTORY)
    }

    try {
      localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(searchHistory.value))
    } catch {
      console.warn('Failed to save search history')
    }
  }

  function clearSearchHistory(): void {
    searchHistory.value = []
    try {
      localStorage.removeItem(SEARCH_HISTORY_KEY)
    } catch {
      console.warn('Failed to clear search history')
    }
  }

  function regexSearch(pattern: string, text: string, flags = 'gi'): boolean {
    try {
      const regex = new RegExp(pattern, flags)
      return regex.test(text)
    } catch {
      return false
    }
  }

  function fuzzySearch(keyword: string, text: string): boolean {
    const lowerKeyword = keyword.toLowerCase()
    const lowerText = text.toLowerCase()

    if (lowerText.includes(lowerKeyword)) {
      return true
    }

    let keywordIndex = 0
    for (let i = 0; i < lowerText.length && keywordIndex < lowerKeyword.length; i++) {
      if (lowerText[i] === lowerKeyword[keywordIndex]) {
        keywordIndex++
      }
    }
    return keywordIndex === lowerKeyword.length
  }

  function calculateRelevanceScore(
    task: Task,
    keyword: string,
    conditions: AdvancedSearchCondition[]
  ): number {
    let score = 0
    const lowerKeyword = keyword.toLowerCase()

    const titleLower = task.title.toLowerCase()
    if (titleLower === lowerKeyword) {
      score += 100
    } else if (titleLower.startsWith(lowerKeyword)) {
      score += 80
    } else if (titleLower.includes(lowerKeyword)) {
      score += 60
    }

    const matchCount = conditions.filter(c => {
      const field = c.field
      const value = c.value.toLowerCase()
      if (field === 'TITLE') return task.title.toLowerCase().includes(value)
      if (field === 'DESCRIPTION') return (task.remark || '').toLowerCase().includes(value)
      if (field === 'STATUS') return task.status_id === c.value
      if (field === 'TYPE') return task.type_id === c.value
      if (field === 'PRIORITY') return task.priority_id === c.value
      return false
    }).length
    score += matchCount * 10

    return score
  }

  loadSearchHistory()

  return {
    keyword,
    searchScope,
    caseSensitive,
    enableHighlight,
    isSearching,
    searchResults,
    hasKeyword,
    matchedCount,
    updateKeyword,
    setSearchScope,
    setCaseSensitive,
    executeSearch,
    clearSearch,
    getHighlightRanges,
    searchHistory,
    saveSearchHistory,
    clearSearchHistory,
    regexSearch,
    fuzzySearch,
    calculateRelevanceScore,
  }
})

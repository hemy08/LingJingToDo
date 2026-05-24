import { watch, ref } from 'vue'
import { useSearchStore } from '../stores/searchStore'
import { useTaskStore } from '../stores/taskStore'
import type { HighlightRange } from '../types'

export function useSearch(debounceDelay = 300) {
  const searchStore = useSearchStore()
  const taskStore = useTaskStore()
  const isDebouncing = ref(false)

  let debounceTimer: ReturnType<typeof setTimeout> | null = null

  function debouncedSearch(tasks: Parameters<typeof searchStore.executeSearch>[0]) {
    if (debounceTimer) {
      clearTimeout(debounceTimer)
    }

    isDebouncing.value = true
    debounceTimer = setTimeout(() => {
      searchStore.executeSearch(tasks)
      isDebouncing.value = false
      debounceTimer = null
    }, debounceDelay)
  }

  function watchKeyword() {
    watch(
      () => searchStore.keyword,
      () => {
        if (searchStore.hasKeyword) {
          debouncedSearch(taskStore.tasks)
        } else {
          searchStore.clearSearch()
        }
      }
    )
  }

  function highlightText(text: string, ranges: HighlightRange[], field: string): string {
    if (!ranges || ranges.length === 0) {
      return text
    }

    const fieldRanges = ranges.filter(r => r.field === field)
    if (fieldRanges.length === 0) {
      return text
    }

    fieldRanges.sort((a, b) => b.start - a.start)

    let result = text
    for (const range of fieldRanges) {
      const before = result.substring(0, range.start)
      const match = result.substring(range.start, range.end)
      const after = result.substring(range.end)
      result = `${before}<mark class="highlight">${match}</mark>${after}`
    }

    return result
  }

  function getHighlightRanges(taskId: string): HighlightRange[] {
    return searchStore.getHighlightRanges(taskId)
  }

  function executeSearchNow(): void {
    if (debounceTimer) {
      clearTimeout(debounceTimer)
      debounceTimer = null
    }
    isDebouncing.value = false
    searchStore.executeSearch(taskStore.tasks)
  }

  return {
    keyword: searchStore.keyword,
    hasKeyword: searchStore.hasKeyword,
    matchedCount: searchStore.matchedCount,
    isSearching: searchStore.isSearching,
    isDebouncing,
    searchResults: searchStore.searchResults,
    updateKeyword: searchStore.updateKeyword,
    setSearchScope: searchStore.setSearchScope,
    setCaseSensitive: searchStore.setCaseSensitive,
    clearSearch: searchStore.clearSearch,
    watchKeyword,
    highlightText,
    getHighlightRanges,
    executeSearchNow,
  }
}

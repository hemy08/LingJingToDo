import { computed } from 'vue'

import { useFilterStore } from '../stores/filterStore'
import type { FilterScheme } from '../types/enhancements'

export function useFilterScheme() {
  const filterStore = useFilterStore()

  const schemes = computed(() => filterStore.schemes)
  const schemeCount = computed(() => filterStore.schemes.length)
  const maxSchemes = 10

  function saveScheme(name: string): FilterScheme | null {
    return filterStore.saveScheme(name)
  }

  function loadScheme(schemeId: string): boolean {
    return filterStore.loadScheme(schemeId)
  }

  function deleteScheme(schemeId: string): void {
    filterStore.deleteScheme(schemeId)
  }

  function renameScheme(schemeId: string, newName: string): boolean {
    return filterStore.renameScheme(schemeId, newName)
  }

  function exportScheme(schemeId: string): string | null {
    return filterStore.exportScheme(schemeId)
  }

  function importScheme(jsonStr: string): FilterScheme | null {
    return filterStore.importScheme(jsonStr)
  }

  function checkNameConflict(name: string): boolean {
    return filterStore.schemes.some(s => s.name === name)
  }

  return {
    schemes,
    schemeCount,
    maxSchemes,
    saveScheme,
    loadScheme,
    deleteScheme,
    renameScheme,
    exportScheme,
    importScheme,
    checkNameConflict,
  }
}

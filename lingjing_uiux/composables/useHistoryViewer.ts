import { computed } from 'vue'
import { useHistoryStore } from '../stores/historyStore'
import { useTaskStore } from '../stores/taskStore'
import type { OperationSnapshot } from '../types'
import type { HistoryDisplayItem } from '../types/enhancements'

export function useHistoryViewer() {
  const historyStore = useHistoryStore()
  const taskStore = useTaskStore()

  const displayItems = computed<HistoryDisplayItem[]>(() => {
    return historyStore.undoStack
      .slice()
      .reverse()
      .map(snapshot => ({
        snapshot,
        displayText: historyStore.generateDisplayText(snapshot),
        relativeTime: historyStore.calculateRelativeTime(snapshot.timestamp),
        icon: historyStore.getOperationIcon(snapshot.type),
        canUndo: true,
      }))
  })

  const historyCount = computed(() => historyStore.undoCount)

  async function batchUndo(selectedIds: string[]): Promise<OperationSnapshot[]> {
    const snapshots = historyStore.batchUndo(selectedIds)

    for (const snapshot of snapshots) {
      if (snapshot.beforeState) {
        await taskStore.updateTask(snapshot.beforeState)
      } else if (snapshot.afterState) {
        await taskStore.deleteTask(snapshot.targetTaskId)
      }
    }

    return snapshots
  }

  async function selectiveUndo(targetSnapshotId: string): Promise<OperationSnapshot[]> {
    const snapshots = historyStore.selectiveUndo(targetSnapshotId)

    for (const snapshot of snapshots) {
      if (snapshot.beforeState) {
        await taskStore.updateTask(snapshot.beforeState)
      } else if (snapshot.afterState) {
        await taskStore.deleteTask(snapshot.targetTaskId)
      }
    }

    return snapshots
  }

  function searchHistory(keyword: string): HistoryDisplayItem[] {
    const snapshots = historyStore.searchHistory(keyword)
    return snapshots.map(snapshot => ({
      snapshot,
      displayText: historyStore.generateDisplayText(snapshot),
      relativeTime: historyStore.calculateRelativeTime(snapshot.timestamp),
      icon: historyStore.getOperationIcon(snapshot.type),
      canUndo: true,
    }))
  }

  function getOperationIcon(type: string): string {
    return historyStore.getOperationIcon(type)
  }

  return {
    displayItems,
    historyCount,
    batchUndo,
    selectiveUndo,
    searchHistory,
    getOperationIcon,
    canUndo: historyStore.canUndo,
    canRedo: historyStore.canRedo,
  }
}

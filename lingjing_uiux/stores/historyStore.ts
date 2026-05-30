import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

import type { Task, OperationSnapshot, OperationType } from '../types'

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

export const useHistoryStore = defineStore('history', () => {
  const undoStack = ref<OperationSnapshot[]>([])
  const redoStack = ref<OperationSnapshot[]>([])
  const maxHistorySize = 100
  const isLocked = ref(false)

  const canUndo = computed(() => undoStack.value.length > 0 && !isLocked.value)
  const canRedo = computed(() => redoStack.value.length > 0 && !isLocked.value)
  const undoCount = computed(() => undoStack.value.length)
  const redoCount = computed(() => redoStack.value.length)

  function recordOperation(
    type: OperationType,
    targetTaskId: string,
    beforeState: Task | null,
    afterState: Task | null,
    parentTaskId?: string
  ): void {
    const snapshot: OperationSnapshot = {
      id: generateId(),
      type,
      targetTaskId,
      parentTaskId,
      beforeState: beforeState ? JSON.parse(JSON.stringify(beforeState)) : null,
      afterState: afterState ? JSON.parse(JSON.stringify(afterState)) : null,
      timestamp: new Date().toISOString(),
    }

    if (undoStack.value.length >= maxHistorySize) {
      undoStack.value.shift()
    }

    undoStack.value.push(snapshot)
  }

  function undo(): OperationSnapshot | null {
    if (!canUndo.value) {
      return null
    }

    isLocked.value = true

    try {
      const snapshot = undoStack.value.pop()
      if (!snapshot) {
        return null
      }

      redoStack.value.push(snapshot)
      return snapshot
    } finally {
      isLocked.value = false
    }
  }

  function redo(): OperationSnapshot | null {
    if (!canRedo.value) {
      return null
    }

    isLocked.value = true

    try {
      const snapshot = redoStack.value.pop()
      if (!snapshot) {
        return null
      }

      undoStack.value.push(snapshot)
      return snapshot
    } finally {
      isLocked.value = false
    }
  }

  function clearRedoStack(): void {
    redoStack.value = []
  }

  function clearAll(): void {
    undoStack.value = []
    redoStack.value = []
  }

  function getLastOperation(): OperationSnapshot | null {
    const last = undoStack.value[undoStack.value.length - 1]
    return last ?? null
  }

  function generateDisplayText(snapshot: OperationSnapshot): string {
    const typeMap: Record<string, string> = {
      CREATE_TASK: '创建任务',
      UPDATE_TASK: '更新任务',
      DELETE_TASK: '删除任务',
      ADD_SUBTASK: '添加子任务',
      UPDATE_SUBTASK: '更新子任务',
      DELETE_SUBTASK: '删除子任务',
    }

    const operation = typeMap[snapshot.type] || snapshot.type
    const taskTitle = snapshot.afterState?.title || snapshot.beforeState?.title || '未知任务'
    return `${operation}: ${taskTitle}`
  }

  function calculateRelativeTime(timestamp: string): string {
    const now = Date.now()
    const then = new Date(timestamp).getTime()
    const diff = now - then

    if (diff < 60000) return '刚刚'
    if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`
    if (diff < 604800000) return `${Math.floor(diff / 86400000)} 天前`
    return new Date(timestamp).toLocaleDateString()
  }

  function getOperationIcon(type: string): string {
    const iconMap: Record<string, string> = {
      CREATE_TASK: 'fa-plus',
      UPDATE_TASK: 'fa-edit',
      DELETE_TASK: 'fa-trash',
      ADD_SUBTASK: 'fa-plus-circle',
      UPDATE_SUBTASK: 'fa-edit',
      DELETE_SUBTASK: 'fa-trash',
    }
    return iconMap[type] || 'fa-circle'
  }

  function searchHistory(keyword: string): OperationSnapshot[] {
    if (!keyword.trim()) {
      return [...undoStack.value].reverse()
    }

    const lowerKeyword = keyword.toLowerCase()
    return undoStack.value
      .filter(snapshot => {
        const displayText = generateDisplayText(snapshot).toLowerCase()
        const taskTitle = (snapshot.afterState?.title || snapshot.beforeState?.title || '').toLowerCase()
        return displayText.includes(lowerKeyword) || taskTitle.includes(lowerKeyword)
      })
      .reverse()
  }

  function batchUndo(selectedIds: string[]): OperationSnapshot[] {
    if (isLocked.value || selectedIds.length === 0) {
      return []
    }

    isLocked.value = true
    const undoneSnapshots: OperationSnapshot[] = []

    try {
      const sortedIds = selectedIds.sort((a, b) => {
        const indexA = undoStack.value.findIndex(s => s.id === a)
        const indexB = undoStack.value.findIndex(s => s.id === b)
        return indexB - indexA
      })

      for (const id of sortedIds) {
        const index = undoStack.value.findIndex(s => s.id === id)
        if (index !== -1) {
          const snapshot = undoStack.value.splice(index, 1)[0]
          if (snapshot) {
            redoStack.value.push(snapshot)
            undoneSnapshots.push(snapshot)
          }
        }
      }

      return undoneSnapshots
    } finally {
      isLocked.value = false
    }
  }

  function selectiveUndo(targetSnapshotId: string): OperationSnapshot[] {
    if (isLocked.value) {
      return []
    }

    const targetIndex = undoStack.value.findIndex(s => s.id === targetSnapshotId)
    if (targetIndex === -1) {
      return []
    }

    const snapshotsToUndo = undoStack.value.slice(targetIndex)
    const ids = snapshotsToUndo.map(s => s.id)

    return batchUndo(ids)
  }

  return {
    undoStack,
    redoStack,
    isLocked,
    canUndo,
    canRedo,
    undoCount,
    redoCount,
    recordOperation,
    undo,
    redo,
    clearRedoStack,
    clearAll,
    getLastOperation,
    generateDisplayText,
    calculateRelativeTime,
    getOperationIcon,
    searchHistory,
    batchUndo,
    selectiveUndo,
  }
})

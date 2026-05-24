import { onMounted, onUnmounted } from 'vue'
import { useHistoryStore } from '../stores/historyStore'
import { useTaskStore } from '../stores/taskStore'
import type { Task, OperationType } from '../types'

export function useHistory() {
  const historyStore = useHistoryStore()
  const taskStore = useTaskStore()

  async function executeWithHistory(
    operation: () => Promise<void>,
    type: OperationType,
    targetTaskId: string,
    getBeforeState: () => Task | null,
    getAfterState: () => Task | null,
    parentTaskId?: string
  ): Promise<void> {
    const beforeState = getBeforeState()

    await operation()

    const afterState = getAfterState()

    historyStore.recordOperation(type, targetTaskId, beforeState, afterState, parentTaskId)
    historyStore.clearRedoStack()
  }

  async function performUndo(): Promise<boolean> {
    const snapshot = historyStore.undo()
    if (!snapshot) {
      return false
    }

    try {
      if (snapshot.beforeState) {
        await taskStore.updateTask(snapshot.beforeState)
      } else if (snapshot.afterState) {
        await taskStore.deleteTask(snapshot.targetTaskId)
      }
      return true
    } catch (error) {
      console.error('Undo failed:', error)
      return false
    }
  }

  async function performRedo(): Promise<boolean> {
    const snapshot = historyStore.redo()
    if (!snapshot) {
      return false
    }

    try {
      if (snapshot.afterState) {
        if (snapshot.beforeState) {
          await taskStore.updateTask(snapshot.afterState)
        } else {
          await taskStore.addTask(snapshot.afterState)
        }
      }
      return true
    } catch (error) {
      console.error('Redo failed:', error)
      return false
    }
  }

  function setupKeyboardShortcuts(): void {
    const handleKeydown = async (event: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
      const ctrlKey = isMac ? event.metaKey : event.ctrlKey

      if (ctrlKey && event.key === 'z' && !event.shiftKey) {
        event.preventDefault()
        await performUndo()
      } else if (
        ctrlKey &&
        ((event.key === 'z' && event.shiftKey) || event.key === 'y')
      ) {
        event.preventDefault()
        await performRedo()
      }
    }

    onMounted(() => {
      window.addEventListener('keydown', handleKeydown)
    })

    onUnmounted(() => {
      window.removeEventListener('keydown', handleKeydown)
    })
  }

  return {
    executeWithHistory,
    performUndo,
    performRedo,
    setupKeyboardShortcuts,
    canUndo: historyStore.canUndo,
    canRedo: historyStore.canRedo,
    undoCount: historyStore.undoCount,
    redoCount: historyStore.redoCount,
  }
}

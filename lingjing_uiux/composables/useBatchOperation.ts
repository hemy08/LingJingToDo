import { ref } from 'vue'
import { useTaskStore } from '../stores/taskStore'
import { useHistoryStore } from '../stores/historyStore'
import type { Task } from '../types'
import type { BatchOperationConfig, BatchOperationResult, BatchSelectionState, ExecutedOperation } from '../types/enhancements'

export function useBatchOperation() {
  const taskStore = useTaskStore()
  const historyStore = useHistoryStore()

  const selectionState = ref<BatchSelectionState>({
    selectedIds: new Set<string>(),
    isSelectAll: false,
    lastSelectedId: null,
  })

  function toggleSelection(taskId: string): void {
    if (selectionState.value.selectedIds.has(taskId)) {
      selectionState.value.selectedIds.delete(taskId)
    } else {
      selectionState.value.selectedIds.add(taskId)
    }
    selectionState.value.lastSelectedId = taskId
    selectionState.value.isSelectAll = false
  }

  function selectAll(taskIds: string[]): void {
    selectionState.value.selectedIds = new Set(taskIds)
    selectionState.value.isSelectAll = true
  }

  function deselectAll(): void {
    selectionState.value.selectedIds = new Set()
    selectionState.value.isSelectAll = false
    selectionState.value.lastSelectedId = null
  }

  function invertSelection(taskIds: string[]): void {
    const newSet = new Set<string>()
    for (const id of taskIds) {
      if (!selectionState.value.selectedIds.has(id)) {
        newSet.add(id)
      }
    }
    selectionState.value.selectedIds = newSet
    selectionState.value.isSelectAll = false
  }

  async function executeBatch(config: BatchOperationConfig): Promise<BatchOperationResult> {
    const executedOperations: ExecutedOperation[] = []
    let successCount = 0
    let failCount = 0
    const failedIds: string[] = []

    for (const taskId of config.taskIds) {
      const task = taskStore.tasks.find(t => t.id === taskId)
      if (!task) {
        failCount++
        failedIds.push(taskId)
        continue
      }

      const beforeState = JSON.parse(JSON.stringify(task)) as Task

      try {
        switch (config.mode) {
          case 'UPDATE_STATUS':
            if (config.targetValue) {
              await taskStore.updateTask({ ...task, status_id: config.targetValue })
            }
            break
          case 'UPDATE_PRIORITY':
            if (config.targetValue) {
              await taskStore.updateTask({ ...task, priority_id: config.targetValue })
            }
            break
          case 'UPDATE_TYPE':
            if (config.targetValue) {
              await taskStore.updateTask({ ...task, type_id: config.targetValue })
            }
            break
          case 'DELETE':
            await taskStore.deleteTask(taskId)
            break
        }

        executedOperations.push({
          taskId,
          operation: config.mode,
          beforeState,
          afterState: config.mode === 'DELETE' ? null : taskStore.tasks.find(t => t.id === taskId) || null,
        })

        successCount++
      } catch (error) {
        failCount++
        failedIds.push(taskId)
      }
    }

    recordBatchHistory(executedOperations)

    return {
      success: failCount === 0,
      successCount,
      failCount,
      failedIds,
    }
  }

  async function batchUpdateStatus(taskIds: string[], statusId: string): Promise<BatchOperationResult> {
    return executeBatch({
      mode: 'UPDATE_STATUS',
      taskIds,
      targetValue: statusId,
      confirmRequired: false,
    })
  }

  async function batchUpdatePriority(taskIds: string[], priorityId: string): Promise<BatchOperationResult> {
    return executeBatch({
      mode: 'UPDATE_PRIORITY',
      taskIds,
      targetValue: priorityId,
      confirmRequired: false,
    })
  }

  async function batchDelete(taskIds: string[]): Promise<BatchOperationResult> {
    return executeBatch({
      mode: 'DELETE',
      taskIds,
      confirmRequired: true,
    })
  }

  function recordBatchHistory(operations: ExecutedOperation[]): void {
    for (const op of operations) {
      historyStore.recordOperation(
        op.operation as any,
        op.taskId,
        op.beforeState,
        op.afterState
      )
    }
  }

  return {
    selectionState,
    toggleSelection,
    selectAll,
    deselectAll,
    invertSelection,
    executeBatch,
    batchUpdateStatus,
    batchUpdatePriority,
    batchDelete,
  }
}

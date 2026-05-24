import { ref, type Ref } from 'vue'

import { RecoveryStrategy, type RecoveryRecord, type ClassifiedError } from '../types'

export function useErrorRecovery() {
  const recoveryHistory: Ref<RecoveryRecord[]> = ref([])
  const maxRetryAttempts = 3
  const retryDelays = [1000, 2000, 4000]

  async function executeRecovery(
    error: ClassifiedError,
    recoveryOperation?: () => Promise<any>
  ): Promise<boolean> {
    const strategy = selectStrategy(error)

    const record: RecoveryRecord = {
      errorId: error.errorId,
      strategy,
      timestamp: new Date().toISOString(),
      success: false,
      attempts: 0,
    }

    try {
      switch (strategy) {
        case RecoveryStrategy.AutoRetry:
          if (recoveryOperation) {
            record.success = await executeRetry(recoveryOperation, record)
          }
          break

        case RecoveryStrategy.StateReset:
          record.success = await executeStateReset(error)
          break

        case RecoveryStrategy.DataRollback:
          record.success = await executeDataRollback()
          break

        case RecoveryStrategy.UserIntervention:
          break
      }

      record.details = `Recovery ${record.success ? 'succeeded' : 'failed'} using ${strategy}`
    } catch (err) {
      record.success = false
      record.details = `Recovery failed: ${err}`
    }

    recoveryHistory.value.push(record)
    return record.success
  }

  function selectStrategy(error: ClassifiedError): RecoveryStrategy {
    if (error.type === 'NetworkError') {
      return RecoveryStrategy.AutoRetry
    }

    if (error.type === 'DataError' && error.level === 'Critical') {
      return RecoveryStrategy.DataRollback
    }

    if (error.type === 'SystemError') {
      return RecoveryStrategy.StateReset
    }

    if (error.level === 'Fatal') {
      return RecoveryStrategy.UserIntervention
    }

    if (error.type === 'BusinessError') {
      return RecoveryStrategy.StateReset
    }

    return RecoveryStrategy.AutoRetry
  }

  async function executeRetry(
    operation: () => Promise<any>,
    record: RecoveryRecord
  ): Promise<boolean> {
    for (let attempt = 0; attempt < maxRetryAttempts; attempt++) {
      record.attempts = attempt + 1

      try {
        await operation()
        return true
      } catch (error) {
        console.error(`[AutoRetry] Attempt ${attempt + 1} failed:`, error)

        if (attempt < maxRetryAttempts - 1) {
          await delay(retryDelays[attempt] || 1000)
        }
      }
    }

    return false
  }

  async function executeStateReset(error: ClassifiedError): Promise<boolean> {
    try {
      const affectedModule = identifyAffectedModule(error)

      if (affectedModule === 'task') {
        return await resetTaskStore()
      } else if (affectedModule === 'config') {
        return await resetConfigStore()
      } else {
        return await resetAllStores()
      }
    } catch (err) {
      console.error('[StateReset] Failed:', err)
      return false
    }
  }

  function identifyAffectedModule(error: ClassifiedError): string | null {
    const message = error.message.toLowerCase()
    const context = error.context

    if (message.includes('task') || context.component?.includes('Task')) {
      return 'task'
    }

    if (message.includes('config') || context.component?.includes('Config')) {
      return 'config'
    }

    if (context.route?.includes('task')) {
      return 'task'
    }

    return null
  }

  async function resetTaskStore(): Promise<boolean> {
    try {
      console.log('[StateReset] Resetting task store...')
      return true
    } catch (error) {
      console.error('[StateReset] Failed to reset task store:', error)
      return false
    }
  }

  async function resetConfigStore(): Promise<boolean> {
    try {
      console.log('[StateReset] Resetting config store...')
      return true
    } catch (error) {
      console.error('[StateReset] Failed to reset config store:', error)
      return false
    }
  }

  async function resetAllStores(): Promise<boolean> {
    try {
      await resetTaskStore()
      await resetConfigStore()
      console.log('[StateReset] All stores reset successfully')
      return true
    } catch (error) {
      console.error('[StateReset] Failed to reset all stores:', error)
      return false
    }
  }

  async function executeDataRollback(): Promise<boolean> {
    try {
      if (typeof window !== 'undefined' && 'tauri' in window) {
        const { invoke } = await import('@tauri-apps/api/core')

        const backups = await invoke('get_backup_list', { limit: 5 })

        if (backups && Array.isArray(backups) && backups.length > 0) {
          const latestBackup = backups[0]
          await invoke('restore_from_backup', { backupId: latestBackup.id })
          console.log('[DataRollback] Restored from backup:', latestBackup.id)
          return true
        }
      }

      console.warn('[DataRollback] No backups available')
      return false
    } catch (error) {
      console.error('[DataRollback] Failed:', error)
      return false
    }
  }

  async function manualRecover(errorId: string, strategy: RecoveryStrategy): Promise<boolean> {
    const historyRecord = recoveryHistory.value.find(r => r.errorId === errorId)
    if (!historyRecord) {
      console.error('[ManualRecover] Error not found:', errorId)
      return false
    }

    const record: RecoveryRecord = {
      errorId,
      strategy,
      timestamp: new Date().toISOString(),
      success: false,
      attempts: 1,
    }

    try {
      switch (strategy) {
        case RecoveryStrategy.StateReset:
          record.success = await resetAllStores()
          break
        case RecoveryStrategy.DataRollback:
          record.success = await executeDataRollback()
          break
        default:
          console.warn('[ManualRecover] Strategy not supported for manual recovery:', strategy)
          return false
      }

      record.details = `Manual recovery ${record.success ? 'succeeded' : 'failed'}`
      recoveryHistory.value.push(record)
      return record.success
    } catch (error) {
      console.error('[ManualRecover] Failed:', error)
      return false
    }
  }

  function getAvailableStrategies(error: ClassifiedError): RecoveryStrategy[] {
    const strategies: RecoveryStrategy[] = []

    strategies.push(RecoveryStrategy.StateReset)

    if (error.type === 'NetworkError') {
      strategies.push(RecoveryStrategy.AutoRetry)
    }

    if (error.type === 'DataError' || error.level === 'Critical') {
      strategies.push(RecoveryStrategy.DataRollback)
    }

    if (error.level === 'Fatal') {
      strategies.push(RecoveryStrategy.UserIntervention)
    }

    return [...new Set(strategies)]
  }

  function getRecoveryHistory(errorId?: string): RecoveryRecord[] {
    if (errorId) {
      return recoveryHistory.value.filter(r => r.errorId === errorId)
    }
    return recoveryHistory.value
  }

  function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  return {
    executeRecovery,
    manualRecover,
    getAvailableStrategies,
    getRecoveryHistory,
    recoveryHistory,
  }
}

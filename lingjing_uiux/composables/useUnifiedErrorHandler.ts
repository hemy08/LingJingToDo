import { ref, type Ref } from 'vue'

import {
  ErrorLevel,
  RecoveryStrategy,
  type ClassifiedError,
  type ErrorLog,
  type ErrorStatistics,
  type ErrorHandlerConfig,
} from '../types'

import { useErrorClassifier } from './useErrorClassifier'
import { useErrorLogger } from './useErrorLogger'
import { useErrorRecovery } from './useErrorRecovery'

export function useUnifiedErrorHandler(config?: Partial<ErrorHandlerConfig>) {
  const classifier = useErrorClassifier()
  const logger = useErrorLogger(config)
  const recovery = useErrorRecovery()

  const errorQueue: Ref<ClassifiedError[]> = ref([])
  const isInitialized = ref(false)
  const errorCount = ref(0)

  async function captureError(
    error: Error | unknown,
    additionalContext?: Record<string, any>
  ): Promise<ClassifiedError> {
    const classifiedError = classifier.classifyError(error, additionalContext)

    errorQueue.value.push(classifiedError)
    errorCount.value++

    if (errorQueue.value.length > 100) {
      errorQueue.value = errorQueue.value.slice(-50)
    }

    await logError(classifiedError)

    if (shouldAttemptRecovery(classifiedError)) {
      const recoverySuccess = await attemptRecovery(classifiedError)
      classifiedError.context['recovery_attempted'] = true
      classifiedError.context['recovery_success'] = recoverySuccess
    }

    notifyUser(classifiedError)

    return classifiedError
  }

  async function logError(error: ClassifiedError): Promise<void> {
    const errorLog: ErrorLog = {
      error_id: error.errorId,
      timestamp: error.timestamp,
      error_code: error.errorCode,
      error_type: error.type,
      error_level: error.level,
      message: error.message,
      stack: error.stack,
      context: error.context,
    }

    await logger.writeLog(errorLog)
  }

  function shouldAttemptRecovery(error: ClassifiedError): boolean {
    if (error.level === ErrorLevel.Fatal) {
      return false
    }

    if (error.type === 'PermissionError') {
      return false
    }

    return true
  }

  async function attemptRecovery(error: ClassifiedError): Promise<boolean> {
    try {
      const success = await recovery.executeRecovery(error)

      if (success) {
        console.log(`[Recovery] Successfully recovered from error: ${error.errorId}`)
      } else {
        console.warn(`[Recovery] Failed to recover from error: ${error.errorId}`)
      }

      return success
    } catch (err) {
      console.error(`[Recovery] Recovery attempt failed:`, err)
      return false
    }
  }

  function notifyUser(error: ClassifiedError): void {
    const message = getUserFriendlyMessage(error)

    switch (error.level) {
      case ErrorLevel.Fatal:
        showFatalError(error, message)
        break
      case ErrorLevel.Severe:
        showSevereError(error, message)
        break
      case ErrorLevel.Warning:
        showWarning(error, message)
        break
      case ErrorLevel.Info:
        showInfo(error, message)
        break
    }
  }

  function getUserFriendlyMessage(error: ClassifiedError): string {
    const messageMap: Record<string, string> = {
      NetworkError: '网络连接出现问题，请检查网络后重试',
      DataError: '数据处理失败，请稍后重试',
      PermissionError: '权限不足，无法执行此操作',
      SystemError: '系统发生错误，请刷新页面或重启应用',
      BusinessError: '操作失败，请检查输入后重试',
      ConfigError: '配置加载失败，已使用默认配置',
    }

    return messageMap[error.type] || error.message
  }

  function showFatalError(error: ClassifiedError, message: string): void {
    console.error('[Fatal Error]', message, error)

    const confirmed = confirm(
      `严重错误\n\n${message}\n\n点击"确定"重新加载应用，点击"取消"查看详细信息`
    )

    if (confirmed) {
      window.location.reload()
    } else {
      console.error('Error details:', error)
    }
  }

  function showSevereError(error: ClassifiedError, message: string): void {
    console.error('[Severe Error]', message, error)
    alert(`错误: ${message}`)
  }

  function showWarning(error: ClassifiedError, message: string): void {
    console.warn('[Warning]', message, error)
  }

  function showInfo(error: ClassifiedError, message: string): void {
    console.info('[Info]', message, error)
  }

  function classifyError(
    error: Error | unknown,
    additionalContext?: Record<string, any>
  ): ClassifiedError {
    return classifier.classifyError(error, additionalContext)
  }

  async function manualRecover(errorId: string, strategy: RecoveryStrategy): Promise<boolean> {
    return await recovery.manualRecover(errorId, strategy)
  }

  function getErrorQueue(): ClassifiedError[] {
    return errorQueue.value
  }

  function clearErrorQueue(): void {
    errorQueue.value = []
    errorCount.value = 0
  }

  function getErrorStatistics(): ErrorStatistics {
    const now = new Date()
    const startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000)

    const errorsByType: Record<string, number> = {}
    const errorsByLevel: Record<string, number> = {}

    for (const error of errorQueue.value) {
      errorsByType[error.type] = (errorsByType[error.type] || 0) + 1
      errorsByLevel[error.level] = (errorsByLevel[error.level] || 0) + 1
    }

    const recoveryRecords = recovery.getRecoveryHistory()
    const successfulRecoveries = recoveryRecords.filter(r => r.success).length
    const recoverySuccessRate =
      recoveryRecords.length > 0 ? (successfulRecoveries / recoveryRecords.length) * 100 : 0

    return {
      totalErrors: errorCount.value,
      errorsByType: errorsByType as any,
      errorsByLevel: errorsByLevel as any,
      recoverySuccessRate,
      recentErrors: errorQueue.value.slice(-100).map(error => ({
        error_id: error.errorId,
        timestamp: error.timestamp,
        error_code: error.errorCode,
        error_type: error.type,
        error_level: error.level,
        message: error.message,
        stack: error.stack,
        context: error.context,
      })),
      timeRange: {
        start: startTime.toISOString(),
        end: now.toISOString(),
      },
    }
  }

  async function queryLogs(filter?: {
    startTime?: string
    endTime?: string
    errorType?: string
    errorLevel?: string
    limit?: number
  }): Promise<ErrorLog[]> {
    return await logger.queryLogs(filter)
  }

  async function exportLogs(format: 'json' | 'text' = 'json'): Promise<string> {
    return await logger.exportLogs(format)
  }

  function initialize(): void {
    if (isInitialized.value) {
      return
    }

    isInitialized.value = true
    console.log('[UnifiedErrorHandler] Initialized')
  }

  return {
    captureError,
    classifyError,
    logError,
    attemptRecovery,
    manualRecover,
    notifyUser,
    getErrorQueue,
    clearErrorQueue,
    getErrorStatistics,
    queryLogs,
    exportLogs,
    initialize,
    errorQueue,
    errorCount,
    isInitialized,
  }
}

let globalHandlerInstance: ReturnType<typeof useUnifiedErrorHandler> | null = null

export function getUnifiedErrorHandler(config?: Partial<ErrorHandlerConfig>) {
  if (!globalHandlerInstance) {
    globalHandlerInstance = useUnifiedErrorHandler(config)
  }
  return globalHandlerInstance
}

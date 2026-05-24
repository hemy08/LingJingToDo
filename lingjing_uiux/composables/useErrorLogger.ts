import { ref, type Ref } from 'vue'

import type { ErrorLog, ErrorHandlerConfig, ErrorContext } from '../types'

export function useErrorLogger(config?: Partial<ErrorHandlerConfig>) {
  const defaultConfig: ErrorHandlerConfig = {
    enableRemoteReport: false,
    logRetentionDays: 30,
    maxLogFileSize: 10 * 1024 * 1024,
    maxTotalLogSize: 100 * 1024 * 1024,
    batchReportSize: 10,
    batchReportInterval: 5 * 60 * 1000,
    maxRetryAttempts: 3,
    retryDelays: [1000, 5000, 30000],
  }

  const loggerConfig = { ...defaultConfig, ...config }
  const pendingLogs: Ref<ErrorLog[]> = ref([])
  const isReporting = ref(false)

  async function writeLog(errorLog: ErrorLog): Promise<void> {
    try {
      const logString = JSON.stringify(errorLog) + '\n'

      if (typeof window !== 'undefined' && 'tauri' in window) {
        const { invoke } = await import('@tauri-apps/api/core')
        await invoke('log_error_to_backend', { errorLog: errorLog })
      } else {
        console.error('[ErrorLog]', logString)
        pendingLogs.value.push(errorLog)
      }

      if (loggerConfig.enableRemoteReport) {
        await scheduleRemoteReport(errorLog)
      }
    } catch (err) {
      console.error('[ErrorLogger] Failed to write log:', err)
      pendingLogs.value.push(errorLog)
    }
  }

  async function scheduleRemoteReport(errorLog: ErrorLog): Promise<void> {
    if (isReporting.value) {
      pendingLogs.value.push(errorLog)
      return
    }

    const isFatal = errorLog.error_level === 'Fatal'
    if (isFatal || pendingLogs.value.length >= loggerConfig.batchReportSize) {
      await executeRemoteReport(isFatal ? [errorLog] : [...pendingLogs.value])
      pendingLogs.value = []
    } else {
      pendingLogs.value.push(errorLog)
    }
  }

  async function executeRemoteReport(logs: ErrorLog[]): Promise<void> {
    if (!loggerConfig.remoteReportUrl) return

    isReporting.value = true
    const sanitizedLogs = logs.map(sanitizeLog)

    for (let attempt = 0; attempt < loggerConfig.maxRetryAttempts; attempt++) {
      try {
        const response = await fetch(loggerConfig.remoteReportUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ errors: sanitizedLogs }),
        })

        if (response.ok) {
          isReporting.value = false
          return
        }

        throw new Error(`Report failed with status ${response.status}`)
      } catch (error) {
        console.error(`[RemoteReport] Attempt ${attempt + 1} failed:`, error)
        if (attempt < loggerConfig.maxRetryAttempts - 1) {
          const delayTime = loggerConfig.retryDelays[attempt] ?? 1000
          await delay(delayTime)
        }
      }
    }

    isReporting.value = false
    console.error('[RemoteReport] All attempts failed, giving up')
  }

  function sanitizeLog(log: ErrorLog): ErrorLog {
    const sanitized = { ...log }

    if (sanitized.stack) {
      sanitized.stack = sanitizeStack(sanitized.stack)
    }

    if (sanitized.context) {
      sanitized.context = sanitizeContext(sanitized.context)
    }

    return sanitized
  }

  function sanitizeStack(stack: string): string {
    return stack
      .replace(/password[=:]\s*\S+/gi, 'password=******')
      .replace(/token[=:]\s*\S+/gi, 'token=REDACTED_TOKEN')
      .replace(/secret[=:]\s*\S+/gi, 'secret=REDACTED_SECRET')
  }

  function sanitizeContext(context: ErrorContext): ErrorContext {
    const sanitized: ErrorContext = { timestamp: context.timestamp }
    const sensitiveFields = [
      'password',
      'token',
      'accessToken',
      'refreshToken',
      'secret',
      'apiKey',
      'credential',
    ]

    for (const key in context) {
      if (key !== 'timestamp') {
        sanitized[key] = context[key]
      }
    }

    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = 'REDACTED'
      }
    }

    if (sanitized['email'] && typeof sanitized['email'] === 'string') {
      sanitized['email'] = sanitized['email'].replace(/(.{2}).*(@.*)/, '$1***$2')
    }

    if (sanitized['phone'] && typeof sanitized['phone'] === 'string') {
      sanitized['phone'] = sanitized['phone'].replace(/(\d{3})\d{4}(\d{3})/, '$1****$2')
    }

    for (const key in sanitized) {
      if (typeof sanitized[key] === 'string' && sanitized[key].includes('/')) {
        const parts = sanitized[key].split('/')
        if (parts.length > 2) {
          sanitized[key] = parts[parts.length - 1]
        }
      }
    }

    return sanitized
  }

  async function queryLogs(filter?: {
    startTime?: string
    endTime?: string
    errorType?: string
    errorLevel?: string
    limit?: number
  }): Promise<ErrorLog[]> {
    try {
      if (typeof window !== 'undefined' && 'tauri' in window) {
        const { invoke } = await import('@tauri-apps/api/core')
        return await invoke('get_error_logs', { filter })
      } else {
        return pendingLogs.value.slice(-(filter?.limit || 100))
      }
    } catch (error) {
      console.error('[ErrorLogger] Failed to query logs:', error)
      return []
    }
  }

  async function cleanupLogs(): Promise<void> {
    try {
      if (typeof window !== 'undefined' && 'tauri' in window) {
        const { invoke } = await import('@tauri-apps/api/core')
        await invoke('cleanup_error_logs')
      }
      pendingLogs.value = []
    } catch (error) {
      console.error('[ErrorLogger] Failed to cleanup logs:', error)
    }
  }

  async function exportLogs(format: 'json' | 'text' = 'json'): Promise<string> {
    const logs = await queryLogs({ limit: 1000 })

    if (format === 'json') {
      return JSON.stringify(logs, null, 2)
    } else {
      return logs
        .map(log => `[${log.timestamp}] [${log.error_level}] [${log.error_type}] ${log.message}`)
        .join('\n')
    }
  }

  function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  return {
    writeLog,
    queryLogs,
    cleanupLogs,
    exportLogs,
    pendingLogs,
    isReporting,
  }
}

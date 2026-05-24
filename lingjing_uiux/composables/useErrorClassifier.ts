import { ErrorType, ErrorLevel, type ErrorContext, type ClassifiedError } from '../types'

export function useErrorClassifier() {
  function classify(error: Error | unknown): ErrorType {
    if (!error) {
      return ErrorType.System
    }

    const err = error instanceof Error ? error : new Error(String(error))
    const message = err.message.toLowerCase()
    const name = err.name.toLowerCase()

    if (
      message.includes('fetch') ||
      message.includes('network') ||
      message.includes('timeout') ||
      message.includes('http') ||
      message.includes('api') ||
      isHttpError(error)
    ) {
      return ErrorType.Network
    }

    if (
      message.includes('validation') ||
      message.includes('format') ||
      message.includes('parse') ||
      name.includes('syntaxerror') ||
      isDataValidationError(error)
    ) {
      return ErrorType.Data
    }

    if (
      message.includes('permission') ||
      message.includes('denied') ||
      message.includes('unauthorized') ||
      message.includes('forbidden') ||
      isPermissionDenied(error)
    ) {
      return ErrorType.Permission
    }

    if (
      name.includes('typeerror') ||
      name.includes('referenceerror') ||
      name.includes('rangeerror') ||
      name.includes('syntaxerror') ||
      message.includes('out of memory') ||
      message.includes('stack overflow')
    ) {
      return ErrorType.System
    }

    if (message.includes('config') || message.includes('setting') || isConfigError(error)) {
      return ErrorType.Config
    }

    return ErrorType.Business
  }

  function determineLevel(error: Error | unknown, type: ErrorType): ErrorLevel {
    if (!error) {
      return ErrorLevel.Warning
    }

    const err = error instanceof Error ? error : new Error(String(error))
    const message = err.message.toLowerCase()

    if (
      message.includes('fatal') ||
      message.includes('crash') ||
      message.includes('critical') ||
      message.includes('app') ||
      (type === ErrorType.System && message.includes('initialization'))
    ) {
      return ErrorLevel.Fatal
    }

    if (
      message.includes('failed to load') ||
      message.includes('failed to save') ||
      message.includes('unavailable') ||
      type === ErrorType.Permission ||
      (type === ErrorType.Network && message.includes('connection'))
    ) {
      return ErrorLevel.Severe
    }

    if (
      type === ErrorType.Network ||
      type === ErrorType.Data ||
      message.includes('invalid') ||
      message.includes('timeout')
    ) {
      return ErrorLevel.Warning
    }

    return ErrorLevel.Info
  }

  function collectContext(additionalContext?: Record<string, any>): ErrorContext {
    const context: ErrorContext = {
      timestamp: new Date().toISOString(),
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      ...additionalContext,
    }

    context.deviceInfo = {
      platform: typeof navigator !== 'undefined' ? navigator.platform : undefined,
      language: typeof navigator !== 'undefined' ? navigator.language : undefined,
      screenWidth: typeof window !== 'undefined' ? window.screen.width : undefined,
      screenHeight: typeof window !== 'undefined' ? window.screen.height : undefined,
    }

    return context
  }

  function classifyError(
    error: Error | unknown,
    additionalContext?: Record<string, any>
  ): ClassifiedError {
    const type = classify(error)
    const level = determineLevel(error, type)
    const context = collectContext(additionalContext)

    const err = error instanceof Error ? error : new Error(String(error))

    return {
      errorId: generateErrorId(),
      originalError: error,
      type,
      level,
      message: err.message || '未知错误',
      stack: err.stack,
      context,
      timestamp: new Date().toISOString(),
    }
  }

  function generateErrorId(): string {
    return 'error-' + Date.now() + '-' + Math.random().toString(36).substring(2, 11)
  }

  function isHttpError(error: any): boolean {
    if (!error) return false
    if (error.status !== undefined || error.statusCode !== undefined) return true
    if (error.response && error.response.status !== undefined) return true
    return false
  }

  function isDataValidationError(error: any): boolean {
    if (!error) return false
    if (error.name === 'ValidationError') return true
    if (error.code === 'INVALID_DATA') return true
    if (error.message && error.message.includes('validation failed')) return true
    return false
  }

  function isPermissionDenied(error: any): boolean {
    if (!error) return false
    const status = error.status || error.statusCode || error.response?.status
    if (status === 401 || status === 403) return true
    if (error.code === 'PERMISSION_DENIED') return true
    return false
  }

  function isConfigError(error: any): boolean {
    if (!error) return false
    if (error.code === 'CONFIG_LOAD_FAILED') return true
    if (
      error.message &&
      (error.message.includes('config file not found') || error.message.includes('invalid config'))
    )
      return true
    return false
  }

  return {
    classify,
    determineLevel,
    collectContext,
    classifyError,
  }
}

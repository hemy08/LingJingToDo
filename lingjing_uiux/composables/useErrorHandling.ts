import { ref, type Component } from 'vue'

import ErrorToast from '../components/common/ErrorToast.vue'
import { ErrorLevel, ErrorType, type ClassifiedError } from '../types'

import { useUnifiedErrorHandler } from './useUnifiedErrorHandler'

export type ToastType = 'error' | 'warning' | 'info' | 'success'

interface ToastOptions {
  type?: ToastType
  title: string
  message?: string
  duration?: number
  error?: Error | unknown
}

interface ToastInstance {
  id: number
  component: Component
  props: ToastOptions
}

const toasts = ref<ToastInstance[]>([])
let toastId = 0

export function useErrorHandling() {
  const unifiedHandler = useUnifiedErrorHandler()

  function showError(title: string, message?: string, duration = 5000, error?: Error | unknown) {
    if (error) {
      unifiedHandler.captureError(error, {
        source: 'showError',
        userMessage: title,
      })
    }

    return showToast({
      type: 'error',
      title,
      message,
      duration,
      error,
    })
  }

  function showWarning(title: string, message?: string, duration = 5000) {
    return showToast({
      type: 'warning',
      title,
      message,
      duration,
    })
  }

  function showInfo(title: string, message?: string, duration = 3000) {
    return showToast({
      type: 'info',
      title,
      message,
      duration,
    })
  }

  function showSuccess(title: string, message?: string, duration = 3000) {
    return showToast({
      type: 'success',
      title,
      message,
      duration,
    })
  }

  function showToast(options: ToastOptions): number {
    const id = ++toastId
    toasts.value.push({
      id,
      component: ErrorToast,
      props: options,
    })
    return id
  }

  function closeToast(id: number) {
    const index = toasts.value.findIndex(t => t.id === id)
    if (index !== -1) {
      toasts.value.splice(index, 1)
    }
  }

  function handleApiError(error: any, fallbackMessage = '操作失败') {
    console.error('API Error:', error)

    unifiedHandler
      .captureError(error, {
        source: 'api',
        fallbackMessage,
      })
      .then(classified => {
        const { title, message } = parseError(error, fallbackMessage)
        showError(title, message, getDurationByLevel(classified.level), error)
      })
  }

  function parseError(error: any, fallbackMessage: string): { title: string; message: string } {
    let title = fallbackMessage
    let message = ''

    if (typeof error === 'string') {
      title = error
    } else if (error instanceof Error) {
      title = error.message
      message = error.stack || ''
    } else if (error.message) {
      title = error.message
      if (error.details) {
        message = error.details
      }
    }

    return { title, message }
  }

  function getDurationByLevel(level: string): number {
    switch (level) {
      case ErrorLevel.Fatal:
        return 0
      case ErrorLevel.Severe:
        return 10000
      case ErrorLevel.Warning:
        return 5000
      case ErrorLevel.Info:
      default:
        return 3000
    }
  }

  async function withErrorHandling<T>(
    operation: () => Promise<T>,
    errorMessage = '操作失败',
    options?: {
      showToast?: boolean
      retryCount?: number
    }
  ): Promise<T | null> {
    const showToastMessage = options?.showToast !== false
    const maxRetries = options?.retryCount || 0

    let lastError: any = null

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation()
      } catch (error) {
        lastError = error

        if (attempt < maxRetries) {
          console.log(`[withErrorHandling] Retry attempt ${attempt + 1}/${maxRetries}`)
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)))
        }
      }
    }

    if (showToastMessage && lastError) {
      handleApiError(lastError, errorMessage)
    }

    return null
  }

  function showClassifiedError(classified: ClassifiedError) {
    const userFriendlyMessage = getUserFriendlyMessage(classified)
    showError(
      userFriendlyMessage,
      classified.message,
      getDurationByLevel(classified.level),
      classified.originalError
    )
  }

  function getUserFriendlyMessage(error: ClassifiedError): string {
    const messageMap: Record<string, string> = {
      [ErrorType.Network]: '网络连接出现问题，请检查网络后重试',
      [ErrorType.Data]: '数据处理失败，请稍后重试',
      [ErrorType.Permission]: '权限不足，无法执行此操作',
      [ErrorType.System]: '系统发生错误，请刷新页面或重启应用',
      [ErrorType.Business]: '操作失败，请检查输入后重试',
      [ErrorType.Config]: '配置加载失败，已使用默认配置',
    }

    return messageMap[error.type] || error.message
  }

  function getErrorStatistics() {
    return unifiedHandler.getErrorStatistics()
  }

  function clearErrors() {
    unifiedHandler.clearErrorQueue()
  }

  return {
    toasts,
    showError,
    showWarning,
    showInfo,
    showSuccess,
    showToast,
    closeToast,
    handleApiError,
    withErrorHandling,
    showClassifiedError,
    getErrorStatistics,
    clearErrors,
  }
}

export function setupGlobalErrorHandler() {
  const { showError } = useErrorHandling()

  window.addEventListener('unhandledrejection', event => {
    console.error('Unhandled Promise Rejection:', event.reason)

    showError('异步操作失败', event.reason?.message || '未知错误', 5000, event.reason)

    event.preventDefault()
  })

  window.addEventListener('error', event => {
    console.error('Unhandled Error:', event.error)

    showError('应用错误', event.error?.message || '未知错误', 5000, event.error)
  })
}

export { useUnifiedErrorHandler } from './useUnifiedErrorHandler'
export { useGlobalErrorCapture } from './useGlobalErrorCapture'

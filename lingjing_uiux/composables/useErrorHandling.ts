import { ref, type Component } from 'vue'
import ErrorToast from '../components/common/ErrorToast.vue'

export type ToastType = 'error' | 'warning' | 'info' | 'success'

interface ToastOptions {
  type?: ToastType
  title: string
  message?: string
  duration?: number
}

interface ToastInstance {
  id: number
  component: Component
  props: ToastOptions
}

const toasts = ref<ToastInstance[]>([])
let toastId = 0

/**
 * 错误处理组合式函数
 */
export function useErrorHandling() {
  /**
   * 显示错误提示
   */
  function showError(title: string, message?: string, duration = 5000) {
    return showToast({
      type: 'error',
      title,
      message,
      duration
    })
  }

  /**
   * 显示警告提示
   */
  function showWarning(title: string, message?: string, duration = 5000) {
    return showToast({
      type: 'warning',
      title,
      message,
      duration
    })
  }

  /**
   * 显示信息提示
   */
  function showInfo(title: string, message?: string, duration = 3000) {
    return showToast({
      type: 'info',
      title,
      message,
      duration
    })
  }

  /**
   * 显示成功提示
   */
  function showSuccess(title: string, message?: string, duration = 3000) {
    return showToast({
      type: 'success',
      title,
      message,
      duration
    })
  }

  /**
   * 显示提示
   */
  function showToast(options: ToastOptions): number {
    const id = ++toastId
    toasts.value.push({
      id,
      component: ErrorToast,
      props: options
    })
    return id
  }

  /**
   * 关闭提示
   */
  function closeToast(id: number) {
    const index = toasts.value.findIndex(t => t.id === id)
    if (index !== -1) {
      toasts.value.splice(index, 1)
    }
  }

  /**
   * 处理 API 错误
   */
  function handleApiError(error: any, fallbackMessage = '操作失败') {
    console.error('API Error:', error)
    
    // 解析错误信息
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
    
    showError(title, message)
  }

  /**
   * 异步操作包装器
   */
  async function withErrorHandling<T>(
    operation: () => Promise<T>,
    errorMessage = '操作失败'
  ): Promise<T | null> {
    try {
      return await operation()
    } catch (error) {
      handleApiError(error, errorMessage)
      return null
    }
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
    withErrorHandling
  }
}

/**
 * 全局错误处理器
 */
export function setupGlobalErrorHandler() {
  // 处理未捕获的 Promise 错误
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled Promise Rejection:', event.reason)
    
    const { showError } = useErrorHandling()
    showError(
      '异步操作失败',
      event.reason?.message || '未知错误'
    )
    
    // 阻止默认行为
    event.preventDefault()
  })

  // 处理未捕获的错误
  window.addEventListener('error', (event) => {
    console.error('Unhandled Error:', event.error)
    
    const { showError } = useErrorHandling()
    showError(
      '应用错误',
      event.error?.message || '未知错误'
    )
  })
}

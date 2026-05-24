import { type App } from 'vue'

import { useUnifiedErrorHandler } from './useUnifiedErrorHandler'

export function useGlobalErrorCapture() {
  const { captureError } = useUnifiedErrorHandler()

  let errorHandlerInstalled = false

  function setup(app?: App) {
    if (typeof window === 'undefined') {
      console.warn('[GlobalErrorCapture] Window not available, skipping setup')
      return
    }

    setupWindowErrorHandler()
    setupUnhandledRejectionHandler()

    if (app) {
      setupVueErrorHandler(app)
    }

    console.log('[GlobalErrorCapture] Global error handlers installed')
  }

  function setupWindowErrorHandler() {
    const originalOnError = window.onerror

    window.onerror = function (
      message: string | Event,
      filename?: string,
      lineno?: number,
      colno?: number,
      error?: Error
    ): boolean {
      captureError(error || message, {
        source: 'window.onerror',
        filename,
        lineno,
        colno,
      })

      if (originalOnError) {
        return originalOnError(message, filename, lineno, colno, error)
      }

      return true
    }
  }

  function setupUnhandledRejectionHandler() {
    window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
      captureError(event.reason, {
        source: 'unhandledrejection',
        promise: true,
      })

      event.preventDefault()
    })
  }

  function setupVueErrorHandler(app: App) {
    if (errorHandlerInstalled) {
      return
    }

    const originalErrorHandler = app.config.errorHandler

    app.config.errorHandler = (err, instance, info) => {
      captureError(err, {
        source: 'vue.errorHandler',
        component: instance?.$options?.name || instance?.$options?.__name,
        componentFile: instance?.$options?.__file,
        info,
        props: instance?.$props ? sanitizeProps(instance.$props) : undefined,
      })

      if (originalErrorHandler) {
        return originalErrorHandler(err, instance, info)
      }

      return false
    }

    errorHandlerInstalled = true
  }

  function sanitizeProps(props: Record<string, any>): Record<string, any> {
    const sanitized: Record<string, any> = {}
    const sensitiveKeys = ['password', 'token', 'secret', 'apiKey', 'credential']

    for (const key in props) {
      if (sensitiveKeys.some(s => key.toLowerCase().includes(s))) {
        sanitized[key] = 'REDACTED'
      } else if (typeof props[key] === 'object' && props[key] !== null) {
        sanitized[key] = '[Object]'
      } else {
        sanitized[key] = props[key]
      }
    }

    return sanitized
  }

  function teardown() {
    if (typeof window !== 'undefined') {
      window.onerror = null
      window.removeEventListener('unhandledrejection', setupUnhandledRejectionHandler)
    }

    errorHandlerInstalled = false
    console.log('[GlobalErrorCapture] Global error handlers removed')
  }

  return {
    setup,
    teardown,
  }
}

let globalCaptureInstance: ReturnType<typeof useGlobalErrorCapture> | null = null

export function getGlobalErrorCapture() {
  if (!globalCaptureInstance) {
    globalCaptureInstance = useGlobalErrorCapture()
  }
  return globalCaptureInstance
}

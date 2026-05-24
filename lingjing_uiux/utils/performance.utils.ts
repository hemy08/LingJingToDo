export function throttle<T extends (...args: any[]) => any>(fn: T, interval: number): T {
  let lastTime = 0
  let timeoutId: ReturnType<typeof setTimeout> | null = null

  return ((...args: Parameters<T>) => {
    const now = Date.now()
    const remaining = interval - (now - lastTime)

    if (remaining <= 0) {
      if (timeoutId) {
        clearTimeout(timeoutId)
        timeoutId = null
      }
      lastTime = now
      return fn(...args)
    }

    if (!timeoutId) {
      timeoutId = setTimeout(() => {
        lastTime = Date.now()
        timeoutId = null
        fn(...args)
      }, remaining)
    }
  }) as T
}

export function debounce<T extends (...args: any[]) => any>(fn: T, interval: number): T {
  let timeoutId: ReturnType<typeof setTimeout> | null = null

  return ((...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    timeoutId = setTimeout(() => {
      timeoutId = null
      fn(...args)
    }, interval)
  }) as T
}

export function calculateMemoryUsage(): number {
  if ('memory' in performance && (performance as any).memory) {
    const memory = (performance as any).memory
    return memory.usedJSHeapSize
  }
  return 0
}

export function markPerformance(name: string): void {
  if ('mark' in performance) {
    performance.mark(name)
  }
}

export function measurePerformance(name: string, startMark: string, endMark: string): number {
  if ('measure' in performance) {
    try {
      performance.measure(name, startMark, endMark)
      const measures = performance.getEntriesByName(name, 'measure')
      if (measures.length > 0) {
        const lastMeasure = measures[measures.length - 1]
        return lastMeasure ? lastMeasure.duration : 0
      }
    } catch (e) {
      console.warn('Performance measure failed:', e)
    }
  }
  return 0
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms.toFixed(2)}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`
  return `${(ms / 60000).toFixed(2)}min`
}

export function calculatePercentile(sortedValues: number[], percentile: number): number {
  if (sortedValues.length === 0) return 0
  const index = Math.ceil((sortedValues.length * percentile) / 100) - 1
  const value = sortedValues[Math.max(0, Math.min(index, sortedValues.length - 1))]
  return value ?? 0
}

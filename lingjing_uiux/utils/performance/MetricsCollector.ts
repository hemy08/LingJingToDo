import { taskCacheManager } from '../cache/TaskCacheManager'

import { performanceMonitor } from './PerformanceMonitor'

export class MetricsCollector {
  private frameRateCollector: number | null = null
  private lastFrameTime: number = 0
  private frameRateEntries: number[] = []

  async collectFCP(): Promise<number> {
    return new Promise(resolve => {
      if (!('PerformanceObserver' in window)) {
        resolve(0)
        return
      }

      try {
        const observer = new PerformanceObserver(list => {
          const entries = list.getEntries()
          const fcpEntry = entries.find(e => e.name === 'first-contentful-paint')

          if (fcpEntry) {
            const fcp = fcpEntry.startTime
            performanceMonitor.recordMetric('firstContentfulPaint', fcp)
            observer.disconnect()
            resolve(fcp)
          }
        })

        observer.observe({ type: 'paint', buffered: true })

        setTimeout(() => {
          observer.disconnect()
          resolve(0)
        }, 5000)
      } catch (e) {
        console.warn('FCP采集失败:', e)
        resolve(0)
      }
    })
  }

  async measureResponseTime<T>(operationName: string, operation: () => Promise<T>): Promise<T> {
    performanceMonitor.startMeasure(operationName)

    try {
      const result = await operation()
      const duration = performanceMonitor.endMeasure(operationName)

      performanceMonitor.recordMetric('responseTime', duration)

      return result
    } catch (error) {
      performanceMonitor.endMeasure(operationName)
      throw error
    }
  }

  startFrameRateCollection(): void {
    if (this.frameRateCollector !== null) return

    this.lastFrameTime = performance.now()

    const collectFrame = () => {
      const now = performance.now()
      const delta = now - this.lastFrameTime
      this.lastFrameTime = now

      const fps = 1000 / delta
      this.frameRateEntries.push(fps)

      if (this.frameRateEntries.length >= 60) {
        const avgFps =
          this.frameRateEntries.reduce((a, b) => a + b, 0) / this.frameRateEntries.length
        performanceMonitor.recordMetric('frameRate', avgFps)
        this.frameRateEntries = []
      }

      this.frameRateCollector = requestAnimationFrame(collectFrame)
    }

    this.frameRateCollector = requestAnimationFrame(collectFrame)
  }

  stopFrameRateCollection(): void {
    if (this.frameRateCollector !== null) {
      cancelAnimationFrame(this.frameRateCollector)
      this.frameRateCollector = null
    }
    this.frameRateEntries = []
  }

  collectMemory(): { used: number; total: number; limit: number } | null {
    if ('memory' in performance && (performance as any).memory) {
      const memory = (performance as any).memory
      const usage = {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        limit: memory.jsHeapSizeLimit,
      }

      performanceMonitor.recordMetric('memoryUsage', usage.used)

      return usage
    }

    return null
  }

  collectCacheHitRate(): number {
    const hitRate = taskCacheManager.getHitRate()
    performanceMonitor.recordMetric('cacheHitRate', hitRate * 100)
    return hitRate
  }

  collectAll(): void {
    this.collectMemory()
    this.collectCacheHitRate()
  }
}

export const metricsCollector = new MetricsCollector()

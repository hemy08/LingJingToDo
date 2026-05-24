import { PERFORMANCE_CONFIG } from '../../config/performance.config'
import type {
  PerformanceMetrics,
  MetricStatistics,
  PerformanceAlert,
  AlertRule,
} from '../../types/performance.types'
import { taskCacheManager } from '../cache/TaskCacheManager'
import {
  markPerformance,
  measurePerformance,
  calculatePercentile,
  calculateMemoryUsage,
} from '../performance.utils'

export class PerformanceMonitor {
  private metrics: Map<string, number[]> = new Map()
  private alerts: PerformanceAlert[] = []
  private measureStartMarks: Map<string, number> = new Map()
  private environment: 'development' | 'production'

  private alertRules: AlertRule[] = [
    {
      metric: 'firstContentfulPaint',
      threshold: PERFORMANCE_CONFIG.monitor.alertThresholds.firstContentfulPaint,
      operator: '>',
      severity: 'warning',
    },
    {
      metric: 'responseTime',
      threshold: PERFORMANCE_CONFIG.monitor.alertThresholds.responseTime,
      operator: '>',
      severity: 'warning',
    },
    {
      metric: 'frameRate',
      threshold: PERFORMANCE_CONFIG.monitor.alertThresholds.frameRate,
      operator: '<',
      severity: 'error',
    },
    {
      metric: 'cacheHitRate',
      threshold: PERFORMANCE_CONFIG.monitor.alertThresholds.cacheHitRate * 100,
      operator: '<',
      severity: 'warning',
    },
    {
      metric: 'memoryUsage',
      threshold: PERFORMANCE_CONFIG.monitor.alertThresholds.memoryUsage,
      operator: '>',
      severity: 'critical',
    },
  ]

  constructor() {
    this.environment = import.meta.env.DEV ? 'development' : 'production'
  }

  startMeasure(name: string): void {
    const startMark = `${name}-start`
    markPerformance(startMark)
    this.measureStartMarks.set(name, Date.now())
  }

  endMeasure(name: string): number {
    const startTime = this.measureStartMarks.get(name)
    if (startTime === undefined) {
      console.warn(`未找到测量开始标记: ${name}`)
      return 0
    }

    const duration = Date.now() - startTime
    this.measureStartMarks.delete(name)

    const endMark = `${name}-end`
    markPerformance(endMark)

    const measureResult = measurePerformance(name, `${name}-start`, endMark)

    this.recordMetric(name, measureResult > 0 ? measureResult : duration)

    return measureResult > 0 ? measureResult : duration
  }

  recordMetric(metric: string, value: number): void {
    if (!this.metrics.has(metric)) {
      this.metrics.set(metric, [])
    }
    this.metrics.get(metric)!.push(value)

    this.checkAlerts(metric, value)
  }

  private checkAlerts(metric: string, value: number): void {
    const rule = this.alertRules.find(r => r.metric === metric)
    if (!rule) return

    let shouldAlert = false
    switch (rule.operator) {
      case '>':
        shouldAlert = value > rule.threshold
        break
      case '<':
        shouldAlert = value < rule.threshold
        break
      case '=':
        shouldAlert = value === rule.threshold
        break
    }

    if (shouldAlert) {
      const alert: PerformanceAlert = {
        metric,
        actualValue: value,
        threshold: rule.threshold,
        severity: rule.severity,
        timestamp: new Date().toISOString(),
        message: `性能告警: ${metric} 实际值 ${value} ${rule.operator} 阈值 ${rule.threshold}`,
      }
      this.alerts.push(alert)

      console.warn(alert.message)
    }
  }

  getStatistics(metric: string): MetricStatistics {
    const values = this.metrics.get(metric) || []
    if (values.length === 0) {
      return {
        count: 0,
        sum: 0,
        average: 0,
        min: 0,
        max: 0,
        p50: 0,
        p95: 0,
        values: [],
      }
    }

    const sorted = [...values].sort((a, b) => a - b)
    const sum = values.reduce((s, v) => s + v, 0)

    return {
      count: values.length,
      sum,
      average: sum / values.length,
      min: sorted[0] ?? 0,
      max: sorted[sorted.length - 1] ?? 0,
      p50: calculatePercentile(sorted, 50),
      p95: calculatePercentile(sorted, 95),
      values,
    }
  }

  getCurrentMetrics(): Partial<PerformanceMetrics> {
    const responseTimeStats = this.getStatistics('responseTime')
    const frameRateStats = this.getStatistics('frameRate')

    return {
      firstContentfulPaint: (this.metrics.get('firstContentfulPaint') || [])[0] || 0,
      responseTime: {
        average: responseTimeStats.average,
        p50: responseTimeStats.p50,
        p95: responseTimeStats.p95,
        max: responseTimeStats.max,
      },
      frameRate: {
        average: frameRateStats.average,
        drops: this.countFrameDrops(),
        minFPS: frameRateStats.min,
      },
      cacheHitRate: taskCacheManager.getHitRate(),
      memoryUsage: this.getMemoryUsage(),
      timestamp: new Date().toISOString(),
      environment: this.environment,
    }
  }

  private getMemoryUsage(): { used: number; total: number; limit: number } {
    const used = calculateMemoryUsage()
    return {
      used,
      total: used,
      limit: PERFORMANCE_CONFIG.monitor.alertThresholds.memoryUsage,
    }
  }

  private countFrameDrops(): number {
    const frameRates = this.metrics.get('frameRate') || []
    return frameRates.filter(fps => fps < 60).length
  }

  getAlerts(): PerformanceAlert[] {
    return [...this.alerts]
  }

  clearAlerts(): void {
    this.alerts = []
  }

  clearMetrics(metric?: string): void {
    if (metric) {
      this.metrics.delete(metric)
    } else {
      this.metrics.clear()
    }
  }

  isEnabled(): boolean {
    return PERFORMANCE_CONFIG.monitor.enabled
  }
}

export const performanceMonitor = new PerformanceMonitor()

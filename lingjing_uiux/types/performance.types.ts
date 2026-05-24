import type { Task } from '../types'

export interface VirtualScrollConfig {
  containerHeight: number
  itemHeightEstimate: number
  bufferSize: number
  threshold: number
  throttleInterval: number
}

export interface VirtualScrollState {
  startIndex: number
  endIndex: number
  heightCache: Map<string, number>
  totalHeight: number
  paddingTop: number
  paddingBottom: number
  scrollTop: number
}

export interface ViewportRange {
  startIndex: number
  endIndex: number
  paddingTop: number
  paddingBottom: number
  visibleItems: Task[]
}

export interface TaskCacheItem {
  tasks: Task[]
  timestamp: number
  expires: number
  size: number
}

export interface CacheConfig {
  maxCapacity: number
  ttl: number
  maxItems: number
}

export interface CacheManager {
  cache: Map<string, TaskCacheItem>
  maxCapacity: number
  currentSize: number
  hitCount: number
  missCount: number
  get(date: string): Task[] | null
  set(date: string, tasks: Task[]): void
  clear(date?: string): void
  getHitRate(): number
}

export interface LoadOptions {
  forceRefresh?: boolean
  silent?: boolean
  priority?: 'high' | 'low' | 'idle'
}

export interface TaskUpdate {
  taskId: string
  changes: Partial<Task>
  timestamp: number
}

export interface PerformanceMetrics {
  firstContentfulPaint: number
  responseTime: {
    average: number
    p50: number
    p95: number
    max: number
  }
  frameRate: {
    average: number
    drops: number
    minFPS: number
  }
  cacheHitRate: number
  memoryUsage: {
    used: number
    total: number
    limit: number
  }
  timestamp: string
  environment: 'development' | 'production'
}

export interface PerformanceAlert {
  metric: string
  actualValue: number
  threshold: number
  severity: 'warning' | 'error' | 'critical'
  timestamp: string
  message: string
}

export interface AlertRule {
  metric: string
  threshold: number
  operator: '>' | '<' | '='
  severity: 'warning' | 'error' | 'critical'
}

export interface MetricStatistics {
  count: number
  sum: number
  average: number
  min: number
  max: number
  p50: number
  p95: number
  values: number[]
}

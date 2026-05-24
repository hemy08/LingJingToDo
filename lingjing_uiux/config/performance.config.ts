export const PERFORMANCE_CONFIG = {
  virtualScroll: {
    containerHeight: 800,
    itemHeightEstimate: 120,
    bufferSize: 5,
    threshold: 100,
    throttleInterval: 16,
  },
  cache: {
    maxCapacity: 50 * 1024 * 1024,
    ttl: 5 * 60 * 1000,
    maxItems: 100,
  },
  loader: {
    timeout: 10 * 1000,
    maxRetries: 3,
    prefetchMaxConcurrent: 2,
  },
  batchUpdate: {
    debounceInterval: 100,
  },
  monitor: {
    enabled: import.meta.env.DEV,
    sampleRate: 1,
    alertThresholds: {
      firstContentfulPaint: 2000,
      responseTime: 500,
      frameRate: 60,
      cacheHitRate: 0.8,
      memoryUsage: 500 * 1024 * 1024,
    },
  },
}

export type PerformanceConfig = typeof PERFORMANCE_CONFIG

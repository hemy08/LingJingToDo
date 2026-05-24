<template>
  <div v-if="showPanel" class="performance-panel">
    <div class="panel-header">
      <h3>性能监控面板</h3>
      <button class="close-btn" @click="showPanel = false">×</button>
    </div>

    <div class="panel-body">
      <div class="metrics-section">
        <h4>性能指标</h4>
        <div class="metric-item">
          <span class="metric-label">首屏加载时间:</span>
          <span class="metric-value">{{ formatDuration(metrics.firstContentfulPaint || 0) }}</span>
        </div>
        <div class="metric-item">
          <span class="metric-label">响应时间 (P95):</span>
          <span class="metric-value">{{ formatDuration(metrics.responseTime?.p95 || 0) }}</span>
        </div>
        <div class="metric-item">
          <span class="metric-label">帧率:</span>
          <span class="metric-value">{{ (metrics.frameRate?.average || 0).toFixed(1) }} FPS</span>
        </div>
        <div class="metric-item">
          <span class="metric-label">缓存命中率:</span>
          <span class="metric-value">{{ ((metrics.cacheHitRate || 0) * 100).toFixed(1) }}%</span>
        </div>
        <div class="metric-item">
          <span class="metric-label">内存占用:</span>
          <span class="metric-value">{{ formatBytes(metrics.memoryUsage?.used || 0) }}</span>
        </div>
      </div>

      <div v-if="alerts.length > 0" class="alerts-section">
        <h4>性能告警</h4>
        <div
          v-for="(alert, index) in alerts"
          :key="index"
          class="alert-item"
          :class="`alert-${alert.severity}`"
        >
          <span class="alert-message">{{ alert.message }}</span>
          <span class="alert-time">{{ formatTime(alert.timestamp) }}</span>
        </div>
      </div>

      <div class="cache-stats-section">
        <h4>缓存统计</h4>
        <div class="stat-item">
          <span class="stat-label">缓存项数量:</span>
          <span class="stat-value">{{ cacheStats.itemCount }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">缓存大小:</span>
          <span class="stat-value">{{ formatBytes(cacheStats.size) }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">命中次数:</span>
          <span class="stat-value">{{ cacheStats.hitCount }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">未命中次数:</span>
          <span class="stat-value">{{ cacheStats.missCount }}</span>
        </div>
      </div>
    </div>
  </div>
  <button v-else class="show-panel-btn" @click="showPanel = true">性能监控</button>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

import { taskCacheManager } from '../../utils/cache/TaskCacheManager'
import { performanceMonitor } from '../../utils/performance/PerformanceMonitor'
import { formatBytes, formatDuration } from '../../utils/performance.utils'

const showPanel = ref(false)
const metrics = ref<any>({})
const alerts = ref<any[]>([])
const cacheStats = ref<any>({
  itemCount: 0,
  size: 0,
  hitCount: 0,
  missCount: 0,
  hitRate: 0,
})

let updateInterval: ReturnType<typeof setInterval> | null = null

function updateMetrics() {
  metrics.value = performanceMonitor.getCurrentMetrics()
  alerts.value = performanceMonitor.getAlerts().slice(-10)
  cacheStats.value = taskCacheManager.getStats()
}

function formatTime(timestamp: string): string {
  const date = new Date(timestamp)
  return date.toLocaleTimeString()
}

onMounted(() => {
  updateMetrics()
  updateInterval = setInterval(updateMetrics, 2000)
})

onUnmounted(() => {
  if (updateInterval) {
    clearInterval(updateInterval)
  }
})
</script>

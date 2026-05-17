<template>
  <div v-if="hasError" class="error-boundary">
    <div class="error-content">
      <div class="error-icon">⚠️</div>
      <h2 class="error-title">出错了</h2>
      <p class="error-message">{{ errorMessage }}</p>
      
      <div v-if="errorDetails" class="error-details">
        <details>
          <summary>详细信息</summary>
          <pre>{{ errorDetails }}</pre>
        </details>
      </div>
      
      <div class="error-actions">
        <button class="retry-btn" @click="handleRetry">
          重试
        </button>
        <button class="reset-btn" @click="handleReset">
          重置应用
        </button>
      </div>
    </div>
  </div>
  <slot v-else></slot>
</template>

<script setup lang="ts">
import { ref, onErrorCaptured, type ComponentPublicInstance } from 'vue'

const hasError = ref(false)
const errorMessage = ref('')
const errorDetails = ref<string | null>(null)

// 捕获子组件错误
onErrorCaptured((error: Error, instance: ComponentPublicInstance | null, info: string) => {
  hasError.value = true
  errorMessage.value = error.message || '未知错误'
  errorDetails.value = `${error.stack}\n\n组件: ${instance?.$options?.name || '未知'}\n信息: ${info}`
  
  // 记录错误日志
  console.error('ErrorBoundary 捕获错误:', {
    error,
    component: instance?.$options?.name,
    info
  })
  
  // 阻止错误继续传播
  return false
})

// 重试
function handleRetry() {
  hasError.value = false
  errorMessage.value = ''
  errorDetails.value = null
  
  // 触发重试事件
  emit('retry')
}

// 重置应用
function handleReset() {
  // 清除所有状态
  hasError.value = false
  errorMessage.value = ''
  errorDetails.value = null
  
  // 触发重置事件
  emit('reset')
  
  // 可选：刷新页面
  if (confirm('是否刷新页面？')) {
    window.location.reload()
  }
}

const emit = defineEmits<{
  retry: []
  reset: []
}>()
</script>

<style scoped>
.error-boundary {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  padding: 40px;
}

.error-content {
  max-width: 600px;
  text-align: center;
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  padding: 40px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.error-icon {
  font-size: 64px;
  margin-bottom: 20px;
}

.error-title {
  font-size: 24px;
  color: #f44336;
  margin: 0 0 16px 0;
}

.error-message {
  font-size: 16px;
  color: #666;
  margin: 0 0 24px 0;
  line-height: 1.6;
}

.error-details {
  margin-bottom: 24px;
  text-align: left;
}

.error-details details {
  background: #f5f5f5;
  border-radius: 8px;
  padding: 12px;
}

.error-details summary {
  cursor: pointer;
  font-weight: 500;
  margin-bottom: 8px;
}

.error-details pre {
  margin: 0;
  padding: 12px;
  background: #fff;
  border-radius: 4px;
  overflow-x: auto;
  font-size: 12px;
  line-height: 1.4;
}

.error-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.retry-btn,
.reset-btn {
  padding: 12px 24px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.retry-btn {
  background: #4CAF50;
  color: white;
}

.retry-btn:hover {
  background: #45a049;
}

.reset-btn {
  background: #f44336;
  color: white;
}

.reset-btn:hover {
  background: #da190b;
}

/* 暗色主题 */
@media (prefers-color-scheme: dark) {
  .error-content {
    background: #1a1a1a;
    border-color: #333;
  }

  .error-message {
    color: #aaa;
  }

  .error-details details {
    background: #252525;
  }

  .error-details pre {
    background: #1a1a1a;
    color: #fff;
  }
}
</style>

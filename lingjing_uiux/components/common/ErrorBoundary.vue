<template>
  <div v-if="hasError" class="error-boundary">
    <div class="error-content">
      <div class="error-icon">{{ errorIcon }}</div>
      <h2 class="error-title">出错了</h2>

      <div v-if="errorType || errorLevel" class="error-meta">
        <span v-if="errorType" class="error-type">类型: {{ errorType }}</span>
        <span v-if="errorLevel" class="error-level" :style="{ color: errorColor }">
          等级: {{ errorLevel }}
        </span>
      </div>

      <p class="error-message">{{ errorMessage }}</p>

      <div v-if="errorDetails && showDetails !== false" class="error-details">
        <details>
          <summary>详细信息</summary>
          <pre>{{ errorDetails }}</pre>
        </details>
      </div>

      <div class="error-actions">
        <button class="retry-btn" :disabled="isRecovering" @click="handleRetry">
          {{ isRecovering ? '恢复中...' : '重试' }}
        </button>

        <button
          v-if="errorLevel === 'Critical' || errorLevel === 'Fatal'"
          class="rollback-btn"
          :disabled="isRecovering"
          @click="handleRollback"
        >
          回滚数据
        </button>

        <button class="reset-btn" @click="handleReset">重置应用</button>
      </div>
    </div>
  </div>
  <slot v-else></slot>
</template>

<script setup lang="ts">
import { ref, onErrorCaptured, computed, type ComponentPublicInstance } from 'vue'

import { useUnifiedErrorHandler } from '../../composables/useUnifiedErrorHandler'
import { ErrorLevel, type ClassifiedError } from '../../types'

const props = defineProps<{
  componentName?: string
  showDetails?: boolean
  enableRecovery?: boolean
}>()

const hasError = ref(false)
const errorMessage = ref('')
const errorDetails = ref<string | null>(null)
const errorType = ref<string>('')
const errorLevel = ref<string>('')
const isRecovering = ref(false)
const classifiedError = ref<ClassifiedError | null>(null)

const { captureError, manualRecover } = useUnifiedErrorHandler()

const errorIcon = computed(() => {
  switch (errorLevel.value) {
    case ErrorLevel.Fatal:
      return '💀'
    case ErrorLevel.Severe:
      return '⚠️'
    case ErrorLevel.Warning:
      return '⚡'
    default:
      return '❌'
  }
})

const errorColor = computed(() => {
  switch (errorLevel.value) {
    case ErrorLevel.Fatal:
      return '#d32f2f'
    case ErrorLevel.Severe:
      return '#f44336'
    case ErrorLevel.Warning:
      return '#ff9800'
    default:
      return '#9e9e9e'
  }
})

onErrorCaptured((error: Error, instance: ComponentPublicInstance | null, info: string) => {
  hasError.value = true
  errorMessage.value = error.message || '未知错误'
  errorDetails.value = `${error.stack}\n\n组件: ${instance?.$options?.name || props.componentName || '未知'}\n信息: ${info}`

  captureError(error, {
    source: 'ErrorBoundary',
    component: instance?.$options?.name || props.componentName,
    info,
    boundaryCaptured: true,
  }).then(classified => {
    classifiedError.value = classified
    errorType.value = classified.type
    errorLevel.value = classified.level
  })

  console.error('ErrorBoundary 捕获错误:', {
    error,
    component: instance?.$options?.name || props.componentName,
    info,
  })

  return false
})

async function handleRetry() {
  if (props.enableRecovery !== false && classifiedError.value) {
    isRecovering.value = true
    try {
      const success = await manualRecover(classifiedError.value.errorId, 'StateReset' as any)
      if (success) {
        resetErrorState()
      }
    } catch (error) {
      console.error('重试失败:', error)
    } finally {
      isRecovering.value = false
    }
  } else {
    resetErrorState()
  }

  emit('retry')
}

function handleReset() {
  resetErrorState()
  emit('reset')

  if (confirm('是否刷新页面？')) {
    window.location.reload()
  }
}

async function handleRollback() {
  if (!classifiedError.value) return

  isRecovering.value = true
  try {
    const success = await manualRecover(classifiedError.value.errorId, 'DataRollback' as any)
    if (success) {
      alert('数据回滚成功')
      resetErrorState()
    } else {
      alert('数据回滚失败，请查看控制台了解详情')
    }
  } catch (error) {
    console.error('数据回滚失败:', error)
    alert('数据回滚失败')
  } finally {
    isRecovering.value = false
  }

  emit('rollback')
}

function resetErrorState() {
  hasError.value = false
  errorMessage.value = ''
  errorDetails.value = null
  errorType.value = ''
  errorLevel.value = ''
  classifiedError.value = null
}

const emit = defineEmits<{
  retry: []
  reset: []
  rollback: []
}>()
</script>

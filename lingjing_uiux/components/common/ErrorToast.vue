<template>
  <Teleport to="body">
    <Transition name="toast">
      <div v-if="visible" class="error-toast" :class="`error-toast--${type}`">
        <div class="toast-icon">{{ getIcon() }}</div>
        <div class="toast-content">
          <div class="toast-title">{{ title }}</div>
          <div v-if="message" class="toast-message">{{ message }}</div>
        </div>
        <button class="toast-close" @click="handleClose">✕</button>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

export type ToastType = 'error' | 'warning' | 'info' | 'success'

interface Props {
  type?: ToastType
  title: string
  message?: string
  duration?: number
}

const props = withDefaults(defineProps<Props>(), {
  type: 'error',
  duration: 5000
})

const emit = defineEmits<{
  close: []
}>()

const visible = ref(true)
let timer: number | null = null

function getIcon(): string {
  switch (props.type) {
    case 'error':
      return '❌'
    case 'warning':
      return '⚠️'
    case 'info':
      return 'ℹ️'
    case 'success':
      return '✅'
    default:
      return '❌'
  }
}

function handleClose() {
  visible.value = false
  clearTimer()
  emit('close')
}

function startTimer() {
  if (props.duration > 0) {
    timer = window.setTimeout(() => {
      handleClose()
    }, props.duration)
  }
}

function clearTimer() {
  if (timer) {
    clearTimeout(timer)
    timer = null
  }
}

onMounted(() => {
  startTimer()
})

onUnmounted(() => {
  clearTimer()
})
</script>

<style scoped>
.error-toast {
  position: fixed;
  top: 20px;
  right: 20px;
  min-width: 300px;
  max-width: 500px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  padding: 16px;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  z-index: 9999;
}

.error-toast--error {
  border-left: 4px solid #f44336;
}

.error-toast--warning {
  border-left: 4px solid #ff9800;
}

.error-toast--info {
  border-left: 4px solid #2196f3;
}

.error-toast--success {
  border-left: 4px solid #4caf50;
}

.toast-icon {
  font-size: 24px;
  flex-shrink: 0;
}

.toast-content {
  flex: 1;
  min-width: 0;
}

.toast-title {
  font-size: 16px;
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
}

.toast-message {
  font-size: 14px;
  color: #666;
  line-height: 1.4;
}

.toast-close {
  background: transparent;
  border: none;
  font-size: 20px;
  color: #999;
  cursor: pointer;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.toast-close:hover {
  color: #333;
}

/* 动画 */
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

/* 暗色主题 */
@media (prefers-color-scheme: dark) {
  .error-toast {
    background: #1a1a1a;
  }

  .toast-title {
    color: #fff;
  }

  .toast-message {
    color: #aaa;
  }

  .toast-close:hover {
    color: #fff;
  }
}
</style>

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
  duration: 5000,
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

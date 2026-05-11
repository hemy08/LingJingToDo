<template>
  <transition name="slide-up">
    <div v-if="visible" class="status-bar" :class="type">
      <div class="status-content">
        <i :class="iconClass"></i>
        <span class="status-message">{{ message }}</span>
        <span v-if="detail" class="status-detail">{{ detail }}</span>
      </div>
      <button class="status-close" @click="handleClose">
        <i class="fas fa-times"></i>
      </button>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  visible: boolean
  message: string
  detail?: string
  type?: 'success' | 'error' | 'warning' | 'info'
}

const props = withDefaults(defineProps<Props>(), {
  type: 'success',
  detail: undefined
})

const emit = defineEmits<{
  'update:visible': [value: boolean]
}>()

const iconClass = computed(() => {
  switch (props.type) {
    case 'success':
      return 'fas fa-check-circle'
    case 'error':
      return 'fas fa-times-circle'
    case 'warning':
      return 'fas fa-exclamation-triangle'
    case 'info':
      return 'fas fa-info-circle'
    default:
      return 'fas fa-info-circle'
  }
})

const handleClose = () => {
  emit('update:visible', false)
}
</script>

<style scoped>
.status-bar {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  min-width: 300px;
  max-width: 600px;
  padding: 12px 20px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  z-index: 9999;
}

.status-bar.success {
  background: #10b981;
  color: white;
}

.status-bar.error {
  background: #ef4444;
  color: white;
}

.status-bar.warning {
  background: #f59e0b;
  color: white;
}

.status-bar.info {
  background: #3b82f6;
  color: white;
}

.status-content {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
}

.status-content i {
  font-size: 18px;
}

.status-message {
  font-weight: 500;
  font-size: 14px;
}

.status-detail {
  font-size: 12px;
  opacity: 0.9;
  margin-left: 8px;
}

.status-close {
  background: transparent;
  border: none;
  color: white;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: background 0.2s;
}

.status-close:hover {
  background: rgba(255, 255, 255, 0.2);
}

/* 动画 */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateX(-50%) translateY(100%);
  opacity: 0;
}
</style>

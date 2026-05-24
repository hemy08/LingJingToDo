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
  detail: undefined,
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

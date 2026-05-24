<template>
  <div v-if="visible" class="dialog-overlay" @click.self="handleOverlayClick">
    <div class="dialog-box">
      <div class="dialog-header">
        <i :class="icon"></i>
        <span>{{ title }}</span>
      </div>
      <div class="dialog-content">{{ message }}</div>
      <div class="dialog-buttons">
        <button
          v-for="button in buttons"
          :key="button.text"
          :class="['btn-sm', button.type || '']"
          @click="handleButtonClick(button)"
        >
          {{ button.text }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface DialogButton {
  text: string
  type?: 'btn-primary' | 'btn-danger' | ''
  action: string
}

interface Props {
  visible: boolean
  title: string
  message: string
  icon?: string
  buttons?: DialogButton[]
  closeOnOverlay?: boolean
}

interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'action', action: string): void
}

const props = withDefaults(defineProps<Props>(), {
  icon: 'fas fa-info-circle',
  buttons: () => [{ text: '确定', type: 'btn-primary', action: 'confirm' }],
  closeOnOverlay: true,
})

const emit = defineEmits<Emits>()

const handleOverlayClick = () => {
  if (props.closeOnOverlay) {
    emit('update:visible', false)
  }
}

const handleButtonClick = (button: DialogButton) => {
  emit('action', button.action)
  emit('update:visible', false)
}
</script>

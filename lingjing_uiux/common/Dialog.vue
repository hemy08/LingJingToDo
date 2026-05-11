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
import { computed } from 'vue'

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
  closeOnOverlay: true
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

<style scoped>
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
}

.dialog-box {
  background: var(--card-bg, #fff);
  border-radius: 8px;
  padding: 20px;
  min-width: 300px;
  max-width: 500px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.dialog-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 15px;
  font-size: 16px;
  font-weight: bold;
}

.dialog-header i {
  color: var(--primary-color, #3b82f6);
}

.dialog-content {
  margin-bottom: 20px;
  line-height: 1.5;
  color: var(--text-color, #333);
}

.dialog-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.btn-sm {
  padding: 6px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: #fff;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.btn-sm:hover {
  background: #f5f5f5;
}

.btn-sm.btn-primary {
  background: var(--primary-color, #3b82f6);
  color: #fff;
  border-color: var(--primary-color, #3b82f6);
}

.btn-sm.btn-primary:hover {
  background: var(--primary-hover, #2563eb);
}

.btn-sm.btn-danger {
  background: #dc2626;
  color: #fff;
  border-color: #dc2626;
}

.btn-sm.btn-danger:hover {
  background: #b91c1c;
}
</style>

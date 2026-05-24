<script setup lang="ts">
export interface ConfigManagerEmits {
  (e: 'open-status'): void
  (e: 'open-type'): void
  (e: 'open-priority'): void
}

const emit = defineEmits<ConfigManagerEmits>()

const handleOpenStatusModal = () => {
  emit('open-status')
}

const handleOpenTypeModal = () => {
  emit('open-type')
}

const handleOpenPriorityModal = () => {
  emit('open-priority')
}
</script>

<template>
  <div class="config-manager">
    <button class="btn-sm" title="状态配置" @click="handleOpenStatusModal">
      <i class="fas fa-tags"></i> 状态
    </button>
    <button class="btn-sm" title="类型配置" @click="handleOpenTypeModal">
      <i class="fas fa-layer-group"></i> 类型
    </button>
    <button class="btn-sm" title="优先级配置" @click="handleOpenPriorityModal">
      <i class="fas fa-flag"></i> 优先级
    </button>
  </div>
</template>

<template>
  <div class="bottom-status-bar">
    <div class="status-item">
      <i class="fas fa-calendar-alt"></i>
      <span>当前日期: {{ currentDate }}</span>
    </div>
    <div class="status-item" v-if="filePath">
      <i class="fas fa-file-alt"></i>
      <span class="file-path" :title="filePath">{{ filePath }}</span>
    </div>
    <div class="status-item" v-else>
      <i class="fas fa-file"></i>
      <span>未保存文件</span>
    </div>
    <div class="status-item" v-if="isDirty">
      <i class="fas fa-exclamation-circle"></i>
      <span>未保存</span>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  currentDate: string
  filePath: string | null
  isDirty: boolean
}>()

</script>

<style scoped>
.bottom-status-bar {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 6px 16px;
  background: var(--statusbar-bg);
  border-top: 1px solid var(--border-color);
  font-size: 12px;
  color: var(--text-secondary);
}

.status-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.status-item i {
  color: var(--primary-color);
}

.file-path {
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>

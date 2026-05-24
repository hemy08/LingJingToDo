<template>
  <div class="bottom-status-bar">
    <div class="status-item">
      <i class="fas fa-calendar-alt"></i>
      <span>当前日期: {{ currentDate }}</span>
    </div>
    <div v-if="filePath" class="status-item">
      <i class="fas fa-file-alt"></i>
      <span class="file-path" :title="filePath">{{ filePath }}</span>
    </div>
    <div v-else class="status-item">
      <i class="fas fa-file"></i>
      <span>未保存文件</span>
    </div>
    <div v-if="isDirty" class="status-item">
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

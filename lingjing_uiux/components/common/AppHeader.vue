<script setup lang="ts">
import FileManager from '../file/FileManager.vue'
import ConfigManager from '../config/ConfigManager.vue'
import UndoRedoButtons from './UndoRedoButtons.vue'

defineProps<{
  isDirty: boolean
  currentFilePath: string | null
  currentFileType: string
  showFilter?: boolean
}>()

const emit = defineEmits<{
  'open-theme': []
  'open-status': []
  'open-type': []
  'open-priority': []
  'file-opened': []
  'file-saved': []
  'file-save-as': []
  'toggle-filter': []
}>()
</script>

<template>
  <div class="toolbar">
    <div class="toolbar-left">
      <h2>灵境待办 v1.0.0</h2>
      <span v-if="isDirty" class="unsaved-indicator">● 未保存</span>
    </div>
    <div class="toolbar-right">
      <UndoRedoButtons />
      <button class="btn-sm" :class="{ active: showFilter }" @click="emit('toggle-filter')">
        <i class="fas fa-filter"></i> 筛选
      </button>
      <button class="btn-sm" @click="emit('open-theme')">
        <i class="fas fa-palette"></i> 主题
      </button>
      <ConfigManager
        @open-status="emit('open-status')"
        @open-type="emit('open-type')"
        @open-priority="emit('open-priority')"
      />
      <FileManager
        :current-file-path="currentFilePath"
        :current-file-type="currentFileType"
        :is-dirty="isDirty"
        @file-opened="emit('file-opened')"
        @file-saved="emit('file-saved')"
        @file-save-as="emit('file-save-as')"
      />
    </div>
  </div>
</template>

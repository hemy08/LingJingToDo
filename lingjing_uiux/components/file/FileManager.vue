<script setup lang="ts">
import { computed } from 'vue'

export interface FileManagerProps {
  currentFilePath: string | null
  currentFileType: string
  isDirty: boolean
}

export interface FileManagerEmits {
  (e: 'update:isDirty', value: boolean): void
  (e: 'file-opened'): void
  (e: 'file-saved'): void
  (e: 'file-save-as'): void
}

const props = defineProps<FileManagerProps>()
const emit = defineEmits<FileManagerEmits>()

const isSaveDisabled = computed(() => !props.isDirty)

const handleOpenFile = () => {
  emit('file-opened')
}

const handleSaveFile = () => {
  emit('file-saved')
}

const handleSaveAs = () => {
  emit('file-save-as')
}
</script>

<template>
  <div class="file-manager">
    <button class="btn-sm" title="打开文件" @click="handleOpenFile">
      <i class="fas fa-folder-open"></i> 打开
    </button>
    <button
      class="btn-sm"
      :disabled="isSaveDisabled"
      title="保存 (Ctrl+S)"
      @click="handleSaveFile"
    >
      <i class="fas fa-save"></i> 保存
    </button>
    <button class="btn-sm" title="另存为" @click="handleSaveAs">
      <i class="fas fa-file-export"></i> 另存为
    </button>
  </div>
</template>

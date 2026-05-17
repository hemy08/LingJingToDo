<template>
  <div class="history-files">
    <div class="history-header">
      <h2>最近文件</h2>
      <button 
        v-if="recentFiles.length > 0" 
        class="clear-btn"
        @click="handleClearAll"
      >
        清空列表
      </button>
    </div>

    <div v-if="loading" class="loading">
      加载中...
    </div>

    <div v-else-if="recentFiles.length === 0" class="empty">
      <p>暂无历史文件</p>
      <p class="hint">打开或导入文件后将显示在这里</p>
    </div>

    <div v-else class="file-list">
      <div 
        v-for="file in recentFiles" 
        :key="file.path"
        class="file-item"
        @click="handleOpenFile(file)"
      >
        <div class="file-icon" :style="{ color: getFileColor(file.type) }">
          {{ getFileIcon(file.type) }}
        </div>
        
        <div class="file-info">
          <div class="file-name">{{ file.name }}</div>
          <div class="file-meta">
            <span class="file-type">{{ getFileTypeName(file.type) }}</span>
            <span class="file-time">{{ formatTime(file.last_accessed) }}</span>
            <span v-if="file.size" class="file-size">{{ formatSize(file.size) }}</span>
          </div>
        </div>

        <button 
          class="remove-btn"
          @click.stop="handleRemove(file)"
          title="从列表中移除"
        >
          ✕
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { fileApi } from '../connections/file_apis'
import { FileType, FileTypeUtils, type RecentFile } from '../types'

const recentFiles = ref<RecentFile[]>([])
const loading = ref(false)

// 加载最近文件列表
async function loadRecentFiles() {
  loading.value = true
  try {
    recentFiles.value = await fileApi.getRecentFiles()
  } catch (error) {
    console.error('加载最近文件失败:', error)
  } finally {
    loading.value = false
  }
}

// 打开文件
async function handleOpenFile(file: RecentFile) {
  try {
    const data = await fileApi.openFile(file.path, file.type)
    // 触发文件打开事件
    emit('file-opened', { path: file.path, type: file.type, data })
  } catch (error) {
    console.error('打开文件失败:', error)
    alert(`打开文件失败: ${error}`)
  }
}

// 移除文件
async function handleRemove(file: RecentFile) {
  try {
    recentFiles.value = await fileApi.removeRecentFile(file.path)
  } catch (error) {
    console.error('移除文件失败:', error)
  }
}

// 清空列表
async function handleClearAll() {
  if (!confirm('确定要清空最近文件列表吗？')) {
    return
  }
  
  try {
    await fileApi.clearRecentFiles()
    recentFiles.value = []
  } catch (error) {
    console.error('清空列表失败:', error)
  }
}

// 获取文件类型图标
function getFileIcon(type: FileType): string {
  return FileTypeUtils.getIcon(type)
}

// 获取文件类型名称
function getFileTypeName(type: FileType): string {
  return FileTypeUtils.getDisplayName(type)
}

// 获取文件类型颜色
function getFileColor(type: FileType): string {
  return FileTypeUtils.getColor(type)
}

// 格式化时间
function formatTime(time: string): string {
  const date = new Date(time)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  
  // 小于1分钟
  if (diff < 60 * 1000) {
    return '刚刚'
  }
  
  // 小于1小时
  if (diff < 60 * 60 * 1000) {
    return `${Math.floor(diff / (60 * 1000))}分钟前`
  }
  
  // 小于1天
  if (diff < 24 * 60 * 60 * 1000) {
    return `${Math.floor(diff / (60 * 60 * 1000))}小时前`
  }
  
  // 小于7天
  if (diff < 7 * 24 * 60 * 60 * 1000) {
    return `${Math.floor(diff / (24 * 60 * 60 * 1000))}天前`
  }
  
  // 其他
  return date.toLocaleDateString()
}

// 格式化文件大小
function formatSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`
  }
  if (bytes < 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
}

const emit = defineEmits<{
  'file-opened': [{ path: string; type: FileType; data: any }]
}>()

onMounted(() => {
  loadRecentFiles()
})
</script>

<style scoped>
.history-files {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.history-header h2 {
  margin: 0;
  font-size: 24px;
  color: #333;
}

.clear-btn {
  padding: 8px 16px;
  background: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.clear-btn:hover {
  background: #e0e0e0;
}

.loading,
.empty {
  text-align: center;
  padding: 40px;
  color: #999;
}

.empty .hint {
  font-size: 14px;
  margin-top: 8px;
}

.file-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.file-item {
  display: flex;
  align-items: center;
  padding: 16px;
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.file-item:hover {
  background: #f9f9f9;
  border-color: #bdbdbd;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.file-icon {
  font-size: 32px;
  margin-right: 16px;
  flex-shrink: 0;
}

.file-info {
  flex: 1;
  min-width: 0;
}

.file-name {
  font-size: 16px;
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-meta {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #999;
}

.file-type {
  padding: 2px 8px;
  background: #f0f0f0;
  border-radius: 4px;
}

.remove-btn {
  padding: 8px;
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 16px;
  color: #999;
  opacity: 0;
  transition: opacity 0.2s;
}

.file-item:hover .remove-btn {
  opacity: 1;
}

.remove-btn:hover {
  color: #f44336;
}

/* 暗色主题 */
@media (prefers-color-scheme: dark) {
  .history-header h2 {
    color: #fff;
  }

  .clear-btn {
    background: #333;
    border-color: #555;
    color: #fff;
  }

  .clear-btn:hover {
    background: #444;
  }

  .file-item {
    background: #1a1a1a;
    border-color: #333;
  }

  .file-item:hover {
    background: #252525;
    border-color: #444;
  }

  .file-name {
    color: #fff;
  }

  .file-type {
    background: #333;
  }
}
</style>

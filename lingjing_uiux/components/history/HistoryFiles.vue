<script setup lang="ts">
import { ref, onMounted } from 'vue'

// 历史文件接口
interface HistoryFile {
  path: string
  name: string
  lastOpened: string
  icon: string
}

// 定义事件
interface Emits {
  (e: 'file-selected', path: string): void
}

const emit = defineEmits<Emits>()

const historyFiles = ref<HistoryFile[]>([])

// 加载历史文件列表
const loadHistoryFiles = async () => {
  try {
    const stored = localStorage.getItem('lingjing_history_files')
    if (stored) {
      historyFiles.value = JSON.parse(stored)
    }
  } catch (error) {
    console.error('加载历史文件失败:', error)
  }
}

// 保存历史文件列表
const saveHistoryFiles = () => {
  localStorage.setItem('lingjing_history_files', JSON.stringify(historyFiles.value))
}

// 添加历史文件
const addHistoryFile = (filePath: string) => {
  const fileName = filePath.split(/[/\\]/).pop() || 'Unknown'
  const newFile: HistoryFile = {
    path: filePath,
    name: fileName,
    lastOpened: new Date().toLocaleString('zh-CN'),
    icon: '📊'
  }

  // 移除已存在的相同路径
  historyFiles.value = historyFiles.value.filter(f => f.path !== filePath)
  // 添加到开头
  historyFiles.value.unshift(newFile)
  // 最多保留 10 个历史记录
  if (historyFiles.value.length > 10) {
    historyFiles.value = historyFiles.value.slice(0, 10)
  }

  saveHistoryFiles()
}

// 打开历史文件
const openHistoryFile = async (file: HistoryFile) => {
  // 更新最后打开时间
  file.lastOpened = new Date().toLocaleString('zh-CN')
  // 移到开头
  const index = historyFiles.value.findIndex(f => f.path === file.path)
  if (index > 0) {
    historyFiles.value.splice(index, 1)
    historyFiles.value.unshift(file)
  }
  saveHistoryFiles()
  
  // 触发事件，通知父组件
  emit('file-selected', file.path)
}

// 删除历史记录
const removeHistoryFile = (event: Event, file: HistoryFile) => {
  event.stopPropagation()
  historyFiles.value = historyFiles.value.filter(f => f.path !== file.path)
  saveHistoryFiles()
}

// 暴露方法给父组件
defineExpose({
  addHistoryFile,
  historyFiles
})

onMounted(() => {
  loadHistoryFiles()
})
</script>

<template>
  <!-- 历史文件列表 -->
  <div class="history-section" v-if="historyFiles.length > 0">
    <h3 class="history-title">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"/>
        <polyline points="12 6 12 12 16 14"/>
      </svg>
      最近打开
    </h3>
    <div class="history-list">
      <div
        v-for="file in historyFiles"
        :key="file.path"
        class="history-item"
        @click="openHistoryFile(file)"
      >
        <div class="history-item-icon">{{ file.icon }}</div>
        <div class="history-item-info">
          <div class="history-item-name">{{ file.name }}</div>
          <div class="history-item-meta">
            <span class="history-item-time">{{ file.lastOpened }}</span>
          </div>
        </div>
        <button class="history-item-remove" @click="removeHistoryFile($event, file)" title="从列表中移除">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.history-section {
  width: 100%;
  max-width: 600px;
  margin-top: 32px;
}

.history-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: white;
  margin-bottom: 16px;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.history-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.history-item:hover {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.3);
  transform: translateX(4px);
}

.history-item-icon {
  font-size: 24px;
}

.history-item-info {
  flex: 1;
}

.history-item-name {
  font-size: 14px;
  font-weight: 500;
  color: white;
  margin-bottom: 4px;
}

.history-item-meta {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
}

.history-item-remove {
  padding: 4px;
  border: none;
  background: transparent;
  color: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s;
}

.history-item-remove:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}
</style>

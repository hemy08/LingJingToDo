<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface Props {
  visible: boolean
}

interface Emits {
  (e: 'update:visible', value: boolean): void
}

defineProps<Props>()
const emit = defineEmits<Emits>()

const currentTheme = ref('light')

const themes = [
    { id: 'light', name: '浅色', icon: 'fa-sun', preview: { bg: '#f5f7fa', card: '#ffffff', text: '#1e2a3e', accent: '#0077c8' } },
    { id: 'dark', name: '深色', icon: 'fa-moon', preview: { bg: '#121826', card: '#1e293b', text: '#e9edf2', accent: '#3b82f6' } },
    { id: 'eye', name: '护眼', icon: 'fa-eye', preview: { bg: '#e8f5e9', card: '#fef9e6', text: '#2c3e2f', accent: '#2e7d32' } },
    { id: 'orange', name: '橙色', icon: 'fa-circle', preview: { bg: '#fff3e0', card: '#ffffff', text: '#e65100', accent: '#ff6d00' } },
    { id: 'purple', name: '紫色', icon: 'fa-circle', preview: { bg: '#f3e5f5', card: '#ffffff', text: '#4a148c', accent: '#7b1fa2' } },
    { id: 'red', name: '红色', icon: 'fa-circle', preview: { bg: '#ffebee', card: '#ffffff', text: '#b71c1c', accent: '#c62828' } },
    { id: 'skyblue', name: '天蓝', icon: 'fa-circle', preview: { bg: '#e1f5fe', card: '#ffffff', text: '#01579b', accent: '#0288d1' } },
    { id: 'navy', name: '海军蓝', icon: 'fa-circle', preview: { bg: '#0f172a', card: '#1e293b', text: '#e2e8f0', accent: '#3b82f6' } },
    { id: 'deep-purple', name: '深紫', icon: 'fa-circle', preview: { bg: '#1e1b4b', card: '#2e2a5e', text: '#e0e7ff', accent: '#8b5cf6' } },
    // 新增主题配色
    { id: 'titian-red', name: '提香红', icon: 'fa-circle', preview: { bg: '#fef5f5', card: '#ffffff', text: '#8b2942', accent: '#c0405b' } },
    { id: 'mars-green', name: '马尔斯绿', icon: 'fa-circle', preview: { bg: '#f0f7f4', card: '#ffffff', text: '#1d4d3a', accent: '#2d6b4f' } },
    { id: 'klein-blue', name: '克莱因蓝', icon: 'fa-circle', preview: { bg: '#f0f5ff', card: '#ffffff', text: '#002fa7', accent: '#0055ff' } },
    { id: 'burgundy-red', name: '勃艮第红', icon: 'fa-circle', preview: { bg: '#fef3f5', card: '#ffffff', text: '#722f37', accent: '#a04a52' } },
    { id: 'schoenbrunn-yellow', name: '申布伦黄', icon: 'fa-circle', preview: { bg: '#fffef5', card: '#ffffff', text: '#c4a000', accent: '#e6c200' } },
    { id: 'tiffany-blue', name: '蒂芙尼蓝', icon: 'fa-circle', preview: { bg: '#f0fafb', card: '#ffffff', text: '#007d80', accent: '#00b4b8' } },
    { id: 'china-red', name: '中国红', icon: 'fa-circle', preview: { bg: '#fff5f5', card: '#ffffff', text: '#c41e3a', accent: '#e52d4a' } },
    { id: 'vandyke-brown', name: '范戴克棕', icon: 'fa-circle', preview: { bg: '#faf8f5', card: '#ffffff', text: '#5c4033', accent: '#8b6b4d' } },
    { id: 'hermes-orange', name: '爱马仕橙', icon: 'fa-circle', preview: { bg: '#fff8f3', card: '#ffffff', text: '#d4710f', accent: '#f37021' } },
    { id: 'prussian-blue', name: '普鲁士蓝', icon: 'fa-circle', preview: { bg: '#f5f8fa', card: '#ffffff', text: '#003153', accent: '#004d80' } },
    { id: 'lime-green', name: '莱姆绿', icon: 'fa-circle', preview: { bg: '#f5faf5', card: '#ffffff', text: '#32cd32', accent: '#50e450' } }
  ]
const applyTheme = (theme: string) => {
  currentTheme.value = theme
  document.body.classList.remove('light', 'dark', 'eye', 'orange', 'purple', 'red', 'skyblue', 'navy', 'deep-purple', 'titian-red', 'mars-green', 'klein-blue', 'burgundy-red', 'schoenbrunn-yellow', 'tiffany-blue', 'china-red', 'vandyke-brown', 'hermes-orange', 'prussian-blue', 'lime-green')
  if (theme !== 'light') document.body.classList.add(theme)
  localStorage.setItem('selected_theme', theme)
}

const handleClose = () => {
  emit('update:visible', false)
}

// 初始化时加载保存的主题
onMounted(() => {
  const savedTheme = localStorage.getItem('selected_theme') || 'light'
  applyTheme(savedTheme)
})
</script>

<template>
  <div v-if="visible" class="modal" @click.self="handleClose">
    <div class="modal-content theme-modal">
      <button class="theme-close-btn" @click="handleClose">
        <i class="fas fa-times"></i>
      </button>
      <h3><i class="fas fa-palette"></i> 主题设置</h3>
      <div class="theme-grid">
        <div 
          v-for="theme in themes" 
          :key="theme.id" 
          class="theme-card" 
          :class="{ active: currentTheme === theme.id }" 
          @click="applyTheme(theme.id)"
        >
          <div class="theme-header">
            <i :class="['fas', theme.icon]"></i>
            <span>{{ theme.name }}</span>
          </div>
          <div class="theme-preview" :style="{ background: theme.preview.bg }">
            <div class="preview-card" :style="{ background: theme.preview.card }">
              <div class="preview-title" :style="{ color: theme.preview.text }">示例任务</div>
              <div class="preview-meta">
                <span class="preview-tag" :style="{ background: theme.preview.accent, color: '#fff' }">进行中</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

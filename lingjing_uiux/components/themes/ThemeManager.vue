<script setup lang="ts">
import { ref, onMounted } from 'vue'

const currentTheme = ref('light')
const currentFontSize = ref('medium')

const themes = [
  { id: 'light', name: '浅色', icon: 'fa-sun' },
  { id: 'dark', name: '深色', icon: 'fa-moon' },
  { id: 'eye', name: '护眼', icon: 'fa-eye' },
  { id: 'orange', name: '橙色', icon: 'fa-circle' },
  { id: 'purple', name: '紫色', icon: 'fa-circle' },
  { id: 'red', name: '红色', icon: 'fa-circle' },
  { id: 'skyblue', name: '天蓝', icon: 'fa-circle' },
  { id: 'navy', name: '海军蓝', icon: 'fa-circle' },
  { id: 'deep-purple', name: '深紫', icon: 'fa-circle' }
]

const fontSizes = [
  { id: 'small', name: '小' },
  { id: 'medium', name: '中' },
  { id: 'large', name: '大' },
  { id: 'xlarge', name: '特大' }
]

const applyTheme = (theme: string) => {
  currentTheme.value = theme
  document.body.classList.remove('light', 'dark', 'eye', 'orange', 'purple', 'red', 'skyblue', 'navy', 'deep-purple')
  if (theme !== 'light') {
    document.body.classList.add(theme)
  }
  localStorage.setItem('selected_theme', theme)
}

const applyFontSize = (size: string) => {
  currentFontSize.value = size
  document.body.classList.remove('font-small', 'font-medium', 'font-large', 'font-xlarge')
  document.body.classList.add(`font-${size}`)
  localStorage.setItem('font_size', size)
}

onMounted(() => {
  const savedTheme = localStorage.getItem('selected_theme') || 'light'
  const savedFont = localStorage.getItem('font_size') || 'medium'
  applyTheme(savedTheme)
  applyFontSize(savedFont)
})

defineExpose({
  currentTheme,
  currentFontSize,
  applyTheme,
  applyFontSize
})
</script>

<template>
  <div class="theme-manager">
    <!-- 主题选择器 -->
    <div class="theme-selector">
      <button 
        v-for="theme in themes" 
        :key="theme.id"
        class="theme-btn"
        :class="{ active: currentTheme === theme.id }"
        :data-theme="theme.id"
        @click="applyTheme(theme.id)"
      >
        <i :class="['fas', theme.icon]"></i>
      </button>
    </div>

    <!-- 字体大小选择器 -->
    <select 
      id="fontSizeSelect" 
      v-model="currentFontSize"
      @change="applyFontSize(currentFontSize)"
      class="font-size-select"
    >
      <option v-for="size in fontSizes" :key="size.id" :value="size.id">
        {{ size.name }}
      </option>
    </select>
  </div>
</template>

<style scoped>
.theme-manager {
  display: flex;
  align-items: center;
  gap: 8px;
}

.theme-selector {
  display: flex;
  gap: 4px;
}

.theme-btn {
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  background: var(--tag-bg);
  color: var(--text-secondary);
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.theme-btn:hover {
  background: var(--accent-blue-light);
  color: var(--accent-blue);
}

.theme-btn.active {
  background: var(--accent-blue);
  color: white;
}

.font-size-select {
  padding: 4px 8px;
  border-radius: 4px;
  border: 1px solid var(--border-light);
  background: var(--card-bg);
  color: var(--text-primary);
  font-size: 12px;
}
</style>

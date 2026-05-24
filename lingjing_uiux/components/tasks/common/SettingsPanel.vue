<template>
  <div class="settings-area">
    <div class="setting-item">
      <label>📝 字体大小:</label>
      <select v-model="fontSize">
        <option value="small">小</option>
        <option value="medium">中</option>
        <option value="large">大</option>
      </select>
    </div>
    <div class="setting-item">
      <label>🔄 拖动方式:</label>
      <select v-model="dragMode">
        <option value="insert">插入方式</option>
        <option value="swap">交换方式</option>
      </select>
    </div>
    <div class="setting-item">
      <label>📐 布局方式:</label>
      <select v-model="layoutMode">
        <option value="masonry">瀑布流</option>
        <option value="list">列表</option>
        <option value="tree">树形</option>
      </select>
    </div>
    <div v-if="layoutMode === 'list'" class="setting-item">
      <label>📊 列表列数:</label>
      <select v-model="listColumns">
        <option :value="1">1列</option>
        <option :value="2">2列</option>
        <option :value="3">3列</option>
        <option :value="4">4列</option>
      </select>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
  config?: {
    fontSize?: string
    dragMode?: 'insert' | 'swap'
    layoutMode?: 'masonry' | 'list' | 'tree'
    listColumns?: number
  }
}>()

const emit = defineEmits<{
  'update:config': [
    config: {
      fontSize: string
      dragMode: 'insert' | 'swap'
      layoutMode: 'masonry' | 'list' | 'tree'
      listColumns: number
    },
  ]
}>()

const fontSize = ref(props.config?.fontSize || 'medium')
const dragMode = ref<'insert' | 'swap'>(props.config?.dragMode || 'insert')
const layoutMode = ref<'masonry' | 'list' | 'tree'>(props.config?.layoutMode || 'masonry')
const listColumns = ref(props.config?.listColumns || 2)

// 监听变化并发出更新
watch([fontSize, dragMode, layoutMode, listColumns], () => {
  emit('update:config', {
    fontSize: fontSize.value,
    dragMode: dragMode.value,
    layoutMode: layoutMode.value,
    listColumns: listColumns.value,
  })
})
</script>

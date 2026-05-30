<template>
  <div class="settings-area">
    <div class="setting-item">
      <label>📝字体:</label>
      <select v-model="fontSize">
        <option value="small">小</option>
        <option value="medium">中</option>
        <option value="large">大</option>
      </select>
    </div>
    <div class="setting-item">
      <label>🔄拖动:</label>
      <select v-model="dragMode">
        <option value="insert">插入方式</option>
        <option value="swap">交换方式</option>
      </select>
    </div>
    <div class="setting-item">
      <label>📐布局:</label>
      <select v-model="layoutMode">
        <option value="masonry">瀑布流</option>
        <option value="list">列表</option>
        <option value="tree">树形</option>
      </select>
    </div>
    <div v-if="layoutMode === 'list'" class="setting-item">
      <label>📊列数:</label>
      <select v-model="listColumns">
        <option :value="1">1列</option>
        <option :value="2">2列</option>
        <option :value="3">3列</option>
        <option :value="4">4列</option>
      </select>
    </div>
    <div class="setting-item">
      <label>📋子任:</label>
      <button
        class="components-action-btn toggle-subtask-btn"
        :title="globalSubtaskDisplayMode === 'card' ? '切换为表格显示' : '切换为卡片显示'"
        @click="toggleGlobalSubtaskDisplayMode"
      >
        <i :class="globalSubtaskDisplayMode === 'card' ? 'fas fa-table' : 'fas fa-th-large'"></i>
        {{ globalSubtaskDisplayMode === 'card' ? '表格' : '卡片' }}
      </button>
    </div>
    <div class="setting-item">
      <label>📑折叠/展开:</label>
      <button
        class="components-action-btn add-subtask-btn"
        @click="handleGlobalCollapseToggle"
      >
        {{ globalCollapseButtonText }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'

import { useTaskCollapseStore } from '../../../stores/taskCollapse'
import type { TaskPanelConfig, SubtaskDisplayMode } from '../../../types'

const props = defineProps<{
  config?: TaskPanelConfig
  totalTasks?: number
}>()

const emit = defineEmits<{
  'update:config': [config: Required<TaskPanelConfig>]
  'collapse-all-tasks': []
}>()

const taskCollapse = useTaskCollapseStore()

const fontSize = ref(props.config?.fontSize || 'medium')
const dragMode = ref<'insert' | 'swap'>(props.config?.dragMode || 'insert')
const layoutMode = ref<'masonry' | 'list' | 'tree'>(props.config?.layoutMode || 'masonry')
const listColumns = ref(props.config?.listColumns || 2)
const globalSubtaskDisplayMode = ref<SubtaskDisplayMode>(props.config?.globalSubtaskDisplayMode || 'table')

const toggleGlobalSubtaskDisplayMode = () => {
  globalSubtaskDisplayMode.value = globalSubtaskDisplayMode.value === 'table' ? 'card' : 'table'
}

const globalCollapseButtonText = computed(() => {
  return taskCollapse.getGlobalButtonText(props.totalTasks || 0)
})

const handleGlobalCollapseToggle = () => {
  const currentText = globalCollapseButtonText.value
  
  if (currentText === '一键折叠') {
    emit('collapse-all-tasks')
  } else {
    taskCollapse.expandAll()
  }
}

watch([fontSize, dragMode, layoutMode, listColumns, globalSubtaskDisplayMode], () => {
  emit('update:config', {
    fontSize: fontSize.value,
    dragMode: dragMode.value,
    layoutMode: layoutMode.value,
    listColumns: listColumns.value,
    globalSubtaskDisplayMode: globalSubtaskDisplayMode.value,
  })
})
</script>

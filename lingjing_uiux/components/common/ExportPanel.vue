<script setup lang="ts">
import { ref, computed } from 'vue'
import { useTaskExport } from '../../composables/useTaskExport'
import type { Task } from '../../types'

const props = defineProps<{
  tasks: Task[]
  visible: boolean
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
}>()

const { progress, exportTasks } = useTaskExport()

const exportFormat = ref<'CSV' | 'JSON'>('CSV')
const exportScope = ref<'ALL' | 'FILTERED' | 'SELECTED'>('ALL')
const selectedFields = ref<string[]>(['ID', 'TITLE', 'STATUS', 'PRIORITY', 'DUE_DATE'])
const includeHeaders = ref(true)

const availableFields = [
  { value: 'ID', label: 'ID' },
  { value: 'TITLE', label: '标题' },
  { value: 'STATUS', label: '状态' },
  { value: 'TYPE', label: '类型' },
  { value: 'PRIORITY', label: '优先级' },
  { value: 'DUE_DATE', label: '截止日期' },
  { value: 'CREATED_DATE', label: '创建日期' },
  { value: 'REMARK', label: '备注' },
]

const isExporting = computed(() => progress.value.status === 'EXPORTING' || progress.value.status === 'PREPARING')

function closePanel() {
  emit('update:visible', false)
}

function toggleField(field: string) {
  const index = selectedFields.value.indexOf(field)
  if (index === -1) {
    selectedFields.value.push(field)
  } else {
    selectedFields.value.splice(index, 1)
  }
}

async function handleExport() {
  if (selectedFields.value.length === 0) {
    alert('请至少选择一个导出字段')
    return
  }

  const result = await exportTasks(
    {
      format: exportFormat.value,
      scope: exportScope.value,
      fields: selectedFields.value as any[],
      includeHeaders: includeHeaders.value,
    },
    props.tasks
  )

  if (result.success) {
    alert(`成功导出 ${result.recordCount} 条记录`)
  } else {
    alert(`导出失败: ${result.errorMessage}`)
  }
}
</script>

<template>
  <div v-if="visible" class="export-panel-overlay" @click.self="closePanel">
    <div class="export-panel">
      <div class="panel-header">
        <h3>
          <i class="fas fa-download"></i>
          导出任务
        </h3>
        <button class="close-btn" @click="closePanel">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <div class="panel-content">
        <div class="option-section">
          <label>导出格式</label>
          <div class="format-options">
            <label class="radio-label">
              <input type="radio" v-model="exportFormat" value="CSV" />
              CSV
            </label>
            <label class="radio-label">
              <input type="radio" v-model="exportFormat" value="JSON" />
              JSON
            </label>
          </div>
        </div>

        <div class="option-section">
          <label>导出范围</label>
          <select v-model="exportScope">
            <option value="ALL">全部任务 ({{ tasks.length }})</option>
            <option value="FILTERED">当前过滤结果</option>
            <option value="SELECTED">已选择任务</option>
          </select>
        </div>

        <div class="option-section">
          <label>导出字段</label>
          <div class="field-list">
            <label
              v-for="field in availableFields"
              :key="field.value"
              class="checkbox-label"
            >
              <input
                type="checkbox"
                :checked="selectedFields.includes(field.value)"
                @change="toggleField(field.value)"
              />
              {{ field.label }}
            </label>
          </div>
        </div>

        <div v-if="exportFormat === 'CSV'" class="option-section">
          <label class="checkbox-label">
            <input type="checkbox" v-model="includeHeaders" />
            包含表头
          </label>
        </div>

        <div v-if="isExporting" class="progress-section">
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: progress.percentage + '%' }"></div>
          </div>
          <span class="progress-text">{{ progress.current }} / {{ progress.total }}</span>
        </div>
      </div>

      <div class="panel-footer">
        <button class="btn-secondary" @click="closePanel">取消</button>
        <button class="btn-primary" :disabled="isExporting" @click="handleExport">
          <i class="fas fa-download"></i>
          导出
        </button>
      </div>
    </div>
  </div>
</template>

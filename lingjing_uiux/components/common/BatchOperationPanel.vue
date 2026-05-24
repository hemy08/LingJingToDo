<script setup lang="ts">
import { computed } from 'vue'
import { useBatchOperation } from '../../composables/useBatchOperation'
import type { Task, TaskStatus, TaskPriority } from '../../types'

const { tasks, statuses, priorities, visible } = defineProps<{
  tasks: Task[]
  statuses: TaskStatus[]
  priorities: TaskPriority[]
  visible: boolean
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  'operation-complete': []
}>()

const {
  selectionState,
  toggleSelection,
  selectAll,
  deselectAll,
  invertSelection,
  batchUpdateStatus,
  batchUpdatePriority,
  batchDelete,
} = useBatchOperation()

const selectedCount = computed(() => selectionState.value.selectedIds.size)
const hasSelection = computed(() => selectedCount.value > 0)

function closePanel() {
  deselectAll()
  emit('update:visible', false)
}

async function handleBatchStatus(statusId: string) {
  const result = await batchUpdateStatus(Array.from(selectionState.value.selectedIds), statusId)
  if (result.success) {
    emit('operation-complete')
  }
}

async function handleBatchPriority(priorityId: string) {
  const result = await batchUpdatePriority(Array.from(selectionState.value.selectedIds), priorityId)
  if (result.success) {
    emit('operation-complete')
  }
}

async function handleBatchDelete() {
  if (!confirm(`确认删除选中的 ${selectedCount.value} 个任务？`)) return

  const result = await batchDelete(Array.from(selectionState.value.selectedIds))
  if (result.success) {
    emit('operation-complete')
    closePanel()
  }
}
</script>

<template>
  <div v-if="visible" class="batch-panel">
    <div class="panel-header">
      <h4>
        <i class="fas fa-check-square"></i>
        批量操作
        <span v-if="hasSelection" class="count-badge">{{ selectedCount }}</span>
      </h4>
      <button class="close-btn" @click="closePanel">
        <i class="fas fa-times"></i>
      </button>
    </div>

    <div class="panel-toolbar">
      <button class="btn-sm" @click="selectAll(tasks.map(t => t.id))">全选</button>
      <button class="btn-sm" @click="deselectAll">取消</button>
      <button class="btn-sm" @click="invertSelection(tasks.map(t => t.id))">反选</button>
    </div>

    <div class="panel-content">
      <div class="task-list">
        <div
          v-for="task in tasks"
          :key="task.id"
          class="task-item"
          :class="{ selected: selectionState.selectedIds.has(task.id) }"
          @click="toggleSelection(task.id)"
        >
          <input
            type="checkbox"
            :checked="selectionState.selectedIds.has(task.id)"
            @click.stop
            @change="toggleSelection(task.id)"
          />
          <span class="task-title">{{ task.title }}</span>
        </div>
      </div>
    </div>

    <div v-if="hasSelection" class="panel-actions">
      <div class="action-group">
        <label>修改状态：</label>
        <select @change="handleBatchStatus(($event.target as HTMLSelectElement).value)">
          <option value="">选择状态</option>
          <option v-for="status in statuses" :key="status.id" :value="status.id">
            {{ status.emoji }} {{ status.name }}
          </option>
        </select>
      </div>

      <div class="action-group">
        <label>修改优先级：</label>
        <select @change="handleBatchPriority(($event.target as HTMLSelectElement).value)">
          <option value="">选择优先级</option>
          <option v-for="priority in priorities" :key="priority.id" :value="priority.id">
            {{ priority.emoji }} {{ priority.name }}
          </option>
        </select>
      </div>

      <button class="btn-danger" @click="handleBatchDelete">
        <i class="fas fa-trash"></i>
        批量删除
      </button>
    </div>
  </div>
</template>

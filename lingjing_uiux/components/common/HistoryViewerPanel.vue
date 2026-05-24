<script setup lang="ts">
import { ref, computed } from 'vue'
import { useHistoryViewer } from '../../composables/useHistoryViewer'
import type { HistoryDisplayItem } from '../../types/enhancements'

defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
}>()

const { displayItems, historyCount, batchUndo, selectiveUndo, searchHistory } = useHistoryViewer()

const searchKeyword = ref('')
const selectedIds = ref<Set<string>>(new Set())
const showConfirm = ref(false)
const pendingAction = ref<'batch' | 'selective' | null>(null)
const targetSnapshotId = ref<string | null>(null)

const filteredItems = computed<HistoryDisplayItem[]>(() => {
  if (!searchKeyword.value.trim()) {
    return displayItems.value
  }
  return searchHistory(searchKeyword.value)
})

function closePanel() {
  emit('update:visible', false)
  searchKeyword.value = ''
  selectedIds.value = new Set()
}

function toggleSelect(id: string) {
  if (selectedIds.value.has(id)) {
    selectedIds.value.delete(id)
  } else {
    selectedIds.value.add(id)
  }
}

function selectAll() {
  selectedIds.value = new Set(filteredItems.value.map(item => item.snapshot.id))
}

function deselectAll() {
  selectedIds.value = new Set()
}

async function handleBatchUndo() {
  if (selectedIds.value.size === 0) return

  showConfirm.value = true
  pendingAction.value = 'batch'
}

async function handleSelectiveUndo(snapshotId: string) {
  targetSnapshotId.value = snapshotId
  showConfirm.value = true
  pendingAction.value = 'selective'
}

async function confirmAction() {
  if (pendingAction.value === 'batch') {
    await batchUndo(Array.from(selectedIds.value))
    selectedIds.value = new Set()
  } else if (pendingAction.value === 'selective' && targetSnapshotId.value) {
    await selectiveUndo(targetSnapshotId.value)
  }

  showConfirm.value = false
  pendingAction.value = null
  targetSnapshotId.value = null
}

function cancelAction() {
  showConfirm.value = false
  pendingAction.value = null
  targetSnapshotId.value = null
}
</script>

<template>
  <div v-if="visible" class="history-panel-overlay" @click.self="closePanel">
    <div class="history-panel">
      <div class="panel-header">
        <h3>
          <i class="fas fa-history"></i>
          操作历史
          <span class="count-badge">{{ historyCount }}</span>
        </h3>
        <button class="close-btn" @click="closePanel">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <div class="panel-toolbar">
        <input
          v-model="searchKeyword"
          type="text"
          placeholder="搜索历史记录..."
          class="search-input"
        />
        <button
          v-if="selectedIds.size > 0"
          class="btn-danger"
          @click="handleBatchUndo"
        >
          <i class="fas fa-undo"></i>
          批量撤销 ({{ selectedIds.size }})
        </button>
      </div>

      <div class="panel-content">
        <div v-if="filteredItems.length === 0" class="empty-state">
          <i class="fas fa-inbox"></i>
          <p>暂无操作历史</p>
        </div>

        <div v-else class="history-list">
          <div
            v-for="item in filteredItems"
            :key="item.snapshot.id"
            class="history-item"
            :class="{ selected: selectedIds.has(item.snapshot.id) }"
          >
            <input
              type="checkbox"
              :checked="selectedIds.has(item.snapshot.id)"
              class="item-checkbox"
              @change="toggleSelect(item.snapshot.id)"
            />
            <i :class="['fas', item.icon]" class="item-icon"></i>
            <div class="item-content">
              <div class="item-text">{{ item.displayText }}</div>
              <div class="item-time">{{ item.relativeTime }}</div>
            </div>
            <button
              class="undo-btn"
              title="撤销到此操作"
              @click="handleSelectiveUndo(item.snapshot.id)"
            >
              <i class="fas fa-undo"></i>
            </button>
          </div>
        </div>
      </div>

      <div v-if="filteredItems.length > 0" class="panel-footer">
        <button class="btn-secondary" @click="selectAll">全选</button>
        <button class="btn-secondary" @click="deselectAll">取消选择</button>
      </div>
    </div>

    <div v-if="showConfirm" class="confirm-dialog-overlay">
      <div class="confirm-dialog">
        <p>确认执行撤销操作？</p>
        <div class="confirm-actions">
          <button class="btn-secondary" @click="cancelAction">取消</button>
          <button class="btn-danger" @click="confirmAction">确认撤销</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useFilterScheme } from '../../composables/useFilterScheme'

defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
}>()

const { schemes, schemeCount, maxSchemes, saveScheme, loadScheme, deleteScheme, renameScheme, exportScheme, importScheme } = useFilterScheme()

const showSaveDialog = ref(false)
const showRenameDialog = ref(false)
const schemeName = ref('')
const selectedSchemeId = ref<string | null>(null)
const importText = ref('')

function closePanel() {
  emit('update:visible', false)
}

function handleSaveScheme() {
  if (!schemeName.value.trim()) return

  const result = saveScheme(schemeName.value.trim())
  if (result) {
    showSaveDialog.value = false
    schemeName.value = ''
  }
}

function handleLoadScheme(schemeId: string) {
  loadScheme(schemeId)
  closePanel()
}

function handleDeleteScheme(schemeId: string) {
  if (confirm('确认删除该过滤方案？')) {
    deleteScheme(schemeId)
  }
}

function openRenameDialog(schemeId: string) {
  selectedSchemeId.value = schemeId
  const scheme = schemes.value.find(s => s.id === schemeId)
  if (scheme) {
    schemeName.value = scheme.name
    showRenameDialog.value = true
  }
}

function handleRenameScheme() {
  if (!schemeName.value.trim() || !selectedSchemeId.value) return

  const success = renameScheme(selectedSchemeId.value, schemeName.value.trim())
  if (success) {
    showRenameDialog.value = false
    schemeName.value = ''
    selectedSchemeId.value = null
  }
}

function handleExportScheme(schemeId: string) {
  const json = exportScheme(schemeId)
  if (json) {
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'filter-scheme.json'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }
}

function handleImportScheme() {
  if (!importText.value.trim()) return

  const scheme = importScheme(importText.value.trim())
  if (scheme) {
    importText.value = ''
  }
}
</script>

<template>
  <div v-if="visible" class="scheme-panel-overlay" @click.self="closePanel">
    <div class="scheme-panel">
      <div class="panel-header">
        <h3>
          <i class="fas fa-filter"></i>
          过滤方案管理
          <span class="count-badge">{{ schemeCount }} / {{ maxSchemes }}</span>
        </h3>
        <button class="close-btn" @click="closePanel">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <div class="panel-toolbar">
        <button class="btn-primary" :disabled="schemeCount >= maxSchemes" @click="showSaveDialog = true">
          <i class="fas fa-save"></i>
          保存当前方案
        </button>
      </div>

      <div class="panel-content">
        <div v-if="schemes.length === 0" class="empty-state">
          <i class="fas fa-folder-open"></i>
          <p>暂无保存的过滤方案</p>
        </div>

        <div v-else class="scheme-list">
          <div v-for="scheme in schemes" :key="scheme.id" class="scheme-item">
            <div class="scheme-info">
              <div class="scheme-name">{{ scheme.name }}</div>
              <div class="scheme-meta">
                {{ new Date(scheme.updatedAt).toLocaleString() }}
              </div>
            </div>
            <div class="scheme-actions">
              <button class="action-btn" title="应用" @click="handleLoadScheme(scheme.id)">
                <i class="fas fa-check"></i>
              </button>
              <button class="action-btn" title="重命名" @click="openRenameDialog(scheme.id)">
                <i class="fas fa-edit"></i>
              </button>
              <button class="action-btn" title="导出" @click="handleExportScheme(scheme.id)">
                <i class="fas fa-download"></i>
              </button>
              <button class="action-btn danger" title="删除" @click="handleDeleteScheme(scheme.id)">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="panel-footer">
        <textarea
          v-model="importText"
          placeholder="粘贴方案JSON进行导入..."
          class="import-input"
        ></textarea>
        <button class="btn-secondary" @click="handleImportScheme">
          <i class="fas fa-upload"></i>
          导入
        </button>
      </div>
    </div>

    <div v-if="showSaveDialog" class="dialog-overlay" @click.self="showSaveDialog = false">
      <div class="dialog">
        <h4>保存过滤方案</h4>
        <input
          v-model="schemeName"
          type="text"
          placeholder="方案名称"
          class="dialog-input"
        />
        <div class="dialog-actions">
          <button class="btn-secondary" @click="showSaveDialog = false">取消</button>
          <button class="btn-primary" @click="handleSaveScheme">保存</button>
        </div>
      </div>
    </div>

    <div v-if="showRenameDialog" class="dialog-overlay" @click.self="showRenameDialog = false">
      <div class="dialog">
        <h4>重命名方案</h4>
        <input
          v-model="schemeName"
          type="text"
          placeholder="新名称"
          class="dialog-input"
        />
        <div class="dialog-actions">
          <button class="btn-secondary" @click="showRenameDialog = false">取消</button>
          <button class="btn-primary" @click="handleRenameScheme">确定</button>
        </div>
      </div>
    </div>
  </div>
</template>

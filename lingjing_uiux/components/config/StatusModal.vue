<template>
  <div v-if="visible" class="status-modal" @click.self="handleClose">
    <div 
      class="status-modal-content" 
      :style="{ width: modalWidth + 'px', height: modalHeight + 'px' }"
      ref="modalRef"
    >
      <!-- 拖动调整大小的手柄 -->
      <div class="resize-handle resize-right" @mousedown="startResize('right', $event)"></div>
      <div class="resize-handle resize-bottom" @mousedown="startResize('bottom', $event)"></div>
      <div class="resize-handle resize-corner" @mousedown="startResize('corner', $event)"></div>
      
      <h3><i class="fas fa-tags"></i> 自定义状态</h3>
      <div class="config-list">
        <div v-for="(status, index) in localStatuses" :key="status.id" class="config-card">
          <div class="card-left">
            <select v-model="status.emoji" class="emoji-select" @change="markAsModified(status.id)">
              <option v-for="emoji in availableEmojis" :key="emoji" :value="emoji">{{ emoji }}</option>
            </select>
            <input 
              v-model="status.name" 
              class="config-input" 
              placeholder="状态名称"
              @change="markAsModified(status.id)"
            />
          </div>
          <div class="card-actions">
            <button 
              v-if="index > 0" 
              class="btn-sm" 
              @click="moveUp(index)"
              title="上移"
            >
              <span>⬆️</span>
            </button>
            <button 
              v-if="index < localStatuses.length - 1" 
              class="btn-sm" 
              @click="moveDown(index)"
              title="下移"
            >
              <span>⬇️</span>
            </button>
            <button class="card-delete-btn" @click="deleteStatus(status.id)">
              <span>❌</span> 删除
            </button>
          </div>
        </div>
      </div>
      <div class="add-config">
        <select v-model="newStatusEmoji" class="emoji-select">
          <option v-for="emoji in availableEmojis" :key="emoji" :value="emoji">{{ emoji }}</option>
        </select>
        <input 
          v-model="newStatusName" 
          type="text" 
          placeholder="新状态名称" 
          @keypress.enter="addStatus"
        >
        <button class="btn-sm btn-primary" @click="addStatus">添加</button>
      </div>
      <div class="modal-buttons">
        <button class="btn-sm" @click="handleClose"><span>🚫</span> 关闭</button>
        <button class="btn-sm btn-primary" @click="handleSave">
          <span>💾</span> 保存全部
        </button>
      </div>
    </div>
  </div>

  <!-- 自定义对话框 -->
</template>

<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue'
import { statusApi } from '../../connections/config_apis'
import { useDialog } from '../../composables/useDialog'
import { createConfigHandlers } from './config_common'
import type { TaskStatus } from '../../types'

interface Props {
  visible: boolean
  statuses: TaskStatus[]
}

interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'updated', statuses: TaskStatus[]): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 可用的emoji列表
const availableEmojis = ['✅', '❎', '⚠️', 'ℹ️', '⏳', '⏸️', '▶️', '🟢', '🔴', '🟡', '🔵', '⚫️', '💀', '🛡️', '🔔',
    '📋', '📌', '📝', '⏹️', '📅','🔒','⏰','🚀'
]

// 本地状态列表
const localStatuses = ref<TaskStatus[]>([])
const newStatusName = ref('')
const newStatusEmoji = ref('📋')
const modifiedIds = ref<Set<string>>(new Set())

// 模态框大小
const modalWidth = ref(800)
const modalHeight = ref(600)
const modalRef = ref<HTMLElement | null>(null)

// 创建配置处理函数
const { handleSave: configHandleSave, handleClose: configHandleClose, handleDelete: configHandleDelete, handleAdd: configHandleAdd, handleMoveUp, handleMoveDown, handleStartResize } = createConfigHandlers<TaskStatus>()
const { showAlert } = useDialog()

// 是否有修改
const hasModifications = () => modifiedIds.value.size > 0

// 监听 visible 变化，从后端获取最新数据
watch(() => props.visible, async (newVisible) => {
  if (newVisible) {
    try {
      const result = await statusApi.getAll()
      localStatuses.value = result
      modifiedIds.value.clear()
    } catch (error) {
      console.error('获取状态列表失败:', error)
      showAlert('错误', '获取状态列表失败')
    }
  }
})

// 标记为已修改
const markAsModified = (id: string) => {
  modifiedIds.value.add(id)
}

// 上移（本地操作）
const moveUp = (index: number) => {
  handleMoveUp(index, localStatuses, modifiedIds)
}

// 下移（本地操作）
const moveDown = (index: number) => {
  handleMoveDown(index, localStatuses, modifiedIds)
}

// 添加状态（本地操作）
const addStatus = () => {
  configHandleAdd(
    newStatusName,
    newStatusEmoji,
    localStatuses,
    modifiedIds,
    '状态',
    'st_custom',
    (id, name, emoji) => ({
      id,
      name,
      color: "#a0aec0",
      emoji
    })
  )
  newStatusEmoji.value = '📋'
}

// 删除状态（本地操作）
const deleteStatus = async (id: string) => {
  await configHandleDelete(
    id,
    localStatuses,
    statusApi.delete.bind(statusApi),
    modifiedIds,
    (result) => emit('updated', result),
    '状态'
  )
}

// 保存全部修改（发送全部数据）
const handleSave = async () => {
  await configHandleSave(
    localStatuses,
    statusApi.update.bind(statusApi),
    modifiedIds,
    (result) => emit('updated', result),
    () => emit('update:visible', false),
    '状态',
    true
  )
}

// 关闭窗口（先保存未保存的修改）
const handleClose = async () => {
  await configHandleClose(
    hasModifications,
    localStatuses,
    statusApi.update.bind(statusApi),
    modifiedIds,
    (result) => emit('updated', result),
    () => emit('update:visible', false),
    '状态'
  )
}

// 拖动调整大小
const startResize = (direction: string, event: MouseEvent) => {
  handleStartResize(direction, event, modalWidth, modalHeight)
}

// 清理事件监听器
onUnmounted(() => {
  // 清理代码
})
</script>


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
  <Dialog
    v-model:visible="dialogVisible"
    :title="dialogTitle"
    :message="dialogMessage"
    :icon="dialogIcon"
    :buttons="dialogButtons"
    @action="handleDialogAction"
  />
</template>

<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue'
import { invoke } from '@tauri-apps/api/core'
import Dialog from '../../common/Dialog.vue'
import type { Status } from '../../types'

interface Props {
  visible: boolean
  statuses: Status[]
}

interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'updated', statuses: Status[]): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 可用的emoji列表
const availableEmojis = ['✅', '❎', '⚠️', 'ℹ️', '⏳', '⏸️', '▶️', '🟢', '🔴', '🟡', '🔵', '⚫️', '💀', '🛡️', '🔔',
    '📋', '📌', '📝', '⏹️', '📅','🔒','⏰','🚀'
]

// 本地状态列表
const localStatuses = ref<Status[]>([])
const newStatusName = ref('')
const newStatusEmoji = ref('📋')
const modifiedIds = ref<Set<string>>(new Set())

// 对话框状态
const dialogVisible = ref(false)
const dialogTitle = ref('')
const dialogMessage = ref('')
const dialogIcon = ref('fas fa-info-circle')
const dialogButtons = ref<Array<{text: string, type?: string, action: string}>>([])
const dialogCallback = ref<Map<string, () => void>>(new Map())

// 模态框大小
const modalWidth = ref(800)
const modalHeight = ref(600)
const modalRef = ref<HTMLElement | null>(null)

// 是否有修改
const hasModifications = () => modifiedIds.value.size > 0

// 监听 visible 变化，从后端获取最新数据
watch(() => props.visible, async (newVisible) => {
  if (newVisible) {
    try {
      const result = await invoke<Status[]>('get_statuses')
      localStatuses.value = result
      modifiedIds.value.clear()
    } catch (error) {
      console.error('获取状态列表失败:', error)
      showAlert('错误', '获取状态列表失败')
    }
  }
})

// 显示对话框
const showDialog = (
  title: string,
  message: string,
  buttons: Array<{text: string, type?: string, action: string}>,
  callbacks?: Map<string, () => void>,
  icon?: string
) => {
  dialogTitle.value = title
  dialogMessage.value = message
  dialogButtons.value = buttons
  dialogIcon.value = icon || 'fas fa-info-circle'
  dialogCallback.value = callbacks || new Map()
  dialogVisible.value = true
}

// 对话框动作处理
const handleDialogAction = (action: string) => {
  const callback = dialogCallback.value.get(action)
  if (callback) {
    callback()
  }
}

// 辅助函数：显示提示对话框
const showAlert = (title: string, message: string, callback?: () => void) => {
  const callbacks = new Map<string, () => void>()
  if (callback) {
    callbacks.set('confirm', callback)
  }
  showDialog(title, message, [{ text: '确定', type: 'btn-primary', action: 'confirm' }], callbacks)
}

// 辅助函数：显示确认对话框
const showConfirm = (title: string, message: string, onConfirm: () => void, onCancel?: () => void) => {
  const callbacks = new Map<string, () => void>()
  callbacks.set('confirm', onConfirm)
  if (onCancel) {
    callbacks.set('cancel', onCancel)
  }
  showDialog(
    title,
    message,
    [
      { text: '取消', action: 'cancel' },
      { text: '确定', type: 'btn-primary', action: 'confirm' }
    ],
    callbacks,
    'fas fa-question-circle'
  )
}

// 对话框取消
const handleDialogCancel = () => {
  dialogVisible.value = false
}

// 标记为已修改
const markAsModified = (id: string) => {
  modifiedIds.value.add(id)
}

// 上移（本地操作）
const moveUp = (index: number) => {
  if (index > 0) {
    const temp = localStatuses.value[index]
    localStatuses.value[index] = localStatuses.value[index - 1]
    localStatuses.value[index - 1] = temp
    modifiedIds.value.add(localStatuses.value[index].id)
    modifiedIds.value.add(localStatuses.value[index - 1].id)
  }
}

// 下移（本地操作）
const moveDown = (index: number) => {
  if (index < localStatuses.value.length - 1) {
    const temp = localStatuses.value[index]
    localStatuses.value[index] = localStatuses.value[index + 1]
    localStatuses.value[index + 1] = temp
    modifiedIds.value.add(localStatuses.value[index].id)
    modifiedIds.value.add(localStatuses.value[index + 1].id)
  }
}

// 添加状态（本地操作）
const addStatus = () => {
  if (!newStatusName.value.trim()) {
    showAlert('提示', '请输入状态名称')
    return
  }
  
  if (localStatuses.value.some(s => s.name === newStatusName.value.trim())) {
    showAlert('提示', '状态已存在')
    return
  }

  const newStatus: Status = {
    id: `st_custom_${Date.now()}`,
    name: newStatusName.value.trim(),
    color: "#a0aec0",
    emoji: newStatusEmoji.value
  }

  localStatuses.value.push(newStatus)
  modifiedIds.value.add(newStatus.id)
  newStatusName.value = ''
  newStatusEmoji.value = '📋'
}

// 删除状态（本地操作）
const deleteStatus = async (id: string) => {
  if (localStatuses.value.length <= 1) {
    showAlert('提示', '至少保留一个状态')
    return
  }

  showConfirm('确认', '确定删除该状态吗?', async () => {
    try {
      const result = await invoke<Status[]>('delete_status', { id })
      localStatuses.value = result
      modifiedIds.value.delete(id)
      emit('updated', result)
    } catch (error) {
      console.error('删除状态失败:', error)
      showAlert('错误', '删除状态失败')
    }
  })
}

// 保存全部修改（发送全部数据）
const handleSave = async () => {
  try {
    const result = await invoke<Status[]>('update_statuses', { statuses: localStatuses.value })
    localStatuses.value = result
    modifiedIds.value.clear()
    emit('updated', result)
    showAlert('成功', '所有状态已保存',() => {
      emit('update:visible', false)
    })
  } catch (error) {
    console.error('保存状态失败:', error)
    showAlert('错误', '保存状态失败')
  }
}

// 关闭窗口（先保存未保存的修改）
const handleClose = async () => {
  if (hasModifications()) {
    showConfirm('提示', '有未保存的修改，是否保存?', async () => {
      try {
        const result = await invoke<Status[]>('update_statuses', { statuses: localStatuses.value })
        localStatuses.value = result
        modifiedIds.value.clear()
        emit('updated', result)
        emit('update:visible', false)
      } catch (error) {
        console.error('保存状态失败:', error)
        showAlert('错误', '保存状态失败')
      }
    })
  } else {
    emit('update:visible', false)
  }
}

// 拖动调整大小
const startResize = (direction: string, event: MouseEvent) => {
  event.preventDefault()
  
  const startX = event.clientX
  const startY = event.clientY
  const startWidth = modalWidth.value
  const startHeight = modalHeight.value
  
  const handleMouseMove = (e: MouseEvent) => {
    if (direction === 'right' || direction === 'corner') {
      const newWidth = startWidth + (e.clientX - startX)
      modalWidth.value = Math.max(400, Math.min(800, newWidth))
    }
    if (direction === 'bottom' || direction === 'corner') {
      const newHeight = startHeight + (e.clientY - startY)
      modalHeight.value = Math.max(400, Math.min(800, newHeight))
    }
  }
  
  const handleMouseUp = () => {
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
  }
  
  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
}

// 清理事件监听器
onUnmounted(() => {
  // 清理代码
})
</script>


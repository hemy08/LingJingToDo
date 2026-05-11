<template>
  <div v-if="visible" class="priority-modal" @click.self="handleClose">
    <div 
      class="priority-modal-content" 
      :style="{ width: modalWidth + 'px', height: modalHeight + 'px' }"
      ref="modalRef"
    >
      <!-- 拖动调整大小的手柄 -->
      <div class="resize-handle resize-right" @mousedown="startResize('right', $event)"></div>
      <div class="resize-handle resize-bottom" @mousedown="startResize('bottom', $event)"></div>
      <div class="resize-handle resize-corner" @mousedown="startResize('corner', $event)"></div>
      
      <h3><i class="fas fa-flag"></i> 自定义优先级</h3>
      <div class="config-list">
        <div v-for="(priority, index) in localPriorities" :key="priority.id" class="config-card">
          <div class="card-left">
            <select v-model="priority.emoji" class="emoji-select" @change="markAsModified(priority.id)">
              <option v-for="emoji in availableEmojis" :key="emoji" :value="emoji">{{ emoji }}</option>
            </select>
            <input 
              v-model="priority.name" 
              class="config-input" 
              placeholder="优先级名称"
              @change="markAsModified(priority.id)"
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
              v-if="index < localPriorities.length - 1" 
              class="btn-sm" 
              @click="moveDown(index)"
              title="下移"
            >
              <span>⬇️</span>
            </button>
            <button class="card-delete-btn" @click="deletePriority(priority.id)">
              <span>❌</span> 删除
            </button>
          </div>
        </div>
      </div>
      <div class="add-config">
        <select v-model="newPriorityEmoji" class="emoji-select">
          <option v-for="emoji in availableEmojis" :key="emoji" :value="emoji">{{ emoji }}</option>
        </select>
        <input 
          v-model="newPriorityName" 
          type="text" 
          placeholder="新优先级名称" 
          @keypress.enter="addPriority"
        >
        <button class="btn-sm btn-primary" @click="addPriority">添加</button>
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
  <div v-if="dialogVisible" class="dialog-overlay" @click.self="dialogVisible = false">
    <div class="dialog-box">
      <div class="dialog-header">
        <i :class="dialogIcon"></i>
        <span>{{ dialogTitle }}</span>
      </div>
      <div class="dialog-content">{{ dialogMessage }}</div>
      <div class="dialog-buttons">
        <button v-if="dialogType === 'confirm'" class="btn-sm" @click="handleDialogCancel">取消</button>
        <button class="btn-sm btn-primary" @click="handleDialogConfirm">确定</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue'
import { invoke } from '@tauri-apps/api/core'
import type { Priority } from '../../types'

interface Props {
  visible: boolean
  priorities: Priority[]
}

interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'updated', priorities: Priority[]): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 可用的emoji列表
const availableEmojis = ['🔥', '🚨', '⚡', '⬆️', '⬇️', '🟢','🔵','🟣','🟡','🟠','🔴']

// 本地优先级列表
const localPriorities = ref<Priority[]>([])
const newPriorityName = ref('')
const newPriorityEmoji = ref('🎯')
const modifiedIds = ref<Set<string>>(new Set())

// 对话框状态
const dialogVisible = ref(false)
const dialogType = ref<'alert' | 'confirm'>('alert')
const dialogTitle = ref('')
const dialogMessage = ref('')
const dialogIcon = ref('fas fa-info-circle')
const dialogCallback = ref<(() => void) | null>(null)

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
      const result = await invoke<Priority[]>('get_priorities')
      localPriorities.value = result
      modifiedIds.value.clear()
    } catch (error) {
      console.error('获取优先级列表失败:', error)
      showDialog('alert', '错误', '获取优先级列表失败')
    }
  }
})

// 显示对话框
const showDialog = (
  type: 'alert' | 'confirm',
  title: string,
  message: string,
  callback?: () => void
) => {
  dialogType.value = type
  dialogTitle.value = title
  dialogMessage.value = message
  dialogIcon.value = type === 'alert' ? 'fas fa-info-circle' : 'fas fa-question-circle'
  dialogCallback.value = callback || null
  dialogVisible.value = true
}

// 对话框确认
const handleDialogConfirm = () => {
  dialogVisible.value = false
  if (dialogCallback.value) {
    dialogCallback.value()
  }
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
    const temp = localPriorities.value[index]
    localPriorities.value[index] = localPriorities.value[index - 1]
    localPriorities.value[index - 1] = temp
    modifiedIds.value.add(localPriorities.value[index].id)
    modifiedIds.value.add(localPriorities.value[index - 1].id)
  }
}

// 下移（本地操作）
const moveDown = (index: number) => {
  if (index < localPriorities.value.length - 1) {
    const temp = localPriorities.value[index]
    localPriorities.value[index] = localPriorities.value[index + 1]
    localPriorities.value[index + 1] = temp
    modifiedIds.value.add(localPriorities.value[index].id)
    modifiedIds.value.add(localPriorities.value[index + 1].id)
  }
}

// 添加优先级（本地操作）
const addPriority = () => {
  if (!newPriorityName.value.trim()) {
    showDialog('alert', '提示', '请输入优先级名称')
    return
  }
  
  if (localPriorities.value.some(p => p.name === newPriorityName.value.trim())) {
    showDialog('alert', '提示', '优先级已存在')
    return
  }

  const newPriority: Priority = {
    id: `p_custom_${Date.now()}`,
    name: newPriorityName.value.trim(),
    color: "#a0aec0",
    emoji: newPriorityEmoji.value
  }

  localPriorities.value.push(newPriority)
  modifiedIds.value.add(newPriority.id)
  newPriorityName.value = ''
  newPriorityEmoji.value = '🎯'
}

// 删除优先级（本地操作）
const deletePriority = async (id: string) => {
  if (localPriorities.value.length <= 1) {
    showDialog('alert', '提示', '至少保留一个优先级')
    return
  }

  showDialog('confirm', '确认', '确定删除该优先级吗?', async () => {
    try {
      const result = await invoke<Priority[]>('delete_priority', { id })
      localPriorities.value = result
      modifiedIds.value.delete(id)
      emit('updated', result)
    } catch (error) {
      console.error('删除优先级失败:', error)
      showDialog('alert', '错误', '删除优先级失败')
    }
  })
}

// 保存单个优先级（发送全部数据）

// 保存全部修改（发送全部数据）
const handleSave = async () => {
  try {
    const result = await invoke<Priority[]>('update_priorities', { priorities: localPriorities.value })
    localPriorities.value = result
    modifiedIds.value.clear()
    emit('updated', result)
    showDialog('alert', '成功', '所有优先级已保存')
  } catch (error) {
    console.error('保存优先级失败:', error)
    showDialog('alert', '错误', '保存优先级失败')
  }
}

// 关闭窗口（先保存未保存的修改）
const handleClose = async () => {
  if (hasModifications()) {
    showDialog('confirm', '提示', '有未保存的修改，是否保存?', async () => {
      try {
        const result = await invoke<Priority[]>('update_priorities', { priorities: localPriorities.value })
        localPriorities.value = result
        modifiedIds.value.clear()
        emit('updated', result)
        emit('update:visible', false)
      } catch (error) {
        console.error('保存优先级失败:', error)
        showDialog('alert', '错误', '保存优先级失败')
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

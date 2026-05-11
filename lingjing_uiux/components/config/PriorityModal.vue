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
</template>

<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue'
import { priorityApi } from '../../connections/config_apis'
import { useDialog } from '../../composables/useDialog'
import { createConfigHandlers } from './config_common'
import type { TaskPriority } from '../../types'

interface Props {
  visible: boolean
  priorities: TaskPriority[]
}

interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'updated', priorities: TaskPriority[]): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 可用的emoji列表
const availableEmojis = ['✅', '❎', '⚠️', 'ℹ️', '⏳', '⏸️', '▶️', '🟢', '🔴', '🟡', '🔵', '⚫️', '💀', '🛡️', '🔔',
    '📋', '📌', '📝', '⏹️', '📅','🔒','⏰','🚀'
]

// 本地优先级列表
const localPriorities = ref<TaskPriority[]>([])
const newPriorityName = ref('')
const newPriorityEmoji = ref('📋')
const modifiedIds = ref<Set<string>>(new Set())

// 模态框大小
const modalWidth = ref(800)
const modalHeight = ref(600)
const modalRef = ref<HTMLElement | null>(null)

// 创建配置处理函数
const { handleSave: configHandleSave, handleClose: configHandleClose, handleDelete: configHandleDelete, handleAdd: configHandleAdd, handleMoveUp, handleMoveDown, handleStartResize } = createConfigHandlers<TaskPriority>()
const { showAlert } = useDialog()

// 是否有修改
const hasModifications = () => modifiedIds.value.size > 0

// 监听 visible 变化，从后端获取最新数据
watch(() => props.visible, async (newVisible) => {
  if (newVisible) {
    try {
      const result = await priorityApi.getAll()
      localPriorities.value = result
      modifiedIds.value.clear()
    } catch (error) {
      console.error('获取优先级列表失败:', error)
      showAlert('错误', '获取优先级列表失败')
    }
  }
})

// 标记为已修改
const markAsModified = (id: string) => {
  modifiedIds.value.add(id)
}

// 上移（本地操作）
const moveUp = (index: number) => {
  handleMoveUp(index, localPriorities, modifiedIds)
}

// 下移（本地操作）
const moveDown = (index: number) => {
  handleMoveDown(index, localPriorities, modifiedIds)
}

// 添加状态（本地操作）
const addPriority = () => {
  configHandleAdd(
    newPriorityName,
    newPriorityEmoji,
    localPriorities,
    modifiedIds,
    '优先级',
    'p_custom',
    (id, name, emoji) => ({
      id,
      name,
      color: "#a0aec0",
      emoji
    })
  )
  newPriorityEmoji.value = '📋'
}

// 删除状态（本地操作）
const deletePriority = async (id: string) => {
  await configHandleDelete(
    id,
    localPriorities,
    priorityApi.delete.bind(priorityApi),
    modifiedIds,
    (result) => emit('updated', result),
    '优先级'
  )
}

// 保存全部修改（发送全部数据）
const handleSave = async () => {
  await configHandleSave(
    localPriorities,
    priorityApi.update.bind(priorityApi),
    modifiedIds,
    (result) => emit('updated', result),
    () => emit('update:visible', false),
    '优先级',
    true
  )
}

// 关闭窗口（先保存未保存的修改）
const handleClose = async () => {
  await configHandleClose(
    hasModifications,
    localPriorities,
    priorityApi.update.bind(priorityApi),
    modifiedIds,
    (result) => emit('updated', result),
    () => emit('update:visible', false),
    '优先级'
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


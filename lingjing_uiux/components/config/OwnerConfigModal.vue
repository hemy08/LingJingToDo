<template>
  <div v-if="visible" class="status-modal" @click.self="handleClose">
    <div
      ref="modalRef"
      class="status-modal-content"
      :style="{ width: modalWidth + 'px', height: modalHeight + 'px' }"
    >
      <!-- 拖动调整大小的手柄 -->
      <div class="resize-handle resize-right" @mousedown="startResize('right', $event)"></div>
      <div class="resize-handle resize-bottom" @mousedown="startResize('bottom', $event)"></div>
      <div class="resize-handle resize-corner" @mousedown="startResize('corner', $event)"></div>

      <h3><i class="fas fa-users"></i> 自定义责任人</h3>
      <div class="config-list">
        <div v-for="(owner, index) in localOwners" :key="owner.id" class="config-card">
          <div class="card-left">
            <select v-model="owner.emoji" class="emoji-select" @change="markAsModified(owner.id)">
              <option v-for="emoji in availableEmojis" :key="emoji" :value="emoji">
                {{ emoji }}
              </option>
            </select>
            <input
              v-model="owner.name"
              class="config-input"
              placeholder="责任人名称"
              @change="markAsModified(owner.id)"
            />
          </div>
          <div class="owner-attributes">
            <div class="attribute-row">
              <label class="attribute-label">技能:</label>
              <input
                :value="(owner.skills || []).join(', ')"
                class="config-input attribute-input"
                placeholder="技能（逗号分隔）"
                @change="handleSkillsChange(owner, ($event.target as HTMLInputElement).value)"
              />
            </div>
            <div class="attribute-row">
              <label class="attribute-label">类型:</label>
              <input
                :value="(owner.types || []).join(', ')"
                class="config-input attribute-input"
                placeholder="类型（逗号分隔）"
                @change="handleTypesChange(owner, ($event.target as HTMLInputElement).value)"
              />
            </div>
          </div>
          <div class="card-actions">
            <button v-if="index > 0" class="btn-sm" title="上移" @click="moveUp(index)">
              <span>⬆️</span>
            </button>
            <button
              v-if="index < localOwners.length - 1"
              class="btn-sm"
              title="下移"
              @click="moveDown(index)"
            >
              <span>⬇️</span>
            </button>
            <button class="card-delete-btn" @click="deleteOwner(owner.id)">
              <span>❌</span> 删除
            </button>
          </div>
        </div>
      </div>
      <div class="add-config">
        <select v-model="newOwnerEmoji" class="emoji-select">
          <option v-for="emoji in availableEmojis" :key="emoji" :value="emoji">{{ emoji }}</option>
        </select>
        <input
          v-model="newOwnerName"
          type="text"
          placeholder="新责任人名称"
          @keypress.enter="addOwner"
        />
        <button class="btn-sm btn-primary" @click="addOwner">添加</button>
      </div>
      <div class="modal-buttons">
        <button class="btn-sm" @click="handleClose"><span>🚫</span> 关闭</button>
        <button class="btn-sm btn-primary" @click="handleSave"><span>💾</span> 保存全部</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue'

import { useDialog } from '../../composables/useDialog'
import { ownerApi } from '../../connections/config_apis'
import type { TaskOwner } from '../../types'

import { createConfigHandlers } from './config_common'

interface Props {
  visible: boolean
  owners: TaskOwner[]
}

interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'updated', owners: TaskOwner[]): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const availableEmojis = [
  '👤',
  '👨',
  '👩',
  '👦',
  '👧',
  '🧑',
  '👶',
  '🧓',
  '👨‍💼',
  '👩‍💼',
  '👨‍🔬',
  '👩‍🔬',
  '👨‍💻',
  '👩‍💻',
  '🤖',
  '🦾',
  '🦿',
  '👔',
  '🎯',
  '⭐',
  '🌟',
  '💫',
  '🔥',
  '💪',
]

const localOwners = ref<TaskOwner[]>([])
const newOwnerName = ref('')
const newOwnerEmoji = ref('👤')
const modifiedIds = ref<Set<string>>(new Set())

const modalWidth = ref(800)
const modalHeight = ref(600)
const modalRef = ref<HTMLElement | null>(null)

const {
  handleSave: configHandleSave,
  handleClose: configHandleClose,
  handleDelete: configHandleDelete,
  handleAdd: configHandleAdd,
  handleMoveUp: handleMoveUp,
  handleMoveDown: handleMoveDown,
  handleStartResize: handleStartResize,
} = createConfigHandlers<TaskOwner>()
const { showAlert } = useDialog()

const hasModifications = () => modifiedIds.value.size > 0

watch(
  () => props.visible,
  async newVisible => {
    if (newVisible) {
      try {
        const result = await ownerApi.getAll()
        localOwners.value = result
        modifiedIds.value.clear()
      } catch (error) {
        console.error('获取责任人列表失败:', error)
        showAlert('错误', '获取责任人列表失败')
      }
    }
  }
)

const markAsModified = (id: string) => {
  modifiedIds.value.add(id)
}

const moveUp = (index: number) => {
  handleMoveUp(index, localOwners, modifiedIds)
}

const moveDown = (index: number) => {
  handleMoveDown(index, localOwners, modifiedIds)
}

const addOwner = () => {
  configHandleAdd(
    newOwnerName,
    newOwnerEmoji,
    localOwners,
    modifiedIds,
    '责任人',
    'owner_custom',
    (id, name, emoji) => ({
      id,
      name,
      color: '#a0aec0',
      emoji,
      skills: [],
      types: [],
    })
  )
  newOwnerEmoji.value = '👤'
}

const deleteOwner = async (id: string) => {
  await configHandleDelete(
    id,
    localOwners,
    ownerApi.delete.bind(ownerApi),
    modifiedIds,
    result => emit('updated', result),
    '责任人'
  )
}

const handleSave = async () => {
  await configHandleSave(
    localOwners,
    ownerApi.update.bind(ownerApi),
    modifiedIds,
    result => emit('updated', result),
    () => emit('update:visible', false),
    '责任人',
    true
  )
}

const handleClose = async () => {
  await configHandleClose(
    hasModifications,
    localOwners,
    ownerApi.update.bind(ownerApi),
    modifiedIds,
    result => emit('updated', result),
    () => emit('update:visible', false),
    '责任人'
  )
}

const startResize = (direction: string, event: MouseEvent) => {
  handleStartResize(direction, event, modalWidth, modalHeight)
}

const handleSkillsChange = (owner: TaskOwner, value: string) => {
  owner.skills = value.split(',').map(s => s.trim()).filter(s => s.length > 0)
  markAsModified(owner.id)
}

const handleTypesChange = (owner: TaskOwner, value: string) => {
  owner.types = value.split(',').map(s => s.trim()).filter(s => s.length > 0)
  markAsModified(owner.id)
}

onUnmounted(() => {
})
</script>

<template>
  <div 
    class="task-card"
    :class="{ 'selected': selectedTaskId === task.id }"
    @click="$emit('select', task.id)"
  >
    <div class="task-card-header">
      <h3 
          v-if="!isEditing"
          class="task-title" 
          @dblclick.stop="startEdit"
          title="双击编辑"
        >{{ task.title }}</h3>
        <input
          v-else
          v-model="editTitle"
          class="edit-input task-edit-input"
          @blur="saveEdit"
          @keyup.enter="saveEdit"
          @keyup.escape="cancelEdit"
          ref="editInput"
          @click.stop
        />
      <div class="task-actions">
        <button 
          class="action-btn toggle-subtask-btn"
          @click="$emit('toggle-subtask-mode', task.id)"
          @mousedown.stop
          @click.stop
          :title="subtaskDisplayMode === 'card' ? '切换为表格显示' : '切换为卡片显示'"
        >
          <i :class="subtaskDisplayMode === 'card' ? 'fas fa-table' : 'fas fa-th-large'"></i>
          {{ subtaskDisplayMode === 'card' ? '表格' : '卡片' }}
        </button>
        <button 
          class="action-btn add-subtask-btn"
          @click="$emit('add-subtask', task)"
          @mousedown.stop
          @click.stop
        >
          <i class="fas fa-plus"></i>
          添加子任务
        </button>
        <button 
          class="action-btn delete-btn"
          @click="$emit('delete', task.id)"
          @mousedown.stop
          @click.stop
        >
          <i class="fas fa-trash"></i>
          删除
        </button>
      </div>
    </div>
    <div class="task-card-body">
      <div class="task-meta-row">
        <div class="meta-item">
          <label class="meta-label">📌 状态:</label>
          <select 
            class="meta-select"
            :value="task.statusId"
            @change="$emit('update', { ...task, statusId: ($event.target as HTMLSelectElement).value })"
          >
            <option v-for="status in statuses" :key="status.id" :value="status.id">{{ status.emoji }} {{ status.name }}
            </option>
          </select>
        </div>
        <div class="meta-item">
          <label class="meta-label">🏷️ 类型:</label>
          <select 
            class="meta-select"
            :value="task.typeId"
            @change="$emit('update', { ...task, typeId: ($event.target as HTMLSelectElement).value })"
          >
            <option v-for="type in types" :key="type.id" :value="type.id">{{ type.emoji }} {{ type.name }}
            </option>
          </select>
        </div>
        <div class="meta-item">
          <label class="meta-label">📁 优先级:</label>
          <select 
            class="meta-select"
            :value="task.priorityId"
            @change="$emit('update', { ...task, priorityId: ($event.target as HTMLSelectElement).value })"
          >
            <option v-for="priority in priorities" :key="priority.id" :value="priority.id">{{ priority.emoji }} {{ priority.name }}
            </option>
          </select>
        </div>
        <div class="meta-item">
          <label class="meta-label">📅 截止时间:</label>
          <input 
            type="date"
            class="meta-select"
            :value="task.dueDate"
            @change="$emit('update', { ...task, dueDate: ($event.target as HTMLInputElement).value })"
          />
        </div>
      </div>

      <!-- 子任务区域 -->
      <div v-if="task.subtasks && task.subtasks.length > 0" class="subtasks-section">
        <div class="subtasks-header">
          <i class="fas fa-tasks"></i>
          子任务 ({{ task.subtasks.length }})
        </div>
        <slot name="subtasks" :subtasks="task.subtasks" :display-mode="subtaskDisplayMode"></slot>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue'

const props = defineProps<{
  task: Task
  statuses: Status[]
  types: Type[]
  priorities: Priority[]
  subtaskDisplayMode: 'card' | 'table'
  selectedTaskId?: number | null
}>()

const emit = defineEmits<{
  update: [task: Task]
  delete: [taskId: number]
  'add-subtask': [task: Task]
  'toggle-subtask-mode': [taskId: number]
  select: [taskId: number | null]
}>()

import type { Task, Status, Type, Priority } from '../../types'


// 编辑状态
const isEditing = ref(false)
const editTitle = ref('')
const editInput = ref<HTMLInputElement | null>(null)

// 开始编辑
const startEdit = async () => {
  isEditing.value = true
  editTitle.value = props.task.title
  await nextTick()
  editInput.value?.focus()
}

// 保存编辑
const saveEdit = () => {
  if (editTitle.value.trim()) {
    emit('update', { ...props.task, title: editTitle.value.trim() })
  }
  isEditing.value = false
}

// 取消编辑
const cancelEdit = () => {
  isEditing.value = false
}

</script>

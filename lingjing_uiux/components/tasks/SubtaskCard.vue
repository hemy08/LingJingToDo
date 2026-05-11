<template>
  <div class="subtask-card">
    <div class="drag-handle subtask-drag-handle" title="拖动排序">
      <i class="fas fa-grip-vertical"></i>
    </div>
    <div class="subtask-card-header">
      <h4 
          v-if="!isEditing"
          class="subtask-title" 
          @click="startEdit"
          title="单击编辑"
        >{{ subtask.title }}</h4>
        <input
          v-else
          v-model="editTitle"
          class="edit-input"
          @blur="saveEdit"
          @keyup.enter="saveEdit"
          @keyup.escape="cancelEdit"
          ref="editInput"
        />
      <button 
        class="subtask-delete-btn"
        @click="$emit('delete', subtask.id)"
        @mousedown.stop
        @click.stop
      >
        <i class="fas fa-trash"></i>
      </button>
    </div>
    <div class="subtask-card-body">
      <div class="task-meta-row">
        <div class="meta-item">
          <label class="meta-label">📌 状态:</label>
          <select 
            class="meta-select"
            :value="subtask.statusId"
            @change="$emit('update', { ...subtask, statusId: ($event.target as HTMLSelectElement).value })"
          >
            <option v-for="status in statuses" :key="status.id" :value="status.id">{{ status.emoji }} {{ status.name }}
            </option>
          </select>
        </div>
        <div class="meta-item">
          <label class="meta-label">🏷️ 类型:</label>
          <select 
            class="meta-select"
            :value="subtask.typeId"
            @change="$emit('update', { ...subtask, typeId: ($event.target as HTMLSelectElement).value })"
          >
            <option v-for="type in types" :key="type.id" :value="type.id">{{ type.emoji }} {{ type.name }}
            </option>
          </select>
        </div>
        <div class="meta-item">
          <label class="meta-label">📁 优先级:</label>
          <select 
            class="meta-select"
            :value="subtask.priorityId"
            @change="$emit('update', { ...subtask, priorityId: ($event.target as HTMLSelectElement).value })"
          >
            <option v-for="priority in priorities" :key="priority.id" :value="priority.id">{{ priority.emoji }} {{ priority.name }}
            </option>
          </select>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  subtask: Task
  statuses: Status[]
  types: Type[]
  priorities: Priority[]
}>()

const emit = defineEmits<{
  update: [task: Task]
  delete: [taskId: number]
}>()

import type { Task, Status, Type, Priority } from '../../types'


// 编辑状态
const isEditing = ref(false)
const editTitle = ref('')

// 开始编辑
const startEdit = () => {
  isEditing.value = true
  editTitle.value = props.subtask.title
}

// 保存编辑
const saveEdit = () => {
  if (editTitle.value.trim()) {
    emit('update', { ...props.subtask, title: editTitle.value.trim() })
  }
  isEditing.value = false
}

// 取消编辑
const cancelEdit = () => {
  isEditing.value = false
}

</script>

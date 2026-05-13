<template>
  <div class="subtask-card">
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
        <!-- 起始日期 -->
        <div class="meta-item">
          <label class="meta-label">🕐</label>
          <input
            type="date"
            class="meta-select"
            :value="subtask.created_at"
            @change="$emit('update', { ...subtask, created_at: ($event.target as HTMLInputElement).value })"
          />
        </div>
        <!-- 截止日期 -->
        <div class="meta-item">
          <label class="meta-label">📅</label>
          <input
            type="date"
            class="meta-select"
            :value="subtask.due_date"
            @change="$emit('update', { ...subtask, due_date: ($event.target as HTMLInputElement).value })"
          />
        </div>
        <!-- 类型 -->
        <div class="meta-item">
          <label class="meta-label">🏷️</label>
          <select
            class="meta-select"
            :value="subtask.type_id"
            @change="$emit('update', { ...subtask, type_id: ($event.target as HTMLSelectElement).value })"
          >
            <option v-for="type in types" :key="type.id" :value="type.id">{{ type.emoji }} {{ type.name }}
            </option>
          </select>
        </div>
        <!-- 状态 -->
        <div class="meta-item">
          <label class="meta-label">📌</label>
          <select
            class="meta-select"
            :value="subtask.status_id"
            @change="$emit('update', { ...subtask, status_id: ($event.target as HTMLSelectElement).value })"
          >
            <option v-for="status in statuses" :key="status.id" :value="status.id">{{ status.emoji }} {{ status.name }}
            </option>
          </select>
        </div>
        <!-- 优先级 -->
        <div class="meta-item">
          <label class="meta-label">📁</label>
          <select
            class="meta-select"
            :value="subtask.priority_id"
            @change="$emit('update', { ...subtask, priority_id: ($event.target as HTMLSelectElement).value })"
          >
            <option v-for="priority in priorities" :key="priority.id" :value="priority.id">{{ priority.emoji }} {{ priority.name }}
            </option>
          </select>
        </div>
      </div>

      <!-- 详细信息区域 -->
      <div class="task-detail-section">
        <div class="detail-header">
          <i class="fas fa-info-circle"></i>
          <span>详细信息</span>
        </div>
        <textarea
          class="detail-textarea"
          :value="subtask.remark || ''"
          @change="$emit('update', { ...subtask, remark: ($event.target as HTMLTextAreaElement).value })"
          placeholder="添加子任务详细描述..."
          rows="2"
        ></textarea>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  subtask: Task
  statuses: TaskStatus[]
  types: TaskType[]
  priorities: TaskPriority[]
}>()

const emit = defineEmits<{
  update: [task: Task]
  delete: [taskId: string]
}>()

import type { Task, TaskStatus, TaskType, TaskPriority } from '../../types'


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

// 格式化日期
const formatDate = (dateStr: string) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

</script>

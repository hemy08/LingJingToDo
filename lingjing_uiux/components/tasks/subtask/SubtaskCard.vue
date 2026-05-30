<template>
  <div class="subtask-card">
    <div class="subtask-card-header">
      <h4 v-if="!isEditing" class="subtask-title" title="单击编辑" @click="startEdit">
        {{ subtask.title }}
      </h4>
      <input
        v-else
        ref="editInput"
        v-model="editTitle"
        class="edit-input"
        @blur="saveEdit"
        @keyup.enter.prevent="saveEdit"
        @keyup.escape.prevent="cancelEdit"
        @click.stop
      />
      <button class="subtask-delete-btn" @click="onDeleteSubtask" @mousedown.stop @click.stop>
        <i class="fas fa-trash">DEL</i>
      </button>
    </div>
    <div class="subtask-card-body">
      <div class="task-meta-row">
        <!-- 创建日期 -->
        <div v-if="subtask.created_date" class="meta-item">
          <label class="meta-label">🕐</label>
          <span class="meta-text" :title="subtask.created_date">{{
            formatDate(subtask.created_date)
          }}</span>
        </div>
        <!-- 截止日期 -->
        <div class="meta-item">
          <label class="meta-label">📅</label>
          <input
            type="date"
            class="meta-select"
            :value="subtask.due_date"
            @change="
              onUpdateSubtask({ ...subtask, due_date: ($event.target as HTMLInputElement).value })
            "
          />
        </div>
        <!-- 类型 -->
        <div class="meta-item">
          <select
            class="meta-select"
            :value="subtask.type_id"
            @change="
              onUpdateSubtask({ ...subtask, type_id: ($event.target as HTMLSelectElement).value })
            "
          >
            <option v-for="type in types" :key="type.id" :value="type.id">
              {{ type.emoji }} {{ type.name }}
            </option>
          </select>
        </div>
        <!-- 状态 -->
        <div class="meta-item">
          <select
            class="meta-select"
            :value="subtask.status_id"
            @change="
              onUpdateSubtask({ ...subtask, status_id: ($event.target as HTMLSelectElement).value })
            "
          >
            <option v-for="status in statuses" :key="status.id" :value="status.id">
              {{ status.emoji }} {{ status.name }}
            </option>
          </select>
        </div>
        <!-- 优先级 -->
        <div class="meta-item">
          <select
            class="meta-select"
            :value="subtask.priority_id"
            @change="
              onUpdateSubtask({
                ...subtask,
                priority_id: ($event.target as HTMLSelectElement).value,
              })
            "
          >
            <option v-for="priority in priorities" :key="priority.id" :value="priority.id">
              {{ priority.emoji }} {{ priority.name }}
            </option>
          </select>
        </div>
        <!-- 责任人 -->
        <div class="meta-item">
          <select
            class="meta-select"
            :value="subtask.owner_id || ''"
            @change="
              onUpdateSubtask({
                ...subtask,
                owner_id: ($event.target as HTMLSelectElement).value || undefined,
              })
            "
          >
            <option value="">未分配</option>
            <option v-for="owner in owners" :key="owner.id" :value="owner.id">
              {{ owner.emoji }} {{ owner.name }}
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
          placeholder="添加子任务详细描述..."
          rows="2"
          @blur="
            onUpdateSubtask({ ...subtask, remark: ($event.target as HTMLTextAreaElement).value })
          "
        ></textarea>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, type Ref } from 'vue'

import type { Task, TaskStatus, TaskType, TaskPriority, TaskOwner } from '../../../types.ts'

const props = defineProps<{
  subtask: Task
  statuses: TaskStatus[]
  types: TaskType[]
  priorities: TaskPriority[]
  owners: TaskOwner[]
  parentId: string
  currentDate: string
  tasks: Task[] | Ref<Task[]>
}>()

const emit = defineEmits<{
  update: [subtask: Task]
  delete: [subtaskId: string]
}>()

// 编辑状态
const isEditing = ref(false)
const editTitle = ref('')
const editInput = ref<HTMLInputElement | null>(null)

// 开始编辑
const startEdit = () => {
  isEditing.value = true
  editTitle.value = props.subtask.title
  // 下一帧聚焦输入框
  nextTick(() => {
    if (editInput.value) {
      editInput.value.focus()
    }
  })
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
  editTitle.value = props.subtask.title
}

// 处理子任务更新
const onUpdateSubtask = (updatedSubtask: Task) => {
  emit('update', updatedSubtask)
}

// 处理子任务删除
const onDeleteSubtask = () => {
  emit('delete', props.subtask.id)
}

// 格式化日期
const formatDate = (dateStr: string) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}
</script>

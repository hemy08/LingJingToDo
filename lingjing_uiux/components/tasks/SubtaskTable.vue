<template>
  <div class="subtasks-list table-mode">
    <table class="subtask-table auto-wrap" >
      <colgroup>
        <col style="width: 20px">
        <col style="width: 300px">
        <col style="width: 120px">
        <col style="width: 120px">
        <col style="width: 120px">
        <col style="width: 120px">
        <col style="width: 120px">
        <col style="width: 300px">
        <col style="width: 40px">
      </colgroup>
      <thead>
        <tr>
          <th>#</th>
          <th>任务</th>
          <th>🕐创建日期</th>
          <th>📅截止日期</th>
          <th>🏷️状态</th>
          <th>📌类型</th>
          <th>📁优先级</th>
          <th>备注</th>
          <th>Op</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(subtask, index) in subtasks" :key="subtask.id">
          <td>{{ index + 1 }}</td>
          <td>
            <div class="cell-content" :title="subtask.title">
              <input
                type="text"
                class="inline-input"
                :value="subtask.title"
                @blur="handleTitleInput(subtask, ($event.target as HTMLInputElement).value)"
              />
            </div>
          </td>
          <td>
            <span class="date-text" v-if="subtask.created_date">{{ formatDate(subtask.created_date) }}</span>
          </td>
          <td>
            <input
              type="date"
              class="inline-date"
              :value="subtask.due_date"
              @change="onUpdateSubtask({ ...subtask, due_date: ($event.target as HTMLInputElement).value })"
            />
          </td>
          <td>
            <select
              class="inline-select"
              :value="subtask.status_id"
              @change="onUpdateSubtask({ ...subtask, status_id: ($event.target as HTMLSelectElement).value })"
            >
              <option v-for="status in statuses" :key="status.id" :value="status.id">
                {{ status.emoji }} {{ status.name }}
              </option>
            </select>
          </td>
          <td>
            <select
              class="inline-select"
              :value="subtask.type_id"
              @change="onUpdateSubtask({ ...subtask, type_id: ($event.target as HTMLSelectElement).value })"
            >
              <option v-for="type in types" :key="type.id" :value="type.id">
                {{ type.emoji }} {{ type.name }}
              </option>
            </select>
          </td>
          <td>
            <select
              class="inline-select"
              :value="subtask.priority_id"
              @change="onUpdateSubtask({ ...subtask, priority_id: ($event.target as HTMLSelectElement).value })"
            >
              <option v-for="priority in priorities" :key="priority.id" :value="priority.id">
                {{ priority.emoji }} {{ priority.name }}
              </option>
            </select>
          </td>
          <td>
            <div class="cell-content" :title="subtask.remark || ''">
              <input
                type="text"
                class="inline-input"
                placeholder="添加备注..."
                :value="subtask.remark || ''"
                @blur="handleRemarkInput(subtask, ($event.target as HTMLInputElement).value)"
              />
            </div>
          </td>
          <td>
            <button
              class="subtask-delete-btn"
              @click="onDeleteSubtask(subtask.id)"
              @mousedown.stop
              @click.stop
            >
              <i class="fas fa-trash">删除</i>
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { type Ref } from 'vue'
import type { Task, TaskStatus, TaskType, TaskPriority } from '../../types'
import { handleUpdateSubtask, handleDeleteSubtask } from './tasks_common'

const props = defineProps<{
  subtasks: Task[]
  statuses: TaskStatus[]
  types: TaskType[]
  priorities: TaskPriority[]
  parentId: string
  currentDate: string
  tasks: Task[] | Ref<Task[]>
}>()

// 处理子任务更新
const onUpdateSubtask = (updatedSubtask: Task) => {
  handleUpdateSubtask(
    props.currentDate,
    props.parentId,
    updatedSubtask,
    props.tasks
  )
}

// 处理子任务删除
const onDeleteSubtask = (subtaskId: string) => {
  handleDeleteSubtask(
    props.currentDate,
    props.parentId,
    subtaskId,
    props.tasks
  )
}

// 处理标题输入
const handleTitleInput = (subtask: Task, value: string) => {
  onUpdateSubtask({ ...subtask, title: value })
}

// 处理备注输入
const handleRemarkInput = (subtask: Task, value: string) => {
  onUpdateSubtask({ ...subtask, remark: value })
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

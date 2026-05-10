<template>
  <div class="subtasks-list table-mode">
    <div class="table-options">
      <label class="wrap-toggle">
        <input type="checkbox" v-model="autoWrap" />
        自动换行
      </label>
    </div>
    <table class="subtask-table" :class="{ 'auto-wrap': autoWrap }">
      <colgroup>
        <col style="width: 40px">
        <col style="width: 40px">
        <col style="width: 150px">
        <col style="width: 120px">
        <col style="width: 120px">
        <col style="width: 120px">
        <col style="width: 100px">
        <col style="width: 60px">
      </colgroup>
      <thead>
        <tr>
          <th>#</th>
          <th></th>
          <th>任务</th>
          <th>状态</th>
          <th>类型</th>
          <th>优先级</th>
          <th>备注</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(subtask, index) in subtasks" :key="subtask.id">
          <td>{{ index + 1 }}</td>
          <td>
            <div class="drag-handle subtask-drag-handle" title="拖动排序">
              <i class="fas fa-grip-vertical"></i>
            </div>
          </td>
          <td>
            <div class="cell-content" :title="subtask.title">
              <input 
                type="text"
                class="inline-input"
                :value="subtask.title"
                @change="$emit('update', { ...subtask, title: ($event.target as HTMLInputElement).value })"
              />
            </div>
          </td>
          <td>
            <select 
              class="inline-select"
              :value="subtask.statusId"
              @change="$emit('update', { ...subtask, statusId: ($event.target as HTMLSelectElement).value })"
            >
              <option v-for="status in statuses" :key="status.id" :value="status.id">
                {{ status.emoji }} {{ status.name }}
              </option>
            </select>
          </td>
          <td>
            <select 
              class="inline-select"
              :value="subtask.typeId"
              @change="$emit('update', { ...subtask, typeId: ($event.target as HTMLSelectElement).value })"
            >
              <option v-for="type in types" :key="type.id" :value="type.id">
                {{ type.emoji }} {{ type.name }}
              </option>
            </select>
          </td>
          <td>
            <select 
              class="inline-select"
              :value="subtask.priorityId"
              @change="$emit('update', { ...subtask, priorityId: ($event.target as HTMLSelectElement).value })"
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
                @change="$emit('update', { ...subtask, remark: ($event.target as HTMLInputElement).value })"
              />
            </div>
          </td>
          <td>
            <button 
              class="subtask-delete-btn"
              @click="$emit('delete', subtask.id)"
              @mousedown.stop
              @click.stop
            >
              <i class="fas fa-trash"></i>
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { Task, Status, Type, Priority } from '../../types'

defineProps<{
  subtasks: Task[]
  statuses: Status[]
  types: Type[]
  priorities: Priority[]
}>()

defineEmits<{
  update: [task: Task]
  delete: [taskId: number]
}>()

const autoWrap = ref(true)
</script>

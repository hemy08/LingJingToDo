<template>
  <div class="task-add-area">
    <input
      v-model="newTaskTitle"
      class="common-input task-input"
      placeholder="输入任务标题,按回车添加..."
      @keyup.enter="handleAddTask"
    />
    <button class="btn-primary" @click="handleAddTask">
      <i class="fas fa-plus"></i>
      添加
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

import { taskApi } from '../../../connections/task_apis.ts'
import type { Task, TaskStatus, TaskType, TaskPriority } from '../../../types.ts'

const props = defineProps<{
  statuses: TaskStatus[]
  types: TaskType[]
  priorities: TaskPriority[]
  currentDate: string | null
  isDirty: boolean
}>()

const emit = defineEmits<{
  'update:isDirty': [value: boolean]
  'task-added': [task: Task]
}>()

const newTaskTitle = ref('')

const markDirty = () => {
  if (!props.isDirty) {
    emit('update:isDirty', true)
  }
}

const getDueDateOneMonthLater = () => {
  const now = new Date()
  const oneMonthLater = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate())
  return oneMonthLater.toISOString().split('T')[0]
}

const handleAddTask = async () => {
  if (!newTaskTitle.value.trim()) return
  if (!props.currentDate) return

  try {
    const taskId = await taskApi.generateMainTaskId()

    const newTask: Task = {
      id: taskId,
      title: newTaskTitle.value.trim(),
      status_id: 'st_default',
      type_id: 'ty_requirement',
      priority_id: 'p3',
      due_date: getDueDateOneMonthLater(),
      created_date: new Date().toISOString(),
    }

    emit('task-added', newTask)
    markDirty()
    newTaskTitle.value = ''
  } catch (error) {
    console.error('生成任务 ID 失败:', error)
  }
}
</script>

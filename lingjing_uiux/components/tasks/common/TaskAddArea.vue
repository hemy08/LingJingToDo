<template>
  <div class="task-add-area">
    <input
      v-model="newTaskTitle"
      class="task-input"
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
import type { Task, TaskStatus } from '../../../types.ts'
import { taskApi } from '../../../connections/task_apis.ts'

const props = defineProps<{
  statuses: TaskStatus[]
  currentDate: string | null
  isDirty: boolean
}>()

const emit = defineEmits<{
  'update:isDirty': [value: boolean]
  'task-added': [task: Task]
}>()

const newTaskTitle = ref('')

// 标记数据已修改
const markDirty = () => {
  if (!props.isDirty) {
    emit('update:isDirty', true)
  }
}

// 添加任务
const handleAddTask = async () => {
  if (!newTaskTitle.value.trim()) return
  if (!props.currentDate) return

  try {
    // 从后端生成任务 ID
    const taskId = await taskApi.generateMainTaskId()

    const newTask: Task = {
      id: taskId,
      title: newTaskTitle.value.trim(),
      status_id: props.statuses[0].id,
      type_id: "",
      priority_id: "",
      due_date: undefined,
      created_date: new Date().toISOString()
    }

    emit('task-added', newTask)
    markDirty()
    newTaskTitle.value = ''
  } catch (error) {
    console.error('生成任务 ID 失败:', error)
  }
}
</script>

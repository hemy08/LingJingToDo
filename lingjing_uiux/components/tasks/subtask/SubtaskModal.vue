<template>
  <div v-if="visible" class="modal" @click="handleClose">
    <div class="modal-content" @click.stop>
      <h3><i class="fas fa-plus-circle"></i> 添加子任务</h3>
      <div class="form-group">
        <label class="form-label">标题:</label>
        <input v-model="formData.title" class="form-input" placeholder="输入子任务标题，回车键添加..." @keyup.enter="handleSubmit" />
      </div>
      <div class="form-group">
        <label class="form-label">📌 状态:</label>
        <select v-model="formData.status_id" class="form-select">
          <option v-for="status in statuses" :key="status.id" :value="status.id">
            {{ status.name }}
          </option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">🏷️ 类型:</label>
        <select v-model="formData.type_id" class="form-select">
          <option v-for="type in types" :key="type.id" :value="type.id">
            {{ type.name }}
          </option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">📁 优先级:</label>
        <select v-model="formData.priority_id" class="form-select">
          <option v-for="priority in priorities" :key="priority.id" :value="priority.id">
            {{ priority.name }}
          </option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">📅 截止日期:</label>
        <input v-model="formData.due_date" type="date" class="form-input" />
      </div>
      <div class="modal-buttons">
        <button class="btn-sm" @click="handleClose">
          <i class="fas fa-times"></i>
          取消
        </button>
        <button class="btn-sm btn-primary" @click="handleSubmit">
          <i class="fas fa-check"></i>
          确定
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, type Ref } from 'vue'
import type { Task, TaskStatus, TaskType, TaskPriority } from '../../../types.ts'
const props = defineProps<{
  visible: boolean
  parentTask: Task | null
  statuses: TaskStatus[]
  types: TaskType[]
  priorities: TaskPriority[]
  currentDate: string
  tasks: Task[] | Ref<Task[]>
}>()

const emit = defineEmits<{
  close: []
  update: [task: Task]
}>()

// 表单数据
const formData = ref({
  title: '',
  status_id: '',
  type_id: '',
  priority_id: '',
  due_date: ''
})

// 监听visible变化,重置表单
watch(() => props.visible, (newVal) => {
  if (newVal) {
    formData.value = {
      title: '',
      status_id: props.statuses[0]?.id || '',
      type_id: props.types[0]?.id || '',
      priority_id: props.priorities[0]?.id || '',
      due_date: ''
    }
  }
})

// 关闭模态窗口
const handleClose = () => {
  emit('close')
}

// 提交表单
const handleSubmit = () => {
  if (!formData.value.title.trim() || !props.parentTask) return

  const newSubtask: Task = {
    id: `TASK${Date.now()}`,
    title: formData.value.title.trim(),
    status_id: formData.value.status_id,
    type_id: formData.value.type_id,
    priority_id: formData.value.priority_id,
    due_date: formData.value.due_date,
    created_date: new Date().toISOString(),
    subtasks: []
  }

  // 更新父任务，添加新子任务
  const updatedTask = {
    ...props.parentTask,
    subtasks: [...(props.parentTask.subtasks || []), newSubtask]
  }

  // 发出事件，让父组件处理更新
  emit('update', updatedTask)

  // 关闭模态窗口
  handleClose()
}
</script>

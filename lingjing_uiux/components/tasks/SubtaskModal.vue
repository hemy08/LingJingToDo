<template>
  <div v-if="visible" class="modal" @click="$emit('close')">
    <div class="modal-content" @click.stop>
      <h3><i class="fas fa-plus-circle"></i> 添加子任务</h3>
      <div class="form-group">
        <label class="form-label">标题:</label>
        <input v-model="formData.title" class="form-input" placeholder="输入子任务标题，回车键添加..." @keyup.enter="handleSubmit" />
      </div>
      <div class="form-group">
        <label class="form-label">📌 状态:</label>
        <select v-model="formData.statusId" class="form-select">
          <option v-for="status in statuses" :key="status.id" :value="status.id">
            {{ status.name }}
          </option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">🏷️ 类型:</label>
        <select v-model="formData.typeId" class="form-select">
          <option v-for="type in types" :key="type.id" :value="type.id">
            {{ type.name }}
          </option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">📁 优先级:</label>
        <select v-model="formData.priorityId" class="form-select">
          <option v-for="priority in priorities" :key="priority.id" :value="priority.id">
            {{ priority.name }}
          </option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">📅 截止日期:</label>
        <input v-model="formData.dueDate" type="date" class="form-input" />
      </div>
      <div class="modal-buttons">
        <button class="btn-sm" @click="$emit('close')">
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
import { ref, watch } from 'vue'
import type { Status, Type, Priority, Task } from '../../types'

const props = defineProps<{
  visible: boolean
  parentTask: Task | null
  statuses: Status[]
  types: Type[]
  priorities: Priority[]
}>()

const emit = defineEmits<{
  close: []
  submit: [subtask: Task]
}>()

// 表单数据
const formData = ref({
  title: '',
  statusId: '',
  typeId: '',
  priorityId: '',
  dueDate: ''
})

// 监听visible变化,重置表单
watch(() => props.visible, (newVal) => {
  if (newVal) {
    formData.value = {
      title: '',
      statusId: props.statuses[0]?.id || '',
      typeId: props.types[0]?.id || '',
      priorityId: props.priorities[0]?.id || '',
      dueDate: ''
    }
  }
})

// 提交表单
const handleSubmit = () => {
  if (!formData.value.title.trim()) return

  const newSubtask: Task = {
    id: Date.now(),
    title: formData.value.title.trim(),
    statusId: formData.value.statusId,
    typeId: formData.value.typeId,
    priorityId: formData.value.priorityId,
    dueDate: formData.value.dueDate,
    subtasks: []
  }

  emit('submit', newSubtask)
}
</script>

<template>
  <div 
    :data-task-id="task.id"
    class="task-card"
    :class="{ 
      'selected': selectedTaskId === task.id,
      'is-highlighted': isHighlighted
    }"
    @click="$emit('select', task.id)"
  >
    <div class="task-card-header">
      <h3 
          v-if="!isEditing"
          class="task-title" 
          @click.stop="startEdit"
          title="单击编辑"
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
          class="components-action-btn toggle-subtask-btn"
          @click="$emit('toggle-subtask-mode', task.id)"
          @mousedown.stop
          @click.stop
          :title="subtaskDisplayMode === 'card' ? '切换为表格显示' : '切换为卡片显示'"
        >
          <i :class="subtaskDisplayMode === 'card' ? 'fas fa-table' : 'fas fa-th-large'"></i>
          {{ subtaskDisplayMode === 'card' ? '表格' : '卡片' }}
        </button>
        <button 
          class="components-action-btn add-subtask-btn"
          @click="$emit('add-subtask', task)"
          @mousedown.stop
          @click.stop
        >
          <i class="fas fa-plus"></i>
          添加子任务
        </button>
        <button
          class="components-action-btn delete-btn"
          @click="onDeleteTask"
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
        <!-- 创建日期 -->
        <div class="meta-item" v-if="task.created_date">
          <label class="meta-label">🕐</label>
          <span class="meta-text" :title="task.created_date">{{ formatDate(task.created_date) }}</span>
        </div>
        <!-- 截止日期 -->
        <div class="meta-item">
          <label class="meta-label">📅</label>
          <input
            type="date"
            class="meta-select"
            :value="task.due_date"
            @change="onUpdateTask({ ...task, due_date: ($event.target as HTMLInputElement).value })"
          />
        </div>
        <!-- 类型 -->
        <div class="meta-item">
          <label class="meta-label">🏷️</label>
          <select
            class="meta-select"
            :value="task.type_id"
            @change="onUpdateTask({ ...task, type_id: ($event.target as HTMLSelectElement).value })"
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
            :value="task.status_id"
            @change="onUpdateTask({ ...task, status_id: ($event.target as HTMLSelectElement).value })"
            :disabled="task.status_id === 'st_closed' && !canCloseTask"
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
            :value="task.priority_id"
            @change="onUpdateTask({ ...task, priority_id: ($event.target as HTMLSelectElement).value })"
          >
            <option v-for="priority in priorities" :key="priority.id" :value="priority.id">{{ priority.emoji }} {{ priority.name }}
            </option>
          </select>
        </div>
      </div>

      <!-- 详细信息编辑区域 -->
      <div class="task-detail-section">
        <div class="detail-header">
          <i class="fas fa-info-circle"></i>
          <span>详细信息</span>
        </div>
        <textarea
          class="detail-textarea"
          :value="task.remark || ''"
          @change="onUpdateTask({ ...task, remark: ($event.target as HTMLTextAreaElement).value })"
          placeholder="添加任务详细描述..."
          rows="3"
        ></textarea>
      </div>

      <!-- 子任务区域 -->
      <div v-if="taskSubtasks && taskSubtasks.length > 0" class="subtasks-section">
        <div class="subtasks-header">
          <i class="fas fa-tasks"></i>
          子任务 ({{ taskSubtasks.length }})
        </div>
        <slot name="subtasks" :subtasks="taskSubtasks" :display-mode="subtaskDisplayMode"></slot>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, type Ref } from 'vue'
import type { Task, TaskStatus, TaskType, TaskPriority } from '../../types'
import { useTaskHighlightStore } from '../../stores/taskHighlight'

const props = defineProps<{
  task: Task
  statuses: TaskStatus[]
  types: TaskType[]
  priorities: TaskPriority[]
  subtaskDisplayMode: 'card' | 'table'
  selectedTaskId?: string | null
  currentDate: string
  tasks: Task[] | Ref<Task[]>
}>()

const emit = defineEmits<{
  'add-subtask': [task: Task]
  'toggle-subtask-mode': [taskId: string]
  select: [taskId: string | null]
  update: [task: Task]
  delete: [taskId: string]
}>()


// 任务高亮状态
const taskHighlight = useTaskHighlightStore()

// 检查是否高亮
const isHighlighted = computed(() => 
  taskHighlight.isHighlighted(props.task.id)
)

// 子任务列表（响应式）
const taskSubtasks = computed(() => {
  return props.task.subtasks || []
})

// 检查是否可以关闭任务
const canCloseTask = computed(() => {
  if (!taskSubtasks.value || taskSubtasks.value.length === 0) {
    return true
  }
  return taskSubtasks.value.every(subtask => 
    subtask.status_id === 'st_done' || subtask.status_id === 'st_closed'
  )
})

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
    onUpdateTask({ ...props.task, title: editTitle.value.trim() })
  }
  isEditing.value = false
}

// 取消编辑
const cancelEdit = () => {
  isEditing.value = false
}

// 处理任务更新
const onUpdateTask = (updatedTask: Task) => {
  emit('update', updatedTask)
}

// 处理任务删除
const onDeleteTask = () => {
  emit('delete', props.task.id)
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

<style scoped>
/* 高亮样式 */
.task-card.is-highlighted {
  animation: highlight-pulse 2s ease-in-out;
  box-shadow: 0 0 0 3px rgba(33, 150, 243, 0.6),
              0 4px 16px rgba(33, 150, 243, 0.4);
  z-index: 10;
}

/* 高亮脉冲动画 */
@keyframes highlight-pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(33, 150, 243, 0.8);
  }
  50% {
    box-shadow: 0 0 0 8px rgba(33, 150, 243, 0.2),
                0 4px 16px rgba(33, 150, 243, 0.5);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(33, 150, 243, 0),
                0 4px 16px rgba(33, 150, 243, 0.4);
  }
}
</style>

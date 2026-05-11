<script setup lang="ts">

// 使用对话框 composable
const { dialogState, handleButtonClick, handleOverlayClick } = useDialog()

// Splitter 拖动相关
const isSplitterActive = ref(false)
const sidebarWidth = ref(280) // 默认侧边栏宽度

const startSplitterDrag = (event: MouseEvent) => {
  event.preventDefault()
  isSplitterActive.value = true
  
  const startX = event.clientX
  const startWidth = sidebarWidth.value
  
  const handleMouseMove = (e: MouseEvent) => {
    const newWidth = startWidth + (e.clientX - startX)
    sidebarWidth.value = Math.max(300, Math.min(600, newWidth))
  }
  
  const handleMouseUp = () => {
    isSplitterActive.value = false
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
  }
  
  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
}

// 选中的任务ID

// 可用的emoji列表
import { ref, reactive, onMounted } from 'vue'
import { useDialog } from './composables/useDialog'
import CalendarPanel from './components/calendar/CalendarPanel.vue'
import TaskPanel from './components/tasks/TaskPanel.vue'
import StatusModal from './components/config/StatusModal.vue'
import ThemeManager from './components/themes/ThemeManager.vue'
import TypeModal from './components/config/TypeModal.vue'
import PriorityModal from './components/config/PriorityModal.vue'
import {invoke} from "@tauri-apps/api/core";
import type { TaskStatus, TaskType, TaskPriority } from './types'


async function LingJing_GetStatus(): Promise<TaskStatus[]> {
  const result = await invoke<TaskStatus[]>('get_statuses')
  console.log('result', result)
  return result
}

async function LingJing_GetTypes(): Promise<TaskType[]> {
  const result = await invoke<TaskType[]>('get_types')
  console.log('result', result)
  return result
}


async function LingJing_GetPriorities(): Promise<TaskPriority[]> {
  const result = await invoke<TaskPriority[]>('get_priorities')
  console.log('result', result)
  return result
}

const config = reactive<{
  statuses: TaskStatus[]
  types: TaskType[]
  priorities: TaskPriority[]
}>({
  statuses: [],
  types: [],
  priorities: [],
})

const todoData = reactive<Record<string, any[]>>({})
const currentDate = ref('')
const isDirty = ref(false)
const showThemeModal = ref(false)
const showStatusModal = ref(false)
const showTypeModal = ref(false)
const showPriorityModal = ref(false)
const showExportModal = ref(false)
const exportFileName = ref('')

const getTodayStr = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const ensureDate = (date: string) => {
  if (!todoData[date]) todoData[date] = []
}

const markDirty = () => {
  if (!isDirty.value) isDirty.value = true
}

const handleStatusUpdated = (statuses: any) => {
  config.statuses = statuses
}
const handleTypeUpdated = (types: any) => {
  config.types = types
}

const handlePriorityUpdated = (priorities: any) => {
  config.priorities = priorities
}

const handleDateChange = (date: string) => {
  // 切换到新日期
  currentDate.value = date
  ensureDate(date)
}

const exportExcel = () => {
  exportFileName.value = `Todo_Backup_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}`
  showExportModal.value = true
}

const importExcel = () => {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.xlsx'
  input.onchange = (e: any) => {
    if (e.target.files[0]) console.log('Import file:', e.target.files[0].name)
  }
  input.click()
}

onMounted(async () => {
  // 从后端获取状态、类型、优先级数据
  config.statuses = await LingJing_GetStatus()
  config.types = await LingJing_GetTypes()
  config.priorities = await LingJing_GetPriorities()
  currentDate.value = getTodayStr()
  ensureDate(currentDate.value)
  if (todoData[currentDate.value].length === 0) {
    todoData[currentDate.value].push({
      id: 10001, title: "示例主任务", statusId: "st_doing", typeId: "ty_work", priorityId: "p3",
      dueDate: "2026-05-10", description: "", useSubtasks: true, subtasks: [], checklist: [], createdAt: Date.now()
    })
  }
})


</script>

<template>
  <div class="app">
    <div class="sidebar" :style="{ width: sidebarWidth + 'px' }">
      <CalendarPanel :current-date="currentDate" @date-change="handleDateChange" />
      <div class="task-tree">
        <div class="task-tree-title"><i class="fas fa-diagram-project"></i> 任务导航树</div>
        <div class="task-tree-container">
          <div 
            v-for="task in todoData[currentDate] || []" 
            :key="task.id" 
            class="tree-node"
            
            
          >
            📌 {{ task.title }}
            <!-- 子任务 -->
            <div v-if="task.subtasks && task.subtasks.length > 0" class="subtask-nodes">
              <div 
                v-for="subtask in task.subtasks" 
                :key="subtask.id" 
                class="tree-node subtask-node"
                
                
              >
                └─ {{ subtask.title }}
              </div>
            </div>
          </div>
          <div v-if="!todoData[currentDate]?.length" class="empty-tree">暂无任务</div>
        </div>
      </div>
    </div>
    <div class="splitter" :class="{ active: isSplitterActive }" @mousedown="startSplitterDrag"></div>
    <div class="main-content">
      <div class="toolbar">
        <div class="toolbar-left">
          <h2>灵境待办 v1.0.0</h2>
          <span v-if="isDirty" class="unsaved-indicator">● 未保存</span>
        </div>
        <div class="toolbar-right">
          <button class="btn-sm" @click="showThemeModal = true"><i class="fas fa-palette"></i> 主题</button>
          <button class="btn-sm" @click="showStatusModal = true"><i class="fas fa-tags"></i> 状态</button>
          <button class="btn-sm" @click="showTypeModal = true"><i class="fas fa-layer-group"></i> 类型</button>
          <button class="btn-sm" @click="showPriorityModal = true"><i class="fas fa-flag"></i> 优先级</button>
          <button class="btn-sm btn-primary" @click="exportExcel"><i class="fas fa-file-excel"></i> 导出</button>
          <button class="btn-sm btn-primary" @click="importExcel"><i class="fas fa-upload"></i> 导入</button>
        </div>
      </div>
      <TaskPanel 
        :tasks="todoData[currentDate] || []"
        :current-date="currentDate"
        :statuses="config.statuses"
        :types="config.types"
        :priorities="config.priorities"
        @dirty="markDirty"
      />
    </div>

    <!-- 主题模态框 -->
    <ThemeManager
      v-model:visible="showThemeModal"
    />

    <!-- 状态模态框 -->
    <StatusModal 
      v-model:visible="showStatusModal" 
      :statuses="config.statuses" 
      @updated="handleStatusUpdated" 
    />

    <!-- 类型模态框 -->
    <TypeModal 
      v-model:visible="showTypeModal" 
      :types="config.types" 
      @updated="handleTypeUpdated" 
    />
    <!-- 优先级模态框 -->
    <PriorityModal 
      v-model:visible="showPriorityModal" 
      :priorities="config.priorities" 
      @updated="handlePriorityUpdated" 
    />
    <!-- 导出模态框 -->
    <div v-if="showExportModal" class="modal" @click.self="showExportModal = false">
      <div class="modal-content">
        <h3><i class="fas fa-file-excel"></i> 导出 Excel</h3>
        <div style="margin: 16px 0;">
          <label style="display: block; margin-bottom: 6px;">文件名（.xlsx）</label>
          <input v-model="exportFileName" type="text" style="width: 100%; padding: 8px 12px; border-radius: 4px; border: 1px solid var(--border-light); background: var(--card-bg); color: var(--text-primary);">
        </div>
        <div class="modal-buttons">
          <button class="btn-sm btn-primary" @click="showExportModal = false">导出</button>
          <button class="btn-sm" @click="showExportModal = false">取消</button>
        </div>
      </div>
    </div>
    <!-- 全局对话框 -->
    <div v-if="dialogState.visible" class="dialog-overlay" @click="handleOverlayClick">
      <div class="dialog-box">
        <div class="dialog-header">
          <i :class="dialogState.icon"></i>
          <span>{{ dialogState.title }}</span>
        </div>
        <div class="dialog-content">{{ dialogState.message }}</div>
        <div class="dialog-buttons">
          <button 
            v-for="button in dialogState.buttons" 
            :key="button.text"
            :class="['btn-sm', button.type || '']"
            @click="handleButtonClick(button)"
          >
            {{ button.text }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
@import './assets/todo.css';
</style>


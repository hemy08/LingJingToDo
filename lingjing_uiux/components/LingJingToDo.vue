<script setup lang="ts">

// 使用对话框 composable
import {getCurrentWindow} from "@tauri-apps/api/window";

const { dialogState, handleButtonClick, handleOverlayClick, showConfirmWithClose } = useDialog()

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
import { ref, reactive, onMounted, watch } from 'vue'
import { useDialog } from '../composables/useDialog'
import CalendarPanel from './calendar/CalendarPanel.vue'
import TaskPanel from './tasks/TaskPanel.vue'
import StatusModal from './config/StatusModal.vue'
import ThemeManager from './themes/ThemeManager.vue'
import StatusBar from './common/StatusBar.vue'
import TypeModal from './config/TypeModal.vue'
import PriorityModal from './config/PriorityModal.vue'
import {invoke} from "@tauri-apps/api/core";
import type { TaskStatus, TaskType, TaskPriority } from '../types'
import { exit } from '@tauri-apps/plugin-process';


const minimizeWindow = async () => {
  await getCurrentWindow().minimize();
}

const maximizeWindow = async () => {
  await getCurrentWindow().toggleMaximize();
}

const closeWindow = async () => {
  // 如果有未保存的数据，提示用户
  if (isDirty.value) {
    const result = await showConfirmWithClose(
      '数据未保存',
      '当前有未保存的数据，请选择操作：',
      '保存并关闭',
      '取消',
      '不保存关闭'
    )

    if (result === 'confirm') {
      // 用户选择保存并关闭
      await handleSaveFile()
      await exit(0)
    } else if (result === 'close') {
      // 用户选择不保存关闭
      await exit(0)
    }
    // 如果选择取消，不做任何操作
  } else {
    // 没有未保存的数据，直接关闭
    await exit(0)
  }
}

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

// 状态提示
const statusVisible = ref(false)
const statusMessage = ref('')
const statusDetail = ref('')
const statusType = ref<'success' | 'error' | 'warning' | 'info'>('success')

// 显示状态提示
const showStatus = (message: string, detail?: string, type: 'success' | 'error' | 'warning' | 'info' = 'success') => {
  statusMessage.value = message
  statusDetail.value = detail || ''
  statusType.value = type
  statusVisible.value = true

  // 3秒后自动关闭
  setTimeout(() => {
    statusVisible.value = false
  }, 3000)
}
const showThemeModal = ref(false)
const showStatusModal = ref(false)
const showTypeModal = ref(false)
const showPriorityModal = ref(false)

// 文件操作相关
const currentFilePath = ref<string | null>(null)
const currentFileType = ref<string>('json')

const getTodayStr = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const ensureDate = (date: string) => {
  if (!todoData[date]) todoData[date] = []
}


const handleStatusUpdated = (statuses: any) => {
  config.statuses = statuses
  showStatus('状态配置已更新', '状态列表已成功保存', 'success')
}
const handleTypeUpdated = (types: any) => {
  config.types = types
  showStatus('类型配置已更新', '类型列表已成功保存', 'success')
}

const handlePriorityUpdated = (priorities: any) => {
  config.priorities = priorities
  showStatus('优先级配置已更新', '优先级列表已成功保存', 'success')
}

const handleDateChange = (date: string) => {
  // 切换到新日期
  currentDate.value = date
}

// 任务统计数据
const taskStatistics = ref({
  total_count: 0,
  main_task_count: 0,
  subtask_count: 0,
  due_today_count: 0,
  overdue_count: 0
})

// 获取任务统计
const fetchTaskStatistics = async () => {
  try {
    const stats = await taskApi.getTaskStatistics()
    taskStatistics.value = stats
  } catch (error) {
    console.error('获取任务统计失败:', error)
  }
}

// 监听当前日期变化，更新统计
watch(currentDate, () => {
  fetchTaskStatistics()
})

// 监听任务数据变化，更新统计
watch(() => todoData, () => {
  fetchTaskStatistics()
}, { deep: true })

// 获取文件名（从完整路径中提取）
const getFileName = (filePath: string) => {
  const parts = filePath.split(/[/\\]/)
  return parts[parts.length - 1] || filePath
}

// 打开文件
const handleOpenFile = async () => {
  try {
    const { open } = await import('@tauri-apps/plugin-dialog')
    const selected = await open({
      multiple: false,
      filters: [
        { name: 'JSON', extensions: ['json'] },
        { name: 'Excel', extensions: ['xlsx', 'xls'] },
        { name: 'XML', extensions: ['xml'] }
      ]
    })

    if (selected) {
      const filePath = selected as string
      const fileType = filePath.endsWith('.json') ? 'json' :
                       filePath.endsWith('.xlsx') || filePath.endsWith('.xls') ? 'excel' : 'xml'

      try {
        const result = await invoke('open_file', { filePath, fileType })
        todoData.value = result as any
        currentFilePath.value = filePath
        currentFileType.value = fileType
        isDirty.value = false
        showStatus('打开成功', `文件 ${filePath} 已成功加载`, 'success')
      } catch (error) {
        showStatus('打开失败', `无法加载文件: ${error}`, 'error')
      }
    }
  } catch (error) {
    showStatus('打开失败', `文件选择失败: ${error}`, 'error')
  }
}

// 保存文件
const handleSaveFile = async () => {
  if (currentFilePath.value) {
    try {
      await invoke('save_file', {
        filePath: currentFilePath.value,
        fileType: currentFileType.value,
        data: todoData.value
      })
      isDirty.value = false
      showStatus('保存成功', `文件已保存到 ${currentFilePath.value}`, 'success')
    } catch (error) {
      showStatus('保存失败', `无法保存文件: ${error}`, 'error')
    }
  } else {
    await handleSaveAs()
  }
}

// 另存为
const handleSaveAs = async () => {
  try {
    const { save } = await import('@tauri-apps/plugin-dialog')
    const filePath = await save({
      filters: [
        { name: 'JSON', extensions: ['json'] },
        { name: 'Excel', extensions: ['xlsx'] },
        { name: 'XML', extensions: ['xml'] }
      ]
    })

    if (filePath) {
      const fileType = filePath.endsWith('.json') ? 'json' :
                       filePath.endsWith('.xlsx') ? 'excel' : 'xml'

      try {
        await invoke('save_file', {
          filePath,
          fileType,
          data: todoData.value
        })
        currentFilePath.value = filePath
        currentFileType.value = fileType
        isDirty.value = false
        showStatus('保存成功', `文件已保存到 ${filePath}`, 'success')
      } catch (error) {
        showStatus('保存失败', `无法保存文件: ${error}`, 'error')
      }
    }
  } catch (error) {
    showStatus('保存失败', `文件选择失败: ${error}`, 'error')
  }
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
      id: 10001, title: "示例主任务", status_id: "st_doing", type_id: "ty_work", priority_id: "p3",
      due_date: "2026-05-10", description: "", useSubtasks: true, subtasks: [], checklist: [], createdAt: Date.now()
    })
  }

  // 获取任务统计
  await fetchTaskStatistics()
})


</script>

<template>
  <div class="app-wrapper">
    <!-- 自定义标题栏 -->
    <div class="titlebar" data-tauri-drag-region>
      <div class="titlebar-left">
        <span class="app-icon">✨</span>
        <span class="app-title">灵境待办</span>
      </div>
      <div class="titlebar-right">
        <button class="titlebar-btn" @click="minimizeWindow" title="最小化">
          <svg width="12" height="12" viewBox="0 0 12 12">
            <rect y="5" width="12" height="2" fill="currentColor"/>
          </svg>
        </button>
        <button class="titlebar-btn" @click="maximizeWindow" title="最大化">
          <svg width="12" height="12" viewBox="0 0 12 12">
            <rect x="1" y="1" width="10" height="10" stroke="currentColor" stroke-width="2" fill="none"/>
          </svg>
        </button>
        <button class="titlebar-btn close-btn" @click="closeWindow" title="关闭">
          <svg width="12" height="12" viewBox="0 0 12 12">
            <path d="M1 1L11 11M11 1L1 11" stroke="currentColor" stroke-width="2"/>
          </svg>
        </button>
      </div>
    </div>

    <div class="app-container">
      <!-- 主内容区域 -->
      <div class="main-area">
        <div class="sidebar" :style="{ width: sidebarWidth + 'px' }">
        <CalendarPanel :current-date="currentDate" @date-change="handleDateChange" />

        <!-- 任务统计 -->
        <div class="task-statistics">
          <div class="stat-item">
            <i class="fas fa-list-check"></i>
            <span class="stat-label">总任务</span>
            <span class="stat-value">{{ taskStatistics.total_count }}</span>
          </div>
          <div class="stat-item">
            <i class="fas fa-tasks"></i>
            <span class="stat-label">主任务</span>
            <span class="stat-value">{{ taskStatistics.main_task_count }}</span>
          </div>
          <div class="stat-item">
            <i class="fas fa-sitemap"></i>
            <span class="stat-label">子任务</span>
            <span class="stat-value">{{ taskStatistics.subtask_count }}</span>
          </div>
          <div class="stat-item stat-warning" v-if="taskStatistics.due_today_count > 0">
            <i class="fas fa-clock"></i>
            <span class="stat-label">今天截止</span>
            <span class="stat-value">{{ taskStatistics.due_today_count }}</span>
          </div>
          <div class="stat-item stat-danger" v-if="taskStatistics.overdue_count > 0">
            <i class="fas fa-exclamation-circle"></i>
            <span class="stat-label">已经延期</span>
            <span class="stat-value">{{ taskStatistics.overdue_count }}</span>
          </div>
        </div>

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
            <button class="btn-sm btn-primary" @click="handleOpenFile"><i class="fas fa-folder-open"></i> 打开</button>
            <button class="btn-sm btn-primary" @click="handleSaveFile"><i class="fas fa-save"></i> 保存</button>
            <button class="btn-sm btn-primary" @click="handleSaveAs"><i class="fas fa-file-export"></i> 另存为</button>
          </div>
        </div>
        <TaskPanel
            :tasks="todoData[currentDate] || []"
            :current-date="currentDate"
            :statuses="config.statuses"
            :types="config.types"
            :priorities="config.priorities"
            v-model:is-dirty="isDirty"
        />
      </div>
      </div>

      <!-- 底部状态栏 -->
      <div class="bottom-status-bar">
        <div class="status-item">
          <i class="fas fa-calendar-alt"></i>
          <span>当前日期: {{ currentDate }}</span>
        </div>
        <div class="status-item" v-if="currentFilePath">
          <i class="fas fa-file-alt"></i>
          <span class="file-path" :title="currentFilePath">{{ getFileName(currentFilePath) }}</span>
        </div>
        <div class="status-item" v-else>
          <i class="fas fa-file"></i>
          <span>未保存文件</span>
        </div>
        <div class="status-item" v-if="isDirty">
          <i class="fas fa-exclamation-circle"></i>
          <span>未保存</span>
        </div>
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

      <!-- 状态提示栏 -->
      <StatusBar
        v-model:visible="statusVisible"
        :message="statusMessage"
        :detail="statusDetail"
        :type="statusType"
      />
  </div>
  </div>
</template>

<style>
@import '../assets/main.css';
@import '../assets/buttons.css';
@import '../assets/config.css';
@import '../assets/statusbar.css';
@import '../assets/titlebar.css';
@import '../assets/tasks.css';
@import '../assets/components.css';
@import '../assets/themes.css';
</style>
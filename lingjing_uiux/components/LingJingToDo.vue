<script setup lang="ts">

// 使用对话框 composable
import { ref, reactive, onMounted, watch, computed } from 'vue'
import { useDialog } from '../composables/useDialog'
import { taskApi } from '../connections/task_apis'
import { invoke } from "@tauri-apps/api/core"
import type { Task, TaskStatus, TaskType, TaskPriority } from '../types'
import CalendarPanel from './calendar/CalendarPanel.vue'
import TaskPanel from './tasks/TaskPanel.vue'
import StatusModal from './config/StatusModal.vue'
import ThemeManager from './themes/ThemeManager.vue'
import StatusBar from './common/StatusBar.vue'
import TypeModal from './config/TypeModal.vue'
import PriorityModal from './config/PriorityModal.vue'
// 新增组件
import CustomTitleBar from './common/CustomTitleBar.vue'
import TaskStatistics from './tasks/TaskStatistics.vue'
import TaskTree from './tasks/TaskTree.vue'
import BottomStatusBar from './common/BottomStatusBar.vue'

const { dialogState, handleButtonClick, handleOverlayClick, showConfirmWithClose } = useDialog()
import { exit } from '@tauri-apps/plugin-process';

// Splitter 拖动相关
const isSplitterActive = ref(false)
const sidebarWidthPercent = ref(10) // 默认侧边栏宽度百分比

const startSplitterDrag = (event: MouseEvent) => {
  event.preventDefault()
  isSplitterActive.value = true

  const startX = event.clientX
  const startWidth = sidebarWidthPercent.value
  const windowWidth = window.innerWidth

  const handleMouseMove = (e: MouseEvent) => {
    const deltaX = e.clientX - startX
    const deltaPercent = (deltaX / windowWidth) * 100
    const newWidth = startWidth + deltaPercent
    sidebarWidthPercent.value = Math.max(10, Math.min(40, newWidth))
  }

  const handleMouseUp = () => {
    isSplitterActive.value = false
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
  }

  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
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

// 计算从当前日期往后的所有任务
const tasksFromDate = computed(() => {
  if (!currentDate.value) return []

  // 获取所有日期并排序
  const allDates = Object.keys(todoData).sort()

  // 过滤出从当前日期开始的日期
  const datesFromCurrent = allDates.filter(date => date >= currentDate.value)

  // 合并所有任务
  const allTasks: Task[] = []
  datesFromCurrent.forEach(date => {
    const tasks = todoData[date] || []
    allTasks.push(...tasks)
  })

  return allTasks
})

// 处理任务添加
const handleTaskAdded = async (newTask: Task) => {
  try {
    const date = currentDate.value || new Date().toISOString().split('T')[0]
    const updatedTasks = await taskApi.addTask(date, newTask)

    // 更新 todoData
    if (!todoData[date]) {
      todoData[date] = []
    }
    // 直接赋值新数组，触发响应式更新
    todoData[date] = updatedTasks

    // 标记数据已修改
    isDirty.value = true
  } catch (error) {
    console.error('添加任务失败:', error)
  }
}

// 处理任务更新
const handleTaskUpdated = async (updatedTask: Task) => {
  try {
    // 找到任务所属的日期
    let taskDate = currentDate.value
    if (!taskDate) {
      // 在所有日期中查找任务
      for (const [date, tasks] of Object.entries(todoData)) {
        if (tasks.some(t => t.id === updatedTask.id)) {
          taskDate = date
          break
        }
      }
    }

    if (!taskDate) {
      console.error('找不到任务所属日期')
      return
    }

    const updatedTasks = await taskApi.updateTask(taskDate, updatedTask)

    // 更新 todoData - 使用响应式更新方式
    if (updatedTasks && todoData[taskDate]) {
      // 直接赋值新数组，触发响应式更新
      todoData[taskDate] = updatedTasks
    }

    // 标记数据已修改
    isDirty.value = true
  } catch (error) {
    console.error('更新任务失败:', error)
  }
}

// 处理任务删除
const handleTaskDeleted = async (taskId: string) => {
  try {
    // 找到任务所属的日期
    let taskDate = currentDate.value
    if (!taskDate) {
      // 在所有日期中查找任务
      for (const [date, tasks] of Object.entries(todoData)) {
        if (tasks.some(t => t.id === taskId)) {
          taskDate = date
          break
        }
      }
    }

    if (!taskDate) {
      console.error('找不到任务所属日期')
      return
    }

    const updatedTasks = await taskApi.deleteTask(taskDate, taskId)

    // 更新 todoData - 使用响应式更新方式
    if (updatedTasks && todoData[taskDate]) {
      // 直接赋值新数组，触发响应式更新
      todoData[taskDate] = updatedTasks
    }

    // 标记数据已修改
    isDirty.value = true
  } catch (error) {
    console.error('删除任务失败:', error)
  }
}

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
        const result = await invoke('open_file', { filePath: filePath, fileType: fileType })
        // 清空现有数据
        Object.keys(todoData).forEach(key => delete todoData[key])
        // 加载新数据
        const data = result as Record<string, any[]>
        Object.assign(todoData, data)

        // 同步到后端
        await taskApi.importTasks(todoData)

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
        data: todoData
      })
      console.log('文件保存成功', todoData)
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
          filePath: filePath,
          fileType: fileType,
          data: todoData
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
    <CustomTitleBar @close="closeWindow" />

    <div class="app-container">
      <!-- 主内容区域 -->
      <div class="main-area">
        <div class="sidebar" :style="{ width: sidebarWidthPercent + '%' }">
        <CalendarPanel :current-date="currentDate" @date-change="handleDateChange" />

        <!-- 任务统计 -->
        <TaskStatistics :statistics="taskStatistics" />
·
        <!-- 任务树 -->
        <TaskTree :tasks="tasksFromDate" />
      </div>      <div class="splitter" :class="{ active: isSplitterActive }" @mousedown="startSplitterDrag"></div>
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
            :tasks="tasksFromDate"
            :current-date="currentDate"
            :statuses="config.statuses"
            :types="config.types"
            :priorities="config.priorities"
            v-model:is-dirty="isDirty"
            @task-added="handleTaskAdded"
            @task-updated="handleTaskUpdated"
            @task-deleted="handleTaskDeleted"
        />
      </div>
      </div>

      <!-- 底部状态栏 -->
      <BottomStatusBar
        :current-date="currentDate"
        :file-path="currentFilePath"
        :is-dirty="isDirty"
      />

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
<script setup lang="ts">


// 选中的任务ID
const selectedTaskId = ref<number | null>(null)

// 可用的emoji列表
const availableEmojis = ['📋', '📌', '✅', '⏰', '🚀', '⚡', '💼', '📚', '🏠', '🔥']
import { ref, reactive, onMounted } from 'vue'
import CalendarPanel from './components/calendar/CalendarPanel.vue'
import TaskPanel from './components/tasks/TaskPanel.vue'
import ConfigManager from './components/config/ConfigManager.vue'

const config = reactive({
  statuses: [
    { id: "st_default", name: "待规划", color: "#6c757d", emoji: "📋" },
    { id: "st_start", name: "已启动", color: "#2b8c5e", emoji: "🚀" },
    { id: "st_doing", name: "进行中", color: "#f59e0b", emoji: "⚡" },
    { id: "st_done", name: "已完成", color: "#3b82f6", emoji: "✅" },
    { id: "st_delay", name: "已延期", color: "#dc2626", emoji: "⏰" }
  ],
  types: [
    { id: "ty_work", name: "工作", color: "#0d6efd", emoji: "💼" },
    { id: "ty_study", name: "学习", color: "#6f42c1", emoji: "📚" },
    { id: "ty_life", name: "生活", color: "#20c997", emoji: "🏠" }
  ],
  priorities: [
    { id: "p0", name: "最高优先级", color: "#e74c3c", emoji: "🔥" },
    { id: "p1", name: "非常紧急", color: "#e67e22", emoji: "⚠️" },
    { id: "p2", name: "紧急", color: "#f39c12", emoji: "🔶" },
    { id: "p3", name: "重要", color: "#3498db", emoji: "💎" },
    { id: "p4", name: "中等", color: "#2ecc71", emoji: "📊" },
    { id: "p5", name: "一般", color: "#95a5a6", emoji: "📝" },
    { id: "p6", name: "不紧急", color: "#bdc3c7", emoji: "💤" }
  ]
})

const themes = [
  { id: 'light', name: '浅色', icon: 'fa-sun', preview: { bg: '#f5f7fa', card: '#ffffff', text: '#1e2a3e', accent: '#0077c8' } },
  { id: 'dark', name: '深色', icon: 'fa-moon', preview: { bg: '#121826', card: '#1e293b', text: '#e9edf2', accent: '#3b82f6' } },
  { id: 'eye', name: '护眼', icon: 'fa-eye', preview: { bg: '#e8f5e9', card: '#fef9e6', text: '#2c3e2f', accent: '#2e7d32' } },
  { id: 'orange', name: '橙色', icon: 'fa-circle', preview: { bg: '#fff3e0', card: '#ffffff', text: '#e65100', accent: '#ff6d00' } },
  { id: 'purple', name: '紫色', icon: 'fa-circle', preview: { bg: '#f3e5f5', card: '#ffffff', text: '#4a148c', accent: '#7b1fa2' } },
  { id: 'red', name: '红色', icon: 'fa-circle', preview: { bg: '#ffebee', card: '#ffffff', text: '#b71c1c', accent: '#c62828' } },
  { id: 'skyblue', name: '天蓝', icon: 'fa-circle', preview: { bg: '#e1f5fe', card: '#ffffff', text: '#01579b', accent: '#0288d1' } },
  { id: 'navy', name: '海军蓝', icon: 'fa-circle', preview: { bg: '#0f172a', card: '#1e293b', text: '#e2e8f0', accent: '#3b82f6' } },
  { id: 'deep-purple', name: '深紫', icon: 'fa-circle', preview: { bg: '#1e1b4b', card: '#2e2a5e', text: '#e0e7ff', accent: '#8b5cf6' } }
]

const currentTheme = ref('light')
const todoData = reactive<Record<string, any[]>>({})
const currentDate = ref('')
const isDirty = ref(false)
const sidebarWidth = ref(25)
const showStatusModal = ref(false)
const showTypeModal = ref(false)
const showPriorityModal = ref(false)
const showThemeModal = ref(false)
const showExportModal = ref(false)
const exportFileName = ref('')
const newStatusName = ref('')
const newTypeName = ref('')
const newPriorityName = ref('')

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

const applyTheme = (theme: string) => {
  currentTheme.value = theme
  document.body.classList.remove('light', 'dark', 'eye', 'orange', 'purple', 'red', 'skyblue', 'navy', 'deep-purple')
  if (theme !== 'light') document.body.classList.add(theme)
  localStorage.setItem('selected_theme', theme)
}

const addStatus = () => {
  if (!newStatusName.value.trim()) return
  if (config.statuses.some(s => s.name === newStatusName.value.trim())) {
    alert('状态已存在')
    return
  }
  config.statuses.push({ id: `st_custom_${Date.now()}`, name: newStatusName.value.trim(), color: "#a0aec0", emoji: "📌" })
  newStatusName.value = ''
  markDirty()
}

const addType = () => {
  if (!newTypeName.value.trim()) return
  if (config.types.some(t => t.name === newTypeName.value.trim())) {
    alert('类型已存在')
    return
  }
  config.types.push({ id: `ty_custom_${Date.now()}`, name: newTypeName.value.trim(), color: "#a0aec0", emoji: "📁" })
  newTypeName.value = ''
  markDirty()
}

const addPriority = () => {
  if (!newPriorityName.value.trim()) return
  if (config.priorities.some(p => p.name === newPriorityName.value.trim())) {
    alert('优先级已存在')
    return
  }
  config.priorities.push({ id: `p_custom_${Date.now()}`, name: newPriorityName.value.trim(), color: "#a0aec0", emoji: "🎯" })
  newPriorityName.value = ''
  markDirty()
}

const deleteStatus = (id: string) => {
  if (config.statuses.length <= 1) {
    alert('至少保留一个状态')
    return
  }
  if (confirm('确定删除该状态吗?')) {
    config.statuses = config.statuses.filter(s => s.id !== id)
    markDirty()
  }
}

const deleteType = (id: string) => {
  if (confirm('确定删除该类型吗?')) {
    config.types = config.types.filter(t => t.id !== id)
    markDirty()
  }
}

const deletePriority = (id: string) => {
  if (config.priorities.length <= 1) {
    alert('至少保留一个优先级')
    return
  }
  if (confirm('确定删除该优先级吗?')) {
    config.priorities = config.priorities.filter(p => p.id !== id)
    markDirty()
  }
}

const handleDateChange = (date: string) => {
  currentDate.value = date
  ensureDate(date)
}

const handleAddTask = (title: string) => {
  if (!currentDate.value) return
  todoData[currentDate.value].push({
    id: Date.now() + Math.random() * 10000,
    title: title,
    statusId: config.statuses[0].id,
    typeId: null,
    priorityId: null,
    dueDate: null,
    description: "",
    useSubtasks: true,
    subtasks: [],
    checklist: [],
    createdAt: Date.now()
  })
  markDirty()
}


const handleUpdateTask = (updatedTask: any) => {
  if (!currentDate.value) return
  const taskIndex = todoData[currentDate.value].findIndex(t => t.id === updatedTask.id)
  if (taskIndex !== -1) {
    todoData[currentDate.value][taskIndex] = updatedTask
    markDirty()
  }
}

const handleDeleteTask = (taskId: number) => {
  if (!currentDate.value) return
  todoData[currentDate.value] = todoData[currentDate.value].filter(t => t.id !== taskId)
  markDirty()
}


const handleReorderTasks = (reorderedTasks: any[]) => {
  if (!currentDate.value) return
  todoData[currentDate.value] = reorderedTasks
  markDirty()
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

onMounted(() => {
  const savedTheme = localStorage.getItem('selected_theme') || 'light'
  applyTheme(savedTheme)
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
    <div class="sidebar" :style="{ width: `${sidebarWidth}%` }">
      <CalendarPanel :current-date="currentDate" @date-change="handleDateChange" />
      <div class="task-tree">
        <div class="task-tree-title"><i class="fas fa-diagram-project"></i> 任务导航树</div>
        <div class="task-tree-container">
          <div 
            v-for="task in todoData[currentDate] || []" 
            :key="task.id" 
            class="tree-node"
            :class="{ 'selected': selectedTaskId === task.id }"
            @click="selectedTaskId = task.id"
          >
            📌 {{ task.title }}
            <!-- 子任务 -->
            <div v-if="task.subtasks && task.subtasks.length > 0" class="subtask-nodes">
              <div 
                v-for="subtask in task.subtasks" 
                :key="subtask.id" 
                class="tree-node subtask-node"
                :class="{ 'selected': selectedTaskId === subtask.id }"
                @click.stop="selectedTaskId = subtask.id"
              >
                └─ {{ subtask.title }}
              </div>
            </div>
          </div>
          <div v-if="!todoData[currentDate]?.length" class="empty-tree">暂无任务</div>
        </div>
      </div>
    </div>
    <div class="splitter"></div>
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
      :selected-task-id="selectedTaskId"
      :statuses="config.statuses"
      :types="config.types"
      :priorities="config.priorities"
      @add-task="handleAddTask"
      @update-task="handleUpdateTask"
      @delete-task="handleDeleteTask"
      @reorder-tasks="handleReorderTasks"
      @select-task="selectedTaskId = $event"
    />
    </div>
    <ConfigManager />

    <!-- 主题模态框 -->
    <div v-if="showThemeModal" class="modal" @click.self="showThemeModal = false">
      <div class="modal-content theme-modal">
        <h3><i class="fas fa-palette"></i> 主题设置</h3>
        <div class="theme-grid">
          <div v-for="theme in themes" :key="theme.id" class="theme-card" :class="{ active: currentTheme === theme.id }" @click="applyTheme(theme.id)">
            <div class="theme-header"><i :class="['fas', theme.icon]"></i><span>{{ theme.name }}</span></div>
            <div class="theme-preview" :style="{ background: theme.preview.bg }">
              <div class="preview-card" :style="{ background: theme.preview.card }">
                <div class="preview-title" :style="{ color: theme.preview.text }">示例任务</div>
                <div class="preview-meta">
                  <span class="preview-tag" :style="{ background: theme.preview.accent, color: '#fff' }">进行中</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-buttons"><button class="btn-sm" @click="showThemeModal = false">关闭</button></div>
      </div>
    </div>

    <!-- 状态模态框 -->
    <div v-if="showStatusModal" class="modal" @click.self="showStatusModal = false">
      <div class="modal-content">
        <h3><i class="fas fa-tags"></i> 自定义状态</h3>
        <div class="config-list">
          <div v-for="status in config.statuses" :key="status.id" class="config-card">
            <div class="card-left">
              <select v-model="status.emoji" class="emoji-select">
                <option v-for="emoji in availableEmojis" :key="emoji" :value="emoji">{{ emoji }}</option>
              </select>
              <input 
                v-model="status.name" 
                class="config-input" 
                placeholder="状态名称"
              />
            </div>
            <button class="card-delete-btn" @click="deleteStatus(status.id)"><i class="fas fa-trash-alt"></i> 删除</button>
          </div>
        </div>
        <div class="add-config">
          <input v-model="newStatusName" type="text" placeholder="新状态名称" @keypress.enter="addStatus">
          <button class="btn-sm btn-primary" @click="addStatus">添加</button>
        </div>
        <div class="modal-buttons"><button class="btn-sm" @click="showStatusModal = false">关闭</button></div>
      </div>
    </div>

    <!-- 类型模态框 -->
    <div v-if="showTypeModal" class="modal" @click.self="showTypeModal = false">
      <div class="modal-content">
        <h3><i class="fas fa-layer-group"></i> 自定义类型</h3>
        <div class="config-list">
          <div v-for="type in config.types" :key="type.id" class="config-card">
            <div class="card-left">
              <select v-model="status.emoji" class="emoji-select">
                <option v-for="emoji in availableEmojis" :key="emoji" :value="emoji">{{ emoji }}</option>
              </select>
              <input 
                v-model="type.name" 
                class="config-input" 
                placeholder="类型名称"
              />
            </div>
            <button class="card-delete-btn" @click="deleteType(type.id)"><i class="fas fa-trash-alt"></i> 删除</button>
          </div>
        </div>
        <div class="add-config">
          <input v-model="newTypeName" type="text" placeholder="新类型名称" @keypress.enter="addType">
          <button class="btn-sm btn-primary" @click="addType">添加</button>
        </div>
        <div class="modal-buttons"><button class="btn-sm" @click="showTypeModal = false">关闭</button></div>
      </div>
    </div>

    <!-- 优先级模态框 -->
    <div v-if="showPriorityModal" class="modal" @click.self="showPriorityModal = false">
      <div class="modal-content">
        <h3><i class="fas fa-flag"></i> 自定义优先级</h3>
        <div class="config-list">
          <div v-for="priority in config.priorities" :key="priority.id" class="config-card">
            <div class="card-left">
              <select v-model="status.emoji" class="emoji-select">
                <option v-for="emoji in availableEmojis" :key="emoji" :value="emoji">{{ emoji }}</option>
              </select>
              <input 
                v-model="priority.name" 
                class="config-input" 
                placeholder="优先级名称"
              />
            </div>
            <button class="card-delete-btn" @click="deletePriority(priority.id)"><i class="fas fa-trash-alt"></i> 删除</button>
          </div>
        </div>
        <div class="add-config">
          <input v-model="newPriorityName" type="text" placeholder="新优先级名称" @keypress.enter="addPriority">
          <button class="btn-sm btn-primary" @click="addPriority">添加</button>
        </div>
        <div class="modal-buttons"><button class="btn-sm" @click="showPriorityModal = false">关闭</button></div>
      </div>
    </div>

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
  </div>
</template>

<style>
@import './assets/todo.css';
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
#app { width: 100%; height: 100vh; }
</style>


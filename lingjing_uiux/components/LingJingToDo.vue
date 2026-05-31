<script setup lang="ts">
import { invoke } from '@tauri-apps/api/core'
import { exit } from '@tauri-apps/plugin-process'
import { ref, computed, onMounted } from 'vue'

import { useConfig } from '../composables/useConfig'
import { useDialog } from '../composables/useDialog'
import { useFileOperations } from '../composables/useFileOperations'
import { useGlobalHotkeys } from '../composables/useGlobalHotkeys'
import { useSplitterDrag } from '../composables/useSplitterDrag'
import { useStatusNotification } from '../composables/useStatusNotification'
import { useTaskOperations } from '../composables/useTaskOperations'
import { taskApi } from '../connections/task_apis'
import { useFilterStore } from '../stores/filterStore'

import AppHeader from './common/AppHeader.vue'
import AppLayout from './common/AppLayout.vue'
import BottomStatusBar from './common/BottomStatusBar.vue'
import CustomTitleBar from './common/CustomTitleBar.vue'
import ModalManager from './common/ModalManager.vue'
import StatusBar from './common/StatusBar.vue'

const props = defineProps<{
  initialFilePath?: string | null
}>()

const { dialogState, handleButtonClick, handleOverlayClick, showConfirmWithClose } = useDialog()

const {
  config,
  loadConfig,
  handleStatusUpdated,
  handleTypeUpdated,
  handlePriorityUpdated,
  handleOwnerUpdated,
} = useConfig()

const { statusVisible, statusMessage, statusDetail, statusType, showStatus } =
  useStatusNotification()

const { isSplitterActive, sidebarWidthPercent, startSplitterDrag } = useSplitterDrag({
  initialWidth: 15,
  minWidth: 10,
  maxWidth: 40,
})

const {
  allTasks,
  currentDate,
  isDirty,
  taskStatistics,
  tasksFromDateWithCompleted,
  handleTaskAdded,
  handleTaskUpdated,
  handleTaskDeleted,
  fetchTaskStatistics,
  loadTasksFromFile,
  loadAllTasks,
} = useTaskOperations()

const filterStore = useFilterStore()

const displayTasks = computed(() => {
  if (filterStore.isFilterActive && filterStore.hasFilters) {
    return filterStore.applyFilters(tasksFromDateWithCompleted.value)
  }
  return tasksFromDateWithCompleted.value
})

const handleFilterSync = () => {}

const handleToggleFilterPanel = () => {
  filterStore.clearAndDeactivate()
  showFilterPanel.value = !showFilterPanel.value
}

const handleRefreshTasks = async () => {
  filterStore.clearAndDeactivate()
  await loadAllTasks()
  showStatus('刷新成功', '已重新加载所有任务', 'success')
}

const { currentFilePath, currentFileType, handleOpenFile, handleSaveFile, handleSaveAs } =
  useFileOperations({
    isDirty,
    onFileOpened: async (filePath: string, fileType: string) => {
      try {
        const result = await invoke('open_file', { filePath: filePath, fileType: fileType })
        const data = result as Record<string, any[]>
        await loadTasksFromFile(data)
        showStatus('打开成功', `文件 ${filePath} 已成功加载`, 'success')
      } catch (error) {
        showStatus('打开失败', `无法加载文件: ${error}`, 'error')
      }
    },
    onFileSaved: (filePath: string) => {
      showStatus('保存成功', `文件已保存到 ${filePath}`, 'success')
    },
    onError: (error: string) => {
      showStatus('操作失败', error, 'error')
    },
  })

const getTodayStr = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const closeWindow = async () => {
  if (isDirty.value) {
    const result = await showConfirmWithClose(
      '数据未保存',
      '当前有未保存的数据，请选择操作：',
      '保存并关闭',
      '取消',
      '不保存关闭'
    )

    if (result === 'confirm') {
      const dataToSave: Record<string, any[]> = {}
      const today = getTodayStr()
      dataToSave[today] = allTasks.value
      await handleSaveFile(dataToSave)
      await exit(0)
    } else if (result === 'close') {
      await exit(0)
    }
  } else {
    await exit(0)
  }
}

const showThemeModal = ref(false)
const showStatusModal = ref(false)
const showTypeModal = ref(false)
const showPriorityModal = ref(false)
const showOwnerModal = ref(false)
const showFilterPanel = ref(false)

const handleStatusUpdatedWithNotify = (statuses: any) => {
  handleStatusUpdated(statuses)
  showStatus('状态配置已更新', '状态列表已成功保存', 'success')
}

const handleTypeUpdatedWithNotify = (types: any) => {
  handleTypeUpdated(types)
  showStatus('类型配置已更新', '类型列表已成功保存', 'success')
}

const handlePriorityUpdatedWithNotify = (priorities: any) => {
  handlePriorityUpdated(priorities)
  showStatus('优先级配置已更新', '优先级列表已成功保存', 'success')
}

const handleOwnerUpdatedWithNotify = (owners: any) => {
  handleOwnerUpdated(owners)
  showStatus('责任人配置已更新', '责任人列表已成功保存', 'success')
}

const handleDateChange = (date: string) => {
  currentDate.value = date
}

const handleFileOpened = async () => {
  await handleOpenFile()
}

const handleFileSaved = async () => {
  const data: Record<string, any[]> = {}
  data[getTodayStr()] = allTasks.value
  await handleSaveFile(data)
}

const handleFileSaveAs = async () => {
  const data: Record<string, any[]> = {}
  data[getTodayStr()] = allTasks.value
  await handleSaveAs(data)
}

const selectedTaskId = ref<string | null>(null)
const layoutMode = ref<'masonry' | 'list' | 'tree'>('masonry')

const handleNewTask = () => {
  const newTaskBtn = document.querySelector('.task-add-area textarea') as HTMLTextAreaElement
  if (newTaskBtn) {
    newTaskBtn.focus()
  }
}

const handleSave = async () => {
  if (isDirty.value) {
    const data: Record<string, any[]> = {}
    data[getTodayStr()] = allTasks.value
    await handleSaveFile(data)
  }
}

const handleUndo = () => {
  showStatus('撤销', '撤销功能即将推出', 'info')
}

const handleRedo = () => {
  showStatus('重做', '重做功能即将推出', 'info')
}

const handleSearch = () => {
  showStatus('搜索', '搜索功能即将推出', 'info')
}

const handleViewSwitch = (mode: 'masonry' | 'list' | 'tree') => {
  layoutMode.value = mode
  showStatus(
    '视图切换',
    `已切换到${mode === 'masonry' ? '瀑布流' : mode === 'list' ? '列表' : '树形'}布局`,
    'success'
  )
}

const handleCancel = () => {
  const currentState = dialogState.value
  if (currentState.visible && currentState.buttons.length > 0) {
    const lastButton = currentState.buttons[currentState.buttons.length - 1]
    if (lastButton) {
      handleButtonClick(lastButton)
    }
  }
}

const handleDelete = async () => {
  if (selectedTaskId.value) {
    await handleTaskDeleted(selectedTaskId.value)
    selectedTaskId.value = null
  }
}

useGlobalHotkeys({
  hotkeys: [
    { key: 'ctrl+n', description: '新建任务', handler: handleNewTask },
    { key: 'ctrl+s', description: '保存', handler: handleSave, enabled: () => isDirty.value },
    { key: 'ctrl+z', description: '撤销（预留）', handler: handleUndo },
    { key: 'ctrl+y', description: '重做（预留）', handler: handleRedo },
    { key: 'ctrl+f', description: '搜索', handler: handleSearch },
    { key: 'ctrl+1', description: '瀑布流布局', handler: () => handleViewSwitch('masonry') },
    { key: 'ctrl+2', description: '列表布局', handler: () => handleViewSwitch('list') },
    { key: 'ctrl+3', description: '树形布局', handler: () => handleViewSwitch('tree') },
    { key: 'escape', description: '取消操作', handler: handleCancel },
    {
      key: 'delete',
      description: '删除选中任务',
      handler: handleDelete,
      enabled: () => !!selectedTaskId.value,
    },
  ],
  excludeInputs: true,
})

onMounted(async () => {
  await loadConfig()
  currentDate.value = getTodayStr()

  if (props.initialFilePath) {
    try {
      const filePath = props.initialFilePath
      const fileType = filePath.endsWith('.json')
        ? 'json'
        : filePath.endsWith('.xlsx') || filePath.endsWith('.xls')
          ? 'excel'
          : 'xml'

      const result = await invoke('open_file', { filePath: filePath, fileType: fileType })
      const data = result as Record<string, any[]>

      const tasks: any[] = []
      Object.values(data).forEach(taskList => {
        tasks.push(...taskList)
      })
      allTasks.value = tasks

      await taskApi.importTasks(data)

      currentFilePath.value = filePath
      currentFileType.value = fileType
      isDirty.value = false
    } catch (error) {
      showStatus('打开失败', `无法加载文件: ${error}`, 'error')
      if (allTasks.value.length === 0) {
        allTasks.value.push({
          id: '10001',
          title: '示例主任务',
          status_id: 'st_doing',
          type_id: 'ty_work',
          priority_id: 'p3',
          due_date: '2026-05-10',
          remark: '',
          created_date: getTodayStr(),
        })
      }
    }
  } else {
    try {
      allTasks.value = await taskApi.getAllUnfinishedTasks()
    } catch (error) {
      console.error('加载任务失败:', error)
      if (allTasks.value.length === 0) {
        allTasks.value.push({
          id: '10001',
          title: '示例主任务',
          status_id: 'st_doing',
          type_id: 'ty_work',
          priority_id: 'p3',
          due_date: '2026-05-10',
          remark: '',
          created_date: getTodayStr(),
        })
      }
    }
  }

  await fetchTaskStatistics()

  setTimeout(() => {
    window.dispatchEvent(new Event('resize'))
  }, 100)
})
</script>

<template>
  <div class="app-wrapper">
    <CustomTitleBar @close="closeWindow" />

    <div class="app-container">
      <AppLayout
        :current-date="currentDate"
        :tasks-from-date="displayTasks"
        :task-statistics="taskStatistics"
        :sidebar-width-percent="sidebarWidthPercent"
        :is-splitter-active="isSplitterActive"
        :config="config"
        :is-dirty="isDirty"
        :show-filter-panel="showFilterPanel"
        @date-change="handleDateChange"
        @splitter-drag="startSplitterDrag"
        @task-added="handleTaskAdded"
        @task-updated="handleTaskUpdated"
        @task-deleted="handleTaskDeleted"
        @open-owner-config="showOwnerModal = true"
        @filter-sync="handleFilterSync"
      >
        <template #header>
          <AppHeader
            :is-dirty="isDirty"
            :current-file-path="currentFilePath"
            :current-file-type="currentFileType"
            :show-filter="showFilterPanel"
            @open-theme="showThemeModal = true"
            @open-status="showStatusModal = true"
            @open-type="showTypeModal = true"
            @open-priority="showPriorityModal = true"
            @open-owner="showOwnerModal = true"
            @toggle-filter="handleToggleFilterPanel"
            @refresh-tasks="handleRefreshTasks"
            @file-opened="handleFileOpened"
            @file-saved="handleFileSaved"
            @file-save-as="handleFileSaveAs"
          />
        </template>
      </AppLayout>

      <BottomStatusBar
        :current-date="currentDate"
        :file-path="currentFilePath"
        :is-dirty="isDirty"
      />

      <ModalManager
        :config="config"
        :show-theme-modal="showThemeModal"
        :show-status-modal="showStatusModal"
        :show-type-modal="showTypeModal"
        :show-priority-modal="showPriorityModal"
        :show-owner-modal="showOwnerModal"
        @update:show-theme-modal="showThemeModal = $event"
        @update:show-status-modal="showStatusModal = $event"
        @update:show-type-modal="showTypeModal = $event"
        @update:show-priority-modal="showPriorityModal = $event"
        @update:show-owner-modal="showOwnerModal = $event"
        @status-updated="handleStatusUpdatedWithNotify"
        @type-updated="handleTypeUpdatedWithNotify"
        @priority-updated="handlePriorityUpdatedWithNotify"
        @owner-updated="handleOwnerUpdatedWithNotify"
      />

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

      <StatusBar
        v-model:visible="statusVisible"
        :message="statusMessage"
        :detail="statusDetail"
        :type="statusType"
      />
    </div>
  </div>
</template>

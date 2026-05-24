<script setup lang="ts">
import { getCurrentWindow } from '@tauri-apps/api/window'
import { ref } from 'vue'

import HistoryFiles from './components/history/HistoryFiles.vue'
import LingJingToDo from './components/LingJingToDo.vue'

// 窗口控制 - 使用 Tauri v2 API
const minimizeWindow = async () => {
  await getCurrentWindow().minimize()
}

const maximizeWindow = async () => {
  await getCurrentWindow().toggleMaximize()
}

const closeWindow = async () => {
  await getCurrentWindow().close()
}

const maximize = async () => {
  await getCurrentWindow().toggleMaximize()
}

const showMainApp = ref(false)
const selectedFile = ref<string | null>(null)

// 历史文件组件引用
const historyFilesRef = ref<InstanceType<typeof HistoryFiles> | null>(null)

// 导入 Excel 文件
const importExcel = async () => {
  try {
    // 使用 Tauri 的文件对话框 API
    const { open } = await import('@tauri-apps/plugin-dialog')
    const selected = await open({
      multiple: false,
      filters: [
        {
          name: 'Excel',
          extensions: ['xlsx', 'xls'],
        },
      ],
    })

    if (selected && typeof selected === 'string') {
      // 添加到历史记录
      historyFilesRef.value?.addHistoryFile(selected)

      selectedFile.value = selected
      showMainApp.value = true
      // 进入主界面后自动最大化窗口
      await maximize()
    }
  } catch (error) {
    console.error('导入文件失败:', error)
  }
}

// 导入 JSON 文件
const importJson = async () => {
  try {
    // 使用 Tauri 的文件对话框 API
    const { open } = await import('@tauri-apps/plugin-dialog')
    const selected = await open({
      multiple: false,
      filters: [
        {
          name: 'JSON',
          extensions: ['json'],
        },
      ],
    })

    if (selected && typeof selected === 'string') {
      // 添加到历史记录
      historyFilesRef.value?.addHistoryFile(selected)

      selectedFile.value = selected
      showMainApp.value = true
      // 进入主界面后自动最大化窗口
      await maximize()
    }
  } catch (error) {
    console.error('导入文件失败:', error)
  }
}

// 导入 XML 文件
const importXml = async () => {
  try {
    // 使用 Tauri 的文件对话框 API
    const { open } = await import('@tauri-apps/plugin-dialog')
    const selected = await open({
      multiple: false,
      filters: [
        {
          name: 'XML',
          extensions: ['xml'],
        },
      ],
    })

    if (selected && typeof selected === 'string') {
      // 添加到历史记录
      historyFilesRef.value?.addHistoryFile(selected)

      selectedFile.value = selected
      showMainApp.value = true
      // 进入主界面后自动最大化窗口
      await maximize()
    }
  } catch (error) {
    console.error('导入文件失败:', error)
  }
}

// 处理历史文件选择
const handleFileSelected = async (filePath: string) => {
  selectedFile.value = filePath
  showMainApp.value = true
  // 进入主界面后自动最大化窗口
  await maximize()
}

// 新建空白项目
const createNewProject = async () => {
  selectedFile.value = null
  showMainApp.value = true
  // 进入主界面后自动最大化窗口
  await maximize()
}
</script>
<template>
  <!-- 主应用界面 -->
  <LingJingToDo v-if="showMainApp" :initial-file-path="selectedFile" @back="showMainApp = false" />

  <!-- 欢迎界面 -->
  <div v-else class="welcome-container" @contextmenu.prevent>
    <!-- 自定义标题栏 -->
    <div class="app-titlebar" data-tauri-drag-region>
      <div class="app-titlebar-left" data-tauri-drag-region>
        <span class="app-icon">✨</span>
        <span class="app-title">灵境待办</span>
      </div>
      <div class="titlebar-right">
        <button class="titlebar-btn" title="最小化" @click="minimizeWindow">
          <svg width="12" height="12" viewBox="0 0 12 12">
            <rect y="5" width="12" height="2" fill="currentColor" />
          </svg>
        </button>
        <button class="titlebar-btn" title="最大化" @click="maximizeWindow">
          <svg width="12" height="12" viewBox="0 0 12 12">
            <rect
              x="1"
              y="1"
              width="10"
              height="10"
              stroke="currentColor"
              stroke-width="2"
              fill="none"
            />
          </svg>
        </button>
        <button class="titlebar-btn close-btn" title="关闭" @click="closeWindow">
          <svg width="12" height="12" viewBox="0 0 12 12">
            <path d="M1 1L11 11M11 1L1 11" stroke="currentColor" stroke-width="2" />
          </svg>
        </button>
      </div>
    </div>

    <!-- 欢迎内容 -->
    <div class="welcome-content">
      <!-- Logo 和标题 -->
      <div class="welcome-header">
        <div class="logo-container">
          <div class="logo-icon">✨</div>
          <div class="logo-glow"></div>
        </div>
        <h1 class="welcome-title">灵境待办</h1>
        <p class="welcome-subtitle">高效管理您的任务，让工作更有条理</p>
      </div>

      <!-- 操作按钮 -->
      <div class="welcome-actions">
        <button class="action-btn primary" @click="importExcel">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          <span>导入 Excel 文件</span>
        </button>
        <button class="action-btn primary" @click="importJson">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
          <span>导入 JSON 文件</span>
        </button>
        <button class="action-btn primary" @click="importXml">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
          <span>导入 XML 文件</span>
        </button>
        <button class="action-btn secondary" @click="createNewProject">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="12" y1="18" x2="12" y2="12" />
            <line x1="9" y1="15" x2="15" y2="15" />
          </svg>
          <span>新建空白项目</span>
        </button>
      </div>

      <!-- 历史文件列表 -->
      <HistoryFiles ref="historyFilesRef" @file-selected="handleFileSelected" />

      <!-- 版本信息 -->
      <div class="welcome-footer">
        <p>版本 1.0.0 | © 2026 by Hemy08 灵境待办 zhaojunwei008@yeah.net</p>
      </div>
    </div>
  </div>
</template>

<style>
/* 全局基础 */
@import './assets/base/theme-variables.css';
@import './assets/base/global-common.css';
@import './assets/base/layout.css';

/* 交互组件 */
@import './assets/components/common-interactive.css';
@import './assets/components/buttons.css';
@import './assets/components/modals.css';
@import './assets/components/panels.css';
@import './assets/components/config.css';
@import './assets/components/statusbar.css';
@import './assets/components/titlebar.css';
@import './assets/common-components.css';

/* 任务相关 */
@import './assets/tasks/task-panels.css';
@import './assets/tasks/task-tree.css';
@import './assets/tasks/skeletons.css';
@import './assets/tasks/tasks.css';

/* 高级组件 */
@import './assets/components/advanced.css';
@import './assets/components/task-list-components.css';
@import './assets/components/welcome.css';

/* 主题 */
@import './assets/main.css';
@import './assets/themes/themes.css';
</style>

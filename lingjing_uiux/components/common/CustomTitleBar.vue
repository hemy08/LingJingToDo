<template>
  <div class="app-titlebar" data-tauri-drag-region>
    <div class="app-titlebar-left" data-tauri-drag-region>
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
</template>

<script setup lang="ts">
import { getCurrentWindow } from '@tauri-apps/api/window'

const emit = defineEmits<{
  close: []
}>()

const minimizeWindow = async () => {
  const window = getCurrentWindow()
  await window.minimize()
}

const maximizeWindow = async () => {
  const window = getCurrentWindow()
  await window.toggleMaximize()
}

const closeWindow = () => {
  emit('close')
}
</script>

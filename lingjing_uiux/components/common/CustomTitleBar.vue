<template>
  <div class="app-titlebar" data-tauri-drag-region>
    <div class="app-titlebar-left" data-tauri-drag-region>
      <span class="app-icon">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="20" height="20">
          <defs>
            <linearGradient id="bgGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#1E293B"/>
              <stop offset="100%" stop-color="#020617"/>
            </linearGradient>
            <linearGradient id="strokeGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#00F2FE"/>
              <stop offset="100%" stop-color="#4F46E5"/>
            </linearGradient>
          </defs>
          <rect width="256" height="256" rx="56" fill="url(#bgGradient2)"/>
          <rect width="256" height="256" rx="56" fill="none" stroke="url(#strokeGradient2)" stroke-width="6"/>
          <polygon points="128,44 212,86 212,170 128,212 44,170 44,86" fill="none" stroke="#4F46E5" stroke-width="12" stroke-linejoin="round"/>
          <path d="M 84 128 L 116 160 L 172 96" fill="none" stroke="#00F2FE" stroke-width="24" stroke-linecap="round" stroke-linejoin="round"/>
          <circle cx="172" cy="96" r="10" fill="#4F46E5"/>
          <circle cx="172" cy="96" r="4" fill="#00F2FE"/>
        </svg>
      </span>
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

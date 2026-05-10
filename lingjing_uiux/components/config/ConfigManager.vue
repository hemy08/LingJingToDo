<script setup lang="ts">
import { reactive } from 'vue'

// 配置数据
const config = reactive({
  statuses: [
    { id: "st_default", name: "待规划", color: "#6c757d" },
    { id: "st_start", name: "已启动", color: "#2b8c5e" },
    { id: "st_doing", name: "进行中", color: "#f59e0b" },
    { id: "st_done", name: "已完成", color: "#3b82f6" },
    { id: "st_delay", name: "已延期", color: "#dc2626" }
  ],
  types: [
    { id: "ty_work", name: "工作", color: "#0d6efd" },
    { id: "ty_study", name: "学习", color: "#6f42c1" },
    { id: "ty_life", name: "生活", color: "#20c997" }
  ],
  priorities: [
    { id: "p0", name: "最高优先级", color: "#e74c3c" },
    { id: "p1", name: "非常紧急", color: "#e67e22" },
    { id: "p2", name: "紧急", color: "#f39c12" },
    { id: "p3", name: "重要", color: "#3498db" },
    { id: "p4", name: "中等", color: "#2ecc71" },
    { id: "p5", name: "一般", color: "#95a5a6" },
    { id: "p6", name: "不紧急", color: "#bdc3c7" }
  ]
})

// 辅助函数
const getStatus = (id: string) => {
  return config.statuses.find(s => s.id === id) || config.statuses[0]
}

const getType = (id: string | null) => {
  return id ? config.types.find(t => t.id === id) : null
}

const getPriority = (id: string | null) => {
  return id ? config.priorities.find(p => p.id === id) : config.priorities[0]
}

// 暴露给父组件
defineExpose({
  config,
  getStatus,
  getType,
  getPriority
})
</script>

<template>
  <!-- ConfigManager不再渲染任何内容,所有模态框都在App.vue中 -->
</template>

<style scoped>
/* 无需样式 */
</style>

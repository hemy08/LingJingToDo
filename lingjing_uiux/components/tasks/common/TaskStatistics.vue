<template>
  <div class="task-statistics">
    <div class="stat-item">
      <i class="fas fa-list-check"></i>
      <span class="stat-label">总任务</span>
      <span class="stat-value">{{ statistics.total_count }}</span>
    </div>
    <div class="stat-item">
      <i class="fas fa-tasks"></i>
      <span class="stat-label">主任务</span>
      <span class="stat-value">{{ statistics.main_task_count }}</span>
    </div>
    <div class="stat-item">
      <i class="fas fa-check-circle"></i>
      <span class="stat-label">已完成</span>
      <span class="stat-value">{{ statistics.completed_count }}</span>
    </div>
    <div class="stat-item">
      <i class="fas fa-clock"></i>
      <span class="stat-label">今日到期</span>
      <span class="stat-value">{{ statistics.due_today_count }}</span>
    </div>
    <div v-if="statistics.overdue_count > 0" class="stat-item stat-danger">
      <i class="fas fa-exclamation-circle"></i>
      <span class="stat-label">已经延期</span>
      <span class="stat-value">{{ statistics.overdue_count }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
// 定义统计接口
interface ITaskStatistics {
  total_count: number
  main_task_count: number
  subtask_count: number
  due_today_count: number
  overdue_count: number
  completed_count?: number
}

defineProps<{
  statistics: ITaskStatistics
}>()
</script>

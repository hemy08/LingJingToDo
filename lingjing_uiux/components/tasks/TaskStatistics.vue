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
    <div class="stat-item stat-danger" v-if="statistics.overdue_count > 0">
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

<style scoped>
.task-statistics {
  padding: 12px;
  background: var(--card-bg);
  border-radius: 8px;
  margin-bottom: 12px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 0;
  font-size: 13px;
}

.stat-item i {
  width: 16px;
  color: var(--primary-color);
}

.stat-label {
  flex: 1;
  color: var(--text-secondary);
}

.stat-value {
  font-weight: 600;
  color: var(--text-color);
}

.stat-danger {
  color: var(--danger-color);
}

.stat-danger i {
  color: var(--danger-color);
}
</style>

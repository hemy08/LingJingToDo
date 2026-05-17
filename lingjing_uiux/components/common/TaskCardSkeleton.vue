<template>
  <div class="task-card-skeleton">
    <div class="task-card-skeleton__header">
      <Skeleton width="60%" height="24px" />
      <Skeleton width="80px" height="20px" :radius="10" />
    </div>
    
    <div class="task-card-skeleton__tags">
      <Skeleton width="60px" height="24px" :radius="12" />
      <Skeleton width="60px" height="24px" :radius="12" />
      <Skeleton width="60px" height="24px" :radius="12" />
    </div>
    
    <div class="task-card-skeleton__content">
      <Skeleton :count="2" height="16px" width="100%" />
    </div>
    
    <div class="task-card-skeleton__footer">
      <Skeleton width="100px" height="20px" />
      <Skeleton width="80px" height="20px" />
    </div>
  </div>
</template>

<script setup lang="ts">
import Skeleton from './Skeleton.vue'
</script>

<style scoped>
.task-card-skeleton {
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.task-card-skeleton__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.task-card-skeleton__tags {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.task-card-skeleton__content {
  margin-bottom: 12px;
}

.task-card-skeleton__footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* 暗色主题 */
@media (prefers-color-scheme: dark) {
  .task-card-skeleton {
    background: #1a1a1a;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  }
}
</style>

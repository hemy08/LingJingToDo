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

<template>
  <div class="skeleton" :class="{ 'skeleton--animated': animated }">
    <slot>
      <div 
        v-for="i in count" 
        :key="i" 
        class="skeleton-item"
        :style="itemStyle"
      ></div>
    </slot>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  count?: number
  width?: string | number
  height?: string | number
  animated?: boolean
  radius?: string | number
}

const props = withDefaults(defineProps<Props>(), {
  count: 1,
  width: '100%',
  height: '20px',
  animated: true,
  radius: '4px'
})

const itemStyle = computed(() => ({
  width: typeof props.width === 'number' ? `${props.width}px` : props.width,
  height: typeof props.height === 'number' ? `${props.height}px` : props.height,
  borderRadius: typeof props.radius === 'number' ? `${props.radius}px` : props.radius
}))
</script>

<style scoped>
.skeleton {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.skeleton-item {
  background: linear-gradient(
    90deg,
    #f0f0f0 25%,
    #e0e0e0 50%,
    #f0f0f0 75%
  );
  background-size: 200% 100%;
}

.skeleton--animated .skeleton-item {
  animation: skeleton-loading 1.5s ease-in-out infinite;
}

@keyframes skeleton-loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

/* 暗色主题 */
@media (prefers-color-scheme: dark) {
  .skeleton-item {
    background: linear-gradient(
      90deg,
      #2a2a2a 25%,
      #3a3a3a 50%,
      #2a2a2a 75%
    );
    background-size: 200% 100%;
  }
}
</style>

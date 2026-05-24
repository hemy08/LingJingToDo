<template>
  <div class="skeleton" :class="{ 'skeleton--animated': animated }">
    <slot>
      <div v-for="i in count" :key="i" class="skeleton-item" :style="itemStyle"></div>
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
  radius: '4px',
})

const itemStyle = computed(() => ({
  width: typeof props.width === 'number' ? `${props.width}px` : props.width,
  height: typeof props.height === 'number' ? `${props.height}px` : props.height,
  borderRadius: typeof props.radius === 'number' ? `${props.radius}px` : props.radius,
}))
</script>

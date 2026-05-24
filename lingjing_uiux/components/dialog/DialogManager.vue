<script setup lang="ts">
import { watch } from 'vue'

import StatusBar from '../common/StatusBar.vue'

export type StatusType = 'success' | 'error' | 'warning' | 'info'

export interface DialogManagerProps {
  statusVisible: boolean
  statusMessage: string
  statusDetail: string
  statusType: StatusType
}

export interface DialogManagerEmits {
  (e: 'update:statusVisible', value: boolean): void
}

const props = defineProps<DialogManagerProps>()
const emit = defineEmits<DialogManagerEmits>()

watch(
  () => props.statusVisible,
  newVal => {
    emit('update:statusVisible', newVal)
  }
)
</script>

<template>
  <div class="dialog-manager">
    <slot name="dialog"></slot>

    <StatusBar
      v-model:visible="statusVisible"
      :message="statusMessage"
      :detail="statusDetail"
      :type="statusType"
    />
  </div>
</template>

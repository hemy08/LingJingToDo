<script setup lang="ts">
import PriorityModal from '../config/PriorityModal.vue'
import StatusModal from '../config/StatusModal.vue'
import TypeModal from '../config/TypeModal.vue'
import ThemeManager from '../themes/ThemeManager.vue'

defineProps<{
  config: any
  showThemeModal: boolean
  showStatusModal: boolean
  showTypeModal: boolean
  showPriorityModal: boolean
}>()

const emit = defineEmits<{
  'update:showThemeModal': [value: boolean]
  'update:showStatusModal': [value: boolean]
  'update:showTypeModal': [value: boolean]
  'update:showPriorityModal': [value: boolean]
  'status-updated': [statuses: any]
  'type-updated': [types: any]
  'priority-updated': [priorities: any]
}>()

const handleStatusUpdated = (statuses: any) => {
  emit('status-updated', statuses)
}

const handleTypeUpdated = (types: any) => {
  emit('type-updated', types)
}

const handlePriorityUpdated = (priorities: any) => {
  emit('priority-updated', priorities)
}
</script>

<template>
  <div>
    <ThemeManager
      :visible="showThemeModal"
      @update:visible="emit('update:showThemeModal', $event)"
    />

    <StatusModal
      :visible="showStatusModal"
      :statuses="config.statuses"
      @update:visible="emit('update:showStatusModal', $event)"
      @updated="handleStatusUpdated"
    />

    <TypeModal
      :visible="showTypeModal"
      :types="config.types"
      @update:visible="emit('update:showTypeModal', $event)"
      @updated="handleTypeUpdated"
    />

    <PriorityModal
      :visible="showPriorityModal"
      :priorities="config.priorities"
      @update:visible="emit('update:showPriorityModal', $event)"
      @updated="handlePriorityUpdated"
    />
  </div>
</template>

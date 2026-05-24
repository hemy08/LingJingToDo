<script setup lang="ts">
import { useHistory } from '../../composables/useHistory'

const props = withDefaults(
  defineProps<{
    showTooltip?: boolean
    size?: 'sm' | 'md' | 'lg'
  }>(),
  {
    showTooltip: true,
    size: 'md',
  }
)

const emit = defineEmits<{
  undo: []
  redo: []
  'undo-failed': []
  'redo-failed': []
}>()

const { performUndo, performRedo, canUndo, canRedo, undoCount, redoCount, setupKeyboardShortcuts } =
  useHistory()

setupKeyboardShortcuts()

async function handleUndo() {
  const success = await performUndo()
  if (success) {
    emit('undo')
  } else {
    emit('undo-failed')
  }
}

async function handleRedo() {
  const success = await performRedo()
  if (success) {
    emit('redo')
  } else {
    emit('redo-failed')
  }
}

const sizeClass = {
  sm: 'btn-xs',
  md: 'btn-sm',
  lg: 'btn-md',
}[props.size]
</script>

<template>
  <div class="undo-redo-buttons">
    <button
      class="btn-sm"
      :class="{ disabled: !canUndo }"
      :disabled="!canUndo"
      :title="showTooltip ? `撤销 (Ctrl+Z)${canUndo ? ` - ${undoCount} 步可用` : ''}` : ''"
      @click="handleUndo"
    >
      <i class="fas fa-undo"></i>
      <span v-if="size !== 'sm'" class="btn-text">撤销</span>
    </button>
    <button
      class="btn-sm"
      :class="{ disabled: !canRedo }"
      :disabled="!canRedo"
      :title="showTooltip ? `重做 (Ctrl+Y)${canRedo ? ` - ${redoCount} 步可用` : ''}` : ''"
      @click="handleRedo"
    >
      <i class="fas fa-redo"></i>
      <span v-if="size !== 'sm'" class="btn-text">重做</span>
    </button>
  </div>
</template>

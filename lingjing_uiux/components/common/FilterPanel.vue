<script setup lang="ts">
import { computed } from 'vue'

import { useFilter } from '../../composables/useFilter'
import type { TaskStatus, TaskPriority, TaskType, FilterCondition } from '../../types'

const props = withDefaults(
  defineProps<{
    statuses: TaskStatus[]
    priorities: TaskPriority[]
    types: TaskType[]
    showDateFilter?: boolean
    persistState?: boolean
  }>(),
  {
    showDateFilter: true,
    persistState: true,
  }
)

const emit = defineEmits<{
  'filter-change': []
  'condition-add': [condition: FilterCondition]
  'condition-remove': [conditionId: string]
  'clear-all': []
}>()

const {
  activeConditions,
  activeConditionCount,
  hasFilters,
  removeCondition,
  clearAllConditions,
  quickFilterByStatus,
  quickFilterByPriority,
  quickFilterByType,
} = useFilter()

const selectedStatus = computed({
  get: () => {
    const statusCondition = activeConditions.find(c => c.type === 'STATUS')
    return statusCondition ? (statusCondition.value as string) : ''
  },
  set: (value: string) => {
    const existing = activeConditions.find(c => c.type === 'STATUS')
    if (existing) {
      removeCondition(existing.id)
    }
    if (value) {
      const status = props.statuses.find(s => s.id === value)
      if (status) {
        quickFilterByStatus(status.id, status.name)
        const lastCondition = activeConditions[activeConditions.length - 1]
        if (lastCondition) {
          emit('condition-add', lastCondition)
        }
      }
    }
    emit('filter-change')
  },
})

const selectedPriority = computed({
  get: () => {
    const priorityCondition = activeConditions.find(c => c.type === 'PRIORITY')
    return priorityCondition ? (priorityCondition.value as string) : ''
  },
  set: (value: string) => {
    const existing = activeConditions.find(c => c.type === 'PRIORITY')
    if (existing) {
      removeCondition(existing.id)
    }
    if (value) {
      const priority = props.priorities.find(p => p.id === value)
      if (priority) {
        quickFilterByPriority(priority.id, priority.name)
        const lastCondition = activeConditions[activeConditions.length - 1]
        if (lastCondition) {
          emit('condition-add', lastCondition)
        }
      }
    }
    emit('filter-change')
  },
})

const selectedType = computed({
  get: () => {
    const typeCondition = activeConditions.find(c => c.type === 'TYPE')
    return typeCondition ? (typeCondition.value as string) : ''
  },
  set: (value: string) => {
    const existing = activeConditions.find(c => c.type === 'TYPE')
    if (existing) {
      removeCondition(existing.id)
    }
    if (value) {
      const type = props.types.find(t => t.id === value)
      if (type) {
        quickFilterByType(type.id, type.name)
        const lastCondition = activeConditions[activeConditions.length - 1]
        if (lastCondition) {
          emit('condition-add', lastCondition)
        }
      }
    }
    emit('filter-change')
  },
})

function handleRemoveCondition(conditionId: string) {
  removeCondition(conditionId)
  emit('condition-remove', conditionId)
  emit('filter-change')
}

function handleClearAll() {
  clearAllConditions()
  emit('clear-all')
  emit('filter-change')
}

function getConditionLabel(condition: FilterCondition): string {
  return condition.label
}

function getConditionColor(condition: FilterCondition): string {
  const typeMap: Record<string, string> = {
    STATUS: '#4CAF50',
    PRIORITY: '#FF9800',
    TYPE: '#2196F3',
    CREATE_DATE: '#9C27B0',
    DUE_DATE: '#E91E63',
  }
  return typeMap[condition.type] || '#757575'
}
</script>

<template>
  <div class="filter-panel">
    <div class="filter-header">
      <span class="filter-title">
        <i class="fas fa-filter"></i>
        过滤器
        <span v-if="activeConditionCount > 0" class="badge">{{ activeConditionCount }}</span>
      </span>
      <button
        v-if="hasFilters"
        class="clear-all-btn"
        title="清空所有过滤条件"
        @click="handleClearAll"
      >
        <i class="fas fa-times"></i>
      </button>
    </div>

    <div class="filter-controls">
      <div class="filter-group">
        <label>状态</label>
        <select v-model="selectedStatus" class="filter-select">
          <option value="">全部</option>
          <option v-for="status in statuses" :key="status.id" :value="status.id">
            {{ status.emoji }} {{ status.name }}
          </option>
        </select>
      </div>

      <div class="filter-group">
        <label>优先级</label>
        <select v-model="selectedPriority" class="filter-select">
          <option value="">全部</option>
          <option v-for="priority in priorities" :key="priority.id" :value="priority.id">
            {{ priority.emoji }} {{ priority.name }}
          </option>
        </select>
      </div>

      <div class="filter-group">
        <label>类型</label>
        <select v-model="selectedType" class="filter-select">
          <option value="">全部</option>
          <option v-for="type in types" :key="type.id" :value="type.id">
            {{ type.emoji }} {{ type.name }}
          </option>
        </select>
      </div>
    </div>

    <div v-if="activeConditionCount > 0" class="active-conditions">
      <div class="conditions-label">已选条件：</div>
      <div class="condition-tags">
        <span
          v-for="condition in activeConditions"
          :key="condition.id"
          class="condition-tag"
          :style="{ backgroundColor: getConditionColor(condition) }"
        >
          {{ getConditionLabel(condition) }}
          <button class="tag-remove-btn" @click="handleRemoveCondition(condition.id)">
            <i class="fas fa-times"></i>
          </button>
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

import type { Task, TaskStatus, TaskPriority, TaskType, SimpleFilterState } from '../../types'

const props = withDefaults(
  defineProps<{
    tasks?: Task[]
    statuses: TaskStatus[]
    priorities: TaskPriority[]
    types: TaskType[]
    placeholder?: string
  }>(),
  {
    tasks: () => [],
    placeholder: '搜索任务描述...',
  }
)

const emit = defineEmits<{
  'filter-change': [filteredTasks: Task[], filterState: SimpleFilterState]
  'search-trigger': [keyword: string, filters: FilterState]
}>()

interface FilterState {
  status: string
  priority: string
  type: string
  keyword: string
}

const selectedStatus = ref('')
const selectedPriority = ref('')
const selectedType = ref('')
const searchKeyword = ref('')

const hasActiveFilters = computed(() => {
  return (
    selectedStatus.value !== '' ||
    selectedPriority.value !== '' ||
    selectedType.value !== '' ||
    searchKeyword.value !== ''
  )
})

const activeFilterCount = computed(() => {
  let count = 0
  if (selectedStatus.value) count++
  if (selectedPriority.value) count++
  if (selectedType.value) count++
  if (searchKeyword.value) count++
  return count
})

function handleSearch() {
  const filteredTasks = filterTasks()
  const filterState: SimpleFilterState = {
    status: selectedStatus.value,
    priority: selectedPriority.value,
    type: selectedType.value,
    keyword: searchKeyword.value,
  }
  emit('filter-change', filteredTasks, filterState)
  emit('search-trigger', searchKeyword.value, {
    status: selectedStatus.value,
    priority: selectedPriority.value,
    type: selectedType.value,
    keyword: searchKeyword.value,
  })
}

function filterTasks(): Task[] {
  let result = [...props.tasks]

  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    result = result.filter(task => {
      const titleMatch = task.title.toLowerCase().includes(keyword)
      const remarkMatch = task.remark && task.remark.toLowerCase().includes(keyword)
      return titleMatch || remarkMatch
    })
  }

  if (selectedStatus.value) {
    result = result.filter(task => task.status_id === selectedStatus.value)
  }

  if (selectedPriority.value) {
    result = result.filter(task => task.priority_id === selectedPriority.value)
  }

  if (selectedType.value) {
    result = result.filter(task => task.type_id === selectedType.value)
  }

  return result
}

function clearAllFilters() {
  selectedStatus.value = ''
  selectedPriority.value = ''
  selectedType.value = ''
  searchKeyword.value = ''
  emit('filter-change', props.tasks, { status: '', priority: '', type: '', keyword: '' })
}

function clearSearch() {
  searchKeyword.value = ''
}
</script>

<template>
  <div class="unified-search-filter">
    <div class="filter-row">
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

      <div class="search-group">
        <input
          v-model="searchKeyword"
          type="text"
          :placeholder="placeholder"
          class="search-input"
          @keyup.enter="handleSearch"
        />
        <button v-if="searchKeyword" class="clear-search-btn" @click="clearSearch">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <button class="search-btn" @click="handleSearch"><i class="fas fa-search"></i> 搜索</button>

      <button v-if="hasActiveFilters" class="clear-all-btn" @click="clearAllFilters">
        <i class="fas fa-times"></i> 清空
      </button>

      <div v-if="activeFilterCount > 0" class="filter-count">{{ activeFilterCount }} 个条件</div>
    </div>
  </div>
</template>

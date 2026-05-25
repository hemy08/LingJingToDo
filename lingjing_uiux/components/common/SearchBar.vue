<script setup lang="ts">
import { ref, computed, watch } from 'vue'

import { useSearch } from '../../composables/useSearch'
import type { Task } from '../../types'

const props = withDefaults(
  defineProps<{
    placeholder?: string
    debounceDelay?: number
    showSuggestions?: boolean
    maxSuggestions?: number
    tasks?: Task[]
  }>(),
  {
    placeholder: '搜索任务...',
    debounceDelay: 300,
    showSuggestions: true,
    maxSuggestions: 5,
    tasks: () => [],
  }
)

const emit = defineEmits<{
  search: [keyword: string]
  clear: []
  'suggestion-selected': [task: Task]
}>()

const {
  keyword,
  hasKeyword,
  matchedCount,
  isSearching,
  isDebouncing,
  updateKeyword,
  clearSearch,
  executeSearchNow,
} = useSearch(props.debounceDelay)

const localKeyword = ref(keyword)
const showDropdown = ref(false)

const suggestions = computed(() => {
  if (!props.showSuggestions || !hasKeyword || localKeyword.value.length < 2) {
    return []
  }

  const tasks = props.tasks
  const kw = localKeyword.value.toLowerCase()

  return tasks
    .filter(
      t => t.title.toLowerCase().includes(kw) || (t.remark && t.remark.toLowerCase().includes(kw))
    )
    .slice(0, props.maxSuggestions)
})

watch(localKeyword, newKeyword => {
  updateKeyword(newKeyword)
  emit('search', newKeyword)
})

function handleInput(event: Event) {
  const target = event.target as HTMLInputElement
  localKeyword.value = target.value
}

function handleClear() {
  localKeyword.value = ''
  clearSearch()
  showDropdown.value = false
  emit('clear')
}

function handleFocus() {
  if (hasKeyword) {
    showDropdown.value = true
  }
}

function handleBlur() {
  setTimeout(() => {
    showDropdown.value = false
  }, 200)
}

function selectSuggestion(task: Task) {
  localKeyword.value = task.title
  showDropdown.value = false
  emit('suggestion-selected', task)
}

function highlightMatch(text: string): string {
  if (!hasKeyword) return text

  const regex = new RegExp(`(${keyword})`, 'gi')
  return text.replace(regex, '<mark class="suggestion-highlight">$1</mark>')
}

function handleSearch() {
  executeSearchNow()
  emit('search', localKeyword.value)
}
</script>

<template>
  <div class="search-bar">
    <div class="search-input-wrapper">
      <i class="fas fa-search search-icon" :class="{ searching: isSearching || isDebouncing }"></i>
      <input
        type="text"
        :value="localKeyword"
        :placeholder="placeholder"
        class="search-input"
        @input="handleInput"
        @focus="handleFocus"
        @blur="handleBlur"
        @keyup.enter="handleSearch"
      />
      <button v-if="hasKeyword" class="clear-btn" title="清空搜索" @click="handleClear">
        <i class="fas fa-times"></i>
      </button>
    </div>

    <button class="search-btn" title="搜索" @click="handleSearch">
      <i class="fas fa-search">搜索</i>
    </button>

    <div v-if="hasKeyword && matchedCount > 0" class="match-count">{{ matchedCount }} 个匹配</div>

    <div v-if="showDropdown && suggestions.length > 0" class="dropdown">
      <div
        v-for="task in suggestions"
        :key="task.id"
        class="dropdown-item"
        @click="selectSuggestion(task)"
      >
        <span class="suggestion-title" v-html="highlightMatch(task.title)"></span>
      </div>
    </div>

    <div
      v-if="showDropdown && hasKeyword && suggestions.length === 0 && !isSearching"
      class="no-result"
    >
      未找到匹配的任务
    </div>
  </div>
</template>

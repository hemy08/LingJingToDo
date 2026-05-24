<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAdvancedSearch } from '../../composables/useAdvancedSearch'
import type { Task } from '../../types'

const props = defineProps<{
  tasks: Task[]
}>()

const emit = defineEmits<{
  search: [results: Task[]]
}>()

const { searchHistory, executeAdvancedSearch, saveHistory, clearHistory } = useAdvancedSearch()

const keyword = ref('')
const showAdvanced = ref(false)
const showHistory = ref(false)
const selectedField = ref<'TITLE' | 'DESCRIPTION' | 'STATUS' | 'PRIORITY' | 'ALL'>('ALL')
const selectedOperator = ref<'CONTAINS' | 'EQUALS'>('CONTAINS')
const enableRegex = ref(false)
const enableFuzzy = ref(false)

const hasKeyword = computed(() => keyword.value.trim().length > 0)

function executeSearch() {
  if (!hasKeyword.value) {
    emit('search', props.tasks)
    return
  }

  const config = {
    conditions: [
      {
        field: selectedField.value,
        operator: selectedOperator.value,
        value: keyword.value,
        caseSensitive: false,
      },
    ],
    logicOperator: 'AND' as const,
    enableRegex: enableRegex.value,
    enableFuzzy: enableFuzzy.value,
    sortBy: 'RELEVANCE' as const,
    sortOrder: 'DESC' as const,
  }

  const results = executeAdvancedSearch(config, props.tasks)
  emit('search', results)
  saveHistory(keyword.value, results.length)
}

function clearSearch() {
  keyword.value = ''
  emit('search', props.tasks)
}

function loadHistory(item: { keyword: string }) {
  keyword.value = item.keyword
  showHistory.value = false
  executeSearch()
}

function toggleAdvanced() {
  showAdvanced.value = !showAdvanced.value
}

function handleBlur() {
  setTimeout(() => {
    showHistory.value = false
  }, 200)
}
</script>

<template>
  <div class="advanced-search-bar">
    <div class="search-row">
      <div class="search-input-wrapper">
        <i class="fas fa-search search-icon"></i>
        <input
          v-model="keyword"
          type="text"
          placeholder="搜索任务..."
          class="search-input"
          @keyup.enter="executeSearch"
          @focus="showHistory = searchHistory.length > 0"
          @blur="handleBlur"
        />
        <button v-if="hasKeyword" class="clear-btn" @click="clearSearch">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <button class="advanced-toggle" :class="{ active: showAdvanced }" @click="toggleAdvanced">
        <i class="fas fa-sliders-h"></i>
      </button>

      <button class="search-btn" @click="executeSearch">
        <i class="fas fa-search">搜索</i>
        搜索
      </button>

      <div v-if="showHistory && searchHistory.length > 0" class="history-dropdown">
        <div class="history-header">
          <span>搜索历史</span>
          <button class="clear-history-btn" @click="clearHistory">清空</button>
        </div>
        <div
          v-for="item in searchHistory"
          :key="item.keyword + item.timestamp"
          class="history-item"
          @click="loadHistory(item)"
        >
          <span class="history-keyword">{{ item.keyword }}</span>
          <span class="history-count">{{ item.resultCount }} 个结果</span>
        </div>
      </div>
    </div>

    <div v-if="showAdvanced" class="advanced-options">
      <div class="option-group">
        <label>搜索字段</label>
        <select v-model="selectedField">
          <option value="ALL">全部</option>
          <option value="TITLE">标题</option>
          <option value="DESCRIPTION">描述</option>
          <option value="STATUS">状态</option>
          <option value="PRIORITY">优先级</option>
        </select>
      </div>

      <div class="option-group">
        <label>匹配方式</label>
        <select v-model="selectedOperator">
          <option value="CONTAINS">包含</option>
          <option value="EQUALS">等于</option>
        </select>
      </div>

      <div class="option-group checkbox-group">
        <label>
          <input type="checkbox" v-model="enableRegex" />
          正则表达式
        </label>
        <label>
          <input type="checkbox" v-model="enableFuzzy" />
          模糊搜索
        </label>
      </div>
    </div>
  </div>
</template>

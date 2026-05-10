<script setup lang="ts">
import { ref, computed } from 'vue'

const calendarYear = ref(new Date().getFullYear())
const calendarMonth = ref(new Date().getMonth())

const getTodayStr = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const calendarDays = computed(() => {
  const firstDay = new Date(calendarYear.value, calendarMonth.value, 1)
  let startWeekday = firstDay.getDay()
  let startOffset = startWeekday === 0 ? 6 : startWeekday - 1
  
  const daysInMonth = new Date(calendarYear.value, calendarMonth.value + 1, 0).getDate()
  const prevMonthDays = new Date(calendarYear.value, calendarMonth.value, 0).getDate()
  
  const days: Array<{ year: number; month: number; day: number; isCurrent: boolean }> = []
  
  for (let i = 0; i < startOffset; i++) {
    days.push({
      year: calendarYear.value,
      month: calendarMonth.value - 1,
      day: prevMonthDays - startOffset + i + 1,
      isCurrent: false
    })
  }
  
  for (let i = 1; i <= daysInMonth; i++) {
    days.push({
      year: calendarYear.value,
      month: calendarMonth.value,
      day: i,
      isCurrent: true
    })
  }
  
  let remaining = 42 - days.length
  for (let i = 1; i <= remaining; i++) {
    days.push({
      year: calendarYear.value,
      month: calendarMonth.value + 1,
      day: i,
      isCurrent: false
    })
  }
  
  return days
})

const monthDisplay = computed(() => {
  return `${calendarYear.value}年${calendarMonth.value + 1}月`
})

const prevMonth = () => {
  if (calendarMonth.value === 0) {
    calendarYear.value--
    calendarMonth.value = 11
  } else {
    calendarMonth.value--
  }
}

const nextMonth = () => {
  if (calendarMonth.value === 11) {
    calendarYear.value++
    calendarMonth.value = 0
  } else {
    calendarMonth.value++
  }
}

const goToToday = () => {
  const t = new Date()
  calendarYear.value = t.getFullYear()
  calendarMonth.value = t.getMonth()
}

const selectDate = (day: { year: number; month: number; day: number }) => {
  const dateStr = `${day.year}-${String(day.month + 1).padStart(2, '0')}-${String(day.day).padStart(2, '0')}`
  console.log('Selected date:', dateStr)
}

const getDateStr = (day: { year: number; month: number; day: number }) => {
  return `${day.year}-${String(day.month + 1).padStart(2, '0')}-${String(day.day).padStart(2, '0')}`
}

const currentDate = ref(getTodayStr())
</script>

<template>
  <div class="calendar-panel">
    <div class="calendar-header">
      <div class="calendar-title">{{ monthDisplay }}</div>
      <div class="calendar-nav">
        <button class="cal-btn" @click="prevMonth">
          <i class="fas fa-chevron-left"></i>
        </button>
        <button class="cal-btn" @click="nextMonth">
          <i class="fas fa-chevron-right"></i>
        </button>
        <button class="cal-btn" @click="goToToday">今天</button>
      </div>
    </div>
    
    <div class="cal-weekdays">
      <span>一</span>
      <span>二</span>
      <span>三</span>
      <span>四</span>
      <span>五</span>
      <span>六</span>
      <span>日</span>
    </div>
    
    <div class="cal-days">
      <div 
        v-for="(day, index) in calendarDays" 
        :key="index"
        class="cal-day"
        :class="{
          'other-month': !day.isCurrent,
          'selected': getDateStr(day) === currentDate
        }"
        :style="getDateStr(day) === getTodayStr() && getDateStr(day) !== currentDate ? 
          { border: '1px solid var(--accent-blue)' } : {}"
        @click="selectDate(day)"
      >
        {{ day.day }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.calendar-panel {
  padding: 12px;
}

.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.calendar-title {
  font-weight: 600;
  font-size: 0.95rem;
  color: var(--text-primary);
}

.calendar-nav {
  display: flex;
  gap: 4px;
}

.cal-btn {
  padding: 4px 8px;
  border: none;
  border-radius: 4px;
  background: var(--tag-bg);
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 0.75rem;
  transition: all 0.2s;
}

.cal-btn:hover {
  background: var(--accent-blue-light);
  color: var(--accent-blue);
}

.cal-weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
  margin-bottom: 8px;
  text-align: center;
  font-size: 0.7rem;
  color: var(--text-secondary);
  font-weight: 500;
}

.cal-days {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
}

.cal-day {
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.75rem;
  transition: all 0.15s;
  color: var(--text-primary);
}

.cal-day:hover {
  background: var(--accent-blue-light);
}

.cal-day.other-month {
  color: var(--text-secondary);
  opacity: 0.4;
}

.cal-day.selected {
  background: var(--accent-blue);
  color: white;
  font-weight: 600;
}
</style>

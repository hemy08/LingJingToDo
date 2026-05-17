<template>
  <div class="task-panel-example">
    <!-- 任务导航树 -->
    <div class="task-tree-panel">
      <h3>任务导航树</h3>
      <div class="tree-container">
        <TaskTreeItem
          v-for="task in tasks"
          :key="task.id"
          :task="task"
          @task-click="handleTaskClick"
        />
      </div>
    </div>
    
    <!-- 任务面板 -->
    <div class="task-list-panel">
      <h3>任务面板</h3>
      <div class="task-list">
        <HighlightableTaskCard
          v-for="task in tasks"
          :key="task.id"
          :task="task"
        >
          <div class="task-card-content">
            <div class="task-header">
              <span class="task-title">{{ task.title }}</span>
              <span class="task-status">{{ getStatusName(task.status_id) }}</span>
            </div>
            <div class="task-meta">
              <span>类型: {{ getTypeName(task.type_id) }}</span>
              <span>优先级: {{ getPriorityName(task.priority_id) }}</span>
            </div>
          </div>
        </HighlightableTaskCard>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import TaskTreeItem from './TaskTreeItem.vue'
import HighlightableTaskCard from './HighlightableTaskCard.vue'
import type { Task } from '../../types'

// 示例任务数据
const tasks = ref<Task[]>([
  {
    id: 'task-1',
    title: '完成项目文档',
    status_id: 'in_progress',
    type_id: 'work',
    priority_id: 'p1',
    subtasks: [
      {
        id: 'task-1-1',
        title: '编写API文档',
        status_id: 'completed',
        type_id: 'work',
        priority_id: 'p2'
      },
      {
        id: 'task-1-2',
        title: '编写用户手册',
        status_id: 'pending',
        type_id: 'work',
        priority_id: 'p2'
      }
    ]
  },
  {
    id: 'task-2',
    title: '代码审查',
    status_id: 'pending',
    type_id: 'work',
    priority_id: 'p1'
  },
  {
    id: 'task-3',
    title: '学习新技术',
    status_id: 'pending',
    type_id: 'study',
    priority_id: 'p3'
  }
])

// 处理任务点击
function handleTaskClick(task: Task) {
  console.log('任务被点击:', task.id, task.title)
}

// 获取状态名称
function getStatusName(statusId: string): string {
  const statusMap: Record<string, string> = {
    'completed': '已完成',
    'in_progress': '进行中',
    'pending': '待处理'
  }
  return statusMap[statusId] || statusId
}

// 获取类型名称
function getTypeName(typeId: string): string {
  const typeMap: Record<string, string> = {
    'work': '工作',
    'study': '学习',
    'life': '生活'
  }
  return typeMap[typeId] || typeId
}

// 获取优先级名称
function getPriorityName(priorityId: string): string {
  const priorityMap: Record<string, string> = {
    'p1': '高',
    'p2': '中',
    'p3': '低'
  }
  return priorityMap[priorityId] || priorityId
}
</script>

<style scoped>
.task-panel-example {
  display: flex;
  gap: 20px;
  padding: 20px;
  height: 100vh;
}

.task-tree-panel,
.task-list-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
}

.task-tree-panel h3,
.task-list-panel h3 {
  margin: 0;
  padding: 16px;
  background: #f5f5f5;
  border-bottom: 1px solid #e0e0e0;
}

.tree-container,
.task-list {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.task-card-content {
  padding: 16px;
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
}

.task-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.task-title {
  font-weight: 500;
  font-size: 16px;
}

.task-status {
  font-size: 14px;
  color: #666;
}

.task-meta {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: #999;
}

/* 暗色主题 */
@media (prefers-color-scheme: dark) {
  .task-tree-panel h3,
  .task-list-panel h3 {
    background: #1a1a1a;
    border-bottom-color: #333;
  }

  .task-card-content {
    background: #1a1a1a;
    border-color: #333;
  }
}
</style>

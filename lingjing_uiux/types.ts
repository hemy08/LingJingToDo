export interface Task {
  id: string
  title: string
  status_id: string
  type_id: string
  priority_id: string
  due_date?: string
  subtasks?: Task[]
  remark?: string
  created_date?: string
  created_at?: string
  closed_date?: string
}

export interface TaskStatus {
  id: string
  name: string
  color: string
  emoji: string
}

export interface TaskType {
  id: string
  name: string
  color: string
  emoji: string
}

export interface TaskPriority {
  id: string
  name: string
  color: string
  emoji: string
}

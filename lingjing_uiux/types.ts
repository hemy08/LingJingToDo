export interface Task {
  id: number
  title: string
  statusId: string
  typeId: string
  priorityId: string
  dueDate?: string
  subtasks?: Task[]
  remark?: string
  createdDate?: string
  closedDate?: string
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

export interface Task {
  id: number
  title: string
  statusId: string
  typeId: string
  priorityId: string
  dueDate?: string
  subtasks?: Task[]
  remark?: string
}

export interface Status {
  id: string
  name: string
  color: string
  emoji: string
}

export interface Type {
  id: string
  name: string
  color: string
  emoji: string
}

export interface Priority {
  id: string
  name: string
  color: string
  emoji: string
}

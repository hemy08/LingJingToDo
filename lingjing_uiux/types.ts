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

/**
 * 文件类型枚举
 */
export enum FileType {
  JSON = 'json',
  XML = 'xml',
  Excel = 'excel'
}

/**
 * 历史文件记录
 */
export interface RecentFile {
  /** 文件路径 */
  path: string
  /** 文件类型 */
  type: FileType
  /** 文件名 */
  name: string
  /** 最后访问时间 */
  last_accessed: string
  /** 文件大小（字节） */
  size?: number
}

/**
 * 文件类型工具函数
 */
export namespace FileTypeUtils {
  /**
   * 根据文件路径推断文件类型
   */
  export function inferFromFile(path: string): FileType {
    const ext = path.split('.').pop()?.toLowerCase()
    switch (ext) {
      case 'json':
        return FileType.JSON
      case 'xml':
        return FileType.XML
      case 'xlsx':
      case 'xls':
        return FileType.Excel
      default:
        return FileType.JSON
    }
  }

  /**
   * 获取文件类型显示名称
   */
  export function getDisplayName(type: FileType): string {
    switch (type) {
      case FileType.JSON:
        return 'JSON'
      case FileType.XML:
        return 'XML'
      case FileType.Excel:
        return 'Excel'
      default:
        return 'Unknown'
    }
  }

  /**
   * 获取文件类型图标
   */
  export function getIcon(type: FileType): string {
    switch (type) {
      case FileType.JSON:
        return '📄'
      case FileType.XML:
        return '📋'
      case FileType.Excel:
        return '📊'
      default:
        return '📁'
    }
  }

  /**
   * 获取文件类型颜色
   */
  export function getColor(type: FileType): string {
    switch (type) {
      case FileType.JSON:
        return '#4CAF50'
      case FileType.XML:
        return '#FF9800'
      case FileType.Excel:
        return '#2196F3'
      default:
        return '#9E9E9E'
    }
  }

  /**
   * 获取文件扩展名
   */
  export function getExtension(type: FileType): string {
    switch (type) {
      case FileType.JSON:
        return '.json'
      case FileType.XML:
        return '.xml'
      case FileType.Excel:
        return '.xlsx'
      default:
        return ''
    }
  }
}

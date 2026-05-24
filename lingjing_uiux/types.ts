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
 * 错误类型枚举
 */
export enum ErrorType {
  Network = 'NetworkError',
  Data = 'DataError',
  Permission = 'PermissionError',
  System = 'SystemError',
  Business = 'BusinessError',
  Config = 'ConfigError',
}

/**
 * 错误等级枚举
 */
export enum ErrorLevel {
  Fatal = 'Fatal',
  Severe = 'Critical',
  Warning = 'Warning',
  Info = 'Info',
}

/**
 * 恢复策略枚举
 */
export enum RecoveryStrategy {
  AutoRetry = 'AutoRetry',
  StateReset = 'StateReset',
  DataRollback = 'DataRollback',
  UserIntervention = 'UserIntervention',
}

/**
 * 错误上下文接口
 */
export interface ErrorContext {
  timestamp: string
  url?: string
  userAgent?: string
  route?: string
  component?: string
  action?: string
  userId?: string
  deviceInfo?: Record<string, any>
  stateSnapshot?: Record<string, any>
  [key: string]: any
}

/**
 * 分类后错误接口
 */
export interface ClassifiedError {
  errorId: string
  originalError: Error | unknown
  type: ErrorType
  level: ErrorLevel
  message: string
  stack?: string
  context: ErrorContext
  errorCode?: string
  timestamp: string
}

/**
 * 错误日志接口
 */
export interface ErrorLog {
  error_id: string
  timestamp: string
  error_code?: string
  error_type: ErrorType
  error_level: ErrorLevel
  message: string
  stack?: string
  context: ErrorContext
  recovery_attempted?: boolean
  recovery_success?: boolean
  recovery_strategy?: RecoveryStrategy
}

/**
 * 恢复记录接口
 */
export interface RecoveryRecord {
  errorId: string
  strategy: RecoveryStrategy
  timestamp: string
  success: boolean
  attempts: number
  details?: string
}

/**
 * 错误统计接口
 */
export interface ErrorStatistics {
  totalErrors: number
  errorsByType: Record<ErrorType, number>
  errorsByLevel: Record<ErrorLevel, number>
  recoverySuccessRate: number
  recentErrors: ErrorLog[]
  timeRange: {
    start: string
    end: string
  }
}

/**
 * 错误处理配置接口
 */
export interface ErrorHandlerConfig {
  enableRemoteReport: boolean
  remoteReportUrl?: string
  logRetentionDays: number
  maxLogFileSize: number
  maxTotalLogSize: number
  batchReportSize: number
  batchReportInterval: number
  maxRetryAttempts: number
  retryDelays: number[]
}

/**
 * 文件类型枚举
 */
export enum FileType {
  JSON = 'json',
  XML = 'xml',
  Excel = 'excel',
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

export enum OperationType {
  CREATE_TASK = 'CREATE_TASK',
  UPDATE_TASK = 'UPDATE_TASK',
  DELETE_TASK = 'DELETE_TASK',
  ADD_SUBTASK = 'ADD_SUBTASK',
  UPDATE_SUBTASK = 'UPDATE_SUBTASK',
  DELETE_SUBTASK = 'DELETE_SUBTASK',
}

export interface OperationSnapshot {
  id: string
  type: OperationType
  targetTaskId: string
  parentTaskId?: string
  beforeState: Task | null
  afterState: Task | null
  timestamp: string
}

export enum SearchScope {
  TITLE = 'TITLE',
  DESCRIPTION = 'DESCRIPTION',
  TYPE = 'TYPE',
  ALL = 'ALL',
}

export interface SearchParams {
  keyword: string
  scope: SearchScope
  caseSensitive: boolean
  enableHighlight: boolean
}

export interface HighlightRange {
  field: 'title' | 'remark' | 'type_id'
  start: number
  end: number
  text: string
}

export interface SearchResult {
  matchedTasks: Task[]
  totalMatches: number
  highlightPositions: Map<string, HighlightRange[]>
  duration?: number
}

export enum FilterType {
  STATUS = 'STATUS',
  PRIORITY = 'PRIORITY',
  TYPE = 'TYPE',
  CREATE_DATE = 'CREATE_DATE',
  DUE_DATE = 'DUE_DATE',
}

export enum FilterOperator {
  EQUALS = 'EQUALS',
  NOT_EQUALS = 'NOT_EQUALS',
  GREATER_THAN = 'GREATER_THAN',
  LESS_THAN = 'LESS_THAN',
  CONTAINS = 'CONTAINS',
  IN_RANGE = 'IN_RANGE',
}

export interface DateRange {
  start: string
  end: string
}

export interface FilterCondition {
  id: string
  type: FilterType
  operator: FilterOperator
  value: string | string[] | DateRange
  label: string
  enabled: boolean
}

export type LogicOperator = 'AND' | 'OR'

export interface CompoundFilterConfig {
  conditions: FilterCondition[]
  logicOperator: LogicOperator
  enabled: boolean
}

import type { Task, OperationSnapshot } from '../types'

export interface HistoryViewConfig {
  maxDisplayRecords: number
  showSearchBox: boolean
  enableVirtualScroll: boolean
  virtualScrollThreshold: number
}

export interface HistoryDisplayItem {
  snapshot: OperationSnapshot
  displayText: string
  relativeTime: string
  icon: string
  canUndo: boolean
}

export interface BatchUndoConfig {
  selectedIds: string[]
  confirmRequired: boolean
}

export interface SearchHistoryItem {
  keyword: string
  timestamp: string
  resultCount: number
}

export interface AdvancedSearchCondition {
  field: SearchField
  operator: SearchOperator
  value: string
  caseSensitive: boolean
}

export interface AdvancedSearchConfig {
  conditions: AdvancedSearchCondition[]
  logicOperator: LogicOperator
  enableRegex: boolean
  enableFuzzy: boolean
  sortBy: SearchSortBy
  sortOrder: SortOrder
}

export interface FilterScheme {
  id: string
  name: string
  config: CompoundFilterConfig
  createdAt: string
  updatedAt: string
}

export interface SchemeManagerConfig {
  maxSchemes: number
  enableExport: boolean
  enableImport: boolean
}

export interface SortConfig {
  field: SortField
  order: SortOrder
}

export interface CompoundFilterConfig {
  conditions: FilterCondition[]
  logicOperator: LogicOperator
  enabled: boolean
}

export interface FilterCondition {
  id: string
  type: string
  operator: string
  value: string | string[] | DateRange
  label: string
  enabled: boolean
}

export interface DateRange {
  start: string
  end: string
}

export interface BatchSelectionState {
  selectedIds: Set<string>
  isSelectAll: boolean
  lastSelectedId: string | null
}

export interface BatchOperationConfig {
  mode: BatchOperationMode
  taskIds: string[]
  targetValue?: string
  confirmRequired: boolean
}

export interface BatchOperationResult {
  success: boolean
  successCount: number
  failCount: number
  failedIds: string[]
  errorMessage?: string
}

export interface ExecutedOperation {
  taskId: string
  operation: string
  beforeState: Task | null
  afterState: Task | null
}

export interface ExportConfig {
  format: ExportFormat
  scope: ExportScope
  fields: ExportField[]
  includeHeaders: boolean
  customScopeIds?: string[]
}

export interface ExportProgress {
  current: number
  total: number
  percentage: number
  status: ExportStatus
}

export interface ExportResult {
  success: boolean
  filename: string
  filepath?: string
  recordCount: number
  errorMessage?: string
}

export interface ShortcutMapping {
  action: ShortcutAction
  key: string
  description: string
  enabled: boolean
}

export interface ShortcutConfig {
  mappings: Map<ShortcutAction, string>
  enableGlobalShortcuts: boolean
}

export interface ConflictCheckResult {
  hasConflict: boolean
  conflictingAction?: ShortcutAction
  isSystemReserved: boolean
}

export type SearchField = 'TITLE' | 'DESCRIPTION' | 'TYPE' | 'STATUS' | 'PRIORITY' | 'ALL'
export type SearchOperator = 'CONTAINS' | 'EQUALS' | 'STARTS_WITH' | 'ENDS_WITH' | 'REGEX' | 'FUZZY'
export type SearchSortBy = 'RELEVANCE' | 'CREATED_DATE' | 'DUE_DATE' | 'PRIORITY' | 'STATUS'
export type SortOrder = 'ASC' | 'DESC'
export type SortField = 'CREATED_DATE' | 'DUE_DATE' | 'PRIORITY' | 'STATUS' | 'TITLE'
export type LogicOperator = 'AND' | 'OR'
export type BatchOperationMode = 'UPDATE_STATUS' | 'UPDATE_PRIORITY' | 'UPDATE_TYPE' | 'DELETE'
export type ExportFormat = 'CSV' | 'JSON'
export type ExportScope = 'ALL' | 'FILTERED' | 'SELECTED'
export type ExportField = 'ID' | 'TITLE' | 'STATUS' | 'TYPE' | 'PRIORITY' | 'DUE_DATE' | 'CREATED_DATE' | 'REMARK'
export type ExportStatus = 'IDLE' | 'PREPARING' | 'EXPORTING' | 'WRITING' | 'COMPLETED' | 'FAILED'
export type ShortcutAction =
  | 'UNDO'
  | 'REDO'
  | 'SEARCH'
  | 'ADVANCED_SEARCH'
  | 'TOGGLE_FILTER'
  | 'BATCH_SELECT'
  | 'EXPORT'
  | 'NEW_TASK'
  | 'DELETE_TASK'
  | 'SAVE'
  | 'OPEN_HISTORY'

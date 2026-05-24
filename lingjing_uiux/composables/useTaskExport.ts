import { ref } from 'vue'
import type { Task } from '../types'
import type { ExportConfig, ExportProgress, ExportResult } from '../types/enhancements'

export function useTaskExport() {
  const progress = ref<ExportProgress>({
    current: 0,
    total: 0,
    percentage: 0,
    status: 'IDLE',
  })

  function toCSV(tasks: Task[], fields: string[], includeHeaders = true): string {
    const rows: string[][] = []

    if (includeHeaders) {
      rows.push(fields)
    }

    for (const task of tasks) {
      const row: string[] = []
      for (const field of fields) {
        let value = ''
        switch (field) {
          case 'ID':
            value = task.id
            break
          case 'TITLE':
            value = task.title
            break
          case 'STATUS':
            value = task.status_id
            break
          case 'TYPE':
            value = task.type_id
            break
          case 'PRIORITY':
            value = task.priority_id
            break
          case 'DUE_DATE':
            value = task.due_date || ''
            break
          case 'CREATED_DATE':
            value = task.created_date || ''
            break
          case 'REMARK':
            value = task.remark || ''
            break
        }
        row.push(`"${value.replace(/"/g, '""')}"`)
      }
      rows.push(row)
    }

    return rows.map(row => row.join(',')).join('\n')
  }

  function toJSON(tasks: Task[], fields: string[]): string {
    const data = tasks.map(task => {
      const obj: Record<string, any> = {}
      for (const field of fields) {
        switch (field) {
          case 'ID':
            obj['id'] = task.id
            break
          case 'TITLE':
            obj['title'] = task.title
            break
          case 'STATUS':
            obj['status'] = task.status_id
            break
          case 'TYPE':
            obj['type'] = task.type_id
            break
          case 'PRIORITY':
            obj['priority'] = task.priority_id
            break
          case 'DUE_DATE':
            obj['dueDate'] = task.due_date
            break
          case 'CREATED_DATE':
            obj['createdDate'] = task.created_date
            break
          case 'REMARK':
            obj['remark'] = task.remark
            break
        }
      }
      return obj
    })

    return JSON.stringify(data, null, 2)
  }

  function generateFilename(format: string, taskCount: number): string {
    const date = new Date().toISOString().split('T')[0]
    const ext = format.toLowerCase()
    return `tasks_${date}_${taskCount}.${ext}`
  }

  async function exportTasks(
    config: ExportConfig,
    tasks: Task[],
    onProgress?: (p: ExportProgress) => void
  ): Promise<ExportResult> {
    progress.value = {
      current: 0,
      total: tasks.length,
      percentage: 0,
      status: 'PREPARING',
    }
    onProgress?.(progress.value)

    let exportTasks: Task[]
    switch (config.scope) {
      case 'ALL':
        exportTasks = tasks
        break
      case 'SELECTED':
        exportTasks = tasks.filter(t => config.customScopeIds?.includes(t.id))
        break
      case 'FILTERED':
        exportTasks = tasks
        break
      default:
        exportTasks = tasks
    }

    progress.value.status = 'EXPORTING'
    onProgress?.(progress.value)

    let content: string
    try {
      if (config.format === 'CSV') {
        content = toCSV(exportTasks, config.fields, config.includeHeaders)
      } else {
        content = toJSON(exportTasks, config.fields)
      }
    } catch (error) {
      progress.value.status = 'FAILED'
      onProgress?.(progress.value)
      return {
        success: false,
        filename: '',
        recordCount: 0,
        errorMessage: 'Failed to generate export content',
      }
    }

    progress.value = {
      current: exportTasks.length,
      total: exportTasks.length,
      percentage: 100,
      status: 'COMPLETED',
    }
    onProgress?.(progress.value)

    const filename = generateFilename(config.format, exportTasks.length)

    downloadFile(content, filename, config.format)

    return {
      success: true,
      filename,
      recordCount: exportTasks.length,
    }
  }

  function downloadFile(content: string, filename: string, format: string): void {
    const mimeType = format === 'CSV' ? 'text/csv' : 'application/json'
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return {
    progress,
    exportTasks,
    toCSV,
    toJSON,
    generateFilename,
  }
}

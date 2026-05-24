import { invoke } from '@tauri-apps/api/core'
import { ref, type Ref } from 'vue'

export interface UseFileOperationsOptions {
  isDirty?: Ref<boolean>
  onFileOpened?: (filePath: string, fileType: string) => void
  onFileSaved?: (filePath: string) => void
  onError?: (error: string) => void
}

export interface UseFileOperationsReturn {
  currentFilePath: Ref<string | null>
  currentFileType: Ref<string>
  isDirty: Ref<boolean>
  handleOpenFile: () => Promise<void>
  handleSaveFile: (data: Record<string, any[]>) => Promise<void>
  handleSaveAs: (data: Record<string, any[]>) => Promise<void>
  markDirty: () => void
  clearDirty: () => void
}

export function useFileOperations(options: UseFileOperationsOptions = {}): UseFileOperationsReturn {
  const currentFilePath = ref<string | null>(null)
  const currentFileType = ref<string>('json')
  const isDirty = options.isDirty || ref(false)

  const markDirty = () => {
    isDirty.value = true
  }

  const clearDirty = () => {
    isDirty.value = false
  }

  const handleOpenFile = async (): Promise<void> => {
    try {
      const { open } = await import('@tauri-apps/plugin-dialog')
      const selected = await open({
        multiple: false,
        filters: [
          { name: 'JSON', extensions: ['json'] },
          { name: 'Excel', extensions: ['xlsx', 'xls'] },
          { name: 'XML', extensions: ['xml'] },
        ],
      })

      if (selected) {
        const filePath = selected as string
        const fileType = filePath.endsWith('.json')
          ? 'json'
          : filePath.endsWith('.xlsx') || filePath.endsWith('.xls')
            ? 'excel'
            : 'xml'

        currentFilePath.value = filePath
        currentFileType.value = fileType
        clearDirty()

        options.onFileOpened?.(filePath, fileType)
      }
    } catch (error) {
      const errorMsg = `文件选择失败: ${error}`
      console.error(errorMsg)
      options.onError?.(errorMsg)
    }
  }

  const handleSaveFile = async (data: Record<string, any[]>): Promise<void> => {
    if (currentFilePath.value) {
      try {
        await invoke('save_file', {
          filePath: currentFilePath.value,
          fileType: currentFileType.value,
          data: data,
        })
        console.log('文件保存成功', data)
        clearDirty()
        options.onFileSaved?.(currentFilePath.value)
      } catch (error) {
        const errorMsg = `无法保存文件: ${error}`
        console.error(errorMsg)
        options.onError?.(errorMsg)
      }
    } else {
      await handleSaveAs(data)
    }
  }

  const handleSaveAs = async (data: Record<string, any[]>): Promise<void> => {
    try {
      const { save } = await import('@tauri-apps/plugin-dialog')
      const filePath = await save({
        filters: [
          { name: 'JSON', extensions: ['json'] },
          { name: 'Excel', extensions: ['xlsx'] },
          { name: 'XML', extensions: ['xml'] },
        ],
      })

      if (filePath) {
        const fileType = filePath.endsWith('.json')
          ? 'json'
          : filePath.endsWith('.xlsx')
            ? 'excel'
            : 'xml'

        try {
          await invoke('save_file', {
            filePath: filePath,
            fileType: fileType,
            data: data,
          })
          currentFilePath.value = filePath
          currentFileType.value = fileType
          clearDirty()
          options.onFileSaved?.(filePath)
        } catch (error) {
          const errorMsg = `无法保存文件: ${error}`
          console.error(errorMsg)
          options.onError?.(errorMsg)
        }
      }
    } catch (error) {
      const errorMsg = `文件选择失败: ${error}`
      console.error(errorMsg)
      options.onError?.(errorMsg)
    }
  }

  return {
    currentFilePath,
    currentFileType,
    isDirty,
    handleOpenFile,
    handleSaveFile,
    handleSaveAs,
    markDirty,
    clearDirty,
  }
}

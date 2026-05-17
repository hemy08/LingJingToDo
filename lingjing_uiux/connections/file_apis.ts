import { invoke } from '@tauri-apps/api/core'
import type { RecentFile } from '../types'
// FileType 暂时未使用，但保留以备后用
// import { FileType } from '../types'

/**
 * 文件操作 API
 */
export const fileApi = {
  /**
   * 打开文件
   */
  async openFile(
    filePath: string,
    fileType: 'json' | 'xml' | 'excel'
  ): Promise<Record<string, any[]>> {
    return await invoke('open_file', { filePath, fileType })
  },

  /**
   * 保存文件
   */
  async saveFile(
    filePath: string,
    fileType: 'json' | 'xml' | 'excel',
    data: Record<string, any[]>
  ): Promise<void> {
    return await invoke('save_file', { filePath, fileType, data })
  },

  /**
   * 获取最近文件列表
   */
  async getRecentFiles(): Promise<RecentFile[]> {
    return await invoke<RecentFile[]>('get_recent_files')
  },

  /**
   * 添加到最近文件列表
   */
  async addRecentFile(
    filePath: string,
    fileType?: 'json' | 'xml' | 'excel'
  ): Promise<RecentFile[]> {
    // 如果未指定文件类型，从路径推断
    const type = fileType || this.inferFileType(filePath)
    return await invoke<RecentFile[]>('add_recent_file', { 
      filePath, 
      fileType: type 
    })
  },

  /**
   * 从文件路径推断文件类型
   */
  inferFileType(filePath: string): 'json' | 'xml' | 'excel' {
    const ext = filePath.split('.').pop()?.toLowerCase()
    switch (ext) {
      case 'json':
        return 'json'
      case 'xml':
        return 'xml'
      case 'xlsx':
      case 'xls':
        return 'excel'
      default:
        return 'json'
    }
  },

  /**
   * 清除最近文件列表
   */
  async clearRecentFiles(): Promise<void> {
    return await invoke('clear_recent_files')
  },

  /**
   * 从最近文件列表中移除指定文件
   */
  async removeRecentFile(filePath: string): Promise<RecentFile[]> {
    return await invoke<RecentFile[]>('remove_recent_file', { filePath })
  }
}

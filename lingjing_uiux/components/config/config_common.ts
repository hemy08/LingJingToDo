import { Ref } from 'vue'
import { useDialog } from '../../composables/useDialog'

const { showAlert, showConfirm, showConfirmWithClose } = useDialog()

/**
 * 配置项保存、关闭、删除、添加、移动和调整大小的公共处理逻辑
 */
export interface ConfigHandlers<T> {
  /**
   * 保存配置项
   */
  handleSave: (
    items: Ref<T[]>,
    updateApi: (items: T[]) => Promise<T[]>,
    modifiedIds: Ref<Set<string>>,
    emitUpdated: (items: T[]) => void,
    emitClose: () => void,
    itemName: string,
    closeAfterSave?: boolean
  ) => Promise<void>

  /**
   * 关闭配置窗口（处理未保存的修改）
   */
  handleClose: (
    hasModifications: () => boolean,
    items: Ref<T[]>,
    updateApi: (items: T[]) => Promise<T[]>,
    modifiedIds: Ref<Set<string>>,
    emitUpdated: (items: T[]) => void,
    emitClose: () => void,
    itemName: string
  ) => Promise<void>

  /**
   * 删除配置项
   */
  handleDelete: (
    id: string,
    items: Ref<T[]>,
    deleteApi: (id: string) => Promise<T[]>,
    modifiedIds: Ref<Set<string>>,
    emitUpdated: (items: T[]) => void,
    itemName: string
  ) => Promise<void>

  /**
   * 添加配置项
   */
  handleAdd: (
    newItemName: Ref<string>,
    newItemEmoji: Ref<string>,
    items: Ref<T[]>,
    modifiedIds: Ref<Set<string>>,
    itemName: string,
    idPrefix: string,
    createItem: (id: string, name: string, emoji: string) => T
  ) => void

  /**
   * 上移配置项
   */
  handleMoveUp: (
    index: number,
    items: Ref<T[]>,
    modifiedIds: Ref<Set<string>>
  ) => void

  /**
   * 下移配置项
   */
  handleMoveDown: (
    index: number,
    items: Ref<T[]>,
    modifiedIds: Ref<Set<string>>
  ) => void

  /**
   * 开始调整模态框大小
   */
  handleStartResize: (
    direction: string,
    event: MouseEvent,
    modalWidth: Ref<number>,
    modalHeight: Ref<number>
  ) => void
}

/**
 * 创建配置项的保存、关闭、删除、添加、移动和调整大小处理函数
 */
export function createConfigHandlers<T extends { id: string; name: string; emoji: string }>(): ConfigHandlers<T> {
  const handleSave = async (
    items: Ref<T[]>,
    updateApi: (items: T[]) => Promise<T[]>,
    modifiedIds: Ref<Set<string>>,
    emitUpdated: (items: T[]) => void,
    emitClose: () => void,
    itemName: string,
    closeAfterSave: boolean = false
  ) => {
    try {
      const result = await updateApi(items.value)
      items.value = result
      modifiedIds.value.clear()
      emitUpdated(result)
      
      if (closeAfterSave) {
        showAlert('成功', `所有${itemName}已保存`, () => {
          emitClose()
        })
      } else {
        showAlert('成功', `所有${itemName}已保存`)
      }
    } catch (error) {
      console.error(`保存${itemName}失败:`, error)
      showAlert('错误', `保存${itemName}失败`)
    }
  }

  const handleClose = async (
    hasModifications: () => boolean,
    items: Ref<T[]>,
    updateApi: (items: T[]) => Promise<T[]>,
    modifiedIds: Ref<Set<string>>,
    emitUpdated: (items: T[]) => void,
    emitClose: () => void,
    itemName: string
  ) => {
    if (hasModifications()) {
      const choice = await showConfirmWithClose(
        '提示',
        '有未保存的修改，请选择操作',
        '保存并关闭',
        '取消',
        '不保存关闭'
      )
      
      if (choice === 'confirm') {
        // 保存并关闭
        try {
          const result = await updateApi(items.value)
          items.value = result
          modifiedIds.value.clear()
          emitUpdated(result)
          emitClose()
        } catch (error) {
          console.error(`保存${itemName}失败:`, error)
          showAlert('错误', `保存${itemName}失败`)
        }
      } else if (choice === 'close') {
        // 不保存关闭
        emitClose()
      }
      // choice === 'cancel' 时什么都不做，保持在当前模态框
    } else {
      emitClose()
    }
  }

  const handleDelete = async (
    id: string,
    items: Ref<T[]>,
    deleteApi: (id: string) => Promise<T[]>,
    modifiedIds: Ref<Set<string>>,
    emitUpdated: (items: T[]) => void,
    itemName: string
  ) => {
    // 检查是否至少保留一个配置项
    if (items.value.length <= 1) {
      showAlert('提示', `至少保留一个${itemName}`)
      return
    }

    // 确认删除
    showConfirm('确认', `确定删除该${itemName}吗?`, async () => {
      try {
        const result = await deleteApi(id)
        items.value = result
        modifiedIds.value.delete(id)
        emitUpdated(result)
      } catch (error) {
        console.error(`删除${itemName}失败:`, error)
        showAlert('错误', `删除${itemName}失败`)
      }
    })
  }

  const handleAdd = (
    newItemName: Ref<string>,
    newItemEmoji: Ref<string>,
    items: Ref<T[]>,
    modifiedIds: Ref<Set<string>>,
    itemName: string,
    idPrefix: string,
    createItem: (id: string, name: string, emoji: string) => T
  ) => {
    // 验证输入
    if (!newItemName.value.trim()) {
      showAlert('提示', `请输入${itemName}名称`)
      return
    }
    
    // 检查是否已存在
    if (items.value.some(item => item.name === newItemName.value.trim())) {
      showAlert('提示', `${itemName}已存在`)
      return
    }

    // 创建新配置项
    const newItem = createItem(
      `${idPrefix}_${Date.now()}`,
      newItemName.value.trim(),
      newItemEmoji.value
    )

    // 添加到列表
    items.value.push(newItem)
    modifiedIds.value.add(newItem.id)
    
    // 清空输入
    newItemName.value = ''
  }

  const handleMoveUp = (
    index: number,
    items: Ref<T[]>,
    modifiedIds: Ref<Set<string>>
  ) => {
    if (index > 0) {
      const temp = items.value[index]
      items.value[index] = items.value[index - 1]
      items.value[index - 1] = temp
      modifiedIds.value.add(items.value[index].id)
      modifiedIds.value.add(items.value[index - 1].id)
    }
  }

  const handleMoveDown = (
    index: number,
    items: Ref<T[]>,
    modifiedIds: Ref<Set<string>>
  ) => {
    if (index < items.value.length - 1) {
      const temp = items.value[index]
      items.value[index] = items.value[index + 1]
      items.value[index + 1] = temp
      modifiedIds.value.add(items.value[index].id)
      modifiedIds.value.add(items.value[index + 1].id)
    }
  }

  const handleStartResize = (
    direction: string,
    event: MouseEvent,
    modalWidth: Ref<number>,
    modalHeight: Ref<number>
  ) => {
    event.preventDefault()
    
    const startX = event.clientX
    const startY = event.clientY
    const startWidth = modalWidth.value
    const startHeight = modalHeight.value
    
    const handleMouseMove = (e: MouseEvent) => {
      if (direction === 'right' || direction === 'corner') {
        const newWidth = startWidth + (e.clientX - startX)
        modalWidth.value = Math.max(400, Math.min(800, newWidth))
      }
      if (direction === 'bottom' || direction === 'corner') {
        const newHeight = startHeight + (e.clientY - startY)
        modalHeight.value = Math.max(400, Math.min(800, newHeight))
      }
    }
    
    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
    
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  return {
    handleSave,
    handleClose,
    handleDelete,
    handleAdd,
    handleMoveUp,
    handleMoveDown,
    handleStartResize
  }
}

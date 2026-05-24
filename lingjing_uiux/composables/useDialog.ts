import { ref } from 'vue'

import Dialog from '../common/Dialog.vue'

export interface DialogButton {
  text: string
  type?: string
  action?: string
}

export interface DialogOptions {
  title: string
  message: string
  buttons?: DialogButton[]
  icon?: string
}

const dialogState = ref<{
  visible: boolean
  title: string
  message: string
  buttons: DialogButton[]
  icon: string
}>({
  visible: false,
  title: '',
  message: '',
  buttons: [],
  icon: 'fas fa-info-circle',
})

const dialogCallbacks = ref<Map<string, (() => void) | undefined>>(new Map())

export function useDialog() {
  const showDialog = (
    title: string,
    message: string,
    buttons?: DialogButton[],
    callbacks?: { confirm?: () => void; cancel?: () => void; close?: () => void }
  ) => {
    dialogState.value = {
      visible: true,
      title,
      message,
      buttons: buttons || [{ text: '确定', type: 'btn-primary', action: 'confirm' }],
      icon: title.includes('错误')
        ? 'fas fa-exclamation-circle'
        : title.includes('确认') || title.includes('提示')
          ? 'fas fa-question-circle'
          : 'fas fa-info-circle',
    }

    dialogCallbacks.value.clear()
    if (callbacks?.confirm) {
      dialogCallbacks.value.set('confirm', callbacks.confirm)
    }
    if (callbacks?.cancel) {
      dialogCallbacks.value.set('cancel', callbacks.cancel)
    }
    if (callbacks?.close) {
      dialogCallbacks.value.set('close', callbacks.close)
    }
  }

  const showAlert = (title: string, message: string, callback?: () => void) => {
    showDialog(title, message, [{ text: '确定', type: 'btn-primary', action: 'confirm' }], {
      confirm: callback,
    })
  }

  const showConfirm = (
    title: string,
    message: string,
    onConfirm?: () => void,
    onCancel?: () => void
  ) => {
    showDialog(
      title,
      message,
      [
        { text: '取消', action: 'cancel' },
        { text: '确定', type: 'btn-primary', action: 'confirm' },
      ],
      { confirm: onConfirm, cancel: onCancel }
    )
  }

  /**
   * 显示三按钮确认对话框
   * @param title 标题
   * @param message 消息
   * @param confirmText 确认按钮文字
   * @param cancelText 取消按钮文字
   * @param closeText 关闭按钮文字
   * @param callbacks 回调函数
   * @returns Promise<'confirm' | 'cancel' | 'close'> 返回用户选择
   */
  const showConfirmWithClose = (
    title: string,
    message: string,
    confirmText: string = '保存',
    cancelText: string = '取消',
    closeText: string = '不保存',
    callbacks?: { onConfirm?: () => void; onCancel?: () => void; onClose?: () => void }
  ): Promise<'confirm' | 'cancel' | 'close'> => {
    return new Promise(resolve => {
      showDialog(
        title,
        message,
        [
          { text: cancelText, action: 'cancel' },
          { text: closeText, action: 'close' },
          { text: confirmText, type: 'btn-primary', action: 'confirm' },
        ],
        {
          confirm: () => {
            callbacks?.onConfirm?.()
            resolve('confirm')
          },
          cancel: () => {
            callbacks?.onCancel?.()
            resolve('cancel')
          },
          close: () => {
            callbacks?.onClose?.()
            resolve('close')
          },
        }
      )
    })
  }

  const handleButtonClick = (button: DialogButton) => {
    const callback = dialogCallbacks.value.get(button.action || 'confirm')
    dialogState.value.visible = false
    if (callback) {
      callback()
    }
  }

  const handleOverlayClick = () => {
    dialogState.value.visible = false
  }

  return {
    dialogState,
    showDialog,
    showAlert,
    showConfirm,
    showConfirmWithClose,
    handleButtonClick,
    handleOverlayClick,
    Dialog,
  }
}

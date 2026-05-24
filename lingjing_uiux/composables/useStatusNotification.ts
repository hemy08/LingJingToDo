import { ref, type Ref } from 'vue'

export type StatusType = 'success' | 'error' | 'warning' | 'info'

export interface StatusNotification {
  message: string
  detail: string
  type: StatusType
}

export interface UseStatusNotificationReturn {
  statusVisible: Ref<boolean>
  statusMessage: Ref<string>
  statusDetail: Ref<string>
  statusType: Ref<StatusType>
  showStatus: (message: string, detail?: string, type?: StatusType) => void
  hideStatus: () => void
}

export function useStatusNotification(): UseStatusNotificationReturn {
  const statusVisible = ref(false)
  const statusMessage = ref('')
  const statusDetail = ref('')
  const statusType = ref<StatusType>('success')

  let hideTimer: number | null = null

  const hideStatus = (): void => {
    if (hideTimer) {
      clearTimeout(hideTimer)
      hideTimer = null
    }
    statusVisible.value = false
  }

  const showStatus = (message: string, detail?: string, type: StatusType = 'success'): void => {
    if (hideTimer) {
      clearTimeout(hideTimer)
    }

    statusMessage.value = message
    statusDetail.value = detail || ''
    statusType.value = type
    statusVisible.value = true

    hideTimer = window.setTimeout(() => {
      statusVisible.value = false
      hideTimer = null
    }, 3000)
  }

  return {
    statusVisible,
    statusMessage,
    statusDetail,
    statusType,
    showStatus,
    hideStatus,
  }
}

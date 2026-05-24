import { ref, type Ref, onUnmounted } from 'vue'

export interface UseSplitterDragOptions {
  initialWidth?: number
  minWidth?: number
  maxWidth?: number
  onResize?: () => void
}

export interface UseSplitterDragReturn {
  isSplitterActive: Ref<boolean>
  sidebarWidthPercent: Ref<number>
  startSplitterDrag: (event: MouseEvent) => void
  sidebarStyle: { width: string }
}

export function useSplitterDrag(options: UseSplitterDragOptions = {}): UseSplitterDragReturn {
  const { initialWidth = 15, minWidth = 10, maxWidth = 40, onResize } = options

  const isSplitterActive = ref(false)
  const sidebarWidthPercent = ref(initialWidth)

  let handleMouseMove: ((e: MouseEvent) => void) | null = null
  let handleMouseUp: (() => void) | null = null

  const triggerResize = (): void => {
    window.dispatchEvent(new Event('resize'))
    onResize?.()
  }

  const startSplitterDrag = (event: MouseEvent): void => {
    event.preventDefault()
    isSplitterActive.value = true

    const startX = event.clientX
    const startWidth = sidebarWidthPercent.value
    const windowWidth = window.innerWidth

    handleMouseMove = (e: MouseEvent): void => {
      const deltaX = e.clientX - startX
      const deltaPercent = (deltaX / windowWidth) * 100
      const newWidth = startWidth + deltaPercent
      sidebarWidthPercent.value = Math.max(minWidth, Math.min(maxWidth, newWidth))

      triggerResize()
    }

    handleMouseUp = (): void => {
      isSplitterActive.value = false

      if (handleMouseMove) {
        document.removeEventListener('mousemove', handleMouseMove)
        handleMouseMove = null
      }
      if (handleMouseUp) {
        document.removeEventListener('mouseup', handleMouseUp)
        handleMouseUp = null
      }

      triggerResize()
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  onUnmounted(() => {
    if (handleMouseMove) {
      document.removeEventListener('mousemove', handleMouseMove)
    }
    if (handleMouseUp) {
      document.removeEventListener('mouseup', handleMouseUp)
    }
  })

  const sidebarStyle = {
    get width(): string {
      return `${sidebarWidthPercent.value}%`
    },
  }

  return {
    isSplitterActive,
    sidebarWidthPercent,
    startSplitterDrag,
    sidebarStyle,
  }
}

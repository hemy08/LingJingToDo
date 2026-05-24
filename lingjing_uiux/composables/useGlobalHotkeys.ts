import { onMounted, onUnmounted, ref, type Ref } from 'vue'

export interface HotkeyConfig {
  key: string
  description: string
  handler: () => void | Promise<void>
  enabled?: () => boolean
  preventDefault?: boolean
}

export interface UseGlobalHotkeysOptions {
  hotkeys: HotkeyConfig[]
  excludeInputs?: boolean
}

interface HotkeyMapItem {
  key: string
  description: string
  handler: () => void | Promise<void>
  enabled: Ref<boolean>
  preventDefault: boolean
}

export interface UseGlobalHotkeysReturn {
  register: () => void
  unregister: () => void
  enable: (key: string) => void
  disable: (key: string) => void
  isEnabled: (key: string) => boolean
}

export function useGlobalHotkeys(options: UseGlobalHotkeysOptions): UseGlobalHotkeysReturn {
  const { hotkeys, excludeInputs = true } = options

  const hotkeyMap = new Map<string, HotkeyMapItem>()
  const registered = ref(false)

  hotkeys.forEach(config => {
    const normalizedKey = normalizeKey(config.key)

    if (hotkeyMap.has(normalizedKey)) {
      console.warn(`快捷键冲突: ${config.key} 已被占用`)
      return
    }

    hotkeyMap.set(normalizedKey, {
      key: normalizedKey,
      description: config.description,
      handler: config.handler,
      enabled: ref(config.enabled ? config.enabled() : true),
      preventDefault: config.preventDefault ?? true,
    })
  })

  const handleKeydown = (event: KeyboardEvent) => {
    if (excludeInputs && isInputElement(event.target as HTMLElement)) {
      return
    }

    const keyString = buildKeyString(event)
    const normalizedKey = normalizeKey(keyString)

    const item = hotkeyMap.get(normalizedKey)
    if (item && item.enabled.value) {
      if (item.preventDefault) {
        event.preventDefault()
      }
      item.handler()
    }
  }

  const register = () => {
    if (!registered.value) {
      window.addEventListener('keydown', handleKeydown)
      registered.value = true
    }
  }

  const unregister = () => {
    if (registered.value) {
      window.removeEventListener('keydown', handleKeydown)
      registered.value = false
    }
  }

  const enable = (key: string) => {
    const normalizedKey = normalizeKey(key)
    const item = hotkeyMap.get(normalizedKey)
    if (item) {
      item.enabled.value = true
    }
  }

  const disable = (key: string) => {
    const normalizedKey = normalizeKey(key)
    const item = hotkeyMap.get(normalizedKey)
    if (item) {
      item.enabled.value = false
    }
  }

  const isEnabled = (key: string): boolean => {
    const normalizedKey = normalizeKey(key)
    const item = hotkeyMap.get(normalizedKey)
    return item?.enabled.value ?? false
  }

  onMounted(() => {
    register()
  })

  onUnmounted(() => {
    unregister()
  })

  return {
    register,
    unregister,
    enable,
    disable,
    isEnabled,
  }
}

function normalizeKey(key: string): string {
  return key.toLowerCase().replace(/\s+/g, '')
}

function buildKeyString(event: KeyboardEvent): string {
  const parts: string[] = []

  if (event.ctrlKey) parts.push('ctrl')
  if (event.altKey) parts.push('alt')
  if (event.shiftKey) parts.push('shift')
  if (event.metaKey) parts.push('meta')

  parts.push(event.key.toLowerCase())

  return parts.join('+')
}

function isInputElement(element: HTMLElement | null): boolean {
  if (!element) return false

  const tagName = element.tagName.toLowerCase()
  const isInput = tagName === 'input' || tagName === 'textarea' || tagName === 'select'
  const isEditable = element.isContentEditable

  return isInput || isEditable
}

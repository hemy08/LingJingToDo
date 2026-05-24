export class RequestDeduplicator {
  private pendingRequests: Map<string, Promise<any>> = new Map()
  private requestTimestamps: Map<string, number> = new Map()
  private cleanupInterval: ReturnType<typeof setInterval> | null = null

  constructor() {
    this.cleanupInterval = setInterval(() => {
      this.cleanup()
    }, 60000)
  }

  async execute<T>(key: string, request: () => Promise<T>): Promise<T> {
    const pending = this.pendingRequests.get(key)
    if (pending) {
      return pending as Promise<T>
    }

    const promise = request()
    this.pendingRequests.set(key, promise)
    this.requestTimestamps.set(key, Date.now())

    try {
      const result = await promise
      return result
    } finally {
      this.pendingRequests.delete(key)
      this.requestTimestamps.delete(key)
    }
  }

  clear(key?: string): void {
    if (key) {
      this.pendingRequests.delete(key)
      this.requestTimestamps.delete(key)
    } else {
      this.pendingRequests.clear()
      this.requestTimestamps.clear()
    }
  }

  has(key: string): boolean {
    return this.pendingRequests.has(key)
  }

  getPendingCount(): number {
    return this.pendingRequests.size
  }

  private cleanup(): void {
    const now = Date.now()
    const maxAge = 120000

    for (const [key, timestamp] of this.requestTimestamps.entries()) {
      if (now - timestamp > maxAge) {
        this.pendingRequests.delete(key)
        this.requestTimestamps.delete(key)
      }
    }
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
    this.clear()
  }
}

export const requestDeduplicator = new RequestDeduplicator()

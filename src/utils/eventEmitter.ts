/**
 * A browser-compatible EventEmitter implementation
 */
export class EventEmitter {
  private events: Record<string, Function[]> = {}

  /**
   * Register an event handler
   * @param event Event name
   * @param listener Function to execute when the event is triggered
   */
  on (event: string, listener: Function): this {
    if (!this.events[event])
      this.events[event] = []
    this.events[event].push(listener)
    return this
  }

  /**
   * Register a one-time event handler
   * @param event Event name
   * @param listener Function to execute when the event is triggered
   */
  once (event: string, listener: Function): this {
    const onceWrapper = (...args: any[]) => {
      listener(...args)
      this.off(event, onceWrapper)
    }
    return this.on(event, onceWrapper)
  }

  /**
   * Unregister an event handler
   * @param event Event name
   * @param listener Function to remove
   */
  off (event: string, listener: Function): this {
    if (this.events[event])
      this.events[event] = this.events[event].filter(l => l !== listener)
    return this
  }

  /**
   * Remove all listeners for an event
   * @param event Event name (optional - if not provided, removes all events)
   */
  removeAllListeners (event?: string): this {
    if (event)
      delete this.events[event]; else
      this.events = {}
    return this
  }

  /**
   * Emit an event
   * @param event Event name
   * @param args Arguments to pass to the event handlers
   */
  emit (event: string, ...args: any[]): boolean {
    if (!this.events[event])
      return false

    this.events[event].forEach(listener => {
      listener(...args)
    })
    return true
  }

  /**
   * Get the number of listeners for an event
   * @param event Event name
   */
  listenerCount (event: string): number {
    return this.events[event]?.length || 0
  }
}

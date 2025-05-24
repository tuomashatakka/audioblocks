import { toast } from '@/hooks/use-toast'
import { EventEmitter } from './eventEmitter'


interface WebSocketMessage {
  type:      string;
  data:      any;
  timestamp: number;
}

class MockWebSocketService extends EventEmitter {
  private static instance:   MockWebSocketService
  private localUserId:       string
  private connected:         boolean = true
  private messageQueue:      WebSocketMessage[] = []
  private localMessageQueue: WebSocketMessage[] = []
  private lastSyncTimestamp: number = Date.now()

  private constructor () {
    super()
    this.localUserId = `local-${Math.random().toString(36)
      .substr(2, 9)}`

    // Simulate network issues every 30-60 seconds
    setInterval(() => {
      if (Math.random() > 0.7)
        this.simulateNetworkIssue()
    }, 30000)
  }

  public static getInstance (): MockWebSocketService {
    if (!MockWebSocketService.instance)
      MockWebSocketService.instance = new MockWebSocketService()
    return MockWebSocketService.instance
  }

  public getLocalUserId (): string {
    return this.localUserId
  }

  public sendMessage (type: string, data: any): void {
    if (!this.connected) {
      this.queueLocalMessage(type, data)
      toast({
        title:       'Connection Lost',
        description: 'Your changes will be synchronized when the connection is restored.',
        variant:     'destructive',
      })
      return
    }

    const message: WebSocketMessage = {
      type,
      data,
      timestamp: Date.now(),
    }

    this.messageQueue.push(message)

    // Simulate latency
    setTimeout(() => {
      this.emit(type, message)
    }, Math.random() * 100)
  }

  public startEditingBlock (blockId: string): void {
    this.sendMessage('blockEditing', { blockId, userId: this.localUserId })
  }

  public endEditingBlock (blockId: string): void {
    this.sendMessage('blockEditingEnd', { blockId, userId: this.localUserId })
  }

  private queueLocalMessage (type: string, data: any): void {
    const message: WebSocketMessage = {
      type,
      data,
      timestamp: Date.now(),
    }
    this.localMessageQueue.push(message)
  }

  private simulateNetworkIssue (): void {
    if (!this.connected)
      return

    console.log('Simulating network disconnection...')
    this.connected = false

    toast({
      title:       'Connection Lost',
      description: 'Trying to reconnect...',
      variant:     'destructive',
    })

    // Store the last time we were in sync
    this.lastSyncTimestamp = Date.now()

    // Reconnect after 2-5 seconds
    setTimeout(() => {
      this.reconnect()
    }, 2000 + Math.random() * 3000)
  }

  private reconnect (): void {
    console.log('Reconnecting...')
    this.connected = true

    toast({
      title:       'Connection Restored',
      description: 'Synchronizing changes...',
    })

    // Check if there are newer messages from the server that we missed
    const newerMessages = this.messageQueue.filter(
      msg => msg.timestamp > this.lastSyncTimestamp &&
             msg.data.userId !== this.localUserId
    )

    if (newerMessages.length > 0) {
      console.log('Found newer messages from server, rolling back...')

      // Find the oldest message timestamp
      const oldestTimestamp = Math.min(
        ...newerMessages.map(msg => msg.timestamp)
      )

      // Emit rollback event
      this.emit('rollback', oldestTimestamp)

      // Replay all messages in order
      const allMessages = [ ...newerMessages, ...this.localMessageQueue ]
        .sort((a, b) => a.timestamp - b.timestamp)

      // Wait a bit then replay the messages
      setTimeout(() => {
        allMessages.forEach(msg => {
          this.emit(msg.type, msg)
        })

        // Clear local queue
        this.localMessageQueue = []
      }, 500)
    }
    else {
      // Just send local changes
      this.localMessageQueue.forEach(msg => {
        this.sendMessage(msg.type, msg.data)
      })
      this.localMessageQueue = []
    }
  }
}

export default MockWebSocketService

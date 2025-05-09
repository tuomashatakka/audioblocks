
import { toast } from "@/hooks/use-toast";

// Simple EventEmitter implementation for browsers
class EventEmitter {
  private events: Record<string, Function[]> = {};

  on(event: string, listener: Function): void {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(listener);
  }

  off(event: string, listener: Function): void {
    if (!this.events[event]) return;
    this.events[event] = this.events[event].filter(l => l !== listener);
  }

  emit(event: string, ...args: any[]): void {
    if (!this.events[event]) return;
    this.events[event].forEach(listener => {
      listener(...args);
    });
  }
}

interface WebSocketMessage {
  type: 'blockUpdate' | 'blockEditing' | 'blockEditingEnd' | 'cursorMove';
  data: any;
  timestamp: number;
  userId: string;
}

interface QueuedMessage extends WebSocketMessage {
  id: string;
}

// Mock implementation of a WebSocket service
class MockWebSocketService extends EventEmitter {
  private static instance: MockWebSocketService;
  private isConnected: boolean = true;
  private messageQueue: QueuedMessage[] = [];
  private localUserId: string = 'local-user';
  private remoteMessageQueue: QueuedMessage[] = [];
  private lastProcessedTimestamp: number = 0;
  
  private constructor() {
    super();
    console.log('WebSocket service initialized');
    
    // Simulate occasional connection drops
    setInterval(() => {
      if (Math.random() > 0.95) {
        this.simulateConnectionDrop();
      }
    }, 30000);
  }
  
  public static getInstance(): MockWebSocketService {
    if (!MockWebSocketService.instance) {
      MockWebSocketService.instance = new MockWebSocketService();
    }
    return MockWebSocketService.instance;
  }
  
  public connect(): void {
    if (!this.isConnected) {
      this.isConnected = true;
      console.log('WebSocket reconnected');
      toast({
        title: "Connection Restored",
        description: "Real-time collaboration is now active.",
      });
      
      // Process any queued messages that came in while disconnected
      this.synchronizeState();
    }
  }
  
  private simulateConnectionDrop(): void {
    this.isConnected = false;
    console.log('WebSocket connection dropped');
    toast({
        title: "Connection Lost",
        description: "Attempting to reconnect...",
        variant: "destructive",
    });
    
    // Simulate reconnection after some delay
    setTimeout(() => this.connect(), Math.random() * 3000 + 1000);
  }
  
  public sendMessage(type: WebSocketMessage['type'], data: any): void {
    if (!this.isConnected) {
      console.log('Cannot send message: WebSocket disconnected');
      return;
    }
    
    const message: WebSocketMessage = {
      type,
      data,
      timestamp: Date.now(),
      userId: this.localUserId
    };
    
    console.log('Sending message:', message);
    
    // Add to local queue
    const queuedMessage: QueuedMessage = {
      ...message,
      id: `${this.localUserId}-${message.timestamp}-${Math.random().toString(36).substr(2, 9)}`
    };
    this.messageQueue.push(queuedMessage);
    
    // Process immediately
    setTimeout(() => {
      this.processMessage(queuedMessage);
    }, 10);
    
    // Simulate sending to other users with small delay
    setTimeout(() => {
      this.simulateRemoteMessages(queuedMessage);
    }, Math.random() * 100 + 50);
  }
  
  private simulateRemoteMessages(originatingMessage: QueuedMessage): void {
    // Simulate other users' edits
    if (Math.random() > 0.7 && originatingMessage.type === 'blockUpdate') {
      const remoteUsers = ['user1', 'user2'];
      const randomUser = remoteUsers[Math.floor(Math.random() * remoteUsers.length)];
      
      const remoteMessage: QueuedMessage = {
        type: 'blockUpdate',
        data: {
          ...originatingMessage.data,
          id: `block${Date.now()}`, // Different block
        },
        timestamp: Date.now(),
        userId: randomUser,
        id: `${randomUser}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      };
      
      this.remoteMessageQueue.push(remoteMessage);
      this.processRemoteMessage(remoteMessage);
    }
  }
  
  private processMessage(message: QueuedMessage): void {
    console.log('Processing message:', message);
    this.emit(message.type, message);
  }
  
  private processRemoteMessage(message: QueuedMessage): void {
    if (!this.isConnected) {
      console.log('Queuing remote message for later processing:', message);
      return;
    }
    
    // Check timestamp ordering
    if (message.timestamp < this.lastProcessedTimestamp) {
      console.log('Received out-of-order message. Need to reapply changes.');
      this.rollbackAndReapply(message.timestamp);
    }
    
    console.log('Processing remote message:', message);
    this.lastProcessedTimestamp = message.timestamp;
    this.emit(message.type, message);
  }
  
  private synchronizeState(): void {
    if (this.remoteMessageQueue.length > 0) {
      console.log('Synchronizing state with remote messages:', this.remoteMessageQueue);
      
      // Find earliest remote message timestamp
      const earliestTimestamp = Math.min(
        ...this.remoteMessageQueue.map(msg => msg.timestamp)
      );
      
      // Roll back local state and reapply changes
      this.rollbackAndReapply(earliestTimestamp);
      
      // Process all remote messages in timestamp order
      const sortedMessages = [...this.remoteMessageQueue].sort(
        (a, b) => a.timestamp - b.timestamp
      );
      
      sortedMessages.forEach(message => {
        this.processRemoteMessage(message);
      });
      
      this.remoteMessageQueue = [];
    }
  }
  
  private rollbackAndReapply(timestamp: number): void {
    console.log(`Rolling back to ${new Date(timestamp).toISOString()} and reapplying changes`);
    this.emit('rollback', timestamp);
    
    // After rollback, reapply local messages that came after the timestamp
    const messagesToReapply = this.messageQueue
      .filter(msg => msg.timestamp > timestamp)
      .sort((a, b) => a.timestamp - b.timestamp);
    
    messagesToReapply.forEach(message => {
      this.processMessage(message);
    });
  }
  
  public startEditingBlock(blockId: string): void {
    this.sendMessage('blockEditing', { blockId, userId: this.localUserId });
  }
  
  public endEditingBlock(blockId: string): void {
    this.sendMessage('blockEditingEnd', { blockId });
  }
  
  public getLocalUserId(): string {
    return this.localUserId;
  }
}

export default MockWebSocketService;

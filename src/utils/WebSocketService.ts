
import { EventEmitter } from "./eventEmitter";
import { toast } from "@/hooks/use-toast";
import {
  UserInteractionMessage,
  ActionType,
  DispatchProcessStatus,
  FilePayload
} from "@/types/collaborative";

class WebSocketService extends EventEmitter {
  private static instance: WebSocketService;
  private localUserId: string;
  private connected: boolean = true;
  private messageQueue: UserInteractionMessage[] = [];
  private localMessageQueue: UserInteractionMessage[] = [];
  private lastSyncTimestamp: number = Date.now();
  private fileTransfers: Record<string, {
    chunks: number,
    received: number,
    data: ArrayBuffer[]
  }> = {};

  private constructor() {
    super();
    this.localUserId = `local-${Math.random().toString(36).substr(2, 9)}`;
    
    // Simulate network issues every 30-60 seconds
    setInterval(() => {
      if (Math.random() > 0.7) {
        this.simulateNetworkIssue();
      }
    }, 30000);
  }

  public static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  public getLocalUserId(): string {
    return this.localUserId;
  }

  public getMessageHistory(): UserInteractionMessage[] {
    return this.messageQueue;
  }

  public sendMessage(action: ActionType, params: any, filePayload?: FilePayload): string {
    const messageId = `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    if (!this.connected) {
      this.queueLocalMessage(action, params, messageId, filePayload);
      toast({
        title: "Connection Lost",
        description: "Your changes will be synchronized when the connection is restored.",
        variant: "destructive",
      });
      return messageId;
    }

    const message: UserInteractionMessage = {
      userId: this.localUserId,
      action,
      params,
      timestamp: Date.now(),
      state: filePayload ? DispatchProcessStatus.UPLOADING_FILE : DispatchProcessStatus.SENT,
      messageId
    };
    
    if (filePayload) {
      message.filePayload = filePayload;
    }

    this.messageQueue.push(message);
    
    // Simulate latency
    setTimeout(() => {
      // Update message state
      const updatedMessage = {
        ...message,
        state: DispatchProcessStatus.BROADCAST_TO_CLIENTS
      };
      
      // Replace the old message in the queue
      const index = this.messageQueue.findIndex(m => m.messageId === message.messageId);
      if (index !== -1) {
        this.messageQueue[index] = updatedMessage;
      }
      
      this.emit(action, updatedMessage);
      this.emit('message', updatedMessage); // General message event
      
      if (filePayload && filePayload.data) {
        // Simulate file processing
        setTimeout(() => {
          const completeMessage = {
            ...updatedMessage,
            state: DispatchProcessStatus.FILE_AVAILABLE_TO_COLLABORATORS
          };
          
          const index = this.messageQueue.findIndex(m => m.messageId === message.messageId);
          if (index !== -1) {
            this.messageQueue[index] = completeMessage;
          }
          
          this.emit('fileAvailable', completeMessage);
        }, filePayload.size / 10000); // Simulate processing time based on file size
      }
    }, Math.random() * 100); // Simulate network latency
    
    return messageId;
  }
  
  public sendFileChunk(transferId: string, chunkIndex: number, totalChunks: number, data: ArrayBuffer): void {
    const filePayload: FilePayload = {
      id: `chunk-${transferId}-${chunkIndex}`,
      name: `Chunk ${chunkIndex} of ${totalChunks}`,
      type: 'application/octet-stream',
      size: data.byteLength,
      data: data,
      isChunk: true,
      chunkIndex,
      totalChunks,
      transferId
    };
    
    this.sendMessage(ActionType.UPLOAD_FILE_CHUNK, { transferId, chunkIndex, totalChunks }, filePayload);
  }
  
  public completeFileUpload(transferId: string, fileName: string, fileType: string, totalSize: number): void {
    this.sendMessage(ActionType.COMPLETE_FILE_UPLOAD, {
      transferId,
      fileName,
      fileType,
      fileSize: totalSize
    });
  }

  public startEditingBlock(blockId: string): void {
    this.sendMessage(ActionType.START_EDITING_BLOCK, { 
      blockId, 
      userId: this.localUserId 
    });
  }

  public endEditingBlock(blockId: string): void {
    this.sendMessage(ActionType.END_EDITING_BLOCK, { 
      blockId, 
      userId: this.localUserId 
    });
  }

  private queueLocalMessage(action: ActionType, params: any, messageId: string, filePayload?: FilePayload): void {
    const message: UserInteractionMessage = {
      userId: this.localUserId,
      action,
      params,
      timestamp: Date.now(),
      state: DispatchProcessStatus.PENDING,
      messageId
    };
    
    if (filePayload) {
      message.filePayload = filePayload;
    }
    
    this.localMessageQueue.push(message);
  }

  private simulateNetworkIssue(): void {
    if (!this.connected) return;
    
    console.log('Simulating network disconnection...');
    this.connected = false;
    
    toast({
      title: "Connection Lost",
      description: "Trying to reconnect...",
      variant: "destructive",
    });
    
    // Store the last time we were in sync
    this.lastSyncTimestamp = Date.now();
    
    // Reconnect after 2-5 seconds
    setTimeout(() => {
      this.reconnect();
    }, 2000 + Math.random() * 3000);
  }

  private reconnect(): void {
    console.log('Reconnecting...');
    this.connected = true;
    
    toast({
      title: "Connection Restored",
      description: "Synchronizing changes...",
    });
    
    // Check if there are newer messages from the server that we missed
    const newerMessages = this.messageQueue.filter(
      msg => msg.timestamp > this.lastSyncTimestamp && 
             msg.userId !== this.localUserId
    );
    
    if (newerMessages.length > 0) {
      console.log('Found newer messages from server, rolling back...');
      
      // Find the oldest message timestamp
      const oldestTimestamp = Math.min(
        ...newerMessages.map(msg => msg.timestamp)
      );
      
      // Emit rollback event
      this.emit('rollback', oldestTimestamp);
      
      // Replay all messages in order
      const allMessages = [...newerMessages, ...this.localMessageQueue]
        .sort((a, b) => a.timestamp - b.timestamp);
      
      // Wait a bit then replay the messages
      setTimeout(() => {
        allMessages.forEach(msg => {
          this.emit(msg.action, msg);
          this.emit('message', msg);
        });
        
        // Clear local queue
        this.localMessageQueue = [];
      }, 500);
    } else {
      // Just send local changes
      this.localMessageQueue.forEach(msg => {
        const action = msg.action;
        const params = msg.params;
        const filePayload = msg.filePayload;
        
        this.sendMessage(action, params, filePayload);
      });
      this.localMessageQueue = [];
    }
  }
  
  // File handling methods
  public handleIncomingFileChunk(message: UserInteractionMessage): void {
    if (!message.filePayload || !message.filePayload.transferId || !message.filePayload.data) {
      return;
    }
    
    const { transferId, chunkIndex, totalChunks, data } = message.filePayload;
    
    if (!this.fileTransfers[transferId]) {
      this.fileTransfers[transferId] = {
        chunks: totalChunks || 0,
        received: 0,
        data: []
      };
    }
    
    const transfer = this.fileTransfers[transferId];
    
    if (typeof chunkIndex === 'number') {
      // Store the chunk data at the correct index
      transfer.data[chunkIndex] = typeof data === 'string' 
        ? this.base64ToArrayBuffer(data as string) 
        : data as ArrayBuffer;
      
      transfer.received++;
      
      // If all chunks received, assemble the file
      if (transfer.received === transfer.chunks) {
        const completeData = this.assembleFile(transfer.data);
        
        this.emit('fileComplete', {
          transferId,
          data: completeData
        });
        
        // Clean up
        delete this.fileTransfers[transferId];
      }
    }
  }
  
  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }
  
  private assembleFile(chunks: ArrayBuffer[]): ArrayBuffer {
    // Calculate total size
    const totalSize = chunks.reduce((acc, chunk) => acc + chunk.byteLength, 0);
    
    // Create a new buffer of the appropriate size
    const result = new Uint8Array(totalSize);
    
    // Copy each chunk into the result buffer at the correct position
    let offset = 0;
    for (const chunk of chunks) {
      result.set(new Uint8Array(chunk), offset);
      offset += chunk.byteLength;
    }
    
    return result.buffer;
  }
}

export default WebSocketService;

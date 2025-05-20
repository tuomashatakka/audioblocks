import { EventEmitter } from "./eventEmitter";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  UserInteractionMessage,
  ActionType,
  DispatchProcessStatus,
  FilePayload
} from "@/types/collaborative";
import { throttle } from '@/lib/utils';

class WebSocketService extends EventEmitter {
  private static instance: WebSocketService;
  private localUserId: string;
  private localUserName: string;
  private connected: boolean = true;
  private messageQueue: UserInteractionMessage[] = [];
  private localMessageQueue: UserInteractionMessage[] = [];
  private lastSyncTimestamp: number = Date.now();
  private fileTransfers: Record<string, {
    chunks: number,
    received: number,
    data: ArrayBuffer[]
  }> = {};
  private channel: any; // RealtimeChannel type
  private currentProjectId: string | null = null;

  private constructor() {
    super();
    this.localUserId = localStorage.getItem('userId') || `local-${Math.random().toString(36).substr(2, 9)}`;
    this.localUserName = localStorage.getItem('userName') || 'Anonymous';
    
    if (!localStorage.getItem('userId')) {
      localStorage.setItem('userId', this.localUserId);
    }
    
    if (!localStorage.getItem('userName')) {
      localStorage.setItem('userName', this.localUserName);
    }
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

  public getLocalUserName(): string {
    return this.localUserName;
  }

  public setLocalUserName(name: string): void {
    this.localUserName = name;
    localStorage.setItem('userName', name);
  }

  public getMessageHistory(): UserInteractionMessage[] {
    return this.messageQueue;
  }

  public connectToProject(projectId: string): void {
    if (this.channel) {
      this.channel.unsubscribe();
    }
    
    this.currentProjectId = projectId;
    
    // Subscribe to the project channel
    this.channel = supabase
      .channel(`project_${projectId}`)
      // Listen to all broadcast messages
      .on('broadcast', { event: 'action' }, (payload) => {
        const message = payload.payload as UserInteractionMessage;
        
        // Don't process our own messages that we're broadcasting
        if (message.userId === this.localUserId) {
          return;
        }
        
        // Add to message queue
        this.messageQueue.push(message);
        
        // Emit specific action event
        this.emit(message.action, message);
        
        // Emit general message event
        this.emit('message', message);
        
        // Handle file availability if needed
        if (message.state === DispatchProcessStatus.FILE_AVAILABLE_TO_COLLABORATORS && message.filePayload) {
          this.emit('fileAvailable', message);
        }
      })
      // Listen to cursor movement updates
      .on('broadcast', { event: 'cursor_move' }, (payload) => {
        // Don't process our own cursor movements
        if (payload.payload.userId === this.localUserId) {
          return;
        }
        
        this.emit('cursorMove', payload.payload);
      })
      // Listen to presence updates (who is online)
      .on('presence', { event: 'sync' }, () => {
        const state = this.channel.presenceState();
        this.emit('presenceSync', state);
      })
      // Listen to users joining
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        this.emit('presenceJoin', { key, newPresences });
      })
      // Listen to users leaving
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        this.emit('presenceLeave', { key, leftPresences });
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          // Track our presence
          this.channel.track({
            userId: this.localUserId,
            userName: this.localUserName,
            online_at: new Date().toISOString()
          });
          
          this.emit('connected', {
            userId: this.localUserId,
            projectId: projectId
          });
          
          this.connected = true;
          
          this.processLocalMessageQueue();
        } else if (status === 'CHANNEL_ERROR') {
          this.connected = false;
          
          toast({
            title: "Connection Lost",
            description: "Your changes will be synchronized when the connection is restored.",
            variant: "destructive",
          });
        }
      });
      
    // Set up throttled cursor movement
    document.addEventListener('mousemove', this.throttledCursorUpdate);
  }

  public disconnectFromProject(): void {
    if (this.channel) {
      document.removeEventListener('mousemove', this.throttledCursorUpdate);
      this.channel.unsubscribe();
      this.channel = null;
      this.currentProjectId = null;
    }
  }

  private throttledCursorUpdate = throttle((e: MouseEvent) => {
    if (!this.channel || !this.connected || !this.currentProjectId) return;
    
    // Only send cursor positions for mouse movements over the project area (you may need to adjust the selector)
    const projectArea = document.querySelector('.project-area');
    if (!projectArea) return;
    
    const rect = projectArea.getBoundingClientRect();
    if (
      e.clientX >= rect.left && 
      e.clientX <= rect.right && 
      e.clientY >= rect.top && 
      e.clientY <= rect.bottom
    ) {
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      this.channel.broadcast({
        type: 'broadcast',
        event: 'cursor_move',
        payload: {
          userId: this.localUserId,
          userName: this.localUserName,
          x,
          y,
          timestamp: Date.now()
        }
      });
      
      // Also update in the database for users who join later
      supabase.from('user_presence').upsert({
        project_id: this.currentProjectId,
        user_id: this.localUserId,
        user_name: this.localUserName,
        cursor_x: Math.round(x),
        cursor_y: Math.round(y),
        last_active: new Date().toISOString()
      }, {
        onConflict: 'user_id,project_id'
      }).then(() => {
        // No need to handle response
      });
    }
  }, 50);

  public sendMessage(action: ActionType, params: any, filePayload?: FilePayload): string {
    const messageId = `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    if (!this.connected || !this.channel) {
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
    
    // Broadcast the message to all clients
    this.channel.broadcast({
      type: 'broadcast',
      event: 'action',
      payload: message
    });
    
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
        
        // Broadcast file availability
        this.channel.broadcast({
          type: 'broadcast',
          event: 'action',
          payload: completeMessage
        });
        
        this.emit('fileAvailable', completeMessage);
      }, filePayload.size / 10000); // Simulate processing time based on file size
    }
    
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
      userId: this.localUserId,
      userName: this.localUserName
    });
  }

  public endEditingBlock(blockId: string): void {
    this.sendMessage(ActionType.END_EDITING_BLOCK, { 
      blockId, 
      userId: this.localUserId 
    });
  }
  
  public lockTrack(trackId: string): void {
    this.sendMessage(ActionType.LOCK_TRACK, {
      trackId,
      userId: this.localUserId,
      userName: this.localUserName
    });
    
    if (this.currentProjectId) {
      // Also update in the database
      supabase.from('tracks').update({
        locked: true,
        locked_by_user_id: this.localUserId,
        locked_by_name: this.localUserName
      }).eq('id', trackId).then(() => {
        // No need to handle response
      });
    }
  }
  
  public unlockTrack(trackId: string): void {
    this.sendMessage(ActionType.UNLOCK_TRACK, {
      trackId,
      userId: this.localUserId
    });
    
    if (this.currentProjectId) {
      // Also update in the database
      supabase.from('tracks').update({
        locked: false,
        locked_by_user_id: null,
        locked_by_name: null
      }).eq('id', trackId).then(() => {
        // No need to handle response
      });
    }
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
  
  private processLocalMessageQueue(): void {
    if (this.localMessageQueue.length > 0) {
      toast({
        title: "Connection Restored",
        description: "Synchronizing pending changes...",
      });
      
      // Send all queued messages
      this.localMessageQueue.forEach(msg => {
        const { action, params, filePayload } = msg;
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

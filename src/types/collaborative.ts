
export enum ActionType {
  // Play controls
  PLAY = 'PLAY',
  PAUSE = 'PAUSE',
  RESTART = 'RESTART',

  // Track operations
  ADD_TRACK = 'ADD_TRACK',
  RENAME_TRACK = 'RENAME_TRACK',
  REMOVE_TRACK = 'REMOVE_TRACK',
  MUTE_TRACK = 'MUTE_TRACK',
  SOLO_TRACK = 'SOLO_TRACK',
  ARM_TRACK = 'ARM_TRACK',
  LOCK_TRACK = 'LOCK_TRACK',
  UNLOCK_TRACK = 'UNLOCK_TRACK',
  SET_TRACK_VOLUME = 'SET_TRACK_VOLUME',
  UPDATE_TRACK = 'UPDATE_TRACK',

  // Block operations
  ADD_BLOCK = 'ADD_BLOCK',
  REMOVE_BLOCK = 'REMOVE_BLOCK',
  UPDATE_BLOCK = 'UPDATE_BLOCK',
  MOVE_BLOCK = 'MOVE_BLOCK',
  RESIZE_BLOCK = 'RESIZE_BLOCK',
  START_EDITING_BLOCK = 'START_EDITING_BLOCK',
  END_EDITING_BLOCK = 'END_EDITING_BLOCK',
  DUPLICATE_BLOCK = 'DUPLICATE_BLOCK',
  SPLIT_BLOCK = 'SPLIT_BLOCK',

  // Marker operations
  ADD_MARKER = 'ADD_MARKER',
  UPDATE_MARKER = 'UPDATE_MARKER',
  REMOVE_MARKER = 'REMOVE_MARKER',

  // File operations
  INITIATE_FILE_UPLOAD = 'INITIATE_FILE_UPLOAD',
  UPLOAD_FILE_CHUNK = 'UPLOAD_FILE_CHUNK',
  COMPLETE_FILE_UPLOAD = 'COMPLETE_FILE_UPLOAD',
  IMPORT_AUDIO_SAMPLE = 'IMPORT_AUDIO_SAMPLE',

  // Session operations
  JOIN_SESSION = 'JOIN_SESSION',
  LEAVE_SESSION = 'LEAVE_SESSION',
  UPDATE_USER_POSITION = 'UPDATE_USER_POSITION',
  USER_JOINED = 'USER_JOINED',

  // Project operations
  CHANGE_PROJECT_NAME = 'CHANGE_PROJECT_NAME',
  SET_BPM = 'SET_BPM',
  CHANGE_BPM = 'CHANGE_BPM',
  SET_MASTER_VOLUME = 'SET_MASTER_VOLUME',
  UPDATE_SETTINGS = 'UPDATE_SETTINGS',
  RESTORE_TO_TIMESTAMP = 'RESTORE_TO_TIMESTAMP',

  // Generic message type for custom messages
  CUSTOM = 'CUSTOM'
}

export interface Message {
  userId?: string;
  userName?: string;
  actionType: ActionType;
  timestamp?: number;
  data: any;
}

export interface GeneralMessage {
  userId?: string;
  userName?: string;
  type: string;
  message: string;
  timestamp?: number;
  data?: any;
}

export interface UserState {
  id: string;
  name: string;
  color: string;
  position: { x: number; y: number };
  isActive: boolean;
  lastSeen: number;
}

export interface ProjectState {
  users: Record<string, UserState>;
  localUserId: string;
  localUserName: string;
  historyMessages: Message[];
}

export interface UserInteractionMessage {
  userId: string;
  userName?: string;
  action: ActionType;
  params: any;
  timestamp: number;
  state?: DispatchProcessStatus;
  messageId: string;
  filePayload?: FilePayload;
}

export interface ProjectHistoryEntry {
  userId: string;
  userName?: string;
  userColor?: string;
  action: ActionType;
  params: any;
  timestamp: number;
  messageId: string;
}

export enum DispatchProcessStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  BROADCAST_TO_CLIENTS = 'BROADCAST_TO_CLIENTS',
  UPLOADING_FILE = 'UPLOADING_FILE',
  FILE_AVAILABLE_TO_COLLABORATORS = 'FILE_AVAILABLE_TO_COLLABORATORS',
}

export interface FilePayload {
  id: string;
  name: string;
  type: string;
  size: number;
  data?: ArrayBuffer | string;
  isChunk?: boolean;
  chunkIndex?: number;
  totalChunks?: number;
  transferId?: string;
}

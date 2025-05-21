
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
  
  // Session operations
  JOIN_SESSION = 'JOIN_SESSION',
  LEAVE_SESSION = 'LEAVE_SESSION',
  UPDATE_USER_POSITION = 'UPDATE_USER_POSITION',
  
  // Project operations
  CHANGE_PROJECT_NAME = 'CHANGE_PROJECT_NAME',
  SET_BPM = 'SET_BPM',
  SET_MASTER_VOLUME = 'SET_MASTER_VOLUME',
  
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

import type { MarkerIcon } from "@/components/TimelineMarker";

export enum ActionType {
  // Project actions
  CREATE_PROJECT = "CREATE_PROJECT",
  OPEN_PROJECT = "OPEN_PROJECT",
  SAVE_PROJECT = "SAVE_PROJECT",
  
  // Track actions
  ADD_TRACK = "ADD_TRACK",
  REMOVE_TRACK = "REMOVE_TRACK",
  UPDATE_TRACK = "UPDATE_TRACK", // For name, color, etc.
  MUTE_TRACK = "MUTE_TRACK",
  SOLO_TRACK = "SOLO_TRACK",
  ARM_TRACK = "ARM_TRACK",
  SET_TRACK_VOLUME = "SET_TRACK_VOLUME",
  LOCK_TRACK = "LOCK_TRACK",
  UNLOCK_TRACK = "UNLOCK_TRACK",
  RENAME_TRACK = "RENAME_TRACK", // Added missing action type
  
  // Block/clip actions
  ADD_BLOCK = "ADD_BLOCK",
  REMOVE_BLOCK = "REMOVE_BLOCK",
  MOVE_BLOCK = "MOVE_BLOCK",
  RESIZE_BLOCK = "RESIZE_BLOCK",
  UPDATE_BLOCK = "UPDATE_BLOCK", // For name, color, etc.
  START_EDITING_BLOCK = "START_EDITING_BLOCK",
  END_EDITING_BLOCK = "END_EDITING_BLOCK",
  
  // Marker actions
  ADD_MARKER = "ADD_MARKER",
  REMOVE_MARKER = "REMOVE_MARKER",
  UPDATE_MARKER = "UPDATE_MARKER",
  
  // File operations
  INITIATE_FILE_UPLOAD = "INITIATE_FILE_UPLOAD",
  UPLOAD_FILE_CHUNK = "UPLOAD_FILE_CHUNK",
  COMPLETE_FILE_UPLOAD = "COMPLETE_FILE_UPLOAD",
  IMPORT_AUDIO_SAMPLE = "IMPORT_AUDIO_SAMPLE",
  
  // Playback control
  PLAY = "PLAY",
  PAUSE = "PAUSE",
  RESTART = "RESTART",
  SEEK = "SEEK",
  CHANGE_BPM = "CHANGE_BPM",
  
  // Settings
  UPDATE_SETTINGS = "UPDATE_SETTINGS",
  
  // Collaboration
  USER_JOINED = "USER_JOINED",
  USER_LEFT = "USER_LEFT",
  CURSOR_MOVE = "CURSOR_MOVE",
  
  // History
  RESTORE_TO_TIMESTAMP = "RESTORE_TO_TIMESTAMP",
  
  // New action types
  RENAME_TRACK = 'RENAME_TRACK',
  DUPLICATE_BLOCK = 'DUPLICATE_BLOCK',
  SPLIT_BLOCK = 'SPLIT_BLOCK',
  GENERAL_MESSAGE = 'GENERAL_MESSAGE',
  CONNECTION_STATUS = 'CONNECTION_STATUS'
}

export enum DispatchProcessStatus {
  PENDING = "PENDING",
  SENT = "SENT",
  RECEIVED_BY_SERVER = "RECEIVED_BY_SERVER",
  PROCESSED = "PROCESSED", 
  BROADCAST_TO_CLIENTS = "BROADCAST_TO_CLIENTS",
  ACKNOWLEDGED = "ACKNOWLEDGED",
  FAILED = "FAILED",
  UPLOADING_FILE = "UPLOADING_FILE",
  FILE_UPLOAD_SUCCESSFUL_CLIENT = "FILE_UPLOAD_SUCCESSFUL_CLIENT",
  FILE_PROCESSING_SERVER = "FILE_PROCESSING_SERVER",
  FILE_AVAILABLE_TO_COLLABORATORS = "FILE_AVAILABLE_TO_COLLABORATORS",
  FILE_UPLOAD_FAILED = "FILE_UPLOAD_FAILED"
}

export interface FilePayload {
  id: string;
  name: string;
  type: string; 
  size: number;
  data?: ArrayBuffer | string; // Actual data or base64 encoded
  isChunk?: boolean;
  chunkIndex?: number;
  totalChunks?: number;
  transferId?: string; // ID linking all chunks of a file
}

export interface UserInteractionMessage {
  userId: string;
  action: ActionType;
  params: Record<string, any>; // Union of specific param types
  timestamp: number;
  state: DispatchProcessStatus;
  messageId: string;
  sequenceId?: string;
  filePayload?: FilePayload;
}

export interface ProjectHistoryEntry extends UserInteractionMessage {
  userName?: string;
  userColor?: string;
}

// Specific parameter types for different actions

export interface TrackActionParams {
  trackId: string;
  name?: string;
  color?: string;
  volume?: number;
  muted?: boolean;
  solo?: boolean;
  armed?: boolean;
}

export interface BlockActionParams {
  blockId: string;
  trackId?: string;
  name?: string;
  startBeat?: number;
  lengthBeats?: number;
  volume?: number;
  pitch?: number;
  fileId?: string; // Reference to an uploaded audio file
}

export interface MarkerActionParams {
  markerId: string;
  position: number;
  color: string;
  icon: MarkerIcon;
  label?: string;
}

export interface FileUploadParams {
  fileId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  transferId?: string;
  targetTrackId?: string;
}

export interface ProjectState {
  id: string;
  name: string;
  bpm: number;
  tracks: Record<string, TrackInfo>;
  blocks: Record<string, BlockInfo>;
  markers: Record<string, MarkerInfo>;
  masterVolume: number;
  settings: ProjectSettings;
  assets: Record<string, AssetInfo>;
  users: Record<string, UserInfo>;
  history: ProjectHistoryEntry[];
  localUserId?: string; // Add this property to fix the TS errors
}

export interface TrackInfo {
  id: string;
  name: string;
  color: string;
  volume: number;
  muted: boolean;
  solo: boolean;
  armed?: boolean;
  locked?: boolean;
  lockedByUser?: string;
  lockedByUserName?: string;
}

export interface BlockInfo {
  id: string;
  name: string;
  trackId: string;
  startBeat: number;
  lengthBeats: number;
  volume: number;
  pitch: number;
  editingUserId?: string | null;
  fileId?: string; // Reference to an audio file
}

export interface MarkerInfo {
  id: string;
  position: number;
  color: string;
  icon: MarkerIcon;
  label?: string;
}

export interface AssetInfo {
  id: string;
  name: string;
  type: string;
  size: number;
  url?: string; // Local URL or reference
  uploadedBy: string;
  uploadedAt: number;
}

export interface UserInfo {
  id: string;
  name: string;
  color: string;
  position: { x: number; y: number };
  isActive: boolean;
  lastActiveAt: number;
}

export interface ProjectSettings {
  snapToGrid: boolean;
  gridSize: number;
  autoSave: boolean;
  showCollaborators: boolean;
  theme: 'dark' | 'light';
  userName?: string;
}

// New types for connection status
export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected';

export interface ConnectionStatusMessage {
  status: ConnectionStatus;
  timestamp: number;
  userId: string;
  userName: string;
}

export interface GeneralMessage {
  type: string;
  message: string;
  userId: string;
  userName: string;
  timestamp: number;
  [key: string]: any; // Allow additional properties
}

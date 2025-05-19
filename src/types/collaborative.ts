import type { MarkerIcon } from '@/components/TimelineMarker'


export enum ActionType {
  // Project actions
  CREATE_PROJECT = 'CREATE_PROJECT',
  OPEN_PROJECT = 'OPEN_PROJECT',
  SAVE_PROJECT = 'SAVE_PROJECT',

  // Track actions
  ADD_TRACK = 'ADD_TRACK',
  REMOVE_TRACK = 'REMOVE_TRACK',
  UPDATE_TRACK = 'UPDATE_TRACK', // For name, color, etc.
  MUTE_TRACK = 'MUTE_TRACK',
  SOLO_TRACK = 'SOLO_TRACK',
  ARM_TRACK = 'ARM_TRACK',
  SET_TRACK_VOLUME = 'SET_TRACK_VOLUME',

  // Block/clip actions
  ADD_BLOCK = 'ADD_BLOCK',
  REMOVE_BLOCK = 'REMOVE_BLOCK',
  MOVE_BLOCK = 'MOVE_BLOCK',
  RESIZE_BLOCK = 'RESIZE_BLOCK',
  UPDATE_BLOCK = 'UPDATE_BLOCK', // For name, color, etc.
  START_EDITING_BLOCK = 'START_EDITING_BLOCK',
  END_EDITING_BLOCK = 'END_EDITING_BLOCK',

  // Marker actions
  ADD_MARKER = 'ADD_MARKER',
  REMOVE_MARKER = 'REMOVE_MARKER',
  UPDATE_MARKER = 'UPDATE_MARKER',

  // File operations
  INITIATE_FILE_UPLOAD = 'INITIATE_FILE_UPLOAD',
  UPLOAD_FILE_CHUNK = 'UPLOAD_FILE_CHUNK',
  COMPLETE_FILE_UPLOAD = 'COMPLETE_FILE_UPLOAD',
  IMPORT_AUDIO_SAMPLE = 'IMPORT_AUDIO_SAMPLE',

  // Playback control
  PLAY = 'PLAY',
  PAUSE = 'PAUSE',
  RESTART = 'RESTART',
  SEEK = 'SEEK',
  CHANGE_BPM = 'CHANGE_BPM',

  // Settings
  UPDATE_SETTINGS = 'UPDATE_SETTINGS',

  // Collaboration
  USER_JOINED = 'USER_JOINED',
  USER_LEFT = 'USER_LEFT',
  CURSOR_MOVE = 'CURSOR_MOVE'
}

export enum DispatchProcessStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  RECEIVED_BY_SERVER = 'RECEIVED_BY_SERVER',
  PROCESSED = 'PROCESSED',
  BROADCAST_TO_CLIENTS = 'BROADCAST_TO_CLIENTS',
  ACKNOWLEDGED = 'ACKNOWLEDGED',
  FAILED = 'FAILED',
  UPLOADING_FILE = 'UPLOADING_FILE',
  FILE_UPLOAD_SUCCESSFUL_CLIENT = 'FILE_UPLOAD_SUCCESSFUL_CLIENT',
  FILE_PROCESSING_SERVER = 'FILE_PROCESSING_SERVER',
  FILE_AVAILABLE_TO_COLLABORATORS = 'FILE_AVAILABLE_TO_COLLABORATORS',
  FILE_UPLOAD_FAILED = 'FILE_UPLOAD_FAILED'
}

export interface FilePayload {
  id:           string;
  name:         string;
  type:         string;
  size:         number;
  data?:        ArrayBuffer | string; // Actual data or base64 encoded
  isChunk?:     boolean;
  chunkIndex?:  number;
  totalChunks?: number;
  transferId?:  string; // ID linking all chunks of a file
}

export interface UserInteractionMessage {
  userId:       string;
  action:       ActionType;
  params:       Record<string, any>; // Union of specific param types
  timestamp:    number;
  state:        DispatchProcessStatus;
  messageId:    string;
  sequenceId?:  string;
  filePayload?: FilePayload;
}

export interface ProjectHistoryEntry extends UserInteractionMessage {
  userName?:  string;
  userColor?: string;
}

// Specific parameter types for different actions

export interface TrackActionParams {
  trackId: string;
  name?:   string;
  color?:  string;
  volume?: number;
  muted?:  boolean;
  solo?:   boolean;
  armed?:  boolean;
}

export interface BlockActionParams {
  blockId:      string;
  trackId?:     string;
  name?:        string;
  startBeat?:   number;
  lengthBeats?: number;
  volume?:      number;
  pitch?:       number;
  fileId?:      string; // Reference to an uploaded audio file
}

export interface MarkerActionParams {
  markerId: string;
  position: number;
  color:    string;
  icon:     MarkerIcon;
  label?:   string;
}

export interface FileUploadParams {
  fileId:         string;
  fileName:       string;
  fileType:       string;
  fileSize:       number;
  transferId?:    string;
  targetTrackId?: string;
}

export interface ProjectState {
  id:             string;
  name:           string;
  bpm:            number;
  tracks:         Record<string, TrackInfo>;
  blocks:         Record<string, BlockInfo>;
  markers:        Record<string, MarkerInfo>;
  masterVolume:   number;
  settings:       ProjectSettings;
  assets:         Record<string, AssetInfo>;
  users:          Record<string, UserInfo>;
  history:        ProjectHistoryEntry[];
  localUserId:    string;
  editingBlockId: string | null;
}

export interface TrackInfo {
  id:            string;
  name:          string;
  color:         string;
  volume:        number;
  muted:         boolean;
  solo:          boolean;
  armed?:        boolean;
  locked?:       boolean;
  lockedByUser?: string;
}

export interface BlockInfo {
  id:             string;
  name?:          string;
  trackId:        string;
  startTime:      number;
  endTime:        number;
  volume?:        number;
  pitch?:         number;
  editingUserId?: string | null;
  audioUrl?:      string | null;
}

export interface MarkerInfo {
  id:       string;
  position: number;
  color:    string;
  icon:     MarkerIcon;
  label?:   string;
}

export interface AssetInfo {
  id:         string;
  name:       string;
  type:       string;
  size:       number;
  url?:       string; // Local URL or reference
  uploadedBy: string;
  uploadedAt: number;
}

export interface UserInfo {
  id:           string;
  name:         string;
  color:        string;
  position:     { x: number; y: number };
  isActive:     boolean;
  lastActiveAt: number;
}

export interface ProjectSettings {
  snapToGrid:        boolean;
  gridSize:          number;
  autoSave:          boolean;
  showCollaborators: boolean;
  theme:             'dark' | 'light';
}

function description (strings, ...keys: Array<string | number>) {
  return (...values: Array<string | Record<keyof typeof keys, string>>) => {
    const dict = values[values.length - 1] || {}
    const result = [ strings[0] ]
    keys.forEach((key, i) => {
      const value = Number.isInteger(key) ? values[key] : dict[key]
      result.push(value, strings[i + 1])
    })
    return result.join('')
  }
}

export const actionDescriptions: {[key in ActionType]: (...params: Array<string | Record<string, string>>) => string } = {
  [ActionType.ADD_TRACK]:    description `Added track "${0}"`,
  [ActionType.REMOVE_TRACK]: description `Removed track "${'trackName'}"`,
  [ActionType.UPDATE_TRACK]: (params: any) => {
    if (params.name)
      return `Renamed track to "${params.name}"`
    if (params.color)
      return `Changed track color`
    return `Updated track properties`
  },
  [ActionType.MUTE_TRACK]:       (params: any) => `${params.muted ? 'Muted' : 'Unmuted'} track`,
  [ActionType.SOLO_TRACK]:       (params: any) => `${params.solo ? 'Soloed' : 'Unsoloed'} track`,
  [ActionType.ARM_TRACK]:        (params: any) => `${params.armed ? 'Armed' : 'Disarmed'} track for recording`,
  [ActionType.SET_TRACK_VOLUME]: description `Set track volume to ${'volume'}`,
  [ActionType.ADD_BLOCK]:        description `Added clip "${'blockName'}"`,
  [ActionType.REMOVE_BLOCK]:     description `Removed clip "${'blockName'}"`,
  [ActionType.MOVE_BLOCK]:       description `Moved clip to position ${'startBeat'}`,
  [ActionType.RESIZE_BLOCK]:     description `Resized clip to ${'lengthBeats'} beats`,
  [ActionType.UPDATE_BLOCK]:     (params: any) => {
    if (params.name)
      return `Renamed clip to "${params.name}"`
    if (params.pitch !== undefined)
      return `Changed clip pitch to ${params.pitch}`
    if (params.volume !== undefined)
      return `Changed clip volume to ${params.volume}`
    return `Updated clip properties`
  },
  [ActionType.START_EDITING_BLOCK]:  description `Started editing clip`,
  [ActionType.END_EDITING_BLOCK]:    description `Finished editing clip`,
  [ActionType.ADD_MARKER]:           description `Added marker "${'label'}"`,
  [ActionType.UPDATE_MARKER]:        description `Updated marker properties`,
  [ActionType.REMOVE_MARKER]:        description `Removed marker`,
  [ActionType.CHANGE_BPM]:           description `Changed BPM to ${'bpm'}`,
  [ActionType.UPDATE_SETTINGS]:      description `Updated project settings`,
  [ActionType.INITIATE_FILE_UPLOAD]: description `Started uploading file "${'fileName'}"`,
  [ActionType.UPLOAD_FILE_CHUNK]:    description `Uploading file chunk ${'chunkIndex'} of ${'totalChunks'}`,
  [ActionType.COMPLETE_FILE_UPLOAD]: description `Completed uploading file "${'fileName'}"`,
  [ActionType.IMPORT_AUDIO_SAMPLE]:  description `Imported audio file "${'fileName'}"`,
  [ActionType.CREATE_PROJECT]:       function (...params: Array<string | Record<string, string>>): string {
    throw new Error('Function not implemented.')
  },
  [ActionType.OPEN_PROJECT]: function (...params: Array<string | Record<string, string>>): string {
    throw new Error('Function not implemented.')
  },
  [ActionType.SAVE_PROJECT]: function (...params: Array<string | Record<string, string>>): string {
    throw new Error('Function not implemented.')
  },
  [ActionType.PLAY]: function (...params: Array<string | Record<string, string>>): string {
    throw new Error('Function not implemented.')
  },
  [ActionType.PAUSE]: function (...params: Array<string | Record<string, string>>): string {
    throw new Error('Function not implemented.')
  },
  [ActionType.RESTART]: function (...params: Array<string | Record<string, string>>): string {
    throw new Error('Function not implemented.')
  },
  [ActionType.SEEK]: function (...params: Array<string | Record<string, string>>): string {
    throw new Error('Function not implemented.')
  },
  [ActionType.USER_JOINED]: function (...params: Array<string | Record<string, string>>): string {
    throw new Error('Function not implemented.')
  },
  [ActionType.USER_LEFT]: function (...params: Array<string | Record<string, string>>): string {
    throw new Error('Function not implemented.')
  },
  [ActionType.CURSOR_MOVE]: function (...params: Array<string | Record<string, string>>): string {
    throw new Error('Function not implemented.')
  }
}

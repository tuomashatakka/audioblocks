import { ProjectAction, ProjectActionType } from './projectActions'
import { ToolType } from '@/components/ToolsMenu'


export interface Track {
  id:                string;
  name:              string;
  color:             string;
  volume:            number;
  muted:             boolean;
  solo:              boolean;
  armed:             boolean;
  locked?:           boolean;
  lockedByUser?:     string | null;
  lockedByUserName?: string | null;
}

export interface Block {
  id:             string;
  name:           string;
  track:          number;
  startBeat:      number;
  lengthBeats:    number;
  volume:         number;
  pitch:          number;
  editingUserId?: string | null;
  fileId?:        string | null;
  file?:          File;
}

export interface TimelineMarker {
  id:        string;
  position:  number; // beat position
  color:     string;
  icon:      'bookmark' | 'flag' | 'star' | 'record' | 'mic' | 'music' | 'zap' | 'comment';
  label?:    string;
  projectId: string;
  createdBy: string;
  createdAt: number;
}

export interface ProjectHistoryEntry {
  id:          string;
  timestamp:   number;
  action:      string;
  description: string;
  userId:      string;
  userName:    string;
  details?:    any;
}

export interface RemoteUser {
  id:       string;
  name:     string;
  position: { x: number; y: number };
  color:    string;
}

export interface ProjectSettings {
  theme:             'light' | 'dark';
  snapToGrid:        boolean;
  gridSize:          number;
  autoSave:          boolean;
  showCollaborators: boolean;
  userName?:         string;
  [key: string]:     string | number | boolean | undefined;
}

export interface ProjectState {
  // Project Data
  project: {
    id:           string | null;
    name:         string | null;
    bpm:          number;
    masterVolume: number;
    settings:     ProjectSettings;
  };

  // Audio Data
  tracks:  Track[];
  blocks:  Block[];
  markers: TimelineMarker[];

  // Playback State
  isPlaying:   boolean;
  currentBeat: number;

  // UI State
  selectedBlockId: string | null;
  activeTool:      ToolType;
  pixelsPerBeat:   number;
  trackHeight:     number;
  beatsPerBar:     number;
  totalBars:       number;
  scrollPosition: {
    horizontal: number;
    vertical:   number;
  };

  // Dialog States
  isSettingsOpen: boolean;
  historyVisible: boolean;

  // Collaboration State
  localUserId:   string;
  localUserName: string;
  isConnected:   boolean;
  remoteUsers:   RemoteUser[];

  // History
  history:              ProjectHistoryEntry[];
  selectedHistoryIndex: number | null;

  // Loading States
  loading: boolean;
  error:   string | null;
}

export const initialProjectState: ProjectState = {
  project: {
    id:           null,
    name:         null,
    bpm:          120,
    masterVolume: 80,
    settings:     {
      theme:             'dark',
      snapToGrid:        true,
      gridSize:          1,
      autoSave:          true,
      showCollaborators: true,
      userName:          'User'
    }
  },
  tracks:          [],
  blocks:          [],
  markers:         [],
  isPlaying:       false,
  currentBeat:     0,
  selectedBlockId: null,
  activeTool:      'select',
  pixelsPerBeat:   40,
  trackHeight:     80,
  beatsPerBar:     4,
  totalBars:       16,
  scrollPosition:  {
    horizontal: 0,
    vertical:   0
  },
  isSettingsOpen:       false,
  historyVisible:       false,
  localUserId:          '',
  localUserName:        '',
  isConnected:          false,
  remoteUsers:          [],
  history:              [],
  selectedHistoryIndex: null,
  loading:              false,
  error:                null
}

export function projectReducer (state: ProjectState, action: ProjectAction): ProjectState {
  const newState = { ...state }

  // Add history entry for trackable actions
  if (action.meta?.trackable && action.meta) {
    const historyEntry: ProjectHistoryEntry = {
      id: `history-${action.meta.timestamp}-${Math.random().toString(36)
        .substr(2, 9)}`,
      timestamp:   action.meta.timestamp,
      action:      action.type,
      description: action.meta.description,
      userId:      action.meta.userId,
      userName:    action.meta.userName,
      details:     action.payload
    }

    newState.history = [ ...state.history, historyEntry ]
  }

  switch (action.type) {
    // Project Management
    case ProjectActionType.LOAD_PROJECT:
      return {
        ...newState,
        project: {
          id:           action.payload.id,
          name:         action.payload.name,
          bpm:          action.payload.bpm,
          masterVolume: action.payload.masterVolume,
          settings:     { ...state.project.settings, ...action.payload.settings }
        },
        tracks:  action.payload.tracks,
        blocks:  action.payload.blocks,
        markers: action.payload.markers || [],
        loading: false,
        error:   null
      }
    case ProjectActionType.SET_PROJECT_LOADING:
      return {
        ...newState,
        loading: action.payload.loading
      }
    case ProjectActionType.SET_PROJECT_ERROR:
      return {
        ...newState,
        error:   action.payload.error,
        loading: false
      }
    case ProjectActionType.UPDATE_PROJECT_SETTINGS:
      return {
        ...newState,
        project: {
          ...state.project,
          settings: { ...state.project.settings, ...action.payload.settings }
        }
      }
    // Playback Actions
    case ProjectActionType.PLAY:
      return {
        ...newState,
        isPlaying: true
      }
    case ProjectActionType.PAUSE:
      return {
        ...newState,
        isPlaying: false
      }
    case ProjectActionType.RESTART:
      return {
        ...newState,
        currentBeat: 0,
        isPlaying:   true
      }
    case ProjectActionType.SET_CURRENT_BEAT:
      return {
        ...newState,
        currentBeat: action.payload.beat
      }
    case ProjectActionType.SET_BPM:
      return {
        ...newState,
        project: {
          ...state.project,
          bpm: action.payload.bpm
        }
      }
    case ProjectActionType.SET_MASTER_VOLUME:
      return {
        ...newState,
        project: {
          ...state.project,
          masterVolume: action.payload.volume
        }
      }
    // Track Actions
    case ProjectActionType.ADD_TRACK:
      return {
        ...newState,
        tracks: [ ...state.tracks, action.payload.track ]
      }
    case ProjectActionType.REMOVE_TRACK:
      return {
        ...newState,
        tracks: state.tracks.filter(track => track.id !== action.payload.trackId),
        blocks: state.blocks.filter(block => {
          const trackIndex = state.tracks.findIndex(t => t.id === action.payload.trackId)
          return block.track !== trackIndex
        })
      }
    case ProjectActionType.UPDATE_TRACK:
      return {
        ...newState,
        tracks: state.tracks.map(track =>
          track.id === action.payload.trackId
            ? { ...track, ...action.payload.updates }
            : track
        )
      }
    case ProjectActionType.RENAME_TRACK:
      return {
        ...newState,
        tracks: state.tracks.map(track =>
          track.id === action.payload.trackId
            ? { ...track, name: action.payload.name }
            : track
        )
      }
    case ProjectActionType.SET_TRACK_VOLUME:
      return {
        ...newState,
        tracks: state.tracks.map(track =>
          track.id === action.payload.trackId
            ? { ...track, volume: action.payload.volume }
            : track
        )
      }
    case ProjectActionType.MUTE_TRACK:
      return {
        ...newState,
        tracks: state.tracks.map(track =>
          track.id === action.payload.trackId
            ? { ...track, muted: action.payload.muted }
            : track
        )
      }
    case ProjectActionType.SOLO_TRACK:
      return {
        ...newState,
        tracks: state.tracks.map(track =>
          track.id === action.payload.trackId
            ? { ...track, solo: action.payload.solo }
            : track
        )
      }
    case ProjectActionType.ARM_TRACK:
      return {
        ...newState,
        tracks: state.tracks.map(track =>
          track.id === action.payload.trackId
            ? { ...track, armed: action.payload.armed }
            : track
        )
      }
    case ProjectActionType.LOCK_TRACK:
      return {
        ...newState,
        tracks: state.tracks.map(track =>
          track.id === action.payload.trackId
            ? {
              ...track,
              locked:           true,
              lockedByUser:     action.payload.userId,
              lockedByUserName: action.payload.userName
            }
            : track
        )
      }
    case ProjectActionType.UNLOCK_TRACK:
      return {
        ...newState,
        tracks: state.tracks.map(track =>
          track.id === action.payload.trackId
            ? {
              ...track,
              locked:           false,
              lockedByUser:     null,
              lockedByUserName: null
            }
            : track
        )
      }
    // Block Actions
    case ProjectActionType.ADD_BLOCK:
      return {
        ...newState,
        blocks: [ ...state.blocks, action.payload.block ]
      }
    case ProjectActionType.REMOVE_BLOCK:
      return {
        ...newState,
        blocks:          state.blocks.filter(block => block.id !== action.payload.blockId),
        selectedBlockId: state.selectedBlockId === action.payload.blockId ? null : state.selectedBlockId
      }
    case ProjectActionType.UPDATE_BLOCK:
      return {
        ...newState,
        blocks: state.blocks.map(block =>
          block.id === action.payload.blockId
            ? { ...block, ...action.payload.updates }
            : block
        )
      }
    case ProjectActionType.MOVE_BLOCK:
      return {
        ...newState,
        blocks: state.blocks.map(block =>
          block.id === action.payload.blockId
            ? {
              ...block,
              track:     action.payload.track,
              startBeat: action.payload.startBeat
            }
            : block
        )
      }
    case ProjectActionType.RESIZE_BLOCK:
      return {
        ...newState,
        blocks: state.blocks.map(block =>
          block.id === action.payload.blockId
            ? { ...block, lengthBeats: action.payload.lengthBeats }
            : block
        )
      }
    case ProjectActionType.DUPLICATE_BLOCK:
      return {
        ...newState,
        blocks: [ ...state.blocks, action.payload.newBlock ]
      }
    case ProjectActionType.START_EDITING_BLOCK:
      return {
        ...newState,
        blocks: state.blocks.map(block =>
          block.id === action.payload.blockId
            ? { ...block, editingUserId: action.payload.userId }
            : block
        )
      }
    case ProjectActionType.END_EDITING_BLOCK:
      return {
        ...newState,
        blocks: state.blocks.map(block =>
          block.id === action.payload.blockId
            ? { ...block, editingUserId: null }
            : block
        )
      }
    // Marker Actions
    case ProjectActionType.ADD_MARKER:
      return {
        ...newState,
        markers: [ ...state.markers, action.payload.marker ]
      }
    case ProjectActionType.UPDATE_MARKER:
      return {
        ...newState,
        markers: state.markers.map(marker =>
          marker.id === action.payload.markerId
            ? { ...marker, ...action.payload.changes }
            : marker
        )
      }
    case ProjectActionType.REMOVE_MARKER:
      return {
        ...newState,
        markers: state.markers.filter(marker => marker.id !== action.payload.markerId)
      }
    // UI Actions
    case ProjectActionType.SELECT_BLOCK:
      return {
        ...newState,
        selectedBlockId: action.payload.blockId
      }
    case ProjectActionType.DESELECT_BLOCK:
      return {
        ...newState,
        selectedBlockId: null
      }
    case ProjectActionType.SET_ACTIVE_TOOL:
      return {
        ...newState,
        activeTool: action.payload.tool
      }
    case ProjectActionType.SET_ZOOM:
      return {
        ...newState,
        pixelsPerBeat: action.payload.pixelsPerBeat
      }
    case ProjectActionType.SET_SCROLL_POSITION:
      return {
        ...newState,
        scrollPosition: {
          horizontal: action.payload.horizontal,
          vertical:   action.payload.vertical
        }
      }
    case ProjectActionType.TOGGLE_SETTINGS:
      return {
        ...newState,
        isSettingsOpen: action.payload.open
      }
    // History Actions
    case ProjectActionType.ADD_HISTORY_ENTRY:
      const historyEntry: ProjectHistoryEntry = {
        id:          action.payload.id,
        timestamp:   action.payload.timestamp,
        action:      action.payload.action,
        description: action.payload.description,
        userId:      action.payload.userId,
        userName:    action.payload.userName,
        details:     action.payload.details
      }

      return {
        ...newState,
        history: [ ...state.history, historyEntry ]
      }
    case ProjectActionType.TOGGLE_HISTORY_DRAWER:
      return {
        ...newState,
        historyVisible:       action.payload.open,
        selectedHistoryIndex: action.payload.open ? state.selectedHistoryIndex : null
      }
    case ProjectActionType.RESTORE_TO_TIMESTAMP:
      // TODO: Implement proper state restoration based on timestamp
      console.log('Restoring to timestamp:', action.payload.timestamp)
      return {
        ...newState,
        selectedHistoryIndex: null,
        historyVisible:       false
      }
    // Collaboration Actions
    case ProjectActionType.USER_JOINED:
      const existingUser = state.remoteUsers.find(user => user.id === action.payload.userId)
      if (existingUser)
        return newState

      return {
        ...newState,
        remoteUsers: [
          ...state.remoteUsers,
          {
            id:       action.payload.userId,
            name:     action.payload.userName,
            position: action.payload.position || { x: 0, y: 0 },
            color:    action.payload.color || generateUserColor(action.payload.userId)
          }
        ]
      }
    case ProjectActionType.USER_LEFT:
      return {
        ...newState,
        remoteUsers: state.remoteUsers.filter(user => user.id !== action.payload.userId)
      }
    case ProjectActionType.UPDATE_USER_PRESENCE:
      return {
        ...newState,
        remoteUsers: state.remoteUsers.map(user =>
          user.id === action.payload.userId
            ? {
              ...user,
              position: action.payload.position || user.position,
              name:     action.payload.userName || user.name
            }
            : user
        ),
        localUserName: action.payload.userId === state.localUserId
          ? action.payload.userName || state.localUserName
          : state.localUserName,
        isConnected: action.payload.connected !== undefined
          ? action.payload.connected
          : state.isConnected
      }
    default:
      console.warn('Unknown action type:', action.type)
      return newState
  }
}

// Helper function to generate consistent colors for users
export function generateUserColor (userId: string): string {
  // Simple hash function to convert userId to a number
  let hash = 0
  for (let i = 0; i < userId.length; i++)
    hash = userId.charCodeAt(i) + ((hash << 5) - hash)

  // Convert the hash to a color
  const hue = Math.abs(hash) % 360
  return `hsl(${hue}, 70%, 65%)`
}

// Helper function to find track by ID
export function findTrackById (tracks: Track[], trackId: string): Track | undefined {
  return tracks.find(track => track.id === trackId)
}

// Helper function to find block by ID
export function findBlockById (blocks: Block[], blockId: string): Block | undefined {
  return blocks.find(block => block.id === blockId)
}

// Helper function to get track index from track ID
export function getTrackIndex (tracks: Track[], trackId: string): number {
  return tracks.findIndex(track => track.id === trackId)
}

// Helper function to check if a track is locked by another user
export function isTrackLockedByOther (track: Track, currentUserId: string): boolean {
  return track.locked === true && track.lockedByUser !== null && track.lockedByUser !== currentUserId
}

// Helper function to check if a block is being edited by another user
export function isBlockEditedByOther (block: Block, currentUserId: string): boolean {
  return block.editingUserId !== null && block.editingUserId !== currentUserId
}

// Helper function to get blocks for a specific track
export function getBlocksForTrack (blocks: Block[], trackIndex: number): Block[] {
  return blocks.filter(block => block.track === trackIndex)
}

// Helper function to get the latest history entry
export function getLatestHistoryEntry (history: ProjectHistoryEntry[]): ProjectHistoryEntry | null {
  return history.length > 0 ? history[history.length - 1] : null
}

// Helper function to filter history by user
export function getHistoryByUser (history: ProjectHistoryEntry[], userId: string): ProjectHistoryEntry[] {
  return history.filter(entry => entry.userId === userId)
}

// Helper function to filter history by action type
export function getHistoryByActionType (history: ProjectHistoryEntry[], actionType: string): ProjectHistoryEntry[] {
  return history.filter(entry => entry.action === actionType)
}

// Helper function to calculate project statistics
export interface ProjectStats {
  totalTracks:   number;
  totalBlocks:   number;
  totalDuration: number; // in beats
  activeUsers:   number;
  lastActivity:  number | null;
}

export function calculateProjectStats (state: ProjectState): ProjectStats {
  const totalDuration = Math.max(
    ...state.blocks.map(block => block.startBeat + block.lengthBeats),
    state.totalBars * state.beatsPerBar
  )

  const lastActivity = getLatestHistoryEntry(state.history)?.timestamp || null

  return {
    totalTracks: state.tracks.length,
    totalBlocks: state.blocks.length,
    totalDuration,
    activeUsers: state.remoteUsers.length + 1, // +1 for local user
    lastActivity
  }
}

// Helper function to validate state consistency
export function validateProjectState (state: ProjectState): string[] {
  const errors: string[] = []

  // Check for orphaned blocks (blocks referencing non-existent tracks)
  state.blocks.forEach(block => {
    if (block.track >= state.tracks.length || block.track < 0)
      errors.push(`Block "${block.name}" (${block.id}) references invalid track index ${block.track}`)
  })

  // Check for invalid selected block
  if (state.selectedBlockId && !findBlockById(state.blocks, state.selectedBlockId))
    errors.push(`Selected block ID "${state.selectedBlockId}" does not exist`)

  // Check for overlapping blocks on the same track
  const trackBlocks: {[trackIndex: number]: Block[] } = {}
  state.blocks.forEach(block => {
    if (!trackBlocks[block.track])
      trackBlocks[block.track] = []
    trackBlocks[block.track].push(block)
  })

  Object.entries(trackBlocks).forEach(([ trackIndex, blocks ]) => {
    blocks.sort((a, b) => a.startBeat - b.startBeat)
    for (let i = 0; i < blocks.length - 1; i++) {
      const currentBlock = blocks[i]
      const nextBlock = blocks[i + 1]
      if (currentBlock.startBeat + currentBlock.lengthBeats > nextBlock.startBeat)
        errors.push(
          `Overlapping blocks on track ${trackIndex}: "${currentBlock.name}" and "${nextBlock.name}"`
        )
    }
  })

  return errors
}

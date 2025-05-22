import { ActionType } from '@/types/collaborative';

// Project Action Types
export enum ProjectActionType {
  // Project Management
  LOAD_PROJECT = 'LOAD_PROJECT',
  SET_PROJECT_LOADING = 'SET_PROJECT_LOADING',
  SET_PROJECT_ERROR = 'SET_PROJECT_ERROR',
  UPDATE_PROJECT_SETTINGS = 'UPDATE_PROJECT_SETTINGS',
  
  // Playback Actions
  PLAY = 'PLAY',
  PAUSE = 'PAUSE',
  RESTART = 'RESTART',
  SET_CURRENT_BEAT = 'SET_CURRENT_BEAT',
  SET_BPM = 'SET_BPM',
  SET_MASTER_VOLUME = 'SET_MASTER_VOLUME',
  
  // Track Actions
  ADD_TRACK = 'ADD_TRACK',
  REMOVE_TRACK = 'REMOVE_TRACK',
  UPDATE_TRACK = 'UPDATE_TRACK',
  RENAME_TRACK = 'RENAME_TRACK',
  SET_TRACK_VOLUME = 'SET_TRACK_VOLUME',
  MUTE_TRACK = 'MUTE_TRACK',
  SOLO_TRACK = 'SOLO_TRACK',
  ARM_TRACK = 'ARM_TRACK',
  LOCK_TRACK = 'LOCK_TRACK',
  UNLOCK_TRACK = 'UNLOCK_TRACK',
  
  // Block Actions
  ADD_BLOCK = 'ADD_BLOCK',
  REMOVE_BLOCK = 'REMOVE_BLOCK',
  UPDATE_BLOCK = 'UPDATE_BLOCK',
  MOVE_BLOCK = 'MOVE_BLOCK',
  RESIZE_BLOCK = 'RESIZE_BLOCK',
  DUPLICATE_BLOCK = 'DUPLICATE_BLOCK',
  START_EDITING_BLOCK = 'START_EDITING_BLOCK',
  END_EDITING_BLOCK = 'END_EDITING_BLOCK',
  
  // UI Actions
  SELECT_BLOCK = 'SELECT_BLOCK',
  DESELECT_BLOCK = 'DESELECT_BLOCK',
  SET_ACTIVE_TOOL = 'SET_ACTIVE_TOOL',
  SET_ZOOM = 'SET_ZOOM',
  SET_SCROLL_POSITION = 'SET_SCROLL_POSITION',
  TOGGLE_SETTINGS = 'TOGGLE_SETTINGS',
  
  // History Actions
  ADD_HISTORY_ENTRY = 'ADD_HISTORY_ENTRY',
  TOGGLE_HISTORY_DRAWER = 'TOGGLE_HISTORY_DRAWER',
  RESTORE_TO_TIMESTAMP = 'RESTORE_TO_TIMESTAMP',
  
  // Collaboration Actions
  USER_JOINED = 'USER_JOINED',
  USER_LEFT = 'USER_LEFT',
  UPDATE_USER_PRESENCE = 'UPDATE_USER_PRESENCE',
}

// Action Interfaces
export interface ProjectAction {
  type: ProjectActionType;
  payload?: any;
  meta?: {
    timestamp: number;
    userId: string;
    userName: string;
    description: string;
    trackable?: boolean; // Whether this action should appear in history
  };
}

// Project Management Actions
export interface LoadProjectAction extends ProjectAction {
  type: ProjectActionType.LOAD_PROJECT;
  payload: {
    id: string;
    name: string;
    bpm: number;
    masterVolume: number;
    settings: any;
    tracks: any[];
    blocks: any[];
  };
}

export interface SetProjectLoadingAction extends ProjectAction {
  type: ProjectActionType.SET_PROJECT_LOADING;
  payload: { loading: boolean };
}

export interface SetProjectErrorAction extends ProjectAction {
  type: ProjectActionType.SET_PROJECT_ERROR;
  payload: { error: string | null };
}

export interface UpdateProjectSettingsAction extends ProjectAction {
  type: ProjectActionType.UPDATE_PROJECT_SETTINGS;
  payload: { settings: any };
}

// Playback Actions
export interface PlayAction extends ProjectAction {
  type: ProjectActionType.PLAY;
}

export interface PauseAction extends ProjectAction {
  type: ProjectActionType.PAUSE;
}

export interface RestartAction extends ProjectAction {
  type: ProjectActionType.RESTART;
}

export interface SetCurrentBeatAction extends ProjectAction {
  type: ProjectActionType.SET_CURRENT_BEAT;
  payload: { beat: number };
}

export interface SetBpmAction extends ProjectAction {
  type: ProjectActionType.SET_BPM;
  payload: { bpm: number };
}

export interface SetMasterVolumeAction extends ProjectAction {
  type: ProjectActionType.SET_MASTER_VOLUME;
  payload: { volume: number };
}

// Track Actions
export interface AddTrackAction extends ProjectAction {
  type: ProjectActionType.ADD_TRACK;
  payload: {
    track: {
      id: string;
      name: string;
      color: string;
      volume: number;
      muted: boolean;
      solo: boolean;
      armed: boolean;
    };
  };
}

export interface RemoveTrackAction extends ProjectAction {
  type: ProjectActionType.REMOVE_TRACK;
  payload: { trackId: string };
}

export interface UpdateTrackAction extends ProjectAction {
  type: ProjectActionType.UPDATE_TRACK;
  payload: {
    trackId: string;
    updates: Partial<{
      name: string;
      color: string;
      volume: number;
      muted: boolean;
      solo: boolean;
      armed: boolean;
      locked: boolean;
      lockedByUser: string | null;
    }>;
  };
}

export interface RenameTrackAction extends ProjectAction {
  type: ProjectActionType.RENAME_TRACK;
  payload: { trackId: string; name: string };
}

export interface SetTrackVolumeAction extends ProjectAction {
  type: ProjectActionType.SET_TRACK_VOLUME;
  payload: { trackId: string; volume: number };
}

export interface MuteTrackAction extends ProjectAction {
  type: ProjectActionType.MUTE_TRACK;
  payload: { trackId: string; muted: boolean };
}

export interface SoloTrackAction extends ProjectAction {
  type: ProjectActionType.SOLO_TRACK;
  payload: { trackId: string; solo: boolean };
}

export interface ArmTrackAction extends ProjectAction {
  type: ProjectActionType.ARM_TRACK;
  payload: { trackId: string; armed: boolean };
}

export interface LockTrackAction extends ProjectAction {
  type: ProjectActionType.LOCK_TRACK;
  payload: { trackId: string; userId: string; userName: string };
}

export interface UnlockTrackAction extends ProjectAction {
  type: ProjectActionType.UNLOCK_TRACK;
  payload: { trackId: string };
}

// Block Actions
export interface AddBlockAction extends ProjectAction {
  type: ProjectActionType.ADD_BLOCK;
  payload: {
    block: {
      id: string;
      name: string;
      track: number;
      startBeat: number;
      lengthBeats: number;
      volume: number;
      pitch: number;
      fileId?: string;
    };
  };
}

export interface RemoveBlockAction extends ProjectAction {
  type: ProjectActionType.REMOVE_BLOCK;
  payload: { blockId: string };
}

export interface UpdateBlockAction extends ProjectAction {
  type: ProjectActionType.UPDATE_BLOCK;
  payload: {
    blockId: string;
    updates: Partial<{
      name: string;
      volume: number;
      pitch: number;
      startBeat: number;
      lengthBeats: number;
      track: number;
    }>;
  };
}

export interface MoveBlockAction extends ProjectAction {
  type: ProjectActionType.MOVE_BLOCK;
  payload: {
    blockId: string;
    track: number;
    startBeat: number;
  };
}

export interface ResizeBlockAction extends ProjectAction {
  type: ProjectActionType.RESIZE_BLOCK;
  payload: {
    blockId: string;
    lengthBeats: number;
  };
}

export interface DuplicateBlockAction extends ProjectAction {
  type: ProjectActionType.DUPLICATE_BLOCK;
  payload: {
    originalBlockId: string;
    newBlock: {
      id: string;
      name: string;
      track: number;
      startBeat: number;
      lengthBeats: number;
      volume: number;
      pitch: number;
    };
  };
}

export interface StartEditingBlockAction extends ProjectAction {
  type: ProjectActionType.START_EDITING_BLOCK;
  payload: { blockId: string; userId: string };
}

export interface EndEditingBlockAction extends ProjectAction {
  type: ProjectActionType.END_EDITING_BLOCK;
  payload: { blockId: string };
}

// UI Actions
export interface SelectBlockAction extends ProjectAction {
  type: ProjectActionType.SELECT_BLOCK;
  payload: { blockId: string };
}

export interface DeselectBlockAction extends ProjectAction {
  type: ProjectActionType.DESELECT_BLOCK;
}

export interface SetActiveToolAction extends ProjectAction {
  type: ProjectActionType.SET_ACTIVE_TOOL;
  payload: { tool: string };
}

export interface SetZoomAction extends ProjectAction {
  type: ProjectActionType.SET_ZOOM;
  payload: { pixelsPerBeat: number };
}

export interface SetScrollPositionAction extends ProjectAction {
  type: ProjectActionType.SET_SCROLL_POSITION;
  payload: { horizontal: number; vertical: number };
}

export interface ToggleSettingsAction extends ProjectAction {
  type: ProjectActionType.TOGGLE_SETTINGS;
  payload: { open: boolean };
}

// History Actions
export interface AddHistoryEntryAction extends ProjectAction {
  type: ProjectActionType.ADD_HISTORY_ENTRY;
  payload: {
    id: string;
    timestamp: number;
    action: string;
    description: string;
    userId: string;
    userName: string;
    details?: any;
  };
}

export interface ToggleHistoryDrawerAction extends ProjectAction {
  type: ProjectActionType.TOGGLE_HISTORY_DRAWER;
  payload: { open: boolean };
}

export interface RestoreToTimestampAction extends ProjectAction {
  type: ProjectActionType.RESTORE_TO_TIMESTAMP;
  payload: { timestamp: number };
}

// Action Creators
export const createProjectAction = <T extends ProjectAction>(
  type: T['type'],
  payload?: T['payload'],
  meta?: Partial<T['meta']>
): T => {
  const action = {
    type,
    payload,
    meta: {
      timestamp: Date.now(),
      userId: '',
      userName: '',
      description: '',
      trackable: true,
      ...meta,
    },
  } as T;

  return action;
};

// Specific Action Creators with descriptions
export const playbackActions = {
  play: (userId: string, userName: string) =>
    createProjectAction<PlayAction>(ProjectActionType.PLAY, undefined, {
      userId,
      userName,
      description: 'Started playback',
    }),

  pause: (userId: string, userName: string) =>
    createProjectAction<PauseAction>(ProjectActionType.PAUSE, undefined, {
      userId,
      userName,
      description: 'Paused playback',
    }),

  restart: (userId: string, userName: string) =>
    createProjectAction<RestartAction>(ProjectActionType.RESTART, undefined, {
      userId,
      userName,
      description: 'Restarted playback',
    }),

  setBpm: (bpm: number, userId: string, userName: string) =>
    createProjectAction<SetBpmAction>(ProjectActionType.SET_BPM, { bpm }, {
      userId,
      userName,
      description: `Changed BPM to ${bpm}`,
    }),

  setMasterVolume: (volume: number, userId: string, userName: string) =>
    createProjectAction<SetMasterVolumeAction>(ProjectActionType.SET_MASTER_VOLUME, { volume }, {
      userId,
      userName,
      description: `Changed master volume to ${volume}%`,
    }),
};

export const trackActions = {
  addTrack: (track: any, userId: string, userName: string) =>
    createProjectAction<AddTrackAction>(ProjectActionType.ADD_TRACK, { track }, {
      userId,
      userName,
      description: `Added track "${track.name}"`,
    }),

  removeTrack: (trackId: string, trackName: string, userId: string, userName: string) =>
    createProjectAction<RemoveTrackAction>(ProjectActionType.REMOVE_TRACK, { trackId }, {
      userId,
      userName,
      description: `Removed track "${trackName}"`,
    }),

  renameTrack: (trackId: string, name: string, oldName: string, userId: string, userName: string) =>
    createProjectAction<RenameTrackAction>(ProjectActionType.RENAME_TRACK, { trackId, name }, {
      userId,
      userName,
      description: `Renamed track from "${oldName}" to "${name}"`,
    }),

  setTrackVolume: (trackId: string, volume: number, trackName: string, userId: string, userName: string) =>
    createProjectAction<SetTrackVolumeAction>(ProjectActionType.SET_TRACK_VOLUME, { trackId, volume }, {
      userId,
      userName,
      description: `Set "${trackName}" volume to ${volume}%`,
    }),

  muteTrack: (trackId: string, muted: boolean, trackName: string, userId: string, userName: string) =>
    createProjectAction<MuteTrackAction>(ProjectActionType.MUTE_TRACK, { trackId, muted }, {
      userId,
      userName,
      description: `${muted ? 'Muted' : 'Unmuted'} track "${trackName}"`,
    }),

  soloTrack: (trackId: string, solo: boolean, trackName: string, userId: string, userName: string) =>
    createProjectAction<SoloTrackAction>(ProjectActionType.SOLO_TRACK, { trackId, solo }, {
      userId,
      userName,
      description: `${solo ? 'Soloed' : 'Unsoloed'} track "${trackName}"`,
    }),

  armTrack: (trackId: string, armed: boolean, trackName: string, userId: string, userName: string) =>
    createProjectAction<ArmTrackAction>(ProjectActionType.ARM_TRACK, { trackId, armed }, {
      userId,
      userName,
      description: `${armed ? 'Armed' : 'Disarmed'} track "${trackName}"`,
    }),

  lockTrack: (trackId: string, trackName: string, userId: string, userName: string) =>
    createProjectAction<LockTrackAction>(ProjectActionType.LOCK_TRACK, { trackId, userId, userName }, {
      userId,
      userName,
      description: `Locked track "${trackName}"`,
    }),

  unlockTrack: (trackId: string, trackName: string, userId: string, userName: string) =>
    createProjectAction<UnlockTrackAction>(ProjectActionType.UNLOCK_TRACK, { trackId }, {
      userId,
      userName,
      description: `Unlocked track "${trackName}"`,
    }),
};

export const blockActions = {
  addBlock: (block: any, trackName: string, userId: string, userName: string) =>
    createProjectAction<AddBlockAction>(ProjectActionType.ADD_BLOCK, { block }, {
      userId,
      userName,
      description: `Added block "${block.name}" to track "${trackName}"`,
    }),

  removeBlock: (blockId: string, blockName: string, userId: string, userName: string) =>
    createProjectAction<RemoveBlockAction>(ProjectActionType.REMOVE_BLOCK, { blockId }, {
      userId,
      userName,
      description: `Removed block "${blockName}"`,
    }),

  updateBlock: (blockId: string, updates: any, blockName: string, userId: string, userName: string) =>
    createProjectAction<UpdateBlockAction>(ProjectActionType.UPDATE_BLOCK, { blockId, updates }, {
      userId,
      userName,
      description: `Updated block "${blockName}"`,
    }),

  moveBlock: (blockId: string, track: number, startBeat: number, blockName: string, userId: string, userName: string) =>
    createProjectAction<MoveBlockAction>(ProjectActionType.MOVE_BLOCK, { blockId, track, startBeat }, {
      userId,
      userName,
      description: `Moved block "${blockName}" to track ${track + 1}, beat ${startBeat + 1}`,
    }),

  resizeBlock: (blockId: string, lengthBeats: number, blockName: string, userId: string, userName: string) =>
    createProjectAction<ResizeBlockAction>(ProjectActionType.RESIZE_BLOCK, { blockId, lengthBeats }, {
      userId,
      userName,
      description: `Resized block "${blockName}" to ${lengthBeats} beats`,
    }),

  duplicateBlock: (originalBlockId: string, newBlock: any, userId: string, userName: string) =>
    createProjectAction<DuplicateBlockAction>(ProjectActionType.DUPLICATE_BLOCK, { originalBlockId, newBlock }, {
      userId,
      userName,
      description: `Duplicated block "${newBlock.name}"`,
    }),

  startEditingBlock: (blockId: string, blockName: string, userId: string, userName: string) =>
    createProjectAction<StartEditingBlockAction>(ProjectActionType.START_EDITING_BLOCK, { blockId, userId }, {
      userId,
      userName,
      description: `Started editing block "${blockName}"`,
      trackable: false, // Don't track editing state changes
    }),

  endEditingBlock: (blockId: string, blockName: string, userId: string, userName: string) =>
    createProjectAction<EndEditingBlockAction>(ProjectActionType.END_EDITING_BLOCK, { blockId }, {
      userId,
      userName,
      description: `Stopped editing block "${blockName}"`,
      trackable: false, // Don't track editing state changes
    }),
};

export const uiActions = {
  selectBlock: (blockId: string) =>
    createProjectAction<SelectBlockAction>(ProjectActionType.SELECT_BLOCK, { blockId }, {
      trackable: false, // Don't track UI state changes
    }),

  deselectBlock: () =>
    createProjectAction<DeselectBlockAction>(ProjectActionType.DESELECT_BLOCK, undefined, {
      trackable: false, // Don't track UI state changes
    }),

  setActiveTool: (tool: string) =>
    createProjectAction<SetActiveToolAction>(ProjectActionType.SET_ACTIVE_TOOL, { tool }, {
      trackable: false, // Don't track UI state changes
    }),

  setZoom: (pixelsPerBeat: number) =>
    createProjectAction<SetZoomAction>(ProjectActionType.SET_ZOOM, { pixelsPerBeat }, {
      trackable: false, // Don't track UI state changes
    }),

  setScrollPosition: (horizontal: number, vertical: number) =>
    createProjectAction<SetScrollPositionAction>(ProjectActionType.SET_SCROLL_POSITION, { horizontal, vertical }, {
      trackable: false, // Don't track UI state changes
    }),
};
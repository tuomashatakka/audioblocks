import React, { createContext, useContext, useReducer, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import WebSocketService from '@/utils/WebSocketService';
import { ActionType, UserInteractionMessage } from '@/types/collaborative';
import { 
  ProjectState, 
  ProjectHistoryEntry, 
  Track, 
  Block, 
  ProjectSettings,
  initialProjectState,
  projectReducer
} from './projectReducer';
import {
  ProjectActionType,
  playbackActions,
  trackActions,
  blockActions,
  uiActions,
  createProjectAction,
  LoadProjectAction,
  SetProjectLoadingAction,
  SetProjectErrorAction,
  UpdateProjectSettingsAction,
  ToggleHistoryDrawerAction,
  RestoreToTimestampAction
} from './projectActions';
import { ToolType } from '@/components/ToolsMenu';

interface ProjectContextType {
  // State
  state: ProjectState;
  
  // Project Management
  loadProject: (projectData: any) => void;
  setProjectLoading: (loading: boolean) => void;
  setProjectError: (error: string | null) => void;
  updateProjectSettings: (settings: Partial<ProjectSettings>) => Promise<void>;
  
  // Playback Actions
  play: () => void;
  pause: () => void;
  restart: () => void;
  setCurrentBeat: (beat: number) => void;
  setBpm: (bpm: number) => void;
  setMasterVolume: (volume: number) => void;
  
  // Track Actions
  addTrack: (track: Omit<Track, 'id'>) => Promise<void>;
  removeTrack: (trackId: string) => void;
  renameTrack: (trackId: string, name: string) => void;
  setTrackVolume: (trackId: string, volume: number) => void;
  muteTrack: (trackId: string, muted: boolean) => void;
  soloTrack: (trackId: string, solo: boolean) => void;
  armTrack: (trackId: string, armed: boolean) => void;
  lockTrack: (trackId: string) => void;
  unlockTrack: (trackId: string) => void;
  
  // Block Actions
  addBlock: (block: Omit<Block, 'id'>) => void;
  removeBlock: (blockId: string) => void;
  updateBlock: (blockId: string, updates: Partial<Block>) => void;
  moveBlock: (blockId: string, track: number, startBeat: number) => void;
  resizeBlock: (blockId: string, lengthBeats: number) => void;
  duplicateBlock: (blockId: string) => void;
  startEditingBlock: (blockId: string) => void;
  endEditingBlock: (blockId: string) => void;
  
  // UI Actions
  selectBlock: (blockId: string) => void;
  deselectBlock: () => void;
  setActiveTool: (tool: ToolType) => void;
  setZoom: (pixelsPerBeat: number) => void;
  setScrollPosition: (horizontal: number, vertical: number) => void;
  toggleSettings: (open: boolean) => void;
  
  // History Actions
  toggleHistoryDrawer: (open: boolean) => void;
  restoreToTimestamp: (timestamp: number) => void;
  
  // Legacy support for existing code
  connectToProject: (projectId: string) => Promise<void>;
  disconnectFromProject: () => void;
  sendMessage: (action: ActionType, params: any) => string;
  messageHistory: UserInteractionMessage[];
  historyVisible: boolean;
  setHistoryVisible: (visible: boolean) => void;
  selectedHistoryIndex: number | null;
  setSelectedHistoryIndex: (index: number | null) => void;
  updateUserName: (name: string) => void;
  sendGeneralMessage: (message: any) => void;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

const webSocketService = WebSocketService.getInstance();

interface ProjectProviderProps {
  children: ReactNode;
}

const fetchProjectData = async (projectId: string) => {
  try {
    // Fetch project details
    const { data: projectData, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();
      
    if (projectError) throw projectError;
    
    // Parse settings JSON from the database
    let projectSettings: ProjectSettings = {
      theme: 'dark',
      snapToGrid: true,
      gridSize: 1,
      autoSave: true,
      showCollaborators: true
    };
    
    if (projectData.settings) {
      try {
        // If settings is a string, parse it, otherwise use as is
        const parsedSettings = typeof projectData.settings === 'string' 
          ? JSON.parse(projectData.settings) 
          : projectData.settings;
          
        projectSettings = {
          ...projectSettings, // Keep defaults
          ...parsedSettings   // Override with stored settings
        };
      } catch (e) {
        console.error("Failed to parse project settings:", e);
      }
    }
    
    // Fetch tracks
    const { data: tracksData, error: tracksError } = await supabase
      .from('tracks')
      .select('*')
      .eq('project_id', projectId);
      
    if (tracksError) throw tracksError;
    
    // Fetch audio blocks
    const { data: blocksData, error: blocksError } = await supabase
      .from('audio_blocks')
      .select('*')
      .in('track_id', tracksData.map(track => track.id));
      
    if (blocksError) throw blocksError;
    
    // Transform the data to match the application structure
    const formattedTracks = tracksData.map(track => ({
      id: track.id,
      name: track.name,
      color: track.color,
      volume: track.volume,
      muted: track.muted,
      solo: track.solo,
      armed: track.armed ?? false,
      locked: track.locked ?? false,
      lockedByUser: track.locked_by_user_id || null,
      lockedByUserName: track.locked_by_name || null
    }));
    
    const formattedBlocks = blocksData.map(block => ({
      id: block.id,
      track: formattedTracks.findIndex(track => track.id === block.track_id),
      startBeat: block.start_beat,
      lengthBeats: block.length_beats,
      name: block.name,
      volume: block.volume,
      pitch: block.pitch,
      fileId: block.file_id
    }));
    
    return {
      project: {
        id: projectData.id,
        name: projectData.name,
        bpm: projectData.bpm || 120,
        masterVolume: projectData.master_volume || 80,
        settings: projectSettings
      },
      tracks: formattedTracks,
      blocks: formattedBlocks
    };
  } catch (error) {
    console.error("Error fetching project data:", error);
    throw error;
  }
};

const updateProject = async (
  projectId: string,
  data: {
    name?: string;
    bpm?: number;
    masterVolume?: number;
    settings?: ProjectSettings;
  }
) => {
  try {
    const updateData: any = {};
    
    if (data.name !== undefined) updateData.name = data.name;
    if (data.bpm !== undefined) updateData.bpm = data.bpm;
    if (data.masterVolume !== undefined) updateData.master_volume = data.masterVolume;
    if (data.settings !== undefined) updateData.settings = data.settings;
    
    const { data: result, error } = await supabase
      .from('projects')
      .update(updateData)
      .eq('id', projectId);
      
    if (error) throw error;
    return result;
  } catch (error) {
    console.error("Error updating project:", error);
    throw error;
  }
};

const createBlock = async (
  projectId: string, 
  trackId: string,
  data: {
    name: string;
    startBeat: number;
    lengthBeats: number;
    volume?: number;
    pitch?: number;
    fileId?: string;
  }
) => {
  try {
    const { data: result, error } = await supabase
      .from('audio_blocks')
      .insert({
        track_id: trackId,
        name: data.name,
        start_beat: data.startBeat,
        length_beats: data.lengthBeats,
        volume: data.volume || 1.0,
        pitch: data.pitch || 0.0,
        file_id: data.fileId
      });
      
    if (error) throw error;
    return result;
  } catch (error) {
    console.error("Error creating audio block:", error);
    throw error;
  }
};

const updateSettings = async (projectId: string, settings: ProjectSettings) => {
  try {
    const { data: project, error: fetchError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();
      
    if (fetchError) throw fetchError;
    
    // Parse existing settings or use default
    let currentSettings: ProjectSettings = {
      theme: 'dark',
      snapToGrid: true,
      gridSize: 1,
      autoSave: true,
      showCollaborators: true
    };
    
    if (project.settings) {
      try {
        // If settings is a string, parse it, otherwise use as is
        const parsedSettings = typeof project.settings === 'string' 
          ? JSON.parse(project.settings) 
          : project.settings;
          
        currentSettings = {
          ...currentSettings,
          ...parsedSettings
        };
      } catch (e) {
        console.error("Failed to parse project settings:", e);
      }
    }
    
    // Merge with new settings
    const updatedSettings: ProjectSettings = {
      ...currentSettings,
      ...settings
    };
    
    // Update the project with the new settings
    const { data: result, error: updateError } = await supabase
      .from('projects')
      .update({ 
        settings: updatedSettings,
        bpm: project.bpm || 120,
        master_volume: project.master_volume || 80
      })
      .eq('id', projectId);
      
    if (updateError) throw updateError;
    return result;
  } catch (error) {
    console.error("Error updating project settings:", error);
    throw error;
  }
};

export const ProjectProvider = ({ children }: ProjectProviderProps) => {
  // Initialize state with user info from WebSocket service
  const [state, dispatch] = useReducer(projectReducer, {
    ...initialProjectState,
    localUserId: webSocketService.getLocalUserId(),
    localUserName: webSocketService.getLocalUserName(),
  });

  // Helper function to get current user info
  const getCurrentUser = useCallback(() => ({
    userId: state.localUserId,
    userName: state.localUserName,
  }), [state.localUserId, state.localUserName]);

  // Project Management Actions
  const loadProject = useCallback((projectData: any) => {
    const action = createProjectAction<LoadProjectAction>(
      ProjectActionType.LOAD_PROJECT,
      {
        id: projectData.id,
        name: projectData.name,
        bpm: projectData.bpm,
        masterVolume: projectData.masterVolume,
        settings: projectData.settings,
        tracks: projectData.tracks,
        blocks: projectData.blocks
      },
      { trackable: false }
    );
    dispatch(action);
  }, []);

  const setProjectLoading = useCallback((loading: boolean) => {
    const action = createProjectAction<SetProjectLoadingAction>(
      ProjectActionType.SET_PROJECT_LOADING,
      { loading },
      { trackable: false }
    );
    dispatch(action);
  }, []);

  const setProjectError = useCallback((error: string | null) => {
    const action = createProjectAction<SetProjectErrorAction>(
      ProjectActionType.SET_PROJECT_ERROR,
      { error },
      { trackable: false }
    );
    dispatch(action);
  }, []);

  const updateProjectSettings = useCallback(async (settings: Partial<ProjectSettings>) => {
    if (!state.project.id) {
      throw new Error("No project is currently active");
    }

    try {
      const action = createProjectAction<UpdateProjectSettingsAction>(
        ProjectActionType.UPDATE_PROJECT_SETTINGS,
        { settings },
        { 
          ...getCurrentUser(),
          description: `Updated project settings`,
        }
      );
      dispatch(action);
      
      sendMessage(ActionType.UPDATE_SETTINGS, { settings });
    } catch (error) {
      console.error("Failed to update project settings:", error);
      throw error;
    }
  }, [state.project.id, getCurrentUser]);

  // Playback Actions
  const play = useCallback(() => {
    const { userId, userName } = getCurrentUser();
    const action = playbackActions.play(userId, userName);
    dispatch(action);
    sendMessage(ActionType.PLAY, {});
  }, [getCurrentUser]);

  const pause = useCallback(() => {
    const { userId, userName } = getCurrentUser();
    const action = playbackActions.pause(userId, userName);
    dispatch(action);
    sendMessage(ActionType.PAUSE, {});
  }, [getCurrentUser]);

  const restart = useCallback(() => {
    const { userId, userName } = getCurrentUser();
    const action = playbackActions.restart(userId, userName);
    dispatch(action);
    sendMessage(ActionType.RESTART, {});
  }, [getCurrentUser]);

  const setCurrentBeat = useCallback((beat: number) => {
    const action = createProjectAction(
      ProjectActionType.SET_CURRENT_BEAT,
      { beat },
      { trackable: false }
    );
    dispatch(action);
  }, []);

  const setBpm = useCallback((bpm: number) => {
    const { userId, userName } = getCurrentUser();
    const action = playbackActions.setBpm(bpm, userId, userName);
    dispatch(action);
    sendMessage(ActionType.UPDATE_SETTINGS, { bpm });
  }, [getCurrentUser]);

  const setMasterVolume = useCallback((volume: number) => {
    const { userId, userName } = getCurrentUser();
    const action = playbackActions.setMasterVolume(volume, userId, userName);
    dispatch(action);
    sendMessage(ActionType.UPDATE_SETTINGS, { masterVolume: volume });
  }, [getCurrentUser]);

  // Track Actions
  const addTrack = useCallback(async (trackData: Omit<Track, 'id'>) => {
    if (!state.project.id) return;

    const { userId, userName } = getCurrentUser();
    
    try {
      const { data: newTrackData, error } = await supabase
        .from('tracks')
        .insert({
          name: trackData.name,
          color: trackData.color,
          volume: trackData.volume,
          muted: trackData.muted,
          solo: trackData.solo,
          armed: trackData.armed,
          project_id: state.project.id
        })
        .select()
        .single();
        
      if (error) throw error;
      
      const newTrack: Track = { 
        id: newTrackData.id, 
        ...trackData
      };
      
      const action = trackActions.addTrack(newTrack, userId, userName);
      dispatch(action);
      sendMessage(ActionType.ADD_TRACK, { track: newTrack });
    } catch (error) {
      console.error('Error adding track:', error);
      throw error;
    }
  }, [state.project.id, getCurrentUser]);

  const removeTrack = useCallback((trackId: string) => {
    const { userId, userName } = getCurrentUser();
    const track = state.tracks.find(t => t.id === trackId);
    const trackName = track?.name || 'Unknown';
    
    const action = trackActions.removeTrack(trackId, trackName, userId, userName);
    dispatch(action);
    sendMessage(ActionType.REMOVE_TRACK, { trackId });
  }, [state.tracks, getCurrentUser]);

  const renameTrack = useCallback((trackId: string, name: string) => {
    const { userId, userName } = getCurrentUser();
    const track = state.tracks.find(t => t.id === trackId);
    const oldName = track?.name || 'Unknown';
    
    const action = trackActions.renameTrack(trackId, name, oldName, userId, userName);
    dispatch(action);
    sendMessage(ActionType.RENAME_TRACK, { trackId, name });
  }, [state.tracks, getCurrentUser]);

  const setTrackVolume = useCallback((trackId: string, volume: number) => {
    const { userId, userName } = getCurrentUser();
    const track = state.tracks.find(t => t.id === trackId);
    const trackName = track?.name || 'Unknown';
    
    const action = trackActions.setTrackVolume(trackId, volume, trackName, userId, userName);
    dispatch(action);
    sendMessage(ActionType.SET_TRACK_VOLUME, { trackId, volume });
  }, [state.tracks, getCurrentUser]);

  const muteTrack = useCallback((trackId: string, muted: boolean) => {
    const { userId, userName } = getCurrentUser();
    const track = state.tracks.find(t => t.id === trackId);
    const trackName = track?.name || 'Unknown';
    
    const action = trackActions.muteTrack(trackId, muted, trackName, userId, userName);
    dispatch(action);
    sendMessage(ActionType.MUTE_TRACK, { trackId, muted });
  }, [state.tracks, getCurrentUser]);

  const soloTrack = useCallback((trackId: string, solo: boolean) => {
    const { userId, userName } = getCurrentUser();
    const track = state.tracks.find(t => t.id === trackId);
    const trackName = track?.name || 'Unknown';
    
    const action = trackActions.soloTrack(trackId, solo, trackName, userId, userName);
    dispatch(action);
    sendMessage(ActionType.SOLO_TRACK, { trackId, solo });
  }, [state.tracks, getCurrentUser]);

  const armTrack = useCallback((trackId: string, armed: boolean) => {
    const { userId, userName } = getCurrentUser();
    const track = state.tracks.find(t => t.id === trackId);
    const trackName = track?.name || 'Unknown';
    
    const action = trackActions.armTrack(trackId, armed, trackName, userId, userName);
    dispatch(action);
    sendMessage(ActionType.ARM_TRACK, { trackId, armed });
  }, [state.tracks, getCurrentUser]);

  const lockTrack = useCallback((trackId: string) => {
    const { userId, userName } = getCurrentUser();
    const track = state.tracks.find(t => t.id === trackId);
    const trackName = track?.name || 'Unknown';
    
    const action = trackActions.lockTrack(trackId, trackName, userId, userName);
    dispatch(action);
    sendMessage(ActionType.LOCK_TRACK, { trackId, userId });
    webSocketService.lockTrack(trackId);
  }, [state.tracks, getCurrentUser]);

  const unlockTrack = useCallback((trackId: string) => {
    const { userId, userName } = getCurrentUser();
    const track = state.tracks.find(t => t.id === trackId);
    const trackName = track?.name || 'Unknown';
    
    const action = trackActions.unlockTrack(trackId, trackName, userId, userName);
    dispatch(action);
    sendMessage(ActionType.UNLOCK_TRACK, { trackId });
    webSocketService.unlockTrack(trackId);
  }, [state.tracks, getCurrentUser]);

  // Block Actions
  const addBlock = useCallback((blockData: Omit<Block, 'id'>) => {
    const { userId, userName } = getCurrentUser();
    const blockId = `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const block: Block = { id: blockId, ...blockData };
    const trackName = state.tracks[blockData.track]?.name || 'Unknown';
    
    const action = blockActions.addBlock(block, trackName, userId, userName);
    dispatch(action);
    sendMessage(ActionType.ADD_BLOCK, { block });
  }, [state.tracks, getCurrentUser]);

  const removeBlock = useCallback((blockId: string) => {
    const { userId, userName } = getCurrentUser();
    const block = state.blocks.find(b => b.id === blockId);
    const blockName = block?.name || 'Unknown';
    
    const action = blockActions.removeBlock(blockId, blockName, userId, userName);
    dispatch(action);
    sendMessage(ActionType.REMOVE_BLOCK, { blockId });
  }, [state.blocks, getCurrentUser]);

  const updateBlock = useCallback((blockId: string, updates: Partial<Block>) => {
    const { userId, userName } = getCurrentUser();
    const block = state.blocks.find(b => b.id === blockId);
    const blockName = block?.name || 'Unknown';
    
    const action = blockActions.updateBlock(blockId, updates, blockName, userId, userName);
    dispatch(action);
    sendMessage(ActionType.UPDATE_BLOCK, { blockId, ...updates });
  }, [state.blocks, getCurrentUser]);

  const moveBlock = useCallback((blockId: string, track: number, startBeat: number) => {
    const { userId, userName } = getCurrentUser();
    const block = state.blocks.find(b => b.id === blockId);
    const blockName = block?.name || 'Unknown';
    
    const action = blockActions.moveBlock(blockId, track, startBeat, blockName, userId, userName);
    dispatch(action);
    sendMessage(ActionType.MOVE_BLOCK, { blockId, trackId: track, startBeat });
  }, [state.blocks, getCurrentUser]);

  const resizeBlock = useCallback((blockId: string, lengthBeats: number) => {
    const { userId, userName } = getCurrentUser();
    const block = state.blocks.find(b => b.id === blockId);
    const blockName = block?.name || 'Unknown';
    
    const action = blockActions.resizeBlock(blockId, lengthBeats, blockName, userId, userName);
    dispatch(action);
    sendMessage(ActionType.RESIZE_BLOCK, { blockId, lengthBeats });
  }, [state.blocks, getCurrentUser]);

  const duplicateBlock = useCallback((blockId: string) => {
    const { userId, userName } = getCurrentUser();
    const block = state.blocks.find(b => b.id === blockId);
    if (!block) return;
    
    const newBlockId = `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newBlock = {
      ...block,
      id: newBlockId,
      startBeat: block.startBeat + block.lengthBeats,
      name: `${block.name} (copy)`
    };
    
    const action = blockActions.duplicateBlock(blockId, newBlock, userId, userName);
    dispatch(action);
    sendMessage(ActionType.DUPLICATE_BLOCK, { 
      originalBlockId: blockId,
      newBlockId: newBlockId,
      newStartBeat: newBlock.startBeat
    });
  }, [state.blocks, getCurrentUser]);

  const startEditingBlock = useCallback((blockId: string) => {
    const { userId, userName } = getCurrentUser();
    const block = state.blocks.find(b => b.id === blockId);
    const blockName = block?.name || 'Unknown';
    
    const action = blockActions.startEditingBlock(blockId, blockName, userId, userName);
    dispatch(action);
    sendMessage(ActionType.START_EDITING_BLOCK, { blockId });
  }, [state.blocks, getCurrentUser]);

  const endEditingBlock = useCallback((blockId: string) => {
    const { userId, userName } = getCurrentUser();
    const block = state.blocks.find(b => b.id === blockId);
    const blockName = block?.name || 'Unknown';
    
    const action = blockActions.endEditingBlock(blockId, blockName, userId, userName);
    dispatch(action);
    sendMessage(ActionType.END_EDITING_BLOCK, { blockId });
  }, [state.blocks, getCurrentUser]);

  // UI Actions
  const selectBlock = useCallback((blockId: string) => {
    const action = uiActions.selectBlock(blockId);
    dispatch(action);
  }, []);

  const deselectBlock = useCallback(() => {
    const action = uiActions.deselectBlock();
    dispatch(action);
  }, []);

  const setActiveTool = useCallback((tool: ToolType) => {
    const action = uiActions.setActiveTool(tool);
    dispatch(action);
  }, []);

  const setZoom = useCallback((pixelsPerBeat: number) => {
    const action = uiActions.setZoom(pixelsPerBeat);
    dispatch(action);
  }, []);

  const setScrollPosition = useCallback((horizontal: number, vertical: number) => {
    const action = uiActions.setScrollPosition(horizontal, vertical);
    dispatch(action);
  }, []);

  const toggleSettings = useCallback((open: boolean) => {
    const action = createProjectAction(
      ProjectActionType.TOGGLE_SETTINGS,
      { open },
      { trackable: false }
    );
    dispatch(action);
  }, []);

  // History Actions
  const toggleHistoryDrawer = useCallback((open: boolean) => {
    const action = createProjectAction<ToggleHistoryDrawerAction>(
      ProjectActionType.TOGGLE_HISTORY_DRAWER,
      { open },
      { trackable: false }
    );
    dispatch(action);
  }, []);

  const restoreToTimestamp = useCallback((timestamp: number) => {
    const { userId, userName } = getCurrentUser();
    const action = createProjectAction<RestoreToTimestampAction>(
      ProjectActionType.RESTORE_TO_TIMESTAMP,
      { timestamp },
      {
        userId,
        userName,
        description: `Restored project to timestamp ${new Date(timestamp).toLocaleString()}`,
      }
    );
    dispatch(action);
    sendMessage(ActionType.RESTORE_TO_TIMESTAMP, { timestamp });
  }, [getCurrentUser]);

  // Legacy support functions for existing code
  const connectToProject = useCallback(async (projectId: string) => {
    try {
      webSocketService.connectToProject(projectId);
      
      // Update local state
      const action = createProjectAction(
        ProjectActionType.UPDATE_PROJECT_SETTINGS,
        { settings: { projectId } },
        { trackable: false }
      );
      dispatch(action);
    } catch (error) {
      console.error("Failed to connect to project:", error);
      throw error;
    }
  }, []);

  const disconnectFromProject = useCallback(() => {
    webSocketService.disconnectFromProject();
    
    // Reset project state
    const action = createProjectAction(
      ProjectActionType.LOAD_PROJECT,
      {
        id: null,
        name: null,
        bpm: 120,
        masterVolume: 80,
        settings: initialProjectState.project.settings,
        tracks: [],
        blocks: []
      },
      { trackable: false }
    );
    dispatch(action);
  }, []);

  const sendMessage = useCallback((action: ActionType, params: any): string => {
    return webSocketService.sendMessage(action, params);
  }, []);

  const sendGeneralMessage = useCallback((message: any) => {
    webSocketService.sendGeneralMessage(message);
  }, []);

  const updateUserName = useCallback((userName: string) => {
    const action = createProjectAction(
      ProjectActionType.UPDATE_USER_PRESENCE,
      { 
        userId: state.localUserId,
        userName,
        connected: state.isConnected
      },
      { trackable: false }
    );
    dispatch(action);
    
    webSocketService.updateUserName(userName);
  }, [state.localUserId, state.isConnected]);

  // Legacy state mappings
  const messageHistory: UserInteractionMessage[] = webSocketService.getMessageHistory();
  const historyVisible = state.historyVisible;
  const setHistoryVisible = toggleHistoryDrawer;
  const selectedHistoryIndex = state.selectedHistoryIndex;
  const setSelectedHistoryIndex = useCallback((index: number | null) => {
    const action = createProjectAction(
      ProjectActionType.ADD_HISTORY_ENTRY,
      {
        id: `selection-${Date.now()}`,
        timestamp: Date.now(),
        action: 'SELECT_HISTORY',
        description: `Selected history entry ${index}`,
        userId: state.localUserId,
        userName: state.localUserName,
        details: { selectedIndex: index }
      },
      { trackable: false }
    );
    dispatch(action);
  }, [state.localUserId, state.localUserName]);

  // WebSocket event handlers
  useEffect(() => {
    const handleConnected = (data: { userId: string, projectId: string }) => {
      const action = createProjectAction(
        ProjectActionType.UPDATE_USER_PRESENCE,
        {
          userId: data.userId,
          connected: true
        },
        { trackable: false }
      );
      dispatch(action);
    };
    
    const handlePresenceSync = (presenceState: any) => {
      const collaborators = Object.values(presenceState)
        .flat()
        .filter((user: any) => user.userId !== state.localUserId)
        .map((user: any) => ({
          id: user.userId,
          name: user.userName || 'Anonymous',
          color: generateUserColor(user.userId),
          position: { x: 0, y: 0 }
        }));
      
      // Update remote users
      collaborators.forEach((user: any) => {
        const action = createProjectAction(
          ProjectActionType.USER_JOINED,
          {
            userId: user.id,
            userName: user.name,
            color: user.color,
            position: user.position
          },
          { trackable: false }
        );
        dispatch(action);
      });
    };
    
    const handleCursorMove = (data: any) => {
      if (data.userId === state.localUserId) return;
      
      const action = createProjectAction(
        ProjectActionType.UPDATE_USER_PRESENCE,
        {
          userId: data.userId,
          position: { x: data.x, y: data.y }
        },
        { trackable: false }
      );
      dispatch(action);
    };
    
    const handleConnectionStatusChanged = (data: { status: 'connecting' | 'connected' | 'disconnected' }) => {
      const action = createProjectAction(
        ProjectActionType.UPDATE_USER_PRESENCE,
        {
          userId: state.localUserId,
          connected: data.status === 'connected'
        },
        { trackable: false }
      );
      dispatch(action);
    };
    
    webSocketService.on('connected', handleConnected);
    webSocketService.on('presenceSync', handlePresenceSync);
    webSocketService.on('cursorMove', handleCursorMove);
    webSocketService.on('connectionStatusChanged', handleConnectionStatusChanged);
    
    return () => {
      webSocketService.off('connected', handleConnected);
      webSocketService.off('presenceSync', handlePresenceSync);
      webSocketService.off('cursorMove', handleCursorMove);
      webSocketService.off('connectionStatusChanged', handleConnectionStatusChanged);
    };
  }, [state.localUserId]);

  // Helper function to generate user colors
  const generateUserColor = (userId: string): string => {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = userId.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash) % 360;
    return `hsl(${hue}, 70%, 65%)`;
  };

  const contextValue: ProjectContextType = {
    // State
    state,
    
    // Project Management
    loadProject,
    setProjectLoading,
    setProjectError,
    updateProjectSettings,
    
    // Playback Actions
    play,
    pause,
    restart,
    setCurrentBeat,
    setBpm,
    setMasterVolume,
    
    // Track Actions
    addTrack,
    removeTrack,
    renameTrack,
    setTrackVolume,
    muteTrack,
    soloTrack,
    armTrack,
    lockTrack,
    unlockTrack,
    
    // Block Actions
    addBlock,
    removeBlock,
    updateBlock,
    moveBlock,
    resizeBlock,
    duplicateBlock,
    startEditingBlock,
    endEditingBlock,
    
    // UI Actions
    selectBlock,
    deselectBlock,
    setActiveTool,
    setZoom,
    setScrollPosition,
    toggleSettings,
    
    // History Actions
    toggleHistoryDrawer,
    restoreToTimestamp,
    
    // Legacy support
    connectToProject,
    disconnectFromProject,
    sendMessage,
    messageHistory,
    historyVisible,
    setHistoryVisible,
    selectedHistoryIndex,
    setSelectedHistoryIndex,
    updateUserName,
    sendGeneralMessage,
  };

  return (
    <ProjectContext.Provider value={contextValue}>
      {children}
    </ProjectContext.Provider>
  );
};

export const useProject = (): ProjectContextType => {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
};

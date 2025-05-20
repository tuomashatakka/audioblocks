import React, { createContext, useContext, useReducer, useEffect, useState, useCallback } from 'react';
import WebSocketService from '@/utils/WebSocketService';
import { supabase } from '@/integrations/supabase/client';
import { 
  ActionType,
  ProjectState,
  UserInteractionMessage,
  DispatchProcessStatus,
  TrackInfo,
  BlockInfo,
  MarkerInfo,
  ProjectHistoryEntry,
  FilePayload
} from '@/types/collaborative';
import { toast } from '@/hooks/use-toast';

// Initial state
const initialProjectState: ProjectState = {
  id: '',
  name: 'Untitled Project',
  bpm: 120,
  tracks: {},
  blocks: {},
  markers: {},
  masterVolume: 80,
  settings: {
    snapToGrid: true,
    gridSize: 1,
    autoSave: true,
    showCollaborators: true,
    theme: 'dark',
    userName: ''
  },
  assets: {},
  users: {},
  history: [],
  localUserId: '' // Initialize with empty string
};

// Action types for the reducer
type ProjectAction = 
  | { type: 'SET_PROJECT'; payload: ProjectState }
  | { type: 'UPDATE_TRACKS'; payload: Record<string, TrackInfo> }
  | { type: 'UPDATE_BLOCKS'; payload: Record<string, BlockInfo> }
  | { type: 'UPDATE_MARKERS'; payload: Record<string, MarkerInfo> }
  | { type: 'SET_BPM'; payload: number }
  | { type: 'SET_MASTER_VOLUME'; payload: number }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<ProjectState['settings']> }
  | { type: 'ADD_HISTORY_ENTRY'; payload: ProjectHistoryEntry }
  | { type: 'RESTORE_FROM_HISTORY'; payload: number }
  | { type: 'SET_LOCAL_USER_ID'; payload: string } // Add this action type
  | { type: 'CLEAR_HISTORY' };

// Reducer function
const projectReducer = (state: ProjectState, action: ProjectAction): ProjectState => {
  switch (action.type) {
    case 'SET_PROJECT':
      return action.payload;
    
    case 'UPDATE_TRACKS':
      return {
        ...state,
        tracks: {
          ...state.tracks,
          ...action.payload
        }
      };
    
    case 'UPDATE_BLOCKS':
      return {
        ...state,
        blocks: {
          ...state.blocks,
          ...action.payload
        }
      };
    
    case 'UPDATE_MARKERS':
      return {
        ...state,
        markers: {
          ...state.markers,
          ...action.payload
        }
      };
    
    case 'SET_BPM':
      return {
        ...state,
        bpm: action.payload
      };
    
    case 'SET_MASTER_VOLUME':
      return {
        ...state,
        masterVolume: action.payload
      };
    
    case 'UPDATE_SETTINGS':
      return {
        ...state,
        settings: {
          ...state.settings,
          ...action.payload
        }
      };
    
    case 'ADD_HISTORY_ENTRY':
      return {
        ...state,
        history: [...state.history, action.payload]
      };
    
    case 'RESTORE_FROM_HISTORY':
      // Here we would actually restore the state from history
      // This is simplified - a real implementation would reconstruct state
      // by replaying messages up to the timestamp
      return {
        ...state
      };
    
    case 'SET_LOCAL_USER_ID':
      return {
        ...state,
        localUserId: action.payload
      };
    
    case 'CLEAR_HISTORY':
      return {
        ...state,
        history: []
      };
    
    default:
      return state;
  }
};

// Context interface
interface ProjectContextType {
  state: ProjectState;
  dispatch: React.Dispatch<ProjectAction>;
  sendMessage: (action: ActionType, params: any, filePayload?: FilePayload) => string;
  uploadFile: (file: File, onProgress?: (progress: number) => void) => Promise<string>;
  historyVisible: boolean;
  setHistoryVisible: (visible: boolean) => void;
  restoreToTimestamp: (timestamp: number) => void;
  selectedHistoryIndex: number | null;
  setSelectedHistoryIndex: (index: number | null) => void;
  lockTrack: (trackId: string) => void;
  unlockTrack: (trackId: string) => void;
  updateUserName: (name: string) => void;
  getProjectFromSupabase: (projectId: string) => Promise<void>;
  saveProjectToSupabase: () => Promise<void>;
  createNewProject: (name: string, bpm: number) => Promise<string>;
}

// Create context
const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

// Provider component
export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(projectReducer, initialProjectState);
  const [webSocketService] = useState(() => WebSocketService.getInstance());
  const [historyVisible, setHistoryVisible] = useState(false);
  const [selectedHistoryIndex, setSelectedHistoryIndex] = useState<number | null>(null);
  const [currentUsers, setCurrentUsers] = useState<Record<string, {userName: string, x: number, y: number}>>({});
  
  // Initialize project from localStorage or create new one
  useEffect(() => {
    const savedProject = localStorage.getItem('currentProject');
    if (savedProject) {
      try {
        const parsedProject = JSON.parse(savedProject);
        dispatch({ type: 'SET_PROJECT', payload: parsedProject });
        
        // Connect to project channel for realtime updates
        if (parsedProject.id) {
          webSocketService.connectToProject(parsedProject.id);
        }
      } catch (error) {
        console.error('Failed to load project from localStorage', error);
      }
    } else {
      // Create a new project
      const newProject: ProjectState = {
        ...initialProjectState,
        id: `project-${Date.now()}`
      };
      dispatch({ type: 'SET_PROJECT', payload: newProject });
    }
    
    // Set local user ID
    dispatch({ 
      type: 'SET_LOCAL_USER_ID', 
      payload: webSocketService.getLocalUserId() 
    });
    
    // Check for saved username in local storage
    const savedUserName = localStorage.getItem('userName');
    if (savedUserName) {
      dispatch({
        type: 'UPDATE_SETTINGS',
        payload: { userName: savedUserName }
      });
    }
    
    // Load history
    const history = webSocketService.getMessageHistory();
    history.forEach(message => {
      dispatch({
        type: 'ADD_HISTORY_ENTRY',
        payload: {
          ...message,
          userName: message.userId === webSocketService.getLocalUserId() ? 'You' : 'Collaborator',
          userColor: message.userId === webSocketService.getLocalUserId() ? '#FF466A' : '#60A5FA'
        }
      });
    });
    
    // Cleanup
    return () => {
      webSocketService.disconnectFromProject();
    };
  }, [webSocketService]);
  
  // Update username when changed
  const updateUserName = useCallback((name: string) => {
    if (name && name.trim()) {
      webSocketService.setLocalUserName(name);
      
      dispatch({
        type: 'UPDATE_SETTINGS',
        payload: { userName: name }
      });
      
      toast({
        title: "Username updated",
        description: `Your name is now set to "${name}"`,
      });
    }
  }, [webSocketService]);
  
  // Function to get project data from Supabase
  const getProjectFromSupabase = useCallback(async (projectId: string) => {
    try {
      // Get the project
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();
      
      if (projectError) throw projectError;
      
      if (!projectData) {
        toast({
          title: "Project not found",
          description: "The requested project could not be found.",
          variant: "destructive",
        });
        return;
      }
      
      // Get the tracks
      const { data: tracksData, error: tracksError } = await supabase
        .from('tracks')
        .select('*')
        .eq('project_id', projectId);
      
      if (tracksError) throw tracksError;
      
      // Get the audio blocks
      const { data: blocksData, error: blocksError } = await supabase
        .from('audio_blocks')
        .select('*')
        .eq('project_id', projectId);
      
      if (blocksError) throw blocksError;
      
      // Transform the data into our state format
      const tracks: Record<string, TrackInfo> = {};
      tracksData?.forEach(track => {
        tracks[track.id] = {
          id: track.id,
          name: track.name,
          color: track.color,
          volume: track.volume,
          muted: track.muted,
          solo: track.solo,
          armed: track.armed,
          locked: track.locked,
          lockedByUser: track.locked_by_user_id,
          lockedByUserName: track.locked_by_name
        };
      });
      
      const blocks: Record<string, BlockInfo> = {};
      blocksData?.forEach(block => {
        blocks[block.id] = {
          id: block.id,
          name: block.name,
          trackId: block.track_id,
          startBeat: block.start_beat,
          lengthBeats: block.length_beats,
          volume: block.volume,
          pitch: block.pitch,
          fileId: block.file_id
        };
      });
      
      // Create a new project state
      const newProject: ProjectState = {
        id: projectData.id,
        name: projectData.name,
        bpm: projectData.bpm,
        masterVolume: projectData.master_volume,
        settings: projectData.settings,
        tracks,
        blocks,
        markers: {},
        assets: {},
        users: {},
        history: [],
        localUserId: webSocketService.getLocalUserId()
      };
      
      // Update the state
      dispatch({ type: 'SET_PROJECT', payload: newProject });
      
      // Save to local storage
      localStorage.setItem('currentProject', JSON.stringify(newProject));
      
      // Connect to the project channel
      webSocketService.connectToProject(projectId);
      
      toast({
        title: "Project loaded",
        description: `Project "${projectData.name}" has been loaded.`,
      });
    } catch (error) {
      console.error('Error loading project from Supabase:', error);
      toast({
        title: "Error loading project",
        description: "There was an error loading the project. Please try again.",
        variant: "destructive",
      });
    }
  }, [webSocketService]);
  
  // Function to save project to Supabase
  const saveProjectToSupabase = useCallback(async () => {
    if (!state.id) return;
    
    try {
      // Save the project
      const { error: projectError } = await supabase
        .from('projects')
        .upsert({
          id: state.id,
          name: state.name,
          bpm: state.bpm,
          master_volume: state.masterVolume,
          settings: state.settings,
          updated_at: new Date().toISOString()
        });
      
      if (projectError) throw projectError;
      
      // Save all tracks
      const trackPromises = Object.values(state.tracks).map(track => {
        return supabase
          .from('tracks')
          .upsert({
            id: track.id,
            project_id: state.id,
            name: track.name,
            color: track.color,
            volume: track.volume,
            muted: track.muted,
            solo: track.solo,
            armed: track.armed || false,
            locked: track.locked || false,
            locked_by_user_id: track.lockedByUser || null,
            locked_by_name: track.lockedByUserName || null,
            updated_at: new Date().toISOString()
          });
      });
      
      await Promise.all(trackPromises);
      
      // Save all blocks
      const blockPromises = Object.values(state.blocks).map(block => {
        return supabase
          .from('audio_blocks')
          .upsert({
            id: block.id,
            project_id: state.id,
            track_id: block.trackId,
            name: block.name,
            start_beat: block.startBeat,
            length_beats: block.lengthBeats,
            volume: block.volume,
            pitch: block.pitch,
            file_id: block.fileId || null,
            updated_at: new Date().toISOString()
          });
      });
      
      await Promise.all(blockPromises);
      
      toast({
        title: "Project saved",
        description: "Your project has been saved to the database.",
      });
    } catch (error) {
      console.error('Error saving project to Supabase:', error);
      toast({
        title: "Error saving project",
        description: "There was an error saving the project. Please try again.",
        variant: "destructive",
      });
    }
  }, [state]);
  
  // Function to create a new project
  const createNewProject = useCallback(async (name: string, bpm: number): Promise<string> => {
    try {
      // Create the project in Supabase
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .insert({
          name,
          bpm,
          settings: {
            snapToGrid: true,
            gridSize: 1,
            autoSave: true,
            showCollaborators: true,
            theme: 'dark',
            userName: webSocketService.getLocalUserName()
          }
        })
        .select()
        .single();
      
      if (projectError) throw projectError;
      
      // Create a new project state
      const newProject: ProjectState = {
        id: projectData.id,
        name: projectData.name,
        bpm: projectData.bpm,
        masterVolume: projectData.master_volume || 80,
        settings: projectData.settings,
        tracks: {},
        blocks: {},
        markers: {},
        assets: {},
        users: {},
        history: [],
        localUserId: webSocketService.getLocalUserId()
      };
      
      // Update the state
      dispatch({ type: 'SET_PROJECT', payload: newProject });
      
      // Save to local storage
      localStorage.setItem('currentProject', JSON.stringify(newProject));
      
      // Connect to the project channel
      webSocketService.connectToProject(projectData.id);
      
      toast({
        title: "Project created",
        description: `Project "${name}" has been created.`,
      });
      
      return projectData.id;
    } catch (error) {
      console.error('Error creating project in Supabase:', error);
      toast({
        title: "Error creating project",
        description: "There was an error creating the project. Please try again.",
        variant: "destructive",
      });
      return '';
    }
  }, [webSocketService]);
  
  // Save project to localStorage when it changes
  useEffect(() => {
    if (state.id) {
      localStorage.setItem('currentProject', JSON.stringify(state));
      
      // If autoSave is enabled, also save to Supabase
      if (state.settings.autoSave) {
        saveProjectToSupabase();
      }
    }
  }, [state, saveProjectToSupabase]);
  
  // WebSocket event handlers for realtime updates
  useEffect(() => {
    // Handle cursor movements from other users
    const handleCursorMove = (data: any) => {
      setCurrentUsers(prev => ({
        ...prev,
        [data.userId]: {
          userName: data.userName,
          x: data.x,
          y: data.y
        }
      }));
    };
    
    // Handle user presence syncing
    const handlePresenceSync = (state: any) => {
      const users: Record<string, any> = {};
      Object.keys(state).forEach(key => {
        const userPresence = state[key][0];
        if (userPresence && userPresence.userId !== webSocketService.getLocalUserId()) {
          users[userPresence.userId] = {
            userName: userPresence.userName,
            x: 0,
            y: 0
          };
        }
      });
      
      setCurrentUsers(users);
    };
    
    // Handle user joining
    const handlePresenceJoin = ({ newPresences }: any) => {
      if (newPresences && newPresences.length > 0) {
        const userPresence = newPresences[0];
        if (userPresence.userId !== webSocketService.getLocalUserId()) {
          toast({
            title: "User joined",
            description: `${userPresence.userName} joined the project.`,
          });
        }
      }
    };
    
    // Handle user leaving
    const handlePresenceLeave = ({ leftPresences }: any) => {
      if (leftPresences && leftPresences.length > 0) {
        const userPresence = leftPresences[0];
        setCurrentUsers(prev => {
          const newUsers = { ...prev };
          delete newUsers[userPresence.userId];
          return newUsers;
        });
        
        toast({
          title: "User left",
          description: `${userPresence.userName} left the project.`,
        });
      }
    };
    
    // Register event listeners for cursor movement and presence
    webSocketService.on('cursorMove', handleCursorMove);
    webSocketService.on('presenceSync', handlePresenceSync);
    webSocketService.on('presenceJoin', handlePresenceJoin);
    webSocketService.on('presenceLeave', handlePresenceLeave);
    
    // Register Supabase event listeners for realtime updates
    const tracksChannel = supabase
      .channel('tracks-changes')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'tracks'
      }, payload => {
        const track = payload.new as any;
        
        // Ignore our own updates
        if (track.locked_by_user_id === webSocketService.getLocalUserId()) {
          return;
        }
        
        // Update the track in our state
        const updatedTrack: TrackInfo = {
          id: track.id,
          name: track.name,
          color: track.color,
          volume: track.volume,
          muted: track.muted,
          solo: track.solo,
          armed: track.armed,
          locked: track.locked,
          lockedByUser: track.locked_by_user_id,
          lockedByUserName: track.locked_by_name
        };
        
        dispatch({
          type: 'UPDATE_TRACKS',
          payload: { [track.id]: updatedTrack }
        });
        
        // Show toast if track was locked/unlocked by another user
        if (track.locked && track.locked_by_user_id) {
          toast({
            title: "Track locked",
            description: `"${track.name}" is now locked by ${track.locked_by_name}.`,
          });
        } else if (payload.old && (payload.old as any).locked && !track.locked) {
          toast({
            title: "Track unlocked",
            description: `"${track.name}" is now unlocked.`,
          });
        }
      })
      .subscribe();
    
    const blocksChannel = supabase
      .channel('blocks-changes')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'audio_blocks'
      }, payload => {
        const block = payload.new as any;
        
        // Update the block in our state
        const updatedBlock: BlockInfo = {
          id: block.id,
          name: block.name,
          trackId: block.track_id,
          startBeat: block.start_beat,
          lengthBeats: block.length_beats,
          volume: block.volume,
          pitch: block.pitch,
          fileId: block.file_id
        };
        
        dispatch({
          type: 'UPDATE_BLOCKS',
          payload: { [block.id]: updatedBlock }
        });
      })
      .subscribe();
    
    // Handle WebSocket messages
    const handleMessage = (message: UserInteractionMessage) => {
      // Add to history
      dispatch({
        type: 'ADD_HISTORY_ENTRY',
        payload: {
          ...message,
          userName: message.userId === webSocketService.getLocalUserId() ? 'You' : 'Collaborator',
          userColor: message.userId === webSocketService.getLocalUserId() ? '#FF466A' : '#60A5FA'
        }
      });
      
      // Process message based on action type
      switch (message.action) {
        case ActionType.UPDATE_TRACK:
          if (message.params.trackId) {
            const { trackId, ...trackChanges } = message.params;
            const updatedTrack = {
              ...state.tracks[trackId],
              ...trackChanges
            };
            dispatch({
              type: 'UPDATE_TRACKS',
              payload: { [trackId]: updatedTrack }
            });
          }
          break;
        
        // Handle track locking
        case ActionType.LOCK_TRACK:
          if (message.params.trackId) {
            const { trackId, userId, userName } = message.params;
            const updatedTrack = {
              ...state.tracks[trackId],
              locked: true,
              lockedByUser: userId,
              lockedByUserName: userName
            };
            dispatch({
              type: 'UPDATE_TRACKS',
              payload: { [trackId]: updatedTrack }
            });
            
            // Show toast if locked by another user
            if (userId !== webSocketService.getLocalUserId()) {
              toast({
                title: "Track locked",
                description: `"${updatedTrack.name}" is now locked by ${userName}.`,
              });
            }
          }
          break;
        
        // Handle track unlocking
        case ActionType.UNLOCK_TRACK:
          if (message.params.trackId) {
            const { trackId } = message.params;
            const updatedTrack = {
              ...state.tracks[trackId],
              locked: false,
              lockedByUser: undefined,
              lockedByUserName: undefined
            };
            dispatch({
              type: 'UPDATE_TRACKS',
              payload: { [trackId]: updatedTrack }
            });
            
            // Show toast if unlocked by another user
            if (message.userId !== webSocketService.getLocalUserId()) {
              toast({
                title: "Track unlocked",
                description: `"${updatedTrack.name}" is now unlocked.`,
              });
            }
          }
          break;
        
        // ... keep existing code (other action handling)
        case ActionType.ADD_TRACK:
          if (message.params.track) {
            const newTrack = message.params.track as TrackInfo;
            dispatch({
              type: 'UPDATE_TRACKS',
              payload: { [newTrack.id]: newTrack }
            });
          }
          break;
        
        case ActionType.REMOVE_TRACK:
          if (message.params.trackId) {
            const updatedTracks = { ...state.tracks };
            delete updatedTracks[message.params.trackId];
            dispatch({
              type: 'UPDATE_TRACKS',
              payload: updatedTracks
            });
          }
          break;
        
        case ActionType.UPDATE_BLOCK:
        case ActionType.MOVE_BLOCK:
        case ActionType.RESIZE_BLOCK:
          if (message.params.blockId) {
            const { blockId, ...blockChanges } = message.params;
            const updatedBlock = {
              ...state.blocks[blockId],
              ...blockChanges
            };
            dispatch({
              type: 'UPDATE_BLOCKS',
              payload: { [blockId]: updatedBlock }
            });
          }
          break;
        
        case ActionType.ADD_BLOCK:
          if (message.params.block) {
            const newBlock = message.params.block as BlockInfo;
            dispatch({
              type: 'UPDATE_BLOCKS',
              payload: { [newBlock.id]: newBlock }
            });
          }
          break;
        
        case ActionType.REMOVE_BLOCK:
          if (message.params.blockId) {
            const updatedBlocks = { ...state.blocks };
            delete updatedBlocks[message.params.blockId];
            dispatch({
              type: 'UPDATE_BLOCKS',
              payload: updatedBlocks
            });
          }
          break;
        
        case ActionType.ADD_MARKER:
          if (message.params.marker) {
            const newMarker = message.params.marker as MarkerInfo;
            dispatch({
              type: 'UPDATE_MARKERS',
              payload: { [newMarker.id]: newMarker }
            });
          }
          break;
        
        case ActionType.UPDATE_MARKER:
          if (message.params.markerId) {
            const { markerId, ...markerChanges } = message.params;
            const updatedMarker = {
              ...state.markers[markerId],
              ...markerChanges
            };
            dispatch({
              type: 'UPDATE_MARKERS',
              payload: { [markerId]: updatedMarker }
            });
          }
          break;
        
        case ActionType.REMOVE_MARKER:
          if (message.params.markerId) {
            const updatedMarkers = { ...state.markers };
            delete updatedMarkers[message.params.markerId];
            dispatch({
              type: 'UPDATE_MARKERS',
              payload: updatedMarkers
            });
          }
          break;
        
        case ActionType.CHANGE_BPM:
          if (typeof message.params.bpm === 'number') {
            dispatch({ type: 'SET_BPM', payload: message.params.bpm });
          }
          break;
        
        case ActionType.UPDATE_SETTINGS:
          dispatch({ type: 'UPDATE_SETTINGS', payload: message.params });
          break;
      }
    };
    
    const handleRollback = (timestamp: number) => {
      restoreToTimestamp(timestamp);
    };
    
    // Register event listeners
    webSocketService.on('message', handleMessage);
    webSocketService.on('rollback', handleRollback);
    
    // Cleanup
    return () => {
      webSocketService.off('message', handleMessage);
      webSocketService.off('rollback', handleRollback);
      webSocketService.off('cursorMove', handleCursorMove);
      webSocketService.off('presenceSync', handlePresenceSync);
      webSocketService.off('presenceJoin', handlePresenceJoin);
      webSocketService.off('presenceLeave', handlePresenceLeave);
      supabase.removeChannel(tracksChannel);
      supabase.removeChannel(blocksChannel);
    };
  }, [state, webSocketService]);
  
  // Function to send messages via WebSocket
  const sendMessage = useCallback((action: ActionType, params: any, filePayload?: FilePayload): string => {
    return webSocketService.sendMessage(action, params, filePayload);
  }, [webSocketService]);
  
  // Function to lock a track
  const lockTrack = useCallback((trackId: string) => {
    if (state.tracks[trackId].locked) {
      toast({
        title: "Track already locked",
        description: `"${state.tracks[trackId].name}" is already locked by ${state.tracks[trackId].lockedByUserName || 'someone else'}.`,
        variant: "destructive",
      });
      return;
    }
    
    webSocketService.lockTrack(trackId);
    
    // Update local state immediately
    const updatedTrack = {
      ...state.tracks[trackId],
      locked: true,
      lockedByUser: webSocketService.getLocalUserId(),
      lockedByUserName: webSocketService.getLocalUserName()
    };
    
    dispatch({
      type: 'UPDATE_TRACKS',
      payload: { [trackId]: updatedTrack }
    });
    
    toast({
      title: "Track locked",
      description: `You have locked "${state.tracks[trackId].name}".`,
    });
  }, [state.tracks, webSocketService]);
  
  // Function to unlock a track
  const unlockTrack = useCallback((trackId: string) => {
    // Only allow unlocking if the user is the one who locked it
    if (
      state.tracks[trackId].locked && 
      state.tracks[trackId].lockedByUser !== webSocketService.getLocalUserId()
    ) {
      toast({
        title: "Cannot unlock track",
        description: `This track is locked by ${state.tracks[trackId].lockedByUserName || 'someone else'}.`,
        variant: "destructive",
      });
      return;
    }
    
    webSocketService.unlockTrack(trackId);
    
    // Update local state immediately
    const updatedTrack = {
      ...state.tracks[trackId],
      locked: false,
      lockedByUser: undefined,
      lockedByUserName: undefined
    };
    
    dispatch({
      type: 'UPDATE_TRACKS',
      payload: { [trackId]: updatedTrack }
    });
    
    toast({
      title: "Track unlocked",
      description: `You have unlocked "${state.tracks[trackId].name}".`,
    });
  }, [state.tracks, webSocketService]);
  
  // Function to upload a file
  const uploadFile = useCallback(async (file: File, onProgress?: (progress: number) => void): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      const transferId = `file-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const chunkSize = 1024 * 1024; // 1MB chunks
      const totalChunks = Math.ceil(file.size / chunkSize);
      let currentChunk = 0;
      
      // Send initial file upload message
      sendMessage(
        ActionType.INITIATE_FILE_UPLOAD, 
        {
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          transferId
        }
      );
      
      const readNextChunk = () => {
        if (currentChunk >= totalChunks) {
          // All chunks sent
          webSocketService.completeFileUpload(transferId, file.name, file.type, file.size);
          resolve(transferId);
          return;
        }
        
        const start = currentChunk * chunkSize;
        const end = Math.min(start + chunkSize, file.size);
        const slice = file.slice(start, end);
        
        reader.onload = (e) => {
          if (e.target?.result instanceof ArrayBuffer) {
            webSocketService.sendFileChunk(
              transferId,
              currentChunk,
              totalChunks,
              e.target.result
            );
            
            currentChunk++;
            
            if (onProgress) {
              onProgress((currentChunk / totalChunks) * 100);
            }
            
            // Read the next chunk
            readNextChunk();
          }
        };
        
        reader.onerror = () => {
          reject(new Error('Error reading file'));
        };
        
        reader.readAsArrayBuffer(slice);
      };
      
      // Start reading chunks
      readNextChunk();
    });
  }, [sendMessage, webSocketService]);
  
  // Function to restore state to a particular timestamp
  const restoreToTimestamp = useCallback((timestamp: number) => {
    toast({
      title: "Restoring project state",
      description: "Rolling back to previous state...",
    });
    
    dispatch({ type: 'RESTORE_FROM_HISTORY', payload: timestamp });
    
    setSelectedHistoryIndex(null);
    setHistoryVisible(false);
  }, []);
  
  // Create context value
  const value = {
    state,
    dispatch,
    sendMessage,
    uploadFile,
    historyVisible,
    setHistoryVisible,
    restoreToTimestamp,
    selectedHistoryIndex,
    setSelectedHistoryIndex,
    lockTrack,
    unlockTrack,
    updateUserName,
    getProjectFromSupabase,
    saveProjectToSupabase,
    createNewProject
  };
  
  // Render providers
  return (
    <ProjectContext.Provider value={value}>
      {children}
      
      {/* Render remote user cursors */}
      {state.settings.showCollaborators && Object.entries(currentUsers).map(([userId, user]) => (
        <div 
          key={userId}
          className="remote-cursor"
          style={{
            position: 'absolute',
            left: `${user.x}px`,
            top: `${user.y}px`,
            zIndex: 9999,
            pointerEvents: 'none'
          }}
        >
          <div 
            style={{
              width: '16px',
              height: '16px',
              borderRadius: '50%',
              backgroundColor: '#60A5FA',
              transform: 'translate(-50%, -50%)'
            }}
          />
          <div 
            style={{
              position: 'absolute',
              top: '-24px',
              left: '8px',
              backgroundColor: '#60A5FA',
              color: 'white',
              padding: '2px 6px',
              borderRadius: '4px',
              fontSize: '12px',
              whiteSpace: 'nowrap'
            }}
          >
            {user.userName}
          </div>
        </div>
      ))}
    </ProjectContext.Provider>
  );
};

// Custom hook for using the context
export const useProject = (): ProjectContextType => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
};

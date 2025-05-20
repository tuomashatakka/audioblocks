import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import WebSocketService from '@/utils/WebSocketService';
import { ActionType, UserInteractionMessage } from '@/types/collaborative';

interface ProjectState {
  localUserId: string;
  localUserName: string;
  projectId: string | null;
  isConnected: boolean;
  collaborators: {
    id: string;
    name: string;
    color: string;
    position: { x: number; y: number };
  }[];
}

interface ProjectSettings {
  theme: 'light' | 'dark';
  snapToGrid: boolean;
  gridSize: number;
  autoSave: boolean;
  showCollaborators: boolean;
  [key: string]: string | number | boolean; // Index signature to allow additional properties
}

interface ProjectContextType {
  state: ProjectState;
  sendMessage: (action: ActionType, params: any) => string;
  connectToProject: (projectId: string) => Promise<void>;
  disconnectFromProject: () => void;
  messageHistory: UserInteractionMessage[];
  historyVisible: boolean;
  setHistoryVisible: (visible: boolean) => void;
  updateProjectSettings: (settings: Partial<ProjectSettings>) => Promise<void>;
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
  const [state, setState] = useState<ProjectState>({
    localUserId: webSocketService.getLocalUserId(),
    localUserName: webSocketService.getLocalUserName(),
    projectId: null,
    isConnected: false,
    collaborators: []
  });
  
  const [historyVisible, setHistoryVisible] = useState(false);
  
  useEffect(() => {
    const handleConnected = (data: { userId: string, projectId: string }) => {
      setState(prev => ({
        ...prev,
        isConnected: true,
        projectId: data.projectId
      }));
    };
    
    const handlePresenceSync = (presenceState: any) => {
      const collaborators = Object.values(presenceState)
        .flat()
        .filter((user: any) => user.userId !== state.localUserId)
        .map((user: any) => ({
          id: user.userId,
          name: user.userName || 'Anonymous',
          color: getRandomColor(user.userId),
          position: { x: 0, y: 0 }
        }));
      
      setState(prev => ({
        ...prev,
        collaborators
      }));
    };
    
    const handleCursorMove = (data: any) => {
      if (data.userId === state.localUserId) return;
      
      setState(prev => {
        const updatedCollaborators = prev.collaborators.map(collab => {
          if (collab.id === data.userId) {
            return {
              ...collab,
              position: { x: data.x, y: data.y }
            };
          }
          return collab;
        });
        
        return {
          ...prev,
          collaborators: updatedCollaborators
        };
      });
    };
    
    webSocketService.on('connected', handleConnected);
    webSocketService.on('presenceSync', handlePresenceSync);
    webSocketService.on('cursorMove', handleCursorMove);
    
    return () => {
      webSocketService.off('connected', handleConnected);
      webSocketService.off('presenceSync', handlePresenceSync);
      webSocketService.off('cursorMove', handleCursorMove);
    };
  }, [state.localUserId]);
  
  const connectToProject = async (projectId: string) => {
    try {
      // Fetch project data from the database
      const projectData = await fetchProjectData(projectId);
      
      // Connect to the WebSocket channel for this project
      webSocketService.connectToProject(projectId);
      
      setState(prev => ({
        ...prev,
        projectId
      }));
    } catch (error) {
      console.error("Failed to connect to project:", error);
      throw error;
    }
  };
  
  const disconnectFromProject = () => {
    webSocketService.disconnectFromProject();
    setState(prev => ({
      ...prev,
      projectId: null,
      isConnected: false,
      collaborators: []
    }));
  };
  
  const sendMessage = (action: ActionType, params: any): string => {
    return webSocketService.sendMessage(action, params);
  };
  
  const updateProjectSettings = async (settings: Partial<ProjectSettings>) => {
    if (!state.projectId) {
      throw new Error("No project is currently active");
    }
    
    try {
      await updateSettings(state.projectId, settings as ProjectSettings);
      sendMessage(ActionType.UPDATE_SETTINGS, { settings });
    } catch (error) {
      console.error("Failed to update project settings:", error);
      throw error;
    }
  };
  
  return (
    <ProjectContext.Provider 
      value={{
        state,
        sendMessage,
        connectToProject,
        disconnectFromProject,
        messageHistory: webSocketService.getMessageHistory(),
        historyVisible,
        setHistoryVisible,
        updateProjectSettings
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
};

// Helper function to generate a consistent color based on user ID
const getRandomColor = (userId: string): string => {
  // Simple hash function to convert userId to a number
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Convert the hash to a color
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 70%, 65%)`;
};

export const useProject = (): ProjectContextType => {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
};

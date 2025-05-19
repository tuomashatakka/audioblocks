'use client'

import React, { createContext, useContext, useReducer, useEffect, useState, useCallback, useMemo } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useParams } from 'next/navigation'
import {
  ActionType,
  ProjectState,
  UserInteractionMessage,
  TrackInfo,
  BlockInfo,
  MarkerInfo,
  ProjectHistoryEntry,
  FilePayload
} from '@/types/collaborative'
import { toast } from '@/hooks/use-toast'

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
    theme: 'dark'
  },
  assets: {},
  users: {},
  history: [],
  localUserId: '',
  editingBlockId: null
}

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
  | { type: 'SET_LOCAL_USER_ID'; payload: string }
  | { type: 'SET_EDITING_BLOCK_ID'; payload: string | null }
  | { type: 'CLEAR_HISTORY' }

// Reducer function
const projectReducer = (state: ProjectState, action: ProjectAction): ProjectState => {
  switch (action.type) {
    case 'SET_PROJECT':
      return action.payload
    case 'UPDATE_TRACKS':
      return {
        ...state,
        tracks: {
          ...state.tracks,
          ...action.payload
        }
      }
    case 'UPDATE_BLOCKS':
      return {
        ...state,
        blocks: {
          ...state.blocks,
          ...action.payload
        }
      }
    case 'UPDATE_MARKERS':
      return {
        ...state,
        markers: {
          ...state.markers,
          ...action.payload
        }
      }
    case 'SET_BPM':
      return {
        ...state,
        bpm: action.payload
      }
    case 'SET_MASTER_VOLUME':
      return {
        ...state,
        masterVolume: action.payload
      }
    case 'UPDATE_SETTINGS':
      return {
        ...state,
        settings: {
          ...state.settings,
          ...action.payload
        }
      }
    case 'ADD_HISTORY_ENTRY':
      return {
        ...state,
        history: [...state.history, action.payload]
      }
    case 'RESTORE_FROM_HISTORY':
      // Here we would actually restore the state from history
      // This is simplified - a real implementation would reconstruct state
      // by replaying messages up to the timestamp
      return {
        ...state
      }
    case 'SET_LOCAL_USER_ID':
      return {
        ...state,
        localUserId: action.payload
      }
    case 'SET_EDITING_BLOCK_ID':
      return {
        ...state,
        editingBlockId: action.payload
      }
    case 'CLEAR_HISTORY':
      return {
        ...state,
        history: []
      }
    default:
      return state
  }
}

// Context interface
interface ProjectContextType {
  state: ProjectState;
  dispatch: React.Dispatch<ProjectAction>;
  sendMessage: (action: ActionType, params: any, filePayload?: FilePayload) => void;
  historyVisible: boolean;
  setHistoryVisible: (visible: boolean) => void;
  restoreToTimestamp: (timestamp: number) => void;
  selectedHistoryIndex: number | null;
  setSelectedHistoryIndex: (index: number | null) => void;
}

// Create context
const ProjectContext = createContext<ProjectContextType | undefined>(undefined)

// Provider component
export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const params = useParams<{ id?: string }>()
  const [state, dispatch] = useReducer(projectReducer, initialProjectState)
  const supabase = createClientComponentClient()
  const [historyVisible, setHistoryVisible] = useState(false)
  const [selectedHistoryIndex, setSelectedHistoryIndex] = useState<number | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)

  // Load project data from Supabase
  useEffect(() => {
    async function loadProject() {
      if (!params.id) return
      
      try {
        // Load project data
        const { data: projectData, error: projectError } = await supabase
          .schema('daw')
          .from('projects')
          .select('*')
          .eq('id', params.id)
          .single()
        
        if (projectError) throw projectError
        
        // Load tracks data
        const { data: tracksData, error: tracksError } = await supabase
          .schema('daw')
          .from('tracks')
          .select('*')
          .eq('project_id', params.id)
          .order('order', { ascending: true })
        
        if (tracksError) throw tracksError
        
        // Load blocks data
        const { data: blocksData, error: blocksError } = await supabase
          .schema('daw')
          .from('blocks')
          .select('*')
          .in('track_id', tracksData.map(track => track.id))
        
        if (blocksError) throw blocksError
        
        // Get user information
        const { data: { user } } = await supabase.auth.getUser()
        
        // Transform data into the state format
        const tracksById: Record<string, TrackInfo> = {}
        const blocksById: Record<string, BlockInfo> = {}
        
        // Process tracks
        tracksData.forEach(track => {
          tracksById[track.id] = {
            id: track.id,
            name: track.name,
            color: getTrackColor(track.order),
            volume: 75,
            muted: false,
            solo: false,
            armed: false
          }
        })
        
        // Process blocks
        blocksData.forEach(block => {
          blocksById[block.id] = {
            id: block.id,
            name: `Block ${blocksData.indexOf(block) + 1}`,
            trackId: block.track_id,
            startTime: block.start_time,
            endTime: block.end_time,
            audioUrl: block.audio_url || null
          }
        })
        
        // Set state
        dispatch({
          type: 'SET_PROJECT',
          payload: {
            ...initialProjectState,
            id: projectData.id,
            name: projectData.name,
            tracks: tracksById,
            blocks: blocksById,
            localUserId: user?.id || ''
          }
        })
        
        setIsInitialized(true)
      } catch (error) {
        console.error('Error loading project:', error)
        toast({
          title: 'Error',
          description: 'Failed to load project data',
          variant: 'destructive'
        })
      }
    }
    
    loadProject()
  }, [params.id, supabase])

  // Helper function to get track color
  function getTrackColor(index: number) {
    const colors = ['#FF466A', '#FFB446', '#64C850', '#5096FF']
    return colors[index % colors.length]
  }
  
  // Set up Supabase Realtime subscription
  useEffect(() => {
    if (!isInitialized || !params.id) return
    
    // Subscribe to project changes
    const channel = supabase
      .channel(`project-${params.id}`)
      .on('broadcast', { event: 'project-update' }, (payload) => {
        const message = payload.payload as UserInteractionMessage
        
        // Add to history
        dispatch({
          type: 'ADD_HISTORY_ENTRY',
          payload: {
            ...message,
            userName: message.userId === state.localUserId ? 'You' : 'Collaborator',
            userColor: message.userId === state.localUserId ? '#FF466A' : '#60A5FA'
          }
        })
        
        // Process message based on action type
        switch (message.action) {
          case ActionType.UPDATE_TRACK:
            if (message.params.trackId) {
              const { trackId, ...trackChanges } = message.params
              const updatedTrack = {
                ...state.tracks[trackId],
                ...trackChanges
              }
              dispatch({
                type: 'UPDATE_TRACKS',
                payload: { [trackId]: updatedTrack }
              })
            }
            break
            
          case ActionType.ADD_TRACK:
            if (message.params.track) {
              const newTrack = message.params.track as TrackInfo
              dispatch({
                type: 'UPDATE_TRACKS',
                payload: { [newTrack.id]: newTrack }
              })
            }
            break
            
          case ActionType.REMOVE_TRACK:
            if (message.params.trackId) {
              const updatedTracks = { ...state.tracks }
              delete updatedTracks[message.params.trackId]
              dispatch({
                type: 'UPDATE_TRACKS',
                payload: updatedTracks
              })
            }
            break
            
          case ActionType.START_EDITING_BLOCK:
            if (message.params.blockId) {
              dispatch({
                type: 'SET_EDITING_BLOCK_ID',
                payload: message.params.blockId
              })
            }
            break
            
          case ActionType.END_EDITING_BLOCK:
            dispatch({
              type: 'SET_EDITING_BLOCK_ID',
              payload: null
            })
            break
            
          case ActionType.UPDATE_BLOCK:
          case ActionType.MOVE_BLOCK:
          case ActionType.RESIZE_BLOCK:
            if (message.params.blockId) {
              const { blockId, ...blockChanges } = message.params
              const updatedBlock = {
                ...state.blocks[blockId],
                ...blockChanges
              }
              dispatch({
                type: 'UPDATE_BLOCKS',
                payload: { [blockId]: updatedBlock }
              })
            }
            break
            
          case ActionType.ADD_BLOCK:
            if (message.params.block) {
              const newBlock = message.params.block as BlockInfo
              dispatch({
                type: 'UPDATE_BLOCKS',
                payload: { [newBlock.id]: newBlock }
              })
            }
            break
            
          case ActionType.REMOVE_BLOCK:
            if (message.params.blockId) {
              const updatedBlocks = { ...state.blocks }
              delete updatedBlocks[message.params.blockId]
              dispatch({
                type: 'UPDATE_BLOCKS',
                payload: updatedBlocks
              })
            }
            break
            
          case ActionType.CHANGE_BPM:
            if (typeof message.params.bpm === 'number') {
              dispatch({ 
                type: 'SET_BPM', 
                payload: message.params.bpm 
              })
            }
            break
            
          case ActionType.SET_MASTER_VOLUME:
            if (typeof message.params.volume === 'number') {
              dispatch({ 
                type: 'SET_MASTER_VOLUME', 
                payload: message.params.volume 
              })
            }
            break
            
          case ActionType.UPDATE_SETTINGS:
            dispatch({ 
              type: 'UPDATE_SETTINGS', 
              payload: message.params 
            })
            break
        }
      })
      .subscribe()
    
    // Clean up subscription
    return () => {
      supabase.removeChannel(channel)
    }
  }, [isInitialized, params.id, state.localUserId, state.tracks, state.blocks, supabase])
  
  // Function to send messages
  const sendMessage = useCallback((action: ActionType, params: any, filePayload?: FilePayload) => {
    if (!params.id && params.id !== state.id) {
      params.id = state.id
    }
    
    const message: UserInteractionMessage = {
      action,
      params,
      timestamp: Date.now(),
      userId: state.localUserId
    }
    
    // Update local state first
    switch (action) {
      case ActionType.START_EDITING_BLOCK:
        dispatch({
          type: 'SET_EDITING_BLOCK_ID',
          payload: params.blockId
        })
        break
        
      case ActionType.END_EDITING_BLOCK:
        dispatch({
          type: 'SET_EDITING_BLOCK_ID',
          payload: null
        })
        break
        
      case ActionType.ADD_TRACK:
        if (params.track) {
          dispatch({
            type: 'UPDATE_TRACKS',
            payload: { [params.track.id]: params.track }
          })
        }
        break
    }
    
    // Add to history
    dispatch({
      type: 'ADD_HISTORY_ENTRY',
      payload: {
        ...message,
        userName: 'You',
        userColor: '#FF466A'
      }
    })
    
    // Broadcast to other clients
    if (params.id) {
      supabase
        .channel(`project-${params.id}`)
        .send({
          type: 'broadcast',
          event: 'project-update',
          payload: message
        })
    }
    
    // For actions that need to be persisted to the database
    if (
      action === ActionType.ADD_TRACK ||
      action === ActionType.REMOVE_TRACK ||
      action === ActionType.ADD_BLOCK ||
      action === ActionType.REMOVE_BLOCK ||
      action === ActionType.MOVE_BLOCK ||
      action === ActionType.RESIZE_BLOCK
    ) {
      persistChangesToDatabase(action, params)
    }
  }, [state.id, state.localUserId, supabase])
  
  // Persist changes to the database
  const persistChangesToDatabase = useCallback(async (action: ActionType, params: any) => {
    try {
      switch (action) {
        case ActionType.ADD_TRACK:
          if (params.track) {
            await supabase
              .schema('daw')
              .from('tracks')
              .insert({
                id: params.track.id,
                project_id: params.id || state.id,
                name: params.track.name,
                order: Object.keys(state.tracks).length
              })
          }
          break
          
        case ActionType.REMOVE_TRACK:
          if (params.trackId) {
            await supabase
              .schema('daw')
              .from('tracks')
              .delete()
              .eq('id', params.trackId)
          }
          break
          
        case ActionType.ADD_BLOCK:
          if (params.block) {
            await supabase
              .schema('daw')
              .from('blocks')
              .insert({
                id: params.block.id,
                track_id: params.block.trackId,
                start_time: params.block.startTime,
                end_time: params.block.endTime,
                audio_url: params.block.audioUrl
              })
          }
          break
          
        case ActionType.REMOVE_BLOCK:
          if (params.blockId) {
            await supabase
              .schema('daw')
              .from('blocks')
              .delete()
              .eq('id', params.blockId)
          }
          break
          
        case ActionType.MOVE_BLOCK:
          if (params.blockId && params.trackId !== undefined && params.startBeat !== undefined) {
            const block = state.blocks[params.blockId]
            if (block) {
              await supabase
                .schema('daw')
                .from('blocks')
                .update({
                  track_id: params.trackId,
                  start_time: params.startBeat,
                  end_time: params.startBeat + (block.endTime - block.startTime)
                })
                .eq('id', params.blockId)
            }
          }
          break
          
        case ActionType.RESIZE_BLOCK:
          if (params.blockId && params.lengthBeats !== undefined) {
            const block = state.blocks[params.blockId]
            if (block) {
              await supabase
                .schema('daw')
                .from('blocks')
                .update({
                  end_time: block.startTime + params.lengthBeats
                })
                .eq('id', params.blockId)
            }
          }
          break
      }
    } catch (error) {
      console.error('Error persisting changes to database:', error)
      toast({
        title: 'Error',
        description: 'Failed to save changes to the database',
        variant: 'destructive'
      })
    }
  }, [state.blocks, state.id, state.tracks, supabase])

  // Function to restore state to a particular timestamp
  const restoreToTimestamp = useCallback((timestamp: number) => {
    toast({
      title: 'Restoring project state',
      description: 'Rolling back to previous state...',
    })

    dispatch({ type: 'RESTORE_FROM_HISTORY', payload: timestamp })
    setSelectedHistoryIndex(null)
    setHistoryVisible(false)
  }, [])

  // Context value
  const value = useMemo(() => ({
    state,
    dispatch,
    sendMessage,
    historyVisible,
    setHistoryVisible,
    restoreToTimestamp,
    selectedHistoryIndex,
    setSelectedHistoryIndex
  }), [
    state,
    dispatch,
    sendMessage,
    historyVisible,
    setHistoryVisible,
    restoreToTimestamp,
    selectedHistoryIndex,
    setSelectedHistoryIndex
  ])

  // Render provider
  return (
    <ProjectContext.Provider value={value}>
      {children}
    </ProjectContext.Provider>
  )
}

// Custom hook for using the context
export const useProject = (): ProjectContextType => {
  const context = useContext(ProjectContext)
  if (!context) {
    throw new Error('useProject must be used within a ProjectProvider')
  }
  return context
}
import React, { createContext, useContext, useReducer, useEffect, useState, useCallback, useMemo } from 'react'
import WebSocketService from '@/utils/WebSocketService'
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
} from '@/types/collaborative'
import { toast } from '@/hooks/use-toast'

// Initial state
const initialProjectState: ProjectState = {
  id:           '',
  name:         'Untitled Project',
  bpm:          120,
  tracks:       {},
  blocks:       {},
  markers:      {},
  masterVolume: 80,
  settings:     {
    snapToGrid:        true,
    gridSize:          1,
    autoSave:          true,
    showCollaborators: true,
    theme:             'dark'
  },
  assets:      {},
  users:       {},
  history:     [],
  localUserId: '' // Initialize with empty string
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
  | { type: 'SET_LOCAL_USER_ID'; payload: string } // Add this action type
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
        history: [ ...state.history, action.payload ]
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
  state:                   ProjectState;
  dispatch:                React.Dispatch<ProjectAction>;
  sendMessage:             (action: ActionType, params: any, filePayload?: FilePayload) => string;
  uploadFile:              (file: File, onProgress?: (progress: number) => void) => Promise<string>;
  historyVisible:          boolean;
  setHistoryVisible:       (visible: boolean) => void;
  restoreToTimestamp:      (timestamp: number) => void;
  selectedHistoryIndex:    number | null;
  setSelectedHistoryIndex: (index: number | null) => void;
}

// Create context
const ProjectContext = createContext<ProjectContextType | undefined>(undefined)

// Provider component
export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [ state, dispatch ] = useReducer(projectReducer, initialProjectState)
  const [ webSocketService ] = useState(() => WebSocketService.getInstance())
  const [ historyVisible, setHistoryVisible ] = useState(false)
  const [ selectedHistoryIndex, setSelectedHistoryIndex ] = useState<number | null>(null)

  // Initialize project from localStorage or create new one
  useEffect(() => {
    const savedProject = localStorage.getItem('currentProject')
    if (savedProject)
      try {
        const parsedProject = JSON.parse(savedProject)
        dispatch({ type: 'SET_PROJECT', payload: parsedProject })
      }
      catch (error) {
        console.error('Failed to load project from localStorage', error)
      } else {
      // Create a new project
      const newProject: ProjectState = {
        ...initialProjectState,
        id: `project-${Date.now()}`
      }
      dispatch({ type: 'SET_PROJECT', payload: newProject })
    }

    // Set local user ID
    dispatch({
      type:    'SET_LOCAL_USER_ID',
      payload: webSocketService.getLocalUserId()
    })

    // Load history
    const history = webSocketService.getMessageHistory()
    history.forEach(message => {
      dispatch({
        type:    'ADD_HISTORY_ENTRY',
        payload: {
          ...message,
          userName:  message.userId === webSocketService.getLocalUserId() ? 'You' : 'Collaborator',
          userColor: message.userId === webSocketService.getLocalUserId() ? '#FF466A' : '#60A5FA'
        }
      })
    })
  }, [ webSocketService ])

  // Save project to localStorage when it changes
  useEffect(() => {
    if (state.id)
      localStorage.setItem('currentProject', JSON.stringify(state))
  }, [ state ])

  // WebSocket event listeners
  useEffect(() => {
    // eslint-disable-next-line complexity
    const handleMessage = (message: UserInteractionMessage) => {
      // Add to history
      dispatch({
        type:    'ADD_HISTORY_ENTRY',
        payload: {
          ...message,
          userName:  message.userId === webSocketService.getLocalUserId() ? 'You' : 'Collaborator',
          userColor: message.userId === webSocketService.getLocalUserId() ? '#FF466A' : '#60A5FA'
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
              type:    'UPDATE_TRACKS',
              payload: { [trackId]: updatedTrack }
            })
          }
          break
        case ActionType.ADD_TRACK:
          if (message.params.track) {
            const newTrack = message.params.track as TrackInfo
            dispatch({
              type:    'UPDATE_TRACKS',
              payload: { [newTrack.id]: newTrack }
            })
          }
          break
        case ActionType.REMOVE_TRACK:
          if (message.params.trackId) {
            const updatedTracks = { ...state.tracks }
            delete updatedTracks[message.params.trackId]
            dispatch({
              type:    'UPDATE_TRACKS',
              payload: updatedTracks
            })
          }
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
              type:    'UPDATE_BLOCKS',
              payload: { [blockId]: updatedBlock }
            })
          }
          break
        case ActionType.ADD_BLOCK:
          if (message.params.block) {
            const newBlock = message.params.block as BlockInfo
            dispatch({
              type:    'UPDATE_BLOCKS',
              payload: { [newBlock.id]: newBlock }
            })
          }
          break
        case ActionType.REMOVE_BLOCK:
          if (message.params.blockId) {
            const updatedBlocks = { ...state.blocks }
            delete updatedBlocks[message.params.blockId]
            dispatch({
              type:    'UPDATE_BLOCKS',
              payload: updatedBlocks
            })
          }
          break
        case ActionType.ADD_MARKER:
          if (message.params.marker) {
            const newMarker = message.params.marker as MarkerInfo
            dispatch({
              type:    'UPDATE_MARKERS',
              payload: { [newMarker.id]: newMarker }
            })
          }
          break
        case ActionType.UPDATE_MARKER:
          if (message.params.markerId) {
            const { markerId, ...markerChanges } = message.params
            const updatedMarker = {
              ...state.markers[markerId],
              ...markerChanges
            }
            dispatch({
              type:    'UPDATE_MARKERS',
              payload: { [markerId]: updatedMarker }
            })
          }
          break
        case ActionType.REMOVE_MARKER:
          if (message.params.markerId) {
            const updatedMarkers = { ...state.markers }
            delete updatedMarkers[message.params.markerId]
            dispatch({
              type:    'UPDATE_MARKERS',
              payload: updatedMarkers
            })
          }
          break
        case ActionType.CHANGE_BPM:
          if (typeof message.params.bpm === 'number')
            dispatch({ type: 'SET_BPM', payload: message.params.bpm })
          break
        case ActionType.UPDATE_SETTINGS:
          dispatch({ type: 'UPDATE_SETTINGS', payload: message.params })
          break

        // Handle other actions as needed
      }
    }

    const handleRollback = (timestamp: number) => {
      restoreToTimestamp(timestamp)
    }

    // Register event listeners
    webSocketService.on('message', handleMessage)
    webSocketService.on('rollback', handleRollback)

    // Cleanup
    return () => {
      webSocketService.off('message', handleMessage)
      webSocketService.off('rollback', handleRollback)
    }
  }, [ state, webSocketService ])

  // Function to send messages via WebSocket
  const sendMessage = useCallback((action: ActionType, params: any, filePayload?: FilePayload): string => webSocketService.sendMessage(action, params, filePayload), [ webSocketService ])

  // Function to upload a file
  const uploadFile = useCallback(async (file: File, onProgress?: (progress: number) => void): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader()
    const transferId = `file-${Date.now()}-${Math.random().toString(36)
      .substring(2, 9)}`
    const chunkSize = 1024 * 1024 // 1MB chunks
    const totalChunks = Math.ceil(file.size / chunkSize)
    let currentChunk = 0

    // Send initial file upload message
    sendMessage(
      ActionType.INITIATE_FILE_UPLOAD,
      {
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        transferId
      }
    )

    const readNextChunk = () => {
      if (currentChunk >= totalChunks) {
        // All chunks sent
        webSocketService.completeFileUpload(transferId, file.name, file.type, file.size)
        resolve(transferId)
        return
      }

      const start = currentChunk * chunkSize
      const end = Math.min(start + chunkSize, file.size)
      const slice = file.slice(start, end)

      reader.onload = e => {
        if (e.target?.result instanceof ArrayBuffer) {
          webSocketService.sendFileChunk(
            transferId,
            currentChunk,
            totalChunks,
            e.target.result
          )

          currentChunk++

          if (onProgress)
            onProgress(currentChunk / totalChunks * 100)

          // Read the next chunk
          readNextChunk()
        }
      }

      reader.onerror = () => {
        reject(new Error('Error reading file'))
      }

      reader.readAsArrayBuffer(slice)
    }

    // Start reading chunks
    readNextChunk()
  }), [ sendMessage, webSocketService ])

  // Function to restore state to a particular timestamp
  const restoreToTimestamp = useCallback((timestamp: number) => {
    toast({
      title:       'Restoring project state',
      description: 'Rolling back to previous state...',
    })

    dispatch({ type: 'RESTORE_FROM_HISTORY', payload: timestamp })

    setSelectedHistoryIndex(null)
    setHistoryVisible(false)
  }, [])

  const value = useMemo(() => ({
    state,
    dispatch,
    sendMessage,
    uploadFile,
    historyVisible,
    setHistoryVisible,
    restoreToTimestamp,
    selectedHistoryIndex,
    setSelectedHistoryIndex
  }), [state, dispatch, sendMessage, uploadFile, historyVisible, setHistoryVisible, restoreToTimestamp, selectedHistoryIndex, setSelectedHistoryIndex]);

  return <ProjectContext.Provider value={ value }>
    {children}
  </ProjectContext.Provider>
}

// Custom hook for using the context
export const useProject = (): ProjectContextType => {
  const context = useContext(ProjectContext)
  if (!context)
    throw new Error('useProject must be used within a ProjectProvider')
  return context
}

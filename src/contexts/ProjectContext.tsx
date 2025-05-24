import React, { createContext, useContext, useReducer, useEffect, ReactNode, useCallback } from 'react'
import { supabase } from '@/integrations/supabase/client'
import WebSocketService from '@/utils/WebSocketService'
import { getAudioSequenceService } from '@/utils/AudioSequenceService'
import { ActionType, GeneralMessage, UserInteractionMessage } from '@/types/collaborative'
import {
  ProjectState,
  ProjectHistoryEntry,
  Track,
  Block,
  ProjectSettings,
  TimelineMarker,
  initialProjectState,
  projectReducer,
  generateUserColor
} from './projectReducer'
import {
  ProjectActionType,
  playbackActions,
  trackActions,
  blockActions,
  createProjectAction,
  LoadProjectAction,
  SetProjectLoadingAction,
  SetProjectErrorAction,
  UpdateProjectSettingsAction,
  RestoreToTimestampAction,
  SelectBlockAction,
  DeselectBlockAction,
  SetActiveToolAction,
  SetZoomAction,
  SetScrollPositionAction,
  ToggleSettingsAction,
  ToggleHistoryDrawerAction,
  markerActions
} from './projectActions'
import { ToolType } from '@/components/ToolsMenu'
import { toast } from '@/hooks/use-toast'
import { RealtimePresenceState } from '@supabase/supabase-js'


interface ProjectContextType {
  // State
  state: ProjectState;

  // Project Management
  loadProject:           (projectData: object) => void;
  setProjectLoading:     (loading: boolean) => void;
  setProjectError:       (error: string | null) => void;
  updateProjectSettings: (settings: Partial<ProjectSettings>) => Promise<void>;

  // Playback Actions
  play:            () => void;
  pause:           () => void;
  restart:         () => void;
  setCurrentBeat:  (beat: number) => void;
  setBpm:          (bpm: number) => void;
  setMasterVolume: (volume: number) => void;

  // Track Actions
  addTrack:       (track: Omit<Track, 'id'>) => Promise<void>;
  removeTrack:    (trackId: string) => void;
  renameTrack:    (trackId: string, name: string) => void;
  setTrackVolume: (trackId: string, volume: number) => void;
  muteTrack:      (trackId: string, muted: boolean) => void;
  soloTrack:      (trackId: string, solo: boolean) => void;
  armTrack:       (trackId: string, armed: boolean) => void;
  lockTrack:      (trackId: string) => void;
  unlockTrack:    (trackId: string) => void;

  // Block Actions
  addBlock:          (block: Omit<Block, 'id'>) => void;
  removeBlock:       (blockId: string) => void;
  updateBlock:       (blockId: string, updates: Partial<Block>) => void;
  moveBlock:         (blockId: string, track: number, startBeat: number) => void;
  resizeBlock:       (blockId: string, lengthBeats: number) => void;
  duplicateBlock:    (blockId: string) => void;
  startEditingBlock: (blockId: string) => void;
  endEditingBlock:   (blockId: string) => void;

  // Audio File Actions
  uploadAudioFile: (file: File) => Promise<string | null>;
  deleteAudioFile: (blockId: string, fileId: string) => Promise<void>;

  // Marker Actions
  addMarker:    (marker: Omit<TimelineMarker, 'id' | 'projectId' | 'createdBy' | 'createdAt'>) => void;
  updateMarker: (markerId: string, changes: Partial<TimelineMarker>) => void;
  removeMarker: (markerId: string) => void;

  // UI Actions
  selectBlock:       (blockId: string) => void;
  deselectBlock:     () => void;
  setActiveTool:     (tool: ToolType) => void;
  setZoom:           (pixelsPerBeat: number) => void;
  setScrollPosition: (horizontal: number, vertical: number) => void;
  toggleSettings:    (open: boolean) => void;

  // History Actions
  toggleHistoryDrawer: (open: boolean) => void;
  restoreToTimestamp:  (timestamp: number) => void;

  // Legacy support for existing code
  connectToProject:        (projectId: string) => Promise<void>;
  disconnectFromProject:   () => void;
  sendMessage:             (action: ActionType, params: object) => string;
  messageHistory:          UserInteractionMessage[];
  historyVisible:          boolean;
  setHistoryVisible:       (visible: boolean) => void;
  selectedHistoryIndex:    number | null;
  setSelectedHistoryIndex: (index: number | null) => void;
  updateUserName:          (name: string) => void;
  sendGeneralMessage:      (message: unknown) => void;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined)

ProjectContext.displayName = 'Project context'

const webSocketService = WebSocketService.getInstance()

interface ProjectProviderProps {
  children: ReactNode;
}

// eslint-disable-next-line complexity
const fetchProjectData = async (projectId: string) => {
  try {
    const { data: projectData, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single()

    if (projectError)
      throw projectError

    // Parse settings JSON from the database
    let projectSettings: ProjectSettings = {
      theme:             'dark',
      snapToGrid:        true,
      gridSize:          1,
      autoSave:          true,
      showCollaborators: true
    }

    if (projectData.settings)
      try {
      // If settings is a string, parse it, otherwise use as is
        const parsedSettings = typeof projectData.settings === 'string'
          ? JSON.parse(projectData.settings)
          : projectData.settings

        projectSettings = {
          ...projectSettings, // Keep defaults
          ...parsedSettings // Override with stored settings
        }
      }
      catch (e) {
        console.error('Failed to parse project settings:', e)
      }

    // Fetch tracks
    const { data: tracksData, error: tracksError } = await supabase
      .from('tracks')
      .select('*')
      .eq('project_id', projectId)

    if (tracksError)
      throw tracksError

    // Fetch audio blocks
    const { data: blocksData, error: blocksError } = await supabase
      .from('audio_blocks')
      .select('*')
      .in('track_id', tracksData.map(track => track.id))

    if (blocksError)
      throw blocksError

    // Fetch timeline markers
    const { data: markersData, error: markersError } = await supabase
      .from('timeline_markers')
      .select('*')
      .eq('project_id', projectId)

    if (markersError)
      throw markersError

    // Transform the data to match the application structure
    const formattedTracks = tracksData.map(track => ({
      id:               track.id,
      name:             track.name,
      color:            track.color,
      volume:           track.volume,
      muted:            track.muted,
      solo:             track.solo,
      armed:            track.armed ?? false,
      locked:           track.locked ?? false,
      lockedByUser:     track.locked_by_user_id || null,
      lockedByUserName: track.locked_by_name || null
    }))

    const formattedBlocks = blocksData.map(block => ({
      id:          block.id,
      track:       formattedTracks.findIndex(track => track.id === block.track_id),
      startBeat:   block.start_beat,
      lengthBeats: block.length_beats,
      name:        block.name,
      volume:      block.volume,
      pitch:       block.pitch,
      fileId:      block.file_id
    }))

    const formattedMarkers = (markersData || []).map(marker => ({
      id:        marker.id,
      position:  marker.position,
      color:     marker.color,
      icon:      marker.icon,
      label:     marker.label,
      projectId: marker.project_id,
      createdBy: marker.created_by,
      createdAt: new Date(marker.created_at).getTime()
    }))

    return {
      project: {
        id:           projectData.id,
        name:         projectData.name,
        bpm:          projectData.bpm || 120,
        masterVolume: projectData.master_volume || 80,
        settings:     projectSettings
      },
      tracks:  formattedTracks || [],
      blocks:  formattedBlocks || [],
      markers: formattedMarkers || []
    }
  }
  catch (error) {
    console.error('Error fetching project data:', error)
    throw error
  }
}

type DataType = {
  name?:         string;
  bpm?:          number;
  masterVolume?: number;
  settings?:     ProjectSettings;
}

const updateProject = async (
  projectId: string,
  data: DataType
) => {
  try {
    const updateData: Record<string, unknown> = {}

    if (data.name !== undefined)
      updateData.name = data.name
    if (data.bpm !== undefined)
      updateData.bpm = data.bpm
    if (data.masterVolume !== undefined)
      updateData.master_volume = data.masterVolume
    if (data.settings !== undefined)
      updateData.settings = data.settings

    const { data: result, error } = await supabase
      .from('projects')
      .update(updateData)
      .eq('id', projectId)

    if (error)
      throw error
    return result
  }
  catch (error) {
    console.error('Error updating project:', error)
    throw error
  }
}

type DataType = {
  name:        string;
  startBeat:   number;
  lengthBeats: number;
  volume?:     number;
  pitch?:      number;
  fileId?:     string;
}

const createBlock = async (
  projectId: string,
  trackId: string,
  data: DataType
) => {
  try {
    const { data: result, error } = await supabase
      .from('audio_blocks')
      .insert({
        track_id:     trackId,
        name:         data.name,
        start_beat:   data.startBeat,
        length_beats: data.lengthBeats,
        volume:       data.volume || 1.0,
        pitch:        data.pitch || 0.0,
        file_id:      data.fileId
      })

    if (error)
      throw error
    return result
  }
  catch (error) {
    console.error('Error creating audio block:', error)
    throw error
  }
}

const updateSettings = async (projectId: string, settings: ProjectSettings) => {
  try {
    const { data: project, error: fetchError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single()

    if (fetchError)
      throw fetchError

    // Parse existing settings or use default
    let currentSettings: ProjectSettings = {
      theme:             'dark',
      snapToGrid:        true,
      gridSize:          1,
      autoSave:          true,
      showCollaborators: true
    }

    if (project.settings)
      try {
      // If settings is a string, parse it, otherwise use as is
        const parsedSettings = typeof project.settings === 'string'
          ? JSON.parse(project.settings)
          : project.settings

        currentSettings = {
          ...currentSettings,
          ...parsedSettings
        }
      }
      catch (e) {
        console.error('Failed to parse project settings:', e)
      }

    // Merge with new settings
    const updatedSettings: ProjectSettings = {
      ...currentSettings,
      ...settings
    }

    // Update the project with the new settings
    const { data: result, error: updateError } = await supabase
      .from('projects')
      .update({
        settings:      updatedSettings,
        bpm:           project.bpm || 120,
        master_volume: project.master_volume || 80
      })
      .eq('id', projectId)

    if (updateError)
      throw updateError
    return result
  }
  catch (error) {
    console.error('Error updating project settings:', error)
    throw error
  }
}

export const ProjectProvider = ({ children }: ProjectProviderProps) => {
  // Initialize state with user info from WebSocket service
  const [ state, dispatch ] = useReducer(projectReducer, {
    ...initialProjectState,
    localUserId:   webSocketService.getLocalUserId(),
    localUserName: webSocketService.getLocalUserName(),
  })

  // Helper function to get current user info
  const getCurrentUser = useCallback(() => ({
    userId:   state.localUserId,
    userName: state.localUserName,
  }), [ state.localUserId, state.localUserName ])

  const uploadAudioFile = useCallback(async (file: File) => {
    if (!state.project.id)
      return null

    try {
      const filePath = `audio/${state.project.id}/${file.name}`
      const { data, error } = await supabase.storage
        .from('project-audio')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert:       false
        })

      if (error) {
        console.error('Error uploading audio file:', error)
        return null
      }

      return data.path // Return the file path in storage
    }
    catch (error) {
      console.error('Unexpected error uploading audio:', error)
      return null
    }
  }, [ state.project.id ])

  const deleteAudioFile = useCallback(async (blockId: string, fileId: string) => {
    if (!state.project.id)
      return

    try {
      const filePath = `audio/${state.project.id}/${blockId}/${fileId}`
      const { error } = await supabase.storage
        .from('project-audio')
        .remove([ filePath ])

      if (error)
        console.error('Error deleting audio file:', error)
    }
    catch (error) {
      console.error('Unexpected error deleting audio:', error)
    }
  }, [ state.project.id ])

  // Project Management Actions
  const loadProject = useCallback((projectData: Record<string, string>) => {
    const action = createProjectAction<LoadProjectAction>(
      ProjectActionType.LOAD_PROJECT,
      {
        id:           projectData.id,
        name:         projectData.name,
        bpm:          projectData.bpm as unknown as number,
        masterVolume: projectData.masterVolume as unknown as number,
        settings:     projectData.settings as unknown as ProjectSettings,
        tracks:       projectData.tracks as unknown as Track[],
        blocks:       projectData.block as unknown as Block[]
      },
      { trackable: false }
    )
    dispatch(action)
  }, [])

  const setProjectLoading = useCallback((loading: boolean) => {
    const action = createProjectAction<SetProjectLoadingAction>(
      ProjectActionType.SET_PROJECT_LOADING,
      { loading },
      { trackable: false }
    )
    dispatch(action)
  }, [])

  const setProjectError = useCallback((error: string | null) => {
    const action = createProjectAction<SetProjectErrorAction>(
      ProjectActionType.SET_PROJECT_ERROR,
      { error },
      { trackable: false }
    )
    dispatch(action)
  }, [])

  const updateProjectSettings = useCallback(async (settings: ProjectSettings) => {
    if (!state.project.id)
      throw new Error('No project is currently active')

    try {
      const action = createProjectAction<UpdateProjectSettingsAction>(
        ProjectActionType.UPDATE_PROJECT_SETTINGS,
        { settings },
        {
          ...getCurrentUser(),
          description: `Updated project settings`,
        }
      )
      dispatch(action)

      sendMessage(ActionType.UPDATE_SETTINGS, { settings })
    }
    catch (error) {
      console.error('Failed to update project settings:', error)
      throw error
    }
  }, [ state.project.id, getCurrentUser ])

  // Update audio sequence when blocks or BPM changes
  const updateAudioSequence = useCallback(async () => {
    if (!state.project.id)
      return

    const audioSequenceService = getAudioSequenceService()
    await audioSequenceService.updateAudioSequence(
      state.blocks,
      state.project.bpm,
      state.project.id
    )
  }, [ state.project.id, state.blocks, state.project.bpm ])

  // Playback Actions
  const play = useCallback(async () => {
    const { userId, userName } = getCurrentUser()

    // Update audio sequence before playing
    await updateAudioSequence()

    const action = playbackActions.play(userId, userName)
    dispatch(action)
    sendMessage(ActionType.PLAY, {})
  }, [ getCurrentUser, updateAudioSequence ])

  const pause = useCallback(() => {
    const { userId, userName } = getCurrentUser()
    const action = playbackActions.pause(userId, userName)
    dispatch(action)
    sendMessage(ActionType.PAUSE, {})
  }, [ getCurrentUser ])

  const restart = useCallback(async () => {
    const { userId, userName } = getCurrentUser()

    // Update audio sequence before restarting
    await updateAudioSequence()

    const action = playbackActions.restart(userId, userName)
    dispatch(action)
    sendMessage(ActionType.RESTART, {})
  }, [ getCurrentUser ])

  const setCurrentBeat = useCallback((beat: number) => {
    const action = createProjectAction(
      ProjectActionType.SET_CURRENT_BEAT,
      { beat },
      { trackable: false }
    )
    dispatch(action)
  }, [])

  const setBpm = useCallback(async (bpm: number) => {
    const { userId, userName } = getCurrentUser()
    const action = playbackActions.setBpm(bpm, userId, userName)
    dispatch(action)
    sendMessage(ActionType.UPDATE_SETTINGS, { bpm })

    // Update audio sequence with new BPM
    setTimeout(() => updateAudioSequence(), 100) // Slight delay to ensure state update
  }, [ getCurrentUser, updateAudioSequence ])

  const setMasterVolume = useCallback((volume: number) => {
    const { userId, userName } = getCurrentUser()
    const action = playbackActions.setMasterVolume(volume, userId, userName)
    dispatch(action)
    sendMessage(ActionType.UPDATE_SETTINGS, { masterVolume: volume })
  }, [ getCurrentUser ])

  // Track Actions
  const addTrack = useCallback(async (trackData: Omit<Track, 'id'>) => {
    if (!state.project.id)
      return

    const { userId, userName } = getCurrentUser()

    try {
      const { data: newTrackData, error } = await supabase
        .from('tracks')
        .insert({
          name:       trackData.name,
          color:      trackData.color,
          volume:     trackData.volume,
          muted:      trackData.muted,
          solo:       trackData.solo,
          armed:      trackData.armed,
          project_id: state.project.id
        })
        .select()
        .single()

      if (error)
        throw error

      const newTrack: Track = {
        id: newTrackData.id,
        ...trackData
      }

      const action = trackActions.addTrack(newTrack, userId, userName)
      dispatch(action)
      sendMessage(ActionType.ADD_TRACK, { track: newTrack })
    }
    catch (error) {
      console.error('Error adding track:', error)
      throw error
    }
  }, [ state.project.id, getCurrentUser ])

  const removeTrack = useCallback((trackId: string) => {
    const { userId, userName } = getCurrentUser()
    const track = state.tracks.find(t => t.id === trackId)
    const trackName = track?.name || 'Unknown'

    const action = trackActions.removeTrack(trackId, trackName, userId, userName)
    dispatch(action)
    sendMessage(ActionType.REMOVE_TRACK, { trackId })
  }, [ state.tracks, getCurrentUser ])

  const renameTrack = useCallback((trackId: string, name: string) => {
    const { userId, userName } = getCurrentUser()
    const track = state.tracks.find(t => t.id === trackId)
    const oldName = track?.name || 'Unknown'

    const action = trackActions.renameTrack(trackId, name, oldName, userId, userName)
    dispatch(action)
    sendMessage(ActionType.RENAME_TRACK, { trackId, name })
  }, [ state.tracks, getCurrentUser ])

  const setTrackVolume = useCallback((trackId: string, volume: number) => {
    const { userId, userName } = getCurrentUser()
    const track = state.tracks.find(t => t.id === trackId)
    const trackName = track?.name || 'Unknown'

    const action = trackActions.setTrackVolume(trackId, volume, trackName, userId, userName)
    dispatch(action)
    sendMessage(ActionType.SET_TRACK_VOLUME, { trackId, volume })
  }, [ state.tracks, getCurrentUser ])

  const muteTrack = useCallback((trackId: string, muted: boolean) => {
    const { userId, userName } = getCurrentUser()
    const track = state.tracks.find(t => t.id === trackId)
    const trackName = track?.name || 'Unknown'

    const action = trackActions.muteTrack(trackId, muted, trackName, userId, userName)
    dispatch(action)
    sendMessage(ActionType.MUTE_TRACK, { trackId, muted })
  }, [ state.tracks, getCurrentUser ])

  const soloTrack = useCallback((trackId: string, solo: boolean) => {
    const { userId, userName } = getCurrentUser()
    const track = state.tracks.find(t => t.id === trackId)
    const trackName = track?.name || 'Unknown'

    const action = trackActions.soloTrack(trackId, solo, trackName, userId, userName)
    dispatch(action)
    sendMessage(ActionType.SOLO_TRACK, { trackId, solo })
  }, [ state.tracks, getCurrentUser ])

  const armTrack = useCallback((trackId: string, armed: boolean) => {
    const { userId, userName } = getCurrentUser()
    const track = state.tracks.find(t => t.id === trackId)
    const trackName = track?.name || 'Unknown'

    const action = trackActions.armTrack(trackId, armed, trackName, userId, userName)
    dispatch(action)
    sendMessage(ActionType.ARM_TRACK, { trackId, armed })
  }, [ state.tracks, getCurrentUser ])

  const lockTrack = useCallback((trackId: string) => {
    const { userId, userName } = getCurrentUser()
    const track = state.tracks.find(t => t.id === trackId)
    const trackName = track?.name || 'Unknown'

    const action = trackActions.lockTrack(trackId, trackName, userId, userName)
    dispatch(action)
    sendMessage(ActionType.LOCK_TRACK, { trackId, userId })
    webSocketService.lockTrack(trackId)
  }, [ state.tracks, getCurrentUser ])

  const unlockTrack = useCallback((trackId: string) => {
    const { userId, userName } = getCurrentUser()
    const track = state.tracks.find(t => t.id === trackId)
    const trackName = track?.name || 'Unknown'

    const action = trackActions.unlockTrack(trackId, trackName, userId, userName)
    dispatch(action)
    sendMessage(ActionType.UNLOCK_TRACK, { trackId })
    webSocketService.unlockTrack(trackId)
  }, [ state.tracks, getCurrentUser ])

  // Block Actions
  const addBlock = useCallback(async (blockData: Omit<Block, 'id'> & { file?: File }) => {
    if (!state.project.id)
      return

    const { userId, userName } = getCurrentUser()
    const track = state.tracks[blockData.track]
    const trackName = track?.name || 'Unknown'

    let fileId: string | undefined
    if (blockData.file) {
      // Upload the audio file and get the file ID
      const uploadedFilePath = await uploadAudioFile('temp-block-id', blockData.file)
      if (uploadedFilePath)
        fileId = uploadedFilePath; else
        console.error('Failed to upload audio file for block:', blockData.name)
    }

    const newBlockId = `block-${Date.now()}-${Math.random().toString(36)
      .substr(2, 9)}`

    // Create the block object
    const newBlock: Block = {
      id:          newBlockId,
      name:        blockData.name,
      track:       blockData.track,
      startBeat:   blockData.startBeat,
      lengthBeats: blockData.lengthBeats,
      volume:      blockData.volume || 80,
      pitch:       blockData.pitch || 0,
      fileId:      fileId,
    }

    try {
      // Insert into database
      const { error: insertError } = await supabase
        .from('audio_blocks')
        .insert({
          id:           newBlock.id,
          track_id:     track.id,
          name:         newBlock.name,
          start_beat:   newBlock.startBeat,
          length_beats: newBlock.lengthBeats,
          volume:       newBlock.volume,
          pitch:        newBlock.pitch,
          file_id:      newBlock.fileId
        })

      if (insertError)
        throw insertError

      // Update local state
      const action = blockActions.addBlock(newBlock, trackName, userId, userName)
      dispatch(action)
      sendMessage(ActionType.ADD_BLOCK, { block: newBlock })

      toast({
        title:       'Block Added',
        description: `Added "${newBlock.name}" to ${trackName}`,
      })

      // Update audio sequence after adding block
      setTimeout(() => updateAudioSequence(), 100)
    }
    catch (error) {
      console.error('Error adding block to database:', error)
      toast({
        title:       'Error',
        description: 'Failed to save block to database',
        variant:     'destructive',
      })
    }
  }, [ state.project.id, state.tracks, getCurrentUser, uploadAudioFile ])

  const removeBlock = useCallback(async (blockId: string) => {
    const { userId, userName } = getCurrentUser()
    const block = state.blocks.find(b => b.id === blockId)
    const blockName = block?.name || 'Unknown'

    if (block?.fileId)
      await deleteAudioFile(blockId, block.fileId)

    const action = blockActions.removeBlock(blockId, blockName, userId, userName)
    dispatch(action)
    sendMessage(ActionType.REMOVE_BLOCK, { blockId })

    // Update audio sequence after removing block
    setTimeout(() => updateAudioSequence(), 100)
  }, [ state.blocks, getCurrentUser, deleteAudioFile ])

  const updateBlock = useCallback((blockId: string, updates: Partial<Block>) => {
    const { userId, userName } = getCurrentUser()
    const block = state.blocks.find(b => b.id === blockId)
    const blockName = block?.name || 'Unknown'

    const action = blockActions.updateBlock(blockId, updates, blockName, userId, userName)
    dispatch(action)
    sendMessage(ActionType.UPDATE_BLOCK, { blockId, ...updates })
  }, [ state.blocks, getCurrentUser ])

  const moveBlock = useCallback((blockId: string, track: number, startBeat: number) => {
    const { userId, userName } = getCurrentUser()
    const block = state.blocks.find(b => b.id === blockId)
    const blockName = block?.name || 'Unknown'

    const action = blockActions.moveBlock(blockId, track, startBeat, blockName, userId, userName)
    dispatch(action)
    sendMessage(ActionType.MOVE_BLOCK, { blockId, trackId: track, startBeat })
  }, [ state.blocks, getCurrentUser ])

  const resizeBlock = useCallback((blockId: string, lengthBeats: number) => {
    const { userId, userName } = getCurrentUser()
    const block = state.blocks.find(b => b.id === blockId)
    const blockName = block?.name || 'Unknown'

    const action = blockActions.resizeBlock(blockId, lengthBeats, blockName, userId, userName)
    dispatch(action)
    sendMessage(ActionType.RESIZE_BLOCK, { blockId, lengthBeats })
  }, [ state.blocks, getCurrentUser ])

  const duplicateBlock = useCallback((blockId: string) => {
    const { userId, userName } = getCurrentUser()
    const block = state.blocks.find(b => b.id === blockId)
    if (!block)
      return

    const newBlockId = `block-${Date.now()}-${Math.random().toString(36)
      .substr(2, 9)}`
    const newBlock = {
      ...block,
      id:        newBlockId,
      startBeat: block.startBeat + block.lengthBeats,
      name:      `${block.name} (copy)`
    }

    const trackName = state.tracks[block.track]?.name || 'Unknown'
    const action = blockActions.duplicateBlock(blockId, newBlock, userId, userName)
    dispatch(action)
    sendMessage(ActionType.DUPLICATE_BLOCK, {
      originalBlockId: blockId,
      newBlock
    })
  }, [ state.blocks, state.tracks, getCurrentUser ])

  const startEditingBlock = useCallback((blockId: string) => {
    const { userId, userName } = getCurrentUser()
    const block = state.blocks.find(b => b.id === blockId)
    const blockName = block?.name || 'Unknown'

    const action = blockActions.startEditingBlock(blockId, blockName, userId, userName)
    dispatch(action)
    sendMessage(ActionType.START_EDITING_BLOCK, { blockId, userId })
  }, [ state.blocks, getCurrentUser ])

  const endEditingBlock = useCallback((blockId: string) => {
    const { userId, userName } = getCurrentUser()
    const block = state.blocks.find(b => b.id === blockId)
    const blockName = block?.name || 'Unknown'

    const action = blockActions.endEditingBlock(blockId, blockName, userId, userName)
    dispatch(action)
    sendMessage(ActionType.END_EDITING_BLOCK, { blockId })
  }, [ state.blocks, getCurrentUser ])

  // Marker Actions
  const addMarker = useCallback(async (markerData: Omit<TimelineMarker, 'id' | 'projectId' | 'createdBy' | 'createdAt'>) => {
    if (!state.project.id)
      return

    const { userId, userName } = getCurrentUser()
    const markerId = `marker-${Date.now()}-${Math.random().toString(36)
      .substr(2, 9)}`

    const marker: TimelineMarker = {
      id:        markerId,
      projectId: state.project.id,
      createdBy: userId,
      createdAt: Date.now(),
      ...markerData
    }

    try {
      // Save to database
      const { error, data } = await supabase
        .from('timeline_markers')
        .insert({
          project_id: marker.projectId,
          position:   marker.position,
          color:      marker.color,
          icon:       marker.icon,
          label:      marker.label,
          created_by: marker.createdBy,
          created_at: new Date(marker.createdAt).toISOString()
        })
        .select()
        .single()

      if (error)
        throw error

      console.log('Marker saved to database:', data)
      marker.id = data.id

      // Update local state
      const action = markerActions.addMarker(marker, userId, userName)
      dispatch(action)
      sendMessage(ActionType.ADD_MARKER, { marker })

      toast({
        title:       'Marker Added',
        description: `Added marker "${marker.label || 'Marker'}" at beat ${marker.position + 1}`,
        color:       'success',
      })
    }
    catch (error) {
      console.error('Error adding marker:', error)
      toast({
        title:       'Error',
        description: 'Failed to add marker',
        variant:     'destructive',
      })
    }
  }, [ state.project.id, getCurrentUser ])

  const updateMarker = useCallback(async (markerId: string, changes: Partial<TimelineMarker>) => {
    if (!state.project.id)
      return

    const { userId, userName } = getCurrentUser()
    const marker = state.markers.find(m => m.id === markerId)
    if (!marker)
      return

    try {
      // Update in database
      const updateData: Partial<TimelineMarker> = {}
      if (changes.position !== undefined)
        updateData.position = changes.position
      if (changes.color !== undefined)
        updateData.color = changes.color
      if (changes.icon !== undefined)
        updateData.icon = changes.icon
      if (changes.label !== undefined)
        updateData.label = changes.label

      const { error } = await supabase
        .from('timeline_markers')
        .update(updateData)
        .eq('id', markerId)

      if (error)
        throw error

      // Update local state
      const action = markerActions.updateMarker(markerId, changes, marker.label || 'Marker', userId, userName)
      dispatch(action)
      sendMessage(ActionType.UPDATE_MARKER, { markerId, changes })

      toast({
        title:       'Marker Updated',
        description: `Updated marker "${marker.label || 'Marker'}"`,
      })
    }
    catch (error) {
      console.error('Error updating marker:', error)
      toast({
        title:       'Error',
        description: 'Failed to update marker',
        variant:     'destructive',
      })
    }
  }, [ state.project.id, state.markers, getCurrentUser ])

  const removeMarker = useCallback(async (markerId: string) => {
    if (!state.project.id)
      return

    const { userId, userName } = getCurrentUser()
    const marker = state.markers.find(m => m.id === markerId)
    if (!marker)
      return

    try {
      // Remove from database
      const { error } = await supabase
        .from('timeline_markers')
        .delete()
        .eq('id', markerId)

      if (error)
        throw error

      // Update local state
      const action = markerActions.removeMarker(markerId, marker.label || 'Marker', userId, userName)
      dispatch(action)
      sendMessage(ActionType.REMOVE_MARKER, { markerId })

      toast({
        title:       'Marker Removed',
        description: `Removed marker "${marker.label || 'Marker'}"`,
      })
    }
    catch (error) {
      console.error('Error removing marker:', error)
      toast({
        title:       'Error',
        description: 'Failed to remove marker',
        variant:     'destructive',
      })
    }
  }, [ state.project.id, state.markers, getCurrentUser ])

  // UI Actions
  const selectBlock = useCallback((blockId: string) => {
    dispatch(createProjectAction<SelectBlockAction>(ProjectActionType.SELECT_BLOCK, { blockId }, { trackable: false }))
  }, [])

  const deselectBlock = useCallback(() => {
    dispatch(createProjectAction<DeselectBlockAction>(ProjectActionType.DESELECT_BLOCK, undefined, { trackable: false }))
  }, [])

  const setActiveTool = useCallback((tool: ToolType) => {
    dispatch(createProjectAction<SetActiveToolAction>(ProjectActionType.SET_ACTIVE_TOOL, { tool }, { trackable: false }))
  }, [])

  const setZoom = useCallback((pixelsPerBeat: number) => {
    dispatch(createProjectAction<SetZoomAction>(ProjectActionType.SET_ZOOM, { pixelsPerBeat }, { trackable: false }))
  }, [])

  const setScrollPosition = useCallback((horizontal: number, vertical: number) => {
    dispatch(createProjectAction<SetScrollPositionAction>(ProjectActionType.SET_SCROLL_POSITION, { horizontal, vertical }, { trackable: false }))
  }, [])

  const toggleSettings = useCallback((open: boolean) => {
    dispatch(createProjectAction<ToggleSettingsAction>(ProjectActionType.TOGGLE_SETTINGS, { open }, { trackable: false }))
  }, [])

  const toggleHistoryDrawer = useCallback((open: boolean) => {
    dispatch(createProjectAction<ToggleHistoryDrawerAction>(ProjectActionType.TOGGLE_HISTORY_DRAWER, { open }, { trackable: false }))
  }, [])

  const restoreToTimestamp = useCallback((timestamp: number) => {
    dispatch(createProjectAction<RestoreToTimestampAction>(ProjectActionType.RESTORE_TO_TIMESTAMP, { timestamp }, { trackable: false }))
  }, [])

  // Legacy support for existing code
  const connectToProject = useCallback(async (projectId: string) => {
    webSocketService.setLocalUserData({ userName: state.localUserName, userId: state.localUserId })
    webSocketService.connectToProject(projectId)
  }, [ state.localUserId, state.localUserName ])

  const disconnectFromProject = useCallback(() => {
    webSocketService.disconnectFromProject()
  }, [])

  const sendMessage = useCallback((action: ActionType, params): string => webSocketService.sendMessage(action, params), [])

  const messageHistory = webSocketService.getMessageHistory()

  const updateUserName = useCallback((userName: string) => {
    webSocketService.setLocalUserName(userName)
    dispatch(createProjectAction(ProjectActionType.UPDATE_USER_PRESENCE, { userName }, { trackable: false }))
  }, [])

  const setRemoteUsers = useCallback(users => {
    dispatch({ type: ProjectActionType.SET_REMOTE_USERS, payload: { users }})
  }, [])

  const sendGeneralMessage = useCallback((message: GeneralMessage) => {
    webSocketService.sendGeneralMessage(message)
  }, [])

  const setSelectedHistoryIndex = useCallback((index: number | null) => {
    dispatch(createProjectAction(ProjectActionType.RESTORE_TO_TIMESTAMP, { index }, { trackable: false }))
  }, [])

  const setHistoryVisible = useCallback((visible: boolean) => {
    dispatch(createProjectAction(ProjectActionType.TOGGLE_HISTORY_DRAWER, { visible }, { trackable: false }))
  }, [])

  useEffect(() => {
    const handleConnected = (data: { userId: string, projectId: string }) => {
      console.log('Connected to project:', data.projectId, 'as user:', data.userId)
    }

    const handlePresenceSync = presenceState => {
      const collaborators = Object.values(presenceState)
        .filter((user: any) => user && user.userId !== state.localUserId)
        .map((user: any) => ({
          userId:   user?.userId,
          userName: user?.userName || 'Anonymous',
          color:    generateUserColor(user.userId || String(user))
        }))

      setRemoteUsers(collaborators)
    }

    const handleCursorMove = data => {
      dispatch({ type: ProjectActionType.SET_REMOTE_USER_CURSOR_POSITION, payload: data })
    }

    const handleConnectionStatusChanged = (data: { status: 'connecting' | 'connected' | 'disconnected' }) => {
      console.log('Connection status changed:', data.status)
    }

    webSocketService.on('connected', handleConnected)
    webSocketService.on('presenceSync', handlePresenceSync)
    webSocketService.on('cursorMove', handleCursorMove)
    webSocketService.on('connectionStatusChanged', handleConnectionStatusChanged)

    return () => {
      webSocketService.off('connected', handleConnected)
      webSocketService.off('presenceSync', handlePresenceSync)
      webSocketService.off('cursorMove', handleCursorMove)
      webSocketService.off('connectionStatusChanged', handleConnectionStatusChanged)
    }
  }, [ state.localUserId, state.localUserName ])

  const contextValue: ProjectContextType = {
    state,
    loadProject,
    setProjectLoading,
    setProjectError,
    updateProjectSettings,
    play,
    pause,
    restart,
    setCurrentBeat,
    setBpm,
    setMasterVolume,
    addTrack,
    removeTrack,
    renameTrack,
    setTrackVolume,
    muteTrack,
    soloTrack,
    armTrack,
    lockTrack,
    unlockTrack,
    addBlock,
    removeBlock,
    updateBlock,
    moveBlock,
    resizeBlock,
    duplicateBlock,
    startEditingBlock,
    endEditingBlock,
    uploadAudioFile,
    deleteAudioFile,
    addMarker,
    updateMarker,
    removeMarker,
    selectBlock,
    deselectBlock,
    setActiveTool,
    setZoom,
    setScrollPosition,
    toggleSettings,
    toggleHistoryDrawer,
    restoreToTimestamp,
    connectToProject,
    disconnectFromProject,
    sendMessage,
    messageHistory,
    // historyVisible,
    setHistoryVisible,
    // selectedHistoryIndex,
    setSelectedHistoryIndex,
    updateUserName,
    sendGeneralMessage,
  }

  return <ProjectContext.Provider value={ contextValue }>
    {children}
  </ProjectContext.Provider>
}

export const useProject = (): ProjectContextType => {
  const context = useContext(ProjectContext)
  if (context === undefined)
    throw new Error('useProject must be used within a ProjectProvider')
  return context
}

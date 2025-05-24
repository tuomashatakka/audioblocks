import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { toast } from '@/hooks/use-toast'
import { Loader2, AlertCircle } from 'lucide-react'
import TrackList from '@/components/TrackList'
import TrackBlock from '@/components/TrackBlock'
import Timeline from '@/components/Timeline'
import CompositionGridView from '@/components/CompositionGridView'
import SettingsDialog from '@/components/SettingsDialog'
import RemoteUser from '@/components/RemoteUser'
import ClipEditPopup from '@/components/ClipEditPopup'
import ProjectHistoryDrawer from '@/components/ProjectHistoryDrawer'
import { Button } from '@/components/ui/button'
import { Record } from '@/components/Record'
import { ToolType } from '@/components/ToolsMenu'
import { useProject } from '@/contexts/ProjectContext'
import { TrackInfo } from '@/components/TrackList'
import { ActionType } from '@/types/collaborative'
import { ui } from '@/styles/ui-classes'
import ToolbarWithStatus from '@/components/ToolbarWithStatus'
import { supabase } from '@/integrations/supabase/client'
import { getAudioEngine } from '@/utils/AudioEngine'

// Fetch project data from Supabase
const fetchProjectData = async (projectId: string) => {
  try {
    // Fetch project details
    const { data: projectData, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single()

    if (projectError)
      throw projectError

    if (!projectData)
      throw new Error('Project not found')

    // Parse settings JSON from the database
    let projectSettings = {
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
      .order('created_at', { ascending: true })

    if (tracksError)
      throw tracksError

    // Fetch audio blocks
    const { data: blocksData, error: blocksError } = await supabase
      .from('audio_blocks')
      .select('*')
      .in('track_id', tracksData?.map(track => track.id) || [])
      .order('created_at', { ascending: true })

    if (blocksError)
      throw blocksError

    // Transform tracks to match the application structure
    const formattedTracks: TrackInfo[] = (tracksData || []).map(track => ({
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

    // Transform blocks to match the application structure
    const formattedBlocks = (blocksData || []).map(block => {
      const trackIndex = formattedTracks.findIndex(track => track.id === block.track_id)
      return {
        id:          block.id,
        track:       trackIndex >= 0 ? trackIndex : 0, // Use track index, fallback to 0
        startBeat:   block.start_beat,
        lengthBeats: block.length_beats,
        name:        block.name,
        volume:      block.volume,
        pitch:       block.pitch,
        fileId:      block.file_id
      }
    })

    return {
      id:           projectData.id,
      name:         projectData.name,
      bpm:          projectData.bpm || 120,
      masterVolume: projectData.master_volume || 80,
      settings:     projectSettings,
      tracks:       formattedTracks,
      blocks:       formattedBlocks
    }
  }
  catch (error) {
    console.error('Error fetching project data:', error)
    throw error
  }
}

const ProjectView: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const {
    // State from context
    state,
    // Actions from context
    loadProject,
    setProjectLoading,
    setProjectError,
    // Playback actions
    play,
    pause,
    restart,
    setCurrentBeat,
    setBpm,
    setMasterVolume,
    // Track actions
    addTrack,
    removeTrack,
    renameTrack,
    setTrackVolume,
    muteTrack,
    soloTrack,
    armTrack,
    lockTrack,
    unlockTrack,
    // Block actions
    addBlock,
    removeBlock,
    updateBlock,
    moveBlock,
    resizeBlock,
    duplicateBlock,
    startEditingBlock,
    endEditingBlock,
    // UI actions
    selectBlock,
    deselectBlock,
    setActiveTool,
    setZoom,
    setScrollPosition,
    toggleSettings,
    // History actions
    toggleHistoryDrawer,
    // Marker actions
    addMarker,
    updateMarker,
    removeMarker,
    // Legacy support
    connectToProject,
    sendMessage,
    sendGeneralMessage,

    updateProjectSettings,
  } = useProject()

  // Local UI state that doesn't belong in global context
  const [ containerWidth, setContainerWidth ] = useState(0)
  const [ clipPopupPosition, setClipPopupPosition ] = useState({ x: 0, y: 0 })
  const [ isLoading, setIsLoading ] = useState(true)
  const [ error, setError ] = useState<Error | null>(null)

  // Drag and drop state
  const [ isDragOver, setIsDragOver ] = useState(false)
  const [ dragPosition, setDragPosition ] = useState<{ x: number, y: number } | null>(null)
  const [ placeholderBlock, setPlaceholderBlock ] = useState<{ track: number, startBeat: number, lengthBeats: number } | null>(null)

  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const timelineRef = useRef<HTMLDivElement>(null)
  const trackListRef = useRef<HTMLDivElement>(null)

  // Derived values from context state
  const isPlaying = state.isPlaying
  const bpm = state.project.bpm
  const masterVolume = state.project.masterVolume
  const currentBeat = isNaN(state.currentBeat) ? 0 : state.currentBeat
  const selectedBlockId = state.selectedBlockId
  const isSettingsOpen = state.isSettingsOpen
  const pixelsPerBeat = state.pixelsPerBeat
  const trackHeight = state.trackHeight
  const beatsPerBar = state.beatsPerBar
  const totalBars = state.totalBars
  const activeTool = state.activeTool
  const settings = state.project.settings
  const tracks = state.tracks || []
  const blocks = useMemo(() => state.blocks || [], [ state.blocks ])
  const markers = state.markers
  const historyVisible = state.historyVisible
  const showCollaborators = settings.showCollaborators
  const horizontalScrollPosition = state.scrollPosition.horizontal
  const verticalScrollPosition = state.scrollPosition.vertical

  console.log(state)

  // Remote users from context collaborators
  const remoteUsers = state.remoteUsers.map(collaborator => ({
    id:       collaborator.id,
    name:     collaborator.name,
    position: collaborator.position,
    color:    collaborator.color
  }))

  // Load project data when component mounts
  useEffect(() => {
    if (!projectId)
      return

    const loadProjectData = async () => {
      try {
        setIsLoading(true)
        setProjectLoading(true)
        setError(null)
        setProjectError(null)

        const projectData = await fetchProjectData(projectId)

        // Load project data into context
        loadProject(projectData)

        // Connect to the project's WebSocket channel
        connectToProject(projectData.id)

        toast({
          title:       'Project Loaded',
          description: `Successfully loaded "${projectData.name}"`,
        })
      }
      catch (err) {
        console.error('Error loading project:', err)

        const errorObj = err as Error
        setError(errorObj)
        setProjectError(errorObj.message)

        toast({
          title:       'Error Loading Project',
          description: errorObj.message,
          variant:     'destructive',
        })
      }
      finally {
        setIsLoading(false)
        setProjectLoading(false)
      }
    }

    loadProjectData()
  }, [ projectId, loadProject, connectToProject, setProjectLoading, setProjectError ])

  const handleRetry = () => {
    if (!projectId)
      return

    const loadProjectData = async () => {
      try {
        setIsLoading(true)
        setProjectLoading(true)
        setError(null)
        setProjectError(null)

        const projectData = await fetchProjectData(projectId)
        loadProject(projectData)
        connectToProject(projectData.id)

        toast({
          title:       'Project Loaded',
          description: `Successfully loaded "${projectData.name}"`,
        })
      }
      catch (err) {
        console.error('Error loading project:', err)

        const errorObj = err as Error
        setError(errorObj)
        setProjectError(errorObj.message)
      }
      finally {
        setIsLoading(false)
        setProjectLoading(false)
      }
    }

    loadProjectData()
  }

  // Helper functions for drag and drop
  const isAudioFile = (file: File | null): boolean => {
    if (!file)
      return false

    const audioExtensions = [ '.mp3', '.wav', '.ogg', '.m4a', '.aac', '.flac', '.wma' ]
    const fileName = file.name?.toLowerCase()

    // Check MIME type first, then fallback to file extension
    return file.type.startsWith('audio/') || (fileName ? audioExtensions.some(ext => fileName.endsWith(ext)) : false)
  }

  const calculateDropPosition = (e: React.DragEvent<HTMLDivElement>) => {
    if (!scrollContainerRef.current)
      return null

    const rect = scrollContainerRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left + horizontalScrollPosition
    const y = e.clientY - rect.top + verticalScrollPosition

    const trackIndex = Math.floor(y / trackHeight)
    let beatPosition = x / pixelsPerBeat

    // Apply snapping if enabled
    if (settings.snapToGrid)
      beatPosition = Math.round(beatPosition / settings.gridSize) * settings.gridSize

    // Default block length (1 bar)
    const defaultLength = beatsPerBar

    return {
      track:       Math.max(0, Math.min(trackIndex, tracks.length - 1)),
      startBeat:   Math.max(0, beatPosition),
      lengthBeats: defaultLength
    }
  }

  // Event handlers using context methods
  const handleDuplicate = (blockId: string) => {
    duplicateBlock(blockId)

    const block = blocks.find(b => b.id === blockId)
    if (block)
      toast({
        title:       'Block Duplicated',
        description: `Created a copy of "${block.name}".`,
      })
  }

  const handleToggleLock = (blockId: string) => {
    const block = blocks.find(b => b.id === blockId)
    if (!block)
      return

    if (block.editingUserId)
      endEditingBlock(blockId); else
      startEditingBlock(blockId)

    toast({
      title:       'Block Lock Changed',
      description: 'Block editing status has been updated.',
    })
  }

  const handleOpenProperties = (blockId: string) => {
    const block = blocks.find(block => block.id === blockId)
    if (!block)
      return

    if (block.editingUserId && block.editingUserId !== state.localUserId) {
      toast({
        title:       'Block is being edited',
        description: `This clip is currently being edited by another user.`,
        variant:     'destructive',
      })
      return
    }

    handleSelectBlock(blockId)
  }

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollLeft, scrollTop } = e.currentTarget
    setScrollPosition(scrollLeft, scrollTop)

    if (timelineRef.current)
      timelineRef.current.scrollLeft = scrollLeft
    if (trackListRef.current)
      trackListRef.current.scrollTop = scrollTop
  }

  const isTrackLocked = (trackIndex: number): boolean => blocks.some(block =>
    block.track === trackIndex &&
      block.editingUserId &&
      block.editingUserId !== state.localUserId
  )

  const handleSelectBlock = (id: string) => {
    const block = blocks.find(block => block.id === id)
    if (!block)
      return

    if (block.editingUserId && block.editingUserId !== state.localUserId) {
      toast({
        title:       'Block is being edited',
        description: `This clip is currently being edited by another user.`,
        variant:     'destructive',
      })
      return
    }

    if (selectedBlockId)
      endEditingBlock(selectedBlockId)

    startEditingBlock(id)
    selectBlock(id)

    if (scrollContainerRef.current && block) {
      const blockX = block.startBeat * pixelsPerBeat
      const blockY = block.track * trackHeight

      setClipPopupPosition({
        x: blockX - horizontalScrollPosition,
        y: blockY - verticalScrollPosition + trackHeight
      })
    }
  }

  // Connection/initialization effect
  useEffect(() => {
    if (!state.project)
      return

    // Mark the track area with the project-area class for cursor tracking
    const trackArea = scrollContainerRef.current
    if (trackArea)
      trackArea.classList.add('project-area')

    // Send a general message to notify others that we've joined
    sendGeneralMessage({
      type:    'user_joined',
      message: `${state.localUserName} joined project "${state.project.name}"`
    })

    // Listen for general messages
    const handleGeneralMessage = (message: any) => {
      if (message.type === 'user_joined' && message.userId !== state.localUserId)
        toast({
          title:       'User Joined',
          description: message.message,
        })
    }

    const webSocketService = window.getWebSocketService?.()
    if (webSocketService)
      webSocketService.on('generalMessage', handleGeneralMessage)

    return () => {
      if (webSocketService)
        webSocketService.off('generalMessage', handleGeneralMessage)
    }
  }, [ state.project, state.localUserId, state.localUserName, sendGeneralMessage ])

  const handleBlockPositionChange = (id: string, newTrack: number, newStartBeat: number) => {
    if (isTrackLocked(newTrack)) {
      toast({
        title:       'Track Locked',
        description: 'This track has clips being edited by other users.',
        variant:     'destructive',
      })
      return
    }

    let adjustedStartBeat = newStartBeat
    if (settings.snapToGrid)
      adjustedStartBeat = Math.round(newStartBeat / settings.gridSize) * settings.gridSize

    moveBlock(id, newTrack, adjustedStartBeat)

    sendGeneralMessage({
      type:      'block_moved',
      blockId:   id,
      trackId:   newTrack,
      startBeat: adjustedStartBeat,
      message:   `Block moved to track ${newTrack + 1}, beat ${adjustedStartBeat + 1}`
    })
  }

  const handleBlockLengthChange = (id: string, newLength: number) => {
    let adjustedLength = newLength
    if (settings.snapToGrid)
      adjustedLength = Math.max(settings.gridSize,
                                Math.round(newLength / settings.gridSize) * settings.gridSize)

    resizeBlock(id, adjustedLength)
  }

  const handlePlay = async () => {
    await play()

    // Start AudioEngine playback
    const audioEngine = getAudioEngine()
    audioEngine.play()

    toast({
      title:       'Playback Started',
      description: 'Your composition is now playing.',
    })
  }

  const handlePause = () => {
    pause()

    // Pause AudioEngine
    const audioEngine = getAudioEngine()
    audioEngine.pause()
  }

  const handleRestart = async () => {
    await restart()

    // Stop and restart AudioEngine
    const audioEngine = getAudioEngine()
    audioEngine.stop()
    audioEngine.play()
  }

  const handleTrackVolumeChange = (trackId: string, volume: number) => {
    setTrackVolume(trackId, volume)
  }

  const handleTrackMuteToggle = (trackId: string) => {
    const track = tracks.find(t => t.id === trackId)
    if (track)
      muteTrack(trackId, !track.muted)
  }

  const handleTrackSoloToggle = (trackId: string) => {
    const track = tracks.find(t => t.id === trackId)
    if (track)
      soloTrack(trackId, !track.solo)
  }

  const handleTrackArmToggle = (trackId: string) => {
    const track = tracks.find(t => t.id === trackId)
    if (track)
      armTrack(trackId, !track.armed)
  }

  const handleTrackLockToggle = (trackId: string) => {
    const track = tracks.find(t => t.id === trackId)
    if (track) {
      if (track.locked)
        unlockTrack(trackId); else
        lockTrack(trackId)
    }

    toast({
      title:       'Track Lock Changed',
      description: 'Track locking status has been updated.',
    })
  }

  const handleTrackRename = (trackId: string, newName: string) => {
    renameTrack(trackId, newName)

    toast({
      title:       'Track Renamed',
      description: `Track has been renamed to "${newName}".`,
    })
  }

  const handleTrackListScroll = (scrollTop: number) => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollTop
      setScrollPosition(horizontalScrollPosition, scrollTop)
    }
  }

  const handleAddTrack = () => {
    const colors = [ '#FF466A', '#FFB446', '#64C850', '#5096FF' ]
    const newColor = colors[tracks.length % colors.length]

    const newTrackData = {
      name:   `Track ${tracks.length + 1}`,
      color:  newColor,
      volume: 75,
      muted:  false,
      solo:   false,
      armed:  false
    }

    addTrack(newTrackData)

    toast({
      title:       'Track Added',
      description: 'A new track has been added to your composition.',
    })
  }

  const handleBlockNameChange = (id: string, name: string) => {
    updateBlock(id, { name })
  }

  const handleBlockVolumeChange = (id: string, volume: number) => {
    updateBlock(id, { volume })
  }

  const handleBlockPitchChange = (id: string, pitch: number) => {
    updateBlock(id, { pitch })
  }

  const handleDeleteBlock = (id: string) => {
    removeBlock(id)
    deselectBlock()

    toast({
      title:       'Clip Deleted',
      description: 'The audio clip has been removed from your track.',
      variant:     'destructive',
    })
  }

  const handleAddMarker = (marker: Omit<import('@/components/Timeline').TimelineMarkerData, 'id'>) => {
    addMarker({
      position: marker.position,
      color:    marker.color,
      icon:     marker.icon,
      label:    marker.label
    })
  }

  const handleEditMarker = (id: string, changes: Partial<import('@/components/Timeline').TimelineMarkerData>) => {
    updateMarker(id, changes)
  }

  const handleDeleteMarker = (id: string) => {
    removeMarker(id)
  }

  // Context menu handlers for CompositionGridView
  const handleAddBlockFromContext = (blockData: Omit<Block, 'id'>) => {
    addBlock(blockData)
  }

  const handleUploadAudioFromContext = (file: File, track: number, startBeat: number) => {
    const fileName = file.name.replace(/\.[^/.]+$/, '') // Remove extension
    const blockData = {
      name:        fileName,
      track,
      startBeat,
      lengthBeats: beatsPerBar, // Use 1 bar as default
      volume:      80,
      pitch:       0,
      file // Include the file for upload
    }

    addBlock(blockData)
  }

  const handleSettingsChange = (key: string, value: any) => {
    updateProjectSettings({
      [key]: value
    })
  }

  const formatTime = (beats: number): string => {
    const seconds = beats * 60 / bpm
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.floor(seconds % 60)
    const milliseconds = Math.floor(seconds % 1 * 1000)
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}:${milliseconds.toString().padStart(3, '0')}`
  }

  const currentTime = formatTime(currentBeat)
  const totalTime = formatTime(totalBars * beatsPerBar)

  useEffect(() => {
    if (!isPlaying)
      return

    const interval = setInterval(() => {
      const audioEngine = getAudioEngine()

      if (audioEngine.isAudioPlaying()) {
        // Sync with AudioEngine time
        const currentTimeMs = audioEngine.getCurrentTime()
        const currentBeatFromAudio = currentTimeMs / 1000 * (bpm / 60)
        const totalBeats = totalBars * beatsPerBar

        setCurrentBeat(currentBeatFromAudio % totalBeats)
      }
      else {
        // Fallback to simulated time progression
        const totalBeats = totalBars * beatsPerBar
        const next = (currentBeat + 0.1) % totalBeats
        setCurrentBeat(next)
      }
    }, 60000 / bpm / 10)

    return () => clearInterval(interval)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ isPlaying, bpm, beatsPerBar, totalBars, currentBeat ])

  const handleContainerClick = (e: React.MouseEvent) => {
    if (e.currentTarget === e.target)
      deselectBlock()
  }

  const handleContainerDoubleClick = (e: React.MouseEvent) => {}

  // Drag and drop handlers
  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()

    // Check if any files being dragged are audio files
    const hasAudioFiles = Array.from(e.dataTransfer.items || []).some(item => {
      if (item.kind !== 'file')
        return false

      const file = item.getAsFile()
      return isAudioFile(file)
    })

    if (hasAudioFiles)
      setIsDragOver(true)
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()

    if (!isDragOver)
      return

    const position = calculateDropPosition(e)
    if (position) {
      setPlaceholderBlock(position)
      setDragPosition({ x: e.clientX, y: e.clientY })
    }
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()

    // Only clear drag state if leaving the container entirely
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false)
      setPlaceholderBlock(null)
      setDragPosition(null)
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()

    setIsDragOver(false)
    setPlaceholderBlock(null)
    setDragPosition(null)

    const files = Array.from(e.dataTransfer.items)
    const audioFiles = files.filter(isAudioFile)

    if (audioFiles.length === 0) {
      toast({
        title:       'Invalid File Type',
        description: 'Please drop audio files (.mp3, .wav, .ogg, .m4a, .aac, .flac, .wma)',
        variant:     'destructive',
      })
      return
    }

    const dropPosition = calculateDropPosition(e)
    if (!dropPosition)
      return

    // Create audio blocks for each dropped file
    audioFiles.forEach((file, index) => {
      const fileName = file.name.replace(/\.[^/.]+$/, '') // Remove extension
      const blockData = {
        name:        fileName,
        track:       dropPosition.track,
        startBeat:   dropPosition.startBeat + index * dropPosition.lengthBeats, // Offset each file
        lengthBeats: dropPosition.lengthBeats,
        volume:      80,
        pitch:       0,
        fileId:      `file-${Date.now()}-${index}` // Placeholder file ID
      }

      addBlock(blockData)
    })

    toast({
      title:       'Audio Files Added',
      description: `Added ${audioFiles.length} audio block${audioFiles.length > 1 ? 's' : ''} to track ${dropPosition.track + 1}`,
    })
  }

  const handleSeek = (beat: number) => {
    setCurrentBeat(beat)
  }

  const handleZoomIn = () => {
    const newZoom = Math.min(pixelsPerBeat + 10, 80)
    setZoom(newZoom)
  }

  const handleZoomOut = () => {
    const newZoom = Math.max(pixelsPerBeat - 10, 20)
    setZoom(newZoom)
  }

  const getTrackEditingUserId = (trackIndex: number) => blocks.find(
    block =>
      block.track === trackIndex &&
        block.editingUserId &&
        block.editingUserId !== state.localUserId
  )?.editingUserId || null

  const getUserColor = (userId: string | null | undefined): string => {
    if (!userId)
      return ''

    const user = remoteUsers.find(u => u.id === userId)
    return user ? user.color : '#888888'
  }

  const tracksWithLockInfo = tracks.map((track, index) => {
    const editingUserId = getTrackEditingUserId(index)
    return {
      ...track,
      locked:       !!editingUserId,
      lockedByUser: editingUserId
    }
  })

  const selectedBlock = useMemo(() => blocks.find(block => block.id === selectedBlockId), [ blocks, selectedBlockId ])

  // Error handling
  if (error)
    return <div className='flex items-center justify-center min-h-screen bg-background'>
      <div className='text-center space-y-4'>
        <AlertCircle className='h-12 w-12 text-destructive mx-auto' />
        <h1 className='text-2xl font-bold text-foreground'>Project Not Found</h1>

        <p className='text-muted-foreground max-w-md'>
          The project you're looking for doesn't exist or you don't have permission to access it.
        </p>

        <div className='space-x-2'>
          <Button variant='outline' onClick={ () => navigate('/') }>
            Go Home
          </Button>

          <Button onClick={ handleRetry }>
            Try Again
          </Button>
        </div>
      </div>
    </div>


  // Loading state
  if (isLoading || !state.project.id)
    return <div className='flex items-center justify-center min-h-screen bg-background'>
      <div className='text-center space-y-4'>
        <Loader2 className='h-8 w-8 animate-spin text-primary mx-auto' />
        <h2 className='text-xl font-semibold text-foreground'>Loading Project...</h2>
        <p className='text-muted-foreground'>Fetching your audio project data</p>
      </div>
    </div>


  return <div className={ ui.layout.fullScreen }>
    <div className={ ui.overlay.gradient } />

    <ToolbarWithStatus
      isPlaying={ isPlaying }
      bpm={ bpm }
      volume={ masterVolume }
      onPlay={ handlePlay }
      onPause={ handlePause }
      onRestart={ handleRestart }
      onBpmChange={ setBpm }
      onVolumeChange={ setMasterVolume }
      onAddTrack={ handleAddTrack }
      usersCount={ remoteUsers.length + 1 }
      activeTool={ activeTool }
      onChangeTool={ setActiveTool }
      onZoomIn={ handleZoomIn }
      onZoomOut={ handleZoomOut }
      onOpenSettings={ () => toggleSettings(true) }
      historyVisible={ historyVisible }
      onToggleHistory={ () => toggleHistoryDrawer(!historyVisible) } />

    <div className='flex flex-grow overflow-hidden z-10'>
      <TrackList
        ref={ trackListRef }
        tracks={ tracksWithLockInfo }
        onVolumeChange={ handleTrackVolumeChange }
        onMuteToggle={ handleTrackMuteToggle }
        onSoloToggle={ handleTrackSoloToggle }
        onArmToggle={ handleTrackArmToggle }
        onLockToggle={ handleTrackLockToggle }
        onRename={ handleTrackRename }
        trackHeight={ trackHeight }
        scrollTop={ verticalScrollPosition }
        onTrackListScroll={ handleTrackListScroll }
        localUserId={ state.localUserId } />

      <CompositionGridView
        tracks={ tracks }
        blocks={ blocks }
        currentTime={ currentTime }
        totalTime={ totalTime }
        currentBeat={ currentBeat }
        pixelsPerBeat={ pixelsPerBeat }
        trackHeight={ trackHeight }
        beatsPerBar={ beatsPerBar }
        totalBars={ totalBars }
        containerWidth={ containerWidth }
        selectedBlockId={ selectedBlockId }
        activeTool={ activeTool }
        horizontalScrollPosition={ horizontalScrollPosition }
        verticalScrollPosition={ verticalScrollPosition }
        snapToGrid={ settings.snapToGrid }
        gridSize={ settings.gridSize }
        localUserId={ state.localUserId }
        markers={ markers.map(marker => ({
          id:       marker.id,
          position: marker.position,
          color:    marker.color,
          icon:     marker.icon,
          label:    marker.label
        })) }
        onSeek={ handleSeek }
        onScroll={ handleScroll }
        onContainerClick={ handleContainerClick }
        onContainerDoubleClick={ handleContainerDoubleClick }
        onSelectBlock={ handleSelectBlock }
        onBlockPositionChange={ handleBlockPositionChange }
        onBlockLengthChange={ handleBlockLengthChange }
        onDeleteBlock={ handleDeleteBlock }
        onDuplicateBlock={ handleDuplicate }
        onBlockNameChange={ handleBlockNameChange }
        onToggleBlockLock={ handleToggleLock }
        onOpenBlockProperties={ handleOpenProperties }
        onAddMarker={ handleAddMarker }
        onEditMarker={ handleEditMarker }
        onDeleteMarker={ handleDeleteMarker }
        onDragEnter={ handleDragEnter }
        onDragOver={ handleDragOver }
        onDragLeave={ handleDragLeave }
        onDrop={ handleDrop }
        isDragOver={ isDragOver }
        placeholderBlock={ placeholderBlock }
        onAddBlock={ handleAddBlockFromContext }
        onUploadAudio={ handleUploadAudioFromContext } />
    </div>

    <ProjectHistoryDrawer
      open={ historyVisible }
      onOpenChange={ toggleHistoryDrawer } />

    <SettingsDialog
      open={ isSettingsOpen }
      onOpenChange={ toggleSettings }
      settings={ settings }
      onSettingsChange={ handleSettingsChange } />

    {selectedBlockId && selectedBlock &&
        <ClipEditPopup
          blockId={ selectedBlockId }
          name={ selectedBlock.name }
          volume={ selectedBlock.volume }
          pitch={ selectedBlock.pitch }
          position={ clipPopupPosition }
          onNameChange={ handleBlockNameChange }
          onVolumeChange={ handleBlockVolumeChange }
          onPitchChange={ handleBlockPitchChange }
          onDelete={ handleDeleteBlock }
          onClose={ () => {
            if (selectedBlockId)
              endEditingBlock(selectedBlockId)
            deselectBlock()
          } } />
    }

    {showCollaborators && remoteUsers.map(user =>
      <RemoteUser
        key={ user.id }
        id={ user.id }
        name={ user.name }
        position={ user.position }
        color={ user.color } />
    )}
  </div>
}

export default ProjectView

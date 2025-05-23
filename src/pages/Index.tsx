import React, { useEffect, useRef, useState } from 'react';
import TrackList from '@/components/TrackList';
import TrackBlock from '@/components/TrackBlock';
import Timeline from '@/components/Timeline';
import SettingsDialog from '@/components/SettingsDialog';
import RemoteUser from '@/components/RemoteUser';
import ClipEditPopup from '@/components/ClipEditPopup';
import ProjectHistoryDrawer from '@/components/ProjectHistoryDrawer';
import { toast } from "@/hooks/use-toast";
import { Button } from '@/components/ui/button';
import { Record } from '@/components/Record';
import { ToolType } from '@/components/ToolsMenu';
import { useProject } from '@/contexts/ProjectContext';
import { ui } from '@/styles/ui-classes';
import ToolbarWithStatus from '@/components/ToolbarWithStatus';
import { createSampleProject } from '@/utils/sampleProject';
import { useNavigate } from 'react-router-dom';
import { ActionType } from '@/types/collaborative';
import { TrackInfo } from '@/components/TrackList';

const Index = () => {
  const {
    // State from context
    state,
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
    // Legacy support
    sendGeneralMessage
  } = useProject();

  const navigate = useNavigate();

  // Refs for DOM elements
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const trackListRef = useRef<HTMLDivElement>(null);

  // Local UI state that doesn't belong in global context
  const [containerWidth, setContainerWidth] = useState(0);
  const [clipPopupPosition, setClipPopupPosition] = useState({ x: 0, y: 0 });

  // Drag and drop state
  const [isDragOver, setIsDragOver] = useState(false);
  const [dragPosition, setDragPosition] = useState<{x: number, y: number} | null>(null);
  const [placeholderBlock, setPlaceholderBlock] = useState<{track: number, startBeat: number, lengthBeats: number} | null>(null);

  // Derived values from context state
  const isPlaying = state.isPlaying;
  const bpm = state.project.bpm;
  const masterVolume = state.project.masterVolume;
  const currentBeat = state.currentBeat;
  const selectedBlockId = state.selectedBlockId;
  const isSettingsOpen = state.isSettingsOpen;
  const pixelsPerBeat = state.pixelsPerBeat;
  const trackHeight = state.trackHeight;
  const beatsPerBar = state.beatsPerBar;
  const totalBars = state.totalBars;
  const activeTool = state.activeTool;
  const settings = state.project.settings;
  const tracks = state.tracks;
  const blocks = state.blocks;
  const historyVisible = state.historyVisible;
  const showCollaborators = settings.showCollaborators;
  const horizontalScrollPosition = state.scrollPosition.horizontal;
  const verticalScrollPosition = state.scrollPosition.vertical;

  const remoteUsers = state.remoteUsers.map(collaborator => ({
    id: collaborator.id,
    name: collaborator.name,
    position: collaborator.position,
    color: collaborator.color
  }));

  // Initialize with default tracks and blocks for demo
  useEffect(() => {
    if (tracks.length === 0) {
      // Add default tracks
      const defaultTracks = [
        { name: 'Drums', color: '#FF466A', volume: 80, muted: false, solo: false, armed: false },
        { name: 'Bass', color: '#FFB446', volume: 75, muted: false, solo: false, armed: false },
        { name: 'Synth', color: '#64C850', volume: 70, muted: false, solo: false, armed: false },
        { name: 'Vocals', color: '#5096FF', volume: 85, muted: false, solo: false, armed: false },
      ];

      defaultTracks.forEach(trackData => {
        addTrack(trackData);
      });

      // Add default blocks after a brief delay to ensure tracks are created
      setTimeout(() => {
        const defaultBlocks = [
          { name: 'Kick', track: 0, startBeat: 0, lengthBeats: 4, volume: 80, pitch: 0 },
          { name: 'Snare', track: 0, startBeat: 8, lengthBeats: 4, volume: 75, pitch: 0 },
          { name: 'Bass Line', track: 1, startBeat: 4, lengthBeats: 8, volume: 70, pitch: 0 },
          { name: 'Synth Lead', track: 2, startBeat: 12, lengthBeats: 6, volume: 65, pitch: 0 },
          { name: 'Vocal Chop', track: 3, startBeat: 16, lengthBeats: 8, volume: 85, pitch: 2 },
        ];

        defaultBlocks.forEach(blockData => {
          addBlock(blockData);
        });
      }, 100);
    }
  }, [tracks.length, addTrack, addBlock]);

  // Helper functions for drag and drop
  const isAudioFile = (file: File): boolean => {
    const audioExtensions = ['.mp3', '.wav', '.ogg', '.m4a', '.aac', '.flac', '.wma'];
    const fileName = file.name.toLowerCase();
    return audioExtensions.some(ext => fileName.endsWith(ext));
  };

  const calculateDropPosition = (e: React.DragEvent<HTMLDivElement>) => {
    if (!scrollContainerRef.current) return null;

    const rect = scrollContainerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left + horizontalScrollPosition;
    const y = e.clientY - rect.top + verticalScrollPosition;

    const trackIndex = Math.floor(y / trackHeight);
    let beatPosition = x / pixelsPerBeat;

    // Apply snapping if enabled
    if (settings.snapToGrid) {
      beatPosition = Math.round(beatPosition / settings.gridSize) * settings.gridSize;
    }

    // Default block length (can be made configurable)
    const defaultLength = 4;

    return {
      track: Math.max(0, Math.min(trackIndex, tracks.length - 1)),
      startBeat: Math.max(0, beatPosition),
      lengthBeats: defaultLength
    };
  };

  // Event handlers using context actions
  const handleDuplicate = (blockId: string) => {
    duplicateBlock(blockId);
    const block = blocks.find(b => b.id === blockId);
    if (block) {
      toast({
        title: "Block Duplicated",
        description: `Created a copy of "${block.name}".`,
      });
    }
  };

  const handleToggleLock = (blockId: string) => {
    const block = blocks.find(b => b.id === blockId);
    if (!block) return;

    if (block.editingUserId) {
      endEditingBlock(blockId);
    } else {
      startEditingBlock(blockId);
    }

    toast({
      title: "Block Lock Changed",
      description: "Block editing status has been updated.",
    });
  };

  const handleOpenProperties = (blockId: string) => {
    const block = blocks.find(block => block.id === blockId);
    if (!block) return;

    if (block.editingUserId && block.editingUserId !== state.localUserId) {
      toast({
        title: "Block is being edited",
        description: `This clip is currently being edited by another user.`,
        variant: "destructive",
      });
      return;
    }

    handleSelectBlock(blockId);
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollLeft, scrollTop } = e.currentTarget;
    setScrollPosition(scrollLeft, scrollTop);

    if (timelineRef.current) {
      timelineRef.current.scrollLeft = scrollLeft;
    }
    if (trackListRef.current) {
      trackListRef.current.scrollTop = scrollTop;
    }
  };

  const isTrackLocked = (trackIndex: number): boolean => {
    return blocks.some(block =>
      block.track === trackIndex &&
      block.editingUserId &&
      block.editingUserId !== state.localUserId
    );
  };

  const handleSelectBlock = (id: string) => {
    const block = blocks.find(block => block.id === id);
    if (!block) return;

    if (block.editingUserId && block.editingUserId !== state.localUserId) {
      toast({
        title: "Block is being edited",
        description: `This clip is currently being edited by another user.`,
        variant: "destructive",
      });
      return;
    }

    if (selectedBlockId) {
      endEditingBlock(selectedBlockId);
    }

    startEditingBlock(id);
    selectBlock(id);

    // Update clip popup position for UI
    if (scrollContainerRef.current && block) {
      const blockX = block.startBeat * pixelsPerBeat;
      const blockY = block.track * trackHeight;

      setClipPopupPosition({
        x: blockX - horizontalScrollPosition,
        y: blockY - verticalScrollPosition + trackHeight
      });
    }
  };

  // Connection/initialization effect
  useEffect(() => {
    // Mark the track area with the project-area class for cursor tracking
    const trackArea = scrollContainerRef.current;
    if (trackArea) {
      trackArea.classList.add('project-area');
    }

    // Send a general message to notify others that we've joined
    sendGeneralMessage({
      type: 'user_joined',
      message: `${state.localUserName} joined the session`
    });

    // Listen for general messages
    const handleGeneralMessage = (message: any) => {
      if (message.type === 'user_joined' && message.userId !== state.localUserId) {
        toast({
          title: "User Joined",
          description: message.message,
        });
      }
    };

    const webSocketService = window.getWebSocketService?.();
    if (webSocketService) {
      webSocketService.on('generalMessage', handleGeneralMessage);
    }

    return () => {
      if (webSocketService) {
        webSocketService.off('generalMessage', handleGeneralMessage);
      }
    };
  }, []);

  const handleBlockPositionChange = (id: string, newTrack: number, newStartBeat: number) => {
    if (isTrackLocked(newTrack)) {
      toast({
        title: "Track Locked",
        description: "This track has clips being edited by other users.",
        variant: "destructive",
      });
      return;
    }

    let adjustedStartBeat = newStartBeat;
    if (settings.snapToGrid) {
      adjustedStartBeat = Math.round(newStartBeat / settings.gridSize) * settings.gridSize;
    }

    moveBlock(id, newTrack, adjustedStartBeat);

    // Notify other users about the block move
    sendGeneralMessage({
      type: 'block_moved',
      blockId: id,
      trackId: newTrack,
      startBeat: adjustedStartBeat,
      message: `Block moved to track ${newTrack + 1}, beat ${adjustedStartBeat + 1}`
    });
  };

  const handleBlockLengthChange = (id: string, newLength: number) => {
    let adjustedLength = newLength;
    if (settings.snapToGrid) {
      adjustedLength = Math.max(settings.gridSize,
        Math.round(newLength / settings.gridSize) * settings.gridSize);
    }

    resizeBlock(id, adjustedLength);
  };

  const handlePlay = () => {
    play();
    toast({
      title: "Playback Started",
      description: "Your composition is now playing.",
    });
  };

  const handlePause = () => {
    pause();
  };

  const handleRestart = () => {
    restart();
  };

  const handleTrackVolumeChange = (trackId: string, volume: number) => {
    setTrackVolume(trackId, volume);
  };

  const handleTrackMuteToggle = (trackId: string) => {
    const track = tracks.find(t => t.id === trackId);
    if (track) {
      muteTrack(trackId, !track.muted);
    }
  };

  const handleTrackSoloToggle = (trackId: string) => {
    const track = tracks.find(t => t.id === trackId);
    if (track) {
      soloTrack(trackId, !track.solo);
    }
  };

  const handleTrackArmToggle = (trackId: string) => {
    const track = tracks.find(t => t.id === trackId);
    if (track) {
      armTrack(trackId, !track.armed);
    }
  };

  const handleTrackLockToggle = (trackId: string) => {
    const track = tracks.find(t => t.id === trackId);
    if (track) {
      if (track.locked) {
        unlockTrack(trackId);
      } else {
        lockTrack(trackId);
      }
    }

    toast({
      title: "Track Lock Changed",
      description: "Track locking status has been updated.",
    });
  };

  const handleTrackRename = (trackId: string, newName: string) => {
    renameTrack(trackId, newName);

    toast({
      title: "Track Renamed",
      description: `Track has been renamed to "${newName}".`,
    });
  };

  const handleTrackListScroll = (scrollTop: number) => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollTop;
      setScrollPosition(horizontalScrollPosition, scrollTop);
    }
  };

  const handleAddTrack = () => {
    const colors = ['#FF466A', '#FFB446', '#64C850', '#5096FF'];
    const newColor = colors[tracks.length % colors.length];

    const newTrackData = {
      name: `Track ${tracks.length + 1}`,
      color: newColor,
      volume: 75,
      muted: false,
      solo: false,
      armed: false
    };

    addTrack(newTrackData);

    toast({
      title: "Track Added",
      description: "A new track has been added to your composition.",
    });
  };

  const handleBlockNameChange = (id: string, name: string) => {
    updateBlock(id, { name });
  };

  const handleBlockVolumeChange = (id: string, volume: number) => {
    updateBlock(id, { volume });
  };

  const handleBlockPitchChange = (id: string, pitch: number) => {
    updateBlock(id, { pitch });
  };

  const handleDeleteBlock = (id: string) => {
    removeBlock(id);
    deselectBlock();

    toast({
      title: "Clip Deleted",
      description: "The audio clip has been removed from your track.",
      variant: "destructive",
    });
  };

  const handleAddMarker = (marker: any) => {};
  const handleEditMarker = (id: string, changes: any) => {};
  const handleDeleteMarker = (id: string) => {};

  const handleSettingsChange = (key: string, value: any) => {
    updateProjectSettings({
      [key]: value
    });
  };

  const formatTime = (beats: number): string => {
    const seconds = (beats * 60) / bpm;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    const milliseconds = Math.floor((seconds % 1) * 1000);
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}:${milliseconds.toString().padStart(3, '0')}`;
  };

  const currentTime = formatTime(currentBeat);
  const totalTime = formatTime(totalBars * beatsPerBar);

  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setCurrentBeat(prev => {
        const totalBeats = totalBars * beatsPerBar;
        const next = (prev + 0.1) % totalBeats;
        return next;
      });
    }, 60000 / bpm / 10);

    return () => clearInterval(interval);
  }, [isPlaying, bpm, beatsPerBar, totalBars]);

  const handleContainerClick = (e: React.MouseEvent) => {
    if (e.currentTarget === e.target) {
      deselectBlock();
    }
  };

  const handleContainerDoubleClick = (e: React.MouseEvent) => {};

  // Drag and drop handlers
  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    // Check if any files being dragged are audio files
    const hasAudioFiles = Array.from(e.dataTransfer.items).some(item =>
      item.kind === 'file' && isAudioFile(item.getAsFile()!)
    );

    if (hasAudioFiles) {
      setIsDragOver(true);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isDragOver) return;

    const position = calculateDropPosition(e);
    if (position) {
      setPlaceholderBlock(position);
      setDragPosition({ x: e.clientX, y: e.clientY });
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    // Only clear drag state if leaving the container entirely
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
      setPlaceholderBlock(null);
      setDragPosition(null);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    setIsDragOver(false);
    setPlaceholderBlock(null);
    setDragPosition(null);

    const files = Array.from(e.dataTransfer.files);
    const audioFiles = files.filter(isAudioFile);

    if (audioFiles.length === 0) {
      toast({
        title: "Invalid File Type",
        description: "Please drop audio files (.mp3, .wav, .ogg, .m4a, .aac, .flac, .wma)",
        variant: "destructive",
      });
      return;
    }

    const dropPosition = calculateDropPosition(e);
    if (!dropPosition) return;

    // Create audio blocks for each dropped file
    audioFiles.forEach((file, index) => {
      const fileName = file.name.replace(/\.[^/.]+$/, ""); // Remove extension
      const blockData = {
        name: fileName,
        track: dropPosition.track,
        startBeat: dropPosition.startBeat + (index * dropPosition.lengthBeats), // Offset each file
        lengthBeats: dropPosition.lengthBeats,
        volume: 80,
        pitch: 0,
        fileId: `file-${Date.now()}-${index}` // Placeholder file ID
      };

      addBlock(blockData);
    });

    toast({
      title: "Audio Files Added",
      description: `Added ${audioFiles.length} audio block${audioFiles.length > 1 ? 's' : ''} to track ${dropPosition.track + 1}`,
    });
  };

  const handleSeek = (beat: number) => {
    setCurrentBeat(beat);
  };

  const handleZoomIn = () => {
    const newZoom = Math.min(pixelsPerBeat + 10, 80);
    setZoom(newZoom);
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(pixelsPerBeat - 10, 20);
    setZoom(newZoom);
  };

  const getTrackEditingUserId = (trackIndex: number) => {
    return blocks.find(
      block => block.track === trackIndex &&
               block.editingUserId &&
               block.editingUserId !== state.localUserId
    )?.editingUserId || null;
  };

  const getUserColor = (userId: string | null | undefined): string => {
    if (!userId) return '';
    const user = remoteUsers.find(u => u.id === userId);
    return user ? user.color : '#888888';
  };

  const tracksWithLockInfo = tracks.map((track, index) => {
    const editingUserId = getTrackEditingUserId(index);
    return {
      ...track,
      locked: !!editingUserId,
      lockedByUser: editingUserId
    };
  });

  const selectedBlock = blocks.find(block => block.id === selectedBlockId);

  const handleCreateSampleProject = async () => {
    try {
      toast({
        title: "Creating Sample Project",
        description: "Setting up a sample project with tracks and audio blocks...",
      });

      const projectId = await createSampleProject();

      toast({
        title: "Sample Project Created!",
        description: "Navigating to your new project...",
      });

      // Navigate to the new project
      navigate(`/project/${projectId}`);
    } catch (error) {
      console.error('Error creating sample project:', error);
      toast({
        title: "Error",
        description: "Failed to create sample project. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className={ui.layout.fullScreen}>
      <div className={ui.overlay.gradient} />

      {/* Sample Project Button */}
      <div className="absolute top-4 right-4 z-20">
        <Button
          onClick={handleCreateSampleProject}
          className="bg-primary hover:bg-primary/90"
        >
          Create Sample Project
        </Button>
      </div>

      <ToolbarWithStatus
        isPlaying={isPlaying}
        bpm={bpm}
        volume={masterVolume}
        onPlay={handlePlay}
        onPause={handlePause}
        onRestart={handleRestart}
        onBpmChange={setBpm}
        onVolumeChange={setMasterVolume}
        onAddTrack={handleAddTrack}
        usersCount={remoteUsers.length + 1}
        activeTool={activeTool}
        onChangeTool={setActiveTool}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onOpenSettings={() => toggleSettings(true)}
        historyVisible={historyVisible}
        onToggleHistory={() => toggleHistoryDrawer(!historyVisible)}
      />

      <div className="flex flex-grow overflow-hidden z-10">
        <TrackList
          ref={trackListRef}
          tracks={tracksWithLockInfo}
          onVolumeChange={handleTrackVolumeChange}
          onMuteToggle={handleTrackMuteToggle}
          onSoloToggle={handleTrackSoloToggle}
          onArmToggle={handleTrackArmToggle}
          onLockToggle={handleTrackLockToggle}
          onRename={handleTrackRename}
          trackHeight={trackHeight}
          scrollTop={verticalScrollPosition}
          onTrackListScroll={handleTrackListScroll}
          localUserId={state.localUserId}
        />

        <div className="flex-grow overflow-hidden flex flex-col">
          <Timeline
            ref={timelineRef}
            width={containerWidth}
            pixelsPerBeat={pixelsPerBeat}
            beatsPerBar={beatsPerBar}
            totalBars={totalBars}
            currentTime={currentTime}
            totalTime={totalTime}
            markers={[]}
            onAddMarker={handleAddMarker}
            onEditMarker={handleEditMarker}
            onDeleteMarker={handleDeleteMarker}
            onSeek={handleSeek}
            scrollLeft={horizontalScrollPosition}
          />

          <div
            ref={scrollContainerRef}
            className={`${ui.layout.growContainer} project-area ${isDragOver ? 'bg-primary/5' : ''}`}
            onClick={handleContainerClick}
            onDoubleClick={handleContainerDoubleClick}
            onScroll={handleScroll}
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div
              className="absolute inset-0"
              style={{
                width: `${totalBars * beatsPerBar * pixelsPerBeat}px`,
                minHeight: `${tracks.length * trackHeight}px`
              }}
            >
              {tracks.map((_, index) => {
                const editingUserId = getTrackEditingUserId(index);
                const userColor = getUserColor(editingUserId);

                return (
                  <div key={index} className="track-edited-by-user absolute left-0 right-0">
                    <div
                      className="absolute left-0 right-0 border-b border-border"
                      style={{
                        top: `${(index + 1) * trackHeight}px`,
                      }}
                    />
                    {editingUserId && (
                      <div
                        className="absolute pointer-events-none"
                        style={{
                          top: `${index * trackHeight}px`,
                          left: 0,
                          right: 0,
                          height: `${trackHeight}px`,
                          backgroundColor: userColor,
                          opacity: 0.1
                        }}
                      />
                    )}
                  </div>
                );
              })}

              {/* Placeholder block for drag and drop */}
              {placeholderBlock && (
                <div
                  className="absolute border-2 border-dashed border-primary bg-primary/20 rounded-md pointer-events-none"
                  style={{
                    left: `${placeholderBlock.startBeat * pixelsPerBeat}px`,
                    top: `${placeholderBlock.track * trackHeight + 4}px`,
                    width: `${placeholderBlock.lengthBeats * pixelsPerBeat}px`,
                    height: `${trackHeight - 8}px`,
                    zIndex: 1000
                  }}
                >
                  <div className="flex items-center justify-center h-full text-primary font-medium text-sm">
                    Drop Audio Here
                  </div>
                </div>
              )}

              {/* Enhanced blocks with drag-and-drop */}
              {blocks.map(block => (
                <TrackBlock
                  key={block.id}
                  id={block.id}
                  track={block.track}
                  startBeat={block.startBeat}
                  lengthBeats={block.lengthBeats}
                  name={block.name}
                  selected={block.id === selectedBlockId}
                  onSelect={handleSelectBlock}
                  onPositionChange={handleBlockPositionChange}
                  onLengthChange={handleBlockLengthChange}
                  pixelsPerBeat={pixelsPerBeat}
                  trackHeight={trackHeight}
                  editingUserId={block.editingUserId}
                  isTrackLocked={isTrackLocked(block.track)}
                  activeTool={activeTool}
                  localUserId={state.localUserId}
                  currentBeat={currentBeat}
                  onDeleteBlock={handleDeleteBlock}
                  onDuplicateBlock={handleDuplicate}
                  onBlockNameChange={handleBlockNameChange}
                  onBlockLockToggle={handleToggleLock}
                  onOpenBlockProperties={handleOpenProperties}
                  snapToGridSize={settings.snapToGrid ? settings.gridSize : 0}
                  gridSize={settings.gridSize}
                  color={tracks[block.track]?.color}
                />
              ))}

              <div
                className="playhead"
                style={{
                  left: `${currentBeat * pixelsPerBeat}px`,
                  height: '100%',
                  position: 'absolute',
                  top: 0
                }}
              />
            </div>
          </div>
        </div>
      </div>

      <ProjectHistoryDrawer
        open={historyVisible}
        onOpenChange={toggleHistoryDrawer}
      />

      <SettingsDialog
        open={isSettingsOpen}
        onOpenChange={toggleSettings}
        settings={settings}
        onSettingsChange={handleSettingsChange}
      />

      {selectedBlockId && selectedBlock && (
        <ClipEditPopup
          blockId={selectedBlockId}
          name={selectedBlock.name}
          volume={selectedBlock.volume}
          pitch={selectedBlock.pitch}
          position={clipPopupPosition}
          onNameChange={handleBlockNameChange}
          onVolumeChange={handleBlockVolumeChange}
          onPitchChange={handleBlockPitchChange}
          onDelete={handleDeleteBlock}
          onClose={() => {
            if (selectedBlockId) {
              endEditingBlock(selectedBlockId);
            }
            deselectBlock();
          }}
        />
      )}
    </div>
  );
};

export default Index;

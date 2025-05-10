import React, { useState, useEffect, useRef } from 'react';
import Toolbar from '@/components/Toolbar';
import TrackList from '@/components/TrackList';
import TrackBlock from '@/components/TrackBlock';
import Timeline from '@/components/Timeline';
import SettingsDialog from '@/components/SettingsDialog';
import RemoteUser from '@/components/RemoteUser';
import ClipEditPopup from '@/components/ClipEditPopup';
import ToolsMenu from '@/components/ToolsMenu';
import ProjectHistoryDrawer from '@/components/ProjectHistoryDrawer';
import { toast } from "@/hooks/use-toast";
import { Settings, History } from 'lucide-react';
import { Record } from '@/components/Record';
import { Button } from '@/components/ui/button';
import { ToolType } from '@/components/ToolsMenu';
import { useProject } from '@/contexts/ProjectContext';
import { TrackInfo } from '@/components/TrackList';
import { ActionType } from '@/types/collaborative';

interface Block {
  id: string;
  name: string;
  track: number;
  startBeat: number;
  lengthBeats: number;
  volume: number;
  pitch: number;
  editingUserId?: string | null;
}

interface RemoteUserInfo {
  id: string;
  name: string;
  position: { x: number; y: number };
  color: string;
}

const remoteUsers: RemoteUserInfo[] = [
  {
    id: 'user1',
    name: 'Emma',
    position: { x: 350, y: 150 },
    color: '#F472B6'
  },
  {
    id: 'user2',
    name: 'Alex',
    position: { x: 550, y: 250 },
    color: '#60A5FA'
  }
];

const Index = () => {
  const { state, sendMessage, historyVisible, setHistoryVisible } = useProject();
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [bpm, setBpm] = useState(120);
  const [masterVolume, setMasterVolume] = useState(80);
  const [currentBeat, setCurrentBeat] = useState(0);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [pixelsPerBeat, setPixelsPerBeat] = useState(40);
  const [trackHeight, setTrackHeight] = useState(80);
  const [beatsPerBar] = useState(4);
  const [totalBars] = useState(16);
  const [showCollaborators, setShowCollaborators] = useState(true);
  const [clipPopupPosition, setClipPopupPosition] = useState({ x: 0, y: 0 });
  const [activeTool, setActiveTool] = useState<ToolType>('select');
  
  const tracksContainerRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const trackListRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  
  const [horizontalScrollPosition, setHorizontalScrollPosition] = useState(0);
  const [verticalScrollPosition, setVerticalScrollPosition] = useState(0);

  const [settings, setSettings] = useState({
    snapToGrid: true,
    gridSize: 1,
    autoSave: true,
    showCollaborators: true,
    theme: 'dark' as const,
  });
  
  // Convert state data to component props format
  const [tracks, setTracks] = useState<TrackInfo[]>([
    { id: 'track1', name: 'Drums', color: '#FF466A', volume: 80, muted: false, solo: false, armed: false },
    { id: 'track2', name: 'Bass', color: '#FFB446', volume: 75, muted: false, solo: false, armed: false },
    { id: 'track3', name: 'Synth', color: '#64C850', volume: 70, muted: false, solo: false, armed: false },
    { id: 'track4', name: 'Vocals', color: '#5096FF', volume: 85, muted: false, solo: false, armed: false },
  ]);
  
  const [blocks, setBlocks] = useState<Block[]>([
    { id: 'block1', name: 'Kick', track: 0, startBeat: 0, lengthBeats: 4, volume: 80, pitch: 0 },
    { id: 'block2', name: 'Snare', track: 0, startBeat: 8, lengthBeats: 4, volume: 75, pitch: 0 },
    { id: 'block3', name: 'Bass Line', track: 1, startBeat: 4, lengthBeats: 8, volume: 70, pitch: 0, editingUserId: 'user1' },
    { id: 'block4', name: 'Synth Lead', track: 2, startBeat: 12, lengthBeats: 6, volume: 65, pitch: 0 },
    { id: 'block5', name: 'Vocal Chop', track: 3, startBeat: 16, lengthBeats: 8, volume: 85, pitch: 2 },
  ]);
  
  const handleSelectBlock = (id: string) => {
    // Check if the block is being edited by someone else
    // const block = blocks.find(block => block.id === id);
    // if (block?.editingUserId && block.editingUserId !== webSocketService.getLocalUserId()) {
    //   toast({
    //     title: "Block is being edited",
    //     description: `This clip is currently being edited by another user.`,
    //     variant: "destructive",
    //   });
    //   return;
    // }
    
    // // End editing previous block
    // if (selectedBlockId) {
    //   webSocketService.endEditingBlock(selectedBlockId);
    // }
    
    // // Position the edit popup
    // if (tracksContainerRef.current && block) {
    //   const blockX = block.startBeat * pixelsPerBeat;
    //   const blockY = block.track * trackHeight;
      
    //   setClipPopupPosition({
    //     x: blockX - horizontalScrollPosition,
    //     y: blockY - verticalScrollPosition + trackHeight
    //   });
    // }
    
    setSelectedBlockId(id);
    
    // // Start editing new block
    // webSocketService.startEditingBlock(id);
  };
  
  const selectedBlock = blocks.find(block => block.id === selectedBlockId);
  
  // Check if a track is locked (has a block being edited by someone else)
  const isTrackLocked = (trackIndex: number): boolean => {
    return false;
  };
  
  const handleBlockPositionChange = (id: string, newTrack: number, newStartBeat: number) => {
    // Check if the target track is locked
    if (isTrackLocked(newTrack)) {
      toast({
        title: "Track Locked",
        description: "This track has clips being edited by other users.",
        variant: "destructive",
      });
      return;
    }

    // Apply grid snapping if enabled
    let adjustedStartBeat = newStartBeat;
    if (settings.snapToGrid) {
      adjustedStartBeat = Math.round(newStartBeat / settings.gridSize) * settings.gridSize;
    }
    
    setBlocks(prevBlocks => 
      prevBlocks.map(block => 
        block.id === id 
          ? { ...block, track: newTrack, startBeat: adjustedStartBeat } 
          : block
      )
    );
    
    // Send update via WebSocket
    sendMessage(ActionType.MOVE_BLOCK, { 
      blockId: id, 
      trackId: newTrack,
      startBeat: adjustedStartBeat 
    });
  };
  
  const handleBlockLengthChange = (id: string, newLength: number) => {
    // Apply grid snapping if enabled
    let adjustedLength = newLength;
    if (settings.snapToGrid) {
      adjustedLength = Math.max(settings.gridSize, 
        Math.round(newLength / settings.gridSize) * settings.gridSize);
    }
    
    setBlocks(prevBlocks => 
      prevBlocks.map(block => 
        block.id === id 
          ? { ...block, lengthBeats: adjustedLength } 
          : block
      )
    );
    
    // Send update via WebSocket
    sendMessage(ActionType.RESIZE_BLOCK, { 
      blockId: id, 
      lengthBeats: adjustedLength 
    });
  };
  
  const handlePlay = () => {
    setIsPlaying(true);
    sendMessage(ActionType.PLAY, {});
    toast({
      title: "Playback Started",
      description: "Your composition is now playing.",
    });
  };
  
  const handlePause = () => {
    setIsPlaying(false);
    sendMessage(ActionType.PAUSE, {});
  };
  
  const handleRestart = () => {
    setCurrentBeat(0);
    if (!isPlaying) {
      setIsPlaying(true);
    }
    sendMessage(ActionType.RESTART, {});
  };
  
  const handleTrackVolumeChange = (trackId: string, volume: number) => {
    setTracks(prevTracks => 
      prevTracks.map(track => 
        track.id === trackId 
          ? { ...track, volume } 
          : track
      )
    );
    
    sendMessage(ActionType.SET_TRACK_VOLUME, { trackId, volume });
  };
  
  const handleTrackMuteToggle = (trackId: string) => {
    setTracks(prevTracks => {
      const updatedTracks = prevTracks.map(track => 
        track.id === trackId 
          ? { ...track, muted: !track.muted } 
          : track
      );
      
      const track = updatedTracks.find(t => t.id === trackId);
      if (track) {
        sendMessage(ActionType.MUTE_TRACK, { trackId, muted: track.muted });
      }
      
      return updatedTracks;
    });
  };
  
  const handleTrackSoloToggle = (trackId: string) => {
    setTracks(prevTracks => {
      const updatedTracks = prevTracks.map(track => 
        track.id === trackId 
          ? { ...track, solo: !track.solo } 
          : track
      );
      
      const track = updatedTracks.find(t => t.id === trackId);
      if (track) {
        sendMessage(ActionType.SOLO_TRACK, { trackId, solo: track.solo });
      }
      
      return updatedTracks;
    });
  };
  
  const handleTrackArmToggle = (trackId: string) => {
    setTracks(prevTracks => {
      const updatedTracks = prevTracks.map(track => 
        track.id === trackId 
          ? { ...track, armed: !track.armed } 
          : track
      );
      
      const track = updatedTracks.find(t => t.id === trackId);
      if (track) {
        sendMessage(ActionType.ARM_TRACK, { trackId, armed: track.armed });
      }
      
      return updatedTracks;
    });
  };
  
  const handleAddTrack = () => {
    const newTrackId = `track${tracks.length + 1}`;
    const colors = ['#FF466A', '#FFB446', '#64C850', '#5096FF'];
    const newColor = colors[tracks.length % colors.length];
    
    const newTrack: TrackInfo = { 
      id: newTrackId, 
      name: `Track ${tracks.length + 1}`, 
      color: newColor, 
      volume: 75, 
      muted: false, 
      solo: false,
      armed: false
    };
    
    setTracks([...tracks, newTrack]);
    
    // Send via WebSocket
    sendMessage(ActionType.ADD_TRACK, { track: newTrack });
    
    toast({
      title: "Track Added",
      description: "A new track has been added to your composition.",
    });
  };
  
  const handleBlockNameChange = (id: string, name: string) => {
    setBlocks(prevBlocks => 
      prevBlocks.map(block => 
        block.id === id 
          ? { ...block, name } 
          : block
      )
    );
    
    // Send update via WebSocket
    sendMessage(ActionType.UPDATE_BLOCK, { blockId: id, name });
  };
  
  const handleBlockVolumeChange = (id: string, volume: number) => {
    setBlocks(prevBlocks => 
      prevBlocks.map(block => 
        block.id === id 
          ? { ...block, volume } 
          : block
      )
    );
    
    // Send update via WebSocket
    sendMessage(ActionType.UPDATE_BLOCK, { blockId: id, volume });
  };
  
  const handleBlockPitchChange = (id: string, pitch: number) => {
    setBlocks(prevBlocks => 
      prevBlocks.map(block => 
        block.id === id 
          ? { ...block, pitch } 
          : block
      )
    );
    
    // Send update via WebSocket
    sendMessage(ActionType.UPDATE_BLOCK, { blockId: id, pitch });
  };
  
  const handleDeleteBlock = (id: string) => {
    setBlocks(prevBlocks => prevBlocks.filter(block => block.id !== id));
    setSelectedBlockId(null);
    
    // Send update via WebSocket
    sendMessage(ActionType.REMOVE_BLOCK, { blockId: id });
    
    toast({
      title: "Clip Deleted",
      description: "The audio clip has been removed from your track.",
      variant: "destructive",
    });
  };
  
  const handleAddMarker = (marker: any) => {
    // const newMarker = {
    //   id: `marker${Date.now()}`,
    //   ...marker
    // };
    
    // setMarkers([...markers, newMarker]);
    
    // toast({
    //   title: "Marker Added",
    //   description: `Marker "${marker.label || 'New marker'}" has been added to the timeline.`,
    // });
  };
  
  const handleEditMarker = (id: string, changes: any) => {
    // setMarkers(prevMarkers => 
    //   prevMarkers.map(marker => 
    //     marker.id === id 
    //       ? { ...marker, ...changes } 
    //       : marker
    //   )
    // );
  };
  
  const handleDeleteMarker = (id: string) => {
    // setMarkers(prevMarkers => prevMarkers.filter(marker => marker.id !== id));
    
    // toast({
    //   title: "Marker Deleted",
    //   description: "The timeline marker has been removed.",
    //   variant: "destructive",
    // });
  };

  const handleSettingsChange = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
    
    // Apply specific setting changes
    if (key === 'showCollaborators') {
      setShowCollaborators(value);
    }
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
  
  const handleTracksContainerScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollLeft, scrollTop } = e.currentTarget;
    setHorizontalScrollPosition(scrollLeft);
    setVerticalScrollPosition(scrollTop);
  };
  
  const handleTimelineScroll = (scrollLeft: number) => {
    setHorizontalScrollPosition(scrollLeft);
    if (tracksContainerRef.current) {
      tracksContainerRef.current.scrollLeft = scrollLeft;
    }
  };
  
  const handleTrackListScroll = (scrollTop: number) => {
    setVerticalScrollPosition(scrollTop);
    if (tracksContainerRef.current) {
      tracksContainerRef.current.scrollTop = scrollTop;
    }
  };

  const handleSeek = (beat: number) => {
    setCurrentBeat(beat);
  };

  const handleZoomIn = () => {
    setPixelsPerBeat(prev => Math.min(prev + 10, 80));
  };

  const handleZoomOut = () => {
    setPixelsPerBeat(prev => Math.max(prev - 10, 20));
  };
  
  const handleContainerClick = (e: React.MouseEvent) => {
    if (e.currentTarget === e.target) {
      setSelectedBlockId(null);
    }
  };
  
  const handleContainerDoubleClick = (e: React.MouseEvent) => {
    // if (e.currentTarget !== e.target || activeTool !== 'select') return;
    
    // const containerRect = tracksContainerRef.current?.getBoundingClientRect();
    // if (!containerRect) return;
    
    // const x = e.clientX - containerRect.left + horizontalScrollPosition;
    // const y = e.clientY - containerRect.top + verticalScrollPosition;
    
    // const track = Math.floor(y / trackHeight);
    // let startBeat = Math.floor(x / pixelsPerBeat);
    
    // // Apply grid snapping
    // if (settings.snapToGrid) {
    //   startBeat = Math.round(startBeat / settings.gridSize) * settings.gridSize;
    // }
    
    // // Check if the track is locked
    // if (isTrackLocked(track)) {
    //   toast({
    //     title: "Track Locked",
    //     description: "This track has clips being edited by other users.",
    //     variant: "destructive",
    //   });
    //   return;
    // }
    
    // if (track >= 0 && track < tracks.length) {
    //   const newBlock: Block = {
    //     id: `block${Date.now()}`,
    //     name: 'New Clip',
    //     track,
    //     startBeat,
    //     lengthBeats: settings.snapToGrid ? settings.gridSize * 4 : 4,
    //     volume: 75,
    //     pitch: 0
    //   };
      
    //   setBlocks([...blocks, newBlock]);
      
    //   // Position popup for the new block
    //   setClipPopupPosition({
    //     x: (startBeat * pixelsPerBeat) - horizontalScrollPosition,
    //     y: (track * trackHeight) - verticalScrollPosition + trackHeight
    //   });
      
    //   setSelectedBlockId(newBlock.id);
      
    //   // Start editing new block
    //   webSocketService.startEditingBlock(newBlock.id);
      
    //   // Send update via WebSocket
    //   webSocketService.sendMessage('blockUpdate', newBlock);
      
    //   toast({
    //     title: "Clip Added",
    //     description: "A new audio clip has been added to your track.",
    //   });
    // }
  };
  
  // Update track locked status and add user color highlighting for edited tracks
  const getTrackEditingUserId = (trackIndex: number) => {
    // const editingBlocks = blocks.filter(
    //   block => block.track === trackIndex && 
    //            block.editingUserId && 
    //            block.editingUserId !== webSocketService.getLocalUserId()
    // );
    
    // return editingBlocks.length > 0 ? editingBlocks[0].editingUserId : null;
    return null;
  };
  
  const tracksWithLockInfo = tracks.map((track, index) => {
    const editingUserId = getTrackEditingUserId(index);
    return {
      ...track,
      locked: !!editingUserId,
      lockedByUser: editingUserId
    };
  });

  // Get the user color of who is editing a track
  const getUserColor = (userId: string | null | undefined): string => {
    if (!userId) return '';
    
    const user = remoteUsers.find(u => u.id === userId);
    return user ? user.color : '#888888';
  };
  
  // Setup WebSocket listeners
  useEffect(() => {
    // const handleBlockUpdate = (message: any) => {
    //   const { data } = message;
      
    //   if (data.deleted) {
    //     setBlocks(prevBlocks => prevBlocks.filter(block => block.id !== data.id));
    //     if (selectedBlockId === data.id) {
    //       setSelectedBlockId(null);
    //     }
    //     return;
    //   }
      
    //   setBlocks(prevBlocks => 
    //     prevBlocks.map(block => 
    //       block.id === data.id 
    //         ? { ...block, ...data }
    //         : block
    //     )
    //   );
    // };
    
    // const handleBlockEditing = (message: any) => {
    //   const { data } = message;
      
    //   setBlocks(prevBlocks => 
    //     prevBlocks.map(block => 
    //       block.id === data.blockId 
    //         ? { ...block, editingUserId: data.userId }
    //         : block
    //     )
    //   );
    // };
    
    // const handleBlockEditingEnd = (message: any) => {
    //   const { data } = message;
      
    //   setBlocks(prevBlocks => 
    //     prevBlocks.map(block => 
    //       block.id === data.blockId 
    //         ? { ...block, editingUserId: null }
    //         : block
    //     )
    //   );
    // };
    
    // const handleRollback = (timestamp: number) => {
    //   console.log(`Rolling back state to ${new Date(timestamp).toISOString()}`);
    //   // In a real implementation, we would restore the state from a saved snapshot
    //   // For this demo, we'll just show a toast
    //   toast({
    //     title: "State Rollback",
    //     description: "Collaborative state has been synchronized.",
    //   });
    // };
    
    // webSocketService.on('blockUpdate', handleBlockUpdate);
    // webSocketService.on('blockEditing', handleBlockEditing);
    // webSocketService.on('blockEditingEnd', handleBlockEditingEnd);
    // webSocketService.on('rollback', handleRollback);
    
    // return () => {
    //   webSocketService.off('blockUpdate', handleBlockUpdate);
    //   webSocketService.off('blockEditing', handleBlockEditing);
    //   webSocketService.off('blockEditingEnd', handleBlockEditingEnd);
    //   webSocketService.off('rollback', handleRollback);
    // };
  }, [selectedBlockId]);
  
  // Close drawer and end editing on component unmount
  useEffect(() => {
    return () => {
      // if (selectedBlockId) {
      //   webSocketService.endEditingBlock(selectedBlockId);
      // }
    };
  }, [selectedBlockId]);
  
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background text-foreground track-colors-default">
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5 mix-blend-screen z-0" />
      
      <Toolbar 
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
      />
      
      <div className="flex justify-between px-4 py-2 bg-secondary border-b border-border z-10">
        <ToolsMenu 
          activeTool={activeTool}
          onChangeTool={setActiveTool}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
        />
        
        <div className="flex items-center space-x-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setHistoryVisible(!historyVisible)}
            className="flex items-center"
          >
            <History size={16} className="mr-1" />
            History
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setIsSettingsOpen(true)}
            className="flex items-center"
          >
            <Settings size={16} className="mr-1" />
            Settings
          </Button>
        </div>
      </div>
      
      <div className="flex flex-grow overflow-hidden z-10">
        <TrackList 
          ref={trackListRef}
          tracks={tracksWithLockInfo}
          onVolumeChange={handleTrackVolumeChange}
          onMuteToggle={handleTrackMuteToggle}
          onSoloToggle={handleTrackSoloToggle}
          onArmToggle={handleTrackArmToggle}
          onRename={() => {}}
          trackHeight={trackHeight}
          scrollTop={verticalScrollPosition}
          onTrackListScroll={handleTrackListScroll}
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
            onTimelineScroll={handleTimelineScroll}
          />
          
          <div 
            ref={tracksContainerRef}
            className="flex-grow relative overflow-auto"
            onClick={handleContainerClick}
            onDoubleClick={handleContainerDoubleClick}
            onScroll={handleTracksContainerScroll}
          >
            <div 
              className="absolute inset-0 pointer-events-none"
              style={{ width: `${totalBars * beatsPerBar * pixelsPerBeat}px` }}
            >
              {tracks.map((_, index) => {
                const editingUserId = getTrackEditingUserId(index);
                const userColor = getUserColor(editingUserId);
                
                return (
                  <div key={index} className="track-edited-by-user">
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
            </div>
            
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
                isTrackLocked={isTrackLocked(block.track) && block.editingUserId !== null}
                activeTool={activeTool}
              />
            ))}
            
            <div 
              className="playhead"
              style={{ 
                left: `${(currentBeat * pixelsPerBeat) - horizontalScrollPosition}px`,
                position: 'fixed',
                height: '100%',
                top: tracks.length ? '16rem' : 0 
              }}
            />
            
            {showCollaborators && remoteUsers.map(user => (
              <RemoteUser 
                key={user.id}
                id={user.id}
                name={user.name}
                position={user.position}
                color={user.color}
              />
            ))}
            
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
                  setSelectedBlockId(null);
                  // if (selectedBlockId) {
                  //   webSocketService.endEditingBlock(selectedBlockId);
                  // }
                }}
              />
            )}
          </div>
        </div>
      </div>

      <ProjectHistoryDrawer 
        open={historyVisible}
        onOpenChange={setHistoryVisible}
      />
      
      <SettingsDialog
        open={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
        settings={settings}
        onSettingsChange={handleSettingsChange}
      />
    </div>
  );
};

export default Index;

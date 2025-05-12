import React, { useState, useEffect, useRef } from 'react';
import Toolbar from '@/components/Toolbar';
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
import { TrackInfo } from '@/components/TrackList';
import { ActionType } from '@/types/collaborative';
import { ui } from '@/styles/ui-classes';

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
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);
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

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollLeft, scrollTop } = e.currentTarget;
    setHorizontalScrollPosition(scrollLeft);
    setVerticalScrollPosition(scrollTop);

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
      sendMessage(ActionType.END_EDITING_BLOCK, { blockId: selectedBlockId });
    }

    sendMessage(ActionType.START_EDITING_BLOCK, { blockId: id });
    setSelectedBlockId(id);

    if (scrollContainerRef.current && block) {
      const blockX = block.startBeat * pixelsPerBeat;
      const blockY = block.track * trackHeight;
      
      setClipPopupPosition({
        x: blockX - horizontalScrollPosition,
        y: blockY - verticalScrollPosition + trackHeight
      });
    }
  };

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
    
    setBlocks(prevBlocks => 
      prevBlocks.map(block => 
        block.id === id 
          ? { ...block, track: newTrack, startBeat: adjustedStartBeat } 
          : block
      )
    );
    
    sendMessage(ActionType.MOVE_BLOCK, { 
      blockId: id, 
      trackId: newTrack,
      startBeat: adjustedStartBeat 
    });
  };

  const handleBlockLengthChange = (id: string, newLength: number) => {
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
    
    sendMessage(ActionType.UPDATE_BLOCK, { blockId: id, pitch });
  };

  const handleDeleteBlock = (id: string) => {
    setBlocks(prevBlocks => prevBlocks.filter(block => block.id !== id));
    setSelectedBlockId(null);
    
    sendMessage(ActionType.REMOVE_BLOCK, { blockId: id });
    
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
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
    
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

  const handleContainerClick = (e: React.MouseEvent) => {
    if (e.currentTarget === e.target) {
      setSelectedBlockId(null);
    }
  };

  const handleContainerDoubleClick = (e: React.MouseEvent) => {};

  const handleSeek = (beat: number) => {
    setCurrentBeat(beat);
  };

  const handleZoomIn = () => {
    setPixelsPerBeat(prev => Math.min(prev + 10, 80));
  };

  const handleZoomOut = () => {
    setPixelsPerBeat(prev => Math.max(prev - 10, 20));
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

  return (
    <div className={ui.layout.fullScreen}>
      <div className={ui.overlay.gradient} />
      
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
        activeTool={activeTool}
        onChangeTool={setActiveTool}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onOpenSettings={() => setIsSettingsOpen(true)}
        historyVisible={historyVisible}
        onToggleHistory={() => setHistoryVisible(!historyVisible)}
      />
      
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
            className={ui.layout.growContainer}
            onClick={handleContainerClick}
            onDoubleClick={handleContainerDoubleClick}
            onScroll={handleScroll}
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
        onOpenChange={setHistoryVisible}
      />
      
      <SettingsDialog
        open={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
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
              sendMessage(ActionType.END_EDITING_BLOCK, { blockId: selectedBlockId });
            }
            setSelectedBlockId(null);
          }}
        />
      )}
    </div>
  );
};

export default Index;

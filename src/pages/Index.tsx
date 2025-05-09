
import React, { useState, useEffect, useRef } from 'react';
import Toolbar from '@/components/Toolbar';
import TrackList, { TrackInfo } from '@/components/TrackList';
import TrackBlock from '@/components/TrackBlock';
import Timeline from '@/components/Timeline';
import EditDrawer from '@/components/EditDrawer';
import RemoteUser from '@/components/RemoteUser';
import { toast } from "@/hooks/use-toast";
import MockWebSocketService from '@/utils/mockWebSocket';

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
  const [isPlaying, setIsPlaying] = useState(false);
  const [bpm, setBpm] = useState(120);
  const [masterVolume, setMasterVolume] = useState(80);
  const [currentBeat, setCurrentBeat] = useState(0);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [pixelsPerBeat, setPixelsPerBeat] = useState(40);
  const [trackHeight, setTrackHeight] = useState(80);
  const [beatsPerBar] = useState(4);
  const [totalBars] = useState(16);
  const [showCollaborators] = useState(true);
  
  const tracksContainerRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const trackListRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  
  const [horizontalScrollPosition, setHorizontalScrollPosition] = useState(0);
  const [verticalScrollPosition, setVerticalScrollPosition] = useState(0);
  
  // WebSocket integration
  const [webSocketService] = useState(() => MockWebSocketService.getInstance());
  
  useEffect(() => {
    if (!tracksContainerRef.current) return;
    
    const updateWidth = () => {
      if (tracksContainerRef.current) {
        setContainerWidth(tracksContainerRef.current.clientWidth);
      }
    };
    
    updateWidth();
    
    const resizeObserver = new ResizeObserver(updateWidth);
    resizeObserver.observe(tracksContainerRef.current);
    
    return () => {
      if (tracksContainerRef.current) {
        resizeObserver.unobserve(tracksContainerRef.current);
      }
    };
  }, []);
  
  const [tracks, setTracks] = useState<TrackInfo[]>([
    { id: 'track1', name: 'Drums', color: '#FF466A', volume: 80, muted: false, solo: false },
    { id: 'track2', name: 'Bass', color: '#FFB446', volume: 75, muted: false, solo: false },
    { id: 'track3', name: 'Synth', color: '#64C850', volume: 70, muted: false, solo: false },
    { id: 'track4', name: 'Vocals', color: '#5096FF', volume: 85, muted: false, solo: false },
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
    const block = blocks.find(block => block.id === id);
    if (block?.editingUserId && block.editingUserId !== webSocketService.getLocalUserId()) {
      toast({
        title: "Block is being edited",
        description: `This clip is currently being edited by another user.`,
        variant: "destructive",
      });
      return;
    }
    
    // End editing previous block
    if (selectedBlockId) {
      webSocketService.endEditingBlock(selectedBlockId);
    }
    
    setSelectedBlockId(id);
    setIsDrawerOpen(true);
    
    // Start editing new block
    webSocketService.startEditingBlock(id);
  };
  
  const selectedBlock = blocks.find(block => block.id === selectedBlockId);
  
  // Check if a track is locked (has a block being edited by someone else)
  const isTrackLocked = (trackIndex: number): boolean => {
    return blocks.some(
      block => block.track === trackIndex && 
               block.editingUserId && 
               block.editingUserId !== webSocketService.getLocalUserId()
    );
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
    
    setBlocks(prevBlocks => 
      prevBlocks.map(block => 
        block.id === id 
          ? { ...block, track: newTrack, startBeat: newStartBeat } 
          : block
      )
    );
    
    // Send update via WebSocket
    webSocketService.sendMessage('blockUpdate', { 
      id, 
      track: newTrack, 
      startBeat: newStartBeat 
    });
  };
  
  const handleBlockLengthChange = (id: string, newLength: number) => {
    setBlocks(prevBlocks => 
      prevBlocks.map(block => 
        block.id === id 
          ? { ...block, lengthBeats: newLength } 
          : block
      )
    );
    
    // Send update via WebSocket
    webSocketService.sendMessage('blockUpdate', { 
      id, 
      lengthBeats: newLength 
    });
  };
  
  const handlePlay = () => {
    setIsPlaying(true);
    toast({
      title: "Playback Started",
      description: "Your composition is now playing.",
    });
  };
  
  const handlePause = () => {
    setIsPlaying(false);
  };
  
  const handleRestart = () => {
    setCurrentBeat(0);
    if (!isPlaying) {
      setIsPlaying(true);
    }
  };
  
  const handleTrackVolumeChange = (trackId: string, volume: number) => {
    setTracks(prevTracks => 
      prevTracks.map(track => 
        track.id === trackId 
          ? { ...track, volume } 
          : track
      )
    );
  };
  
  const handleTrackMuteToggle = (trackId: string) => {
    setTracks(prevTracks => 
      prevTracks.map(track => 
        track.id === trackId 
          ? { ...track, muted: !track.muted } 
          : track
      )
    );
  };
  
  const handleTrackSoloToggle = (trackId: string) => {
    setTracks(prevTracks => 
      prevTracks.map(track => 
        track.id === trackId 
          ? { ...track, solo: !track.solo } 
          : track
      )
    );
  };
  
  const handleAddTrack = () => {
    const newTrackId = `track${tracks.length + 1}`;
    const colors = ['#FF466A', '#FFB446', '#64C850', '#5096FF'];
    const newColor = colors[tracks.length % colors.length];
    
    setTracks([
      ...tracks,
      { 
        id: newTrackId, 
        name: `Track ${tracks.length + 1}`, 
        color: newColor, 
        volume: 75, 
        muted: false, 
        solo: false 
      }
    ]);
    
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
    webSocketService.sendMessage('blockUpdate', { id, name });
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
    webSocketService.sendMessage('blockUpdate', { id, volume });
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
    webSocketService.sendMessage('blockUpdate', { id, pitch });
  };
  
  const handleDeleteBlock = (id: string) => {
    setBlocks(prevBlocks => prevBlocks.filter(block => block.id !== id));
    setSelectedBlockId(null);
    
    // Send update via WebSocket
    webSocketService.sendMessage('blockUpdate', { id, deleted: true });
    
    toast({
      title: "Clip Deleted",
      description: "The audio clip has been removed from your track.",
      variant: "destructive",
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
  
  const handleContainerClick = (e: React.MouseEvent) => {
    if (e.currentTarget === e.target) {
      setSelectedBlockId(null);
      setIsDrawerOpen(false);
    }
  };
  
  const handleContainerDoubleClick = (e: React.MouseEvent) => {
    if (e.currentTarget !== e.target) return;
    
    const containerRect = tracksContainerRef.current?.getBoundingClientRect();
    if (!containerRect) return;
    
    const x = e.clientX - containerRect.left + horizontalScrollPosition;
    const y = e.clientY - containerRect.top + verticalScrollPosition;
    
    const track = Math.floor(y / trackHeight);
    const startBeat = Math.floor(x / pixelsPerBeat);
    
    // Check if the track is locked
    if (isTrackLocked(track)) {
      toast({
        title: "Track Locked",
        description: "This track has clips being edited by other users.",
        variant: "destructive",
      });
      return;
    }
    
    if (track >= 0 && track < tracks.length) {
      const newBlock: Block = {
        id: `block${Date.now()}`,
        name: 'New Clip',
        track,
        startBeat,
        lengthBeats: 4,
        volume: 75,
        pitch: 0
      };
      
      setBlocks([...blocks, newBlock]);
      
      setSelectedBlockId(newBlock.id);
      setIsDrawerOpen(true);
      
      // Start editing new block
      webSocketService.startEditingBlock(newBlock.id);
      
      // Send update via WebSocket
      webSocketService.sendMessage('blockUpdate', newBlock);
      
      toast({
        title: "Clip Added",
        description: "A new audio clip has been added to your track.",
      });
    }
  };
  
  // Update track locked status
  const tracksWithLockInfo = tracks.map((track, index) => ({
    ...track,
    locked: isTrackLocked(index),
    lockedByUser: blocks.find(
      block => block.track === index && 
               block.editingUserId && 
               block.editingUserId !== webSocketService.getLocalUserId()
    )?.editingUserId
  }));
  
  // Setup WebSocket listeners
  useEffect(() => {
    const handleBlockUpdate = (message: any) => {
      const { data } = message;
      
      if (data.deleted) {
        setBlocks(prevBlocks => prevBlocks.filter(block => block.id !== data.id));
        if (selectedBlockId === data.id) {
          setSelectedBlockId(null);
          setIsDrawerOpen(false);
        }
        return;
      }
      
      setBlocks(prevBlocks => 
        prevBlocks.map(block => 
          block.id === data.id 
            ? { ...block, ...data }
            : block
        )
      );
    };
    
    const handleBlockEditing = (message: any) => {
      const { data } = message;
      
      setBlocks(prevBlocks => 
        prevBlocks.map(block => 
          block.id === data.blockId 
            ? { ...block, editingUserId: data.userId }
            : block
        )
      );
    };
    
    const handleBlockEditingEnd = (message: any) => {
      const { data } = message;
      
      setBlocks(prevBlocks => 
        prevBlocks.map(block => 
          block.id === data.blockId 
            ? { ...block, editingUserId: null }
            : block
        )
      );
    };
    
    const handleRollback = (timestamp: number) => {
      console.log(`Rolling back state to ${new Date(timestamp).toISOString()}`);
      // In a real implementation, we would restore the state from a saved snapshot
      // For this demo, we'll just show a toast
      toast({
        title: "State Rollback",
        description: "Collaborative state has been synchronized.",
      });
    };
    
    webSocketService.on('blockUpdate', handleBlockUpdate);
    webSocketService.on('blockEditing', handleBlockEditing);
    webSocketService.on('blockEditingEnd', handleBlockEditingEnd);
    webSocketService.on('rollback', handleRollback);
    
    return () => {
      webSocketService.off('blockUpdate', handleBlockUpdate);
      webSocketService.off('blockEditing', handleBlockEditing);
      webSocketService.off('blockEditingEnd', handleBlockEditingEnd);
      webSocketService.off('rollback', handleRollback);
    };
  }, [selectedBlockId]);
  
  // Close drawer and end editing on component unmount
  useEffect(() => {
    return () => {
      if (selectedBlockId) {
        webSocketService.endEditingBlock(selectedBlockId);
      }
    };
  }, [selectedBlockId]);
  
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background text-foreground track-colors-default">
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
      
      <div className="flex flex-grow overflow-hidden">
        <TrackList 
          ref={trackListRef}
          tracks={tracksWithLockInfo}
          onVolumeChange={handleTrackVolumeChange}
          onMuteToggle={handleTrackMuteToggle}
          onSoloToggle={handleTrackSoloToggle}
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
              {tracks.map((_, index) => (
                <div 
                  key={index}
                  className="absolute left-0 right-0 border-b border-border"
                  style={{ top: `${(index + 1) * trackHeight}px` }}
                />
              ))}
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
                isTrackLocked={isTrackLocked(block.track) && block.editingUserId !== webSocketService.getLocalUserId()}
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
          </div>
        </div>
        
        <EditDrawer 
          isOpen={isDrawerOpen}
          onClose={() => {
            setIsDrawerOpen(false);
            if (selectedBlockId) {
              webSocketService.endEditingBlock(selectedBlockId);
              setSelectedBlockId(null);
            }
          }}
          selectedBlock={selectedBlock || null}
          onNameChange={handleBlockNameChange}
          onVolumeChange={handleBlockVolumeChange}
          onPitchChange={handleBlockPitchChange}
          onDelete={handleDeleteBlock}
          volume={selectedBlock?.volume || 75}
          pitch={selectedBlock?.pitch || 0}
        />
      </div>
    </div>
  );
};

export default Index;

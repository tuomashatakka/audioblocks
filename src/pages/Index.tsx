import React, { useState, useEffect, useRef } from 'react';
import Toolbar from '@/components/Toolbar';
import TrackList, { TrackInfo } from '@/components/TrackList';
import TrackBlock from '@/components/TrackBlock';
import Timeline from '@/components/Timeline';
import EditDrawer from '@/components/EditDrawer';
import RemoteUser from '@/components/RemoteUser';
import { toast } from "@/hooks/use-toast";

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
  const [containerWidth, setContainerWidth] = useState(0);
  
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
    setSelectedBlockId(id);
    setIsDrawerOpen(true);
  };
  
  const selectedBlock = blocks.find(block => block.id === selectedBlockId);
  
  const handleBlockPositionChange = (id: string, newTrack: number, newStartBeat: number) => {
    setBlocks(prevBlocks => 
      prevBlocks.map(block => 
        block.id === id 
          ? { ...block, track: newTrack, startBeat: newStartBeat } 
          : block
      )
    );
  };
  
  const handleBlockLengthChange = (id: string, newLength: number) => {
    setBlocks(prevBlocks => 
      prevBlocks.map(block => 
        block.id === id 
          ? { ...block, lengthBeats: newLength } 
          : block
      )
    );
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
  };
  
  const handleBlockVolumeChange = (id: string, volume: number) => {
    setBlocks(prevBlocks => 
      prevBlocks.map(block => 
        block.id === id 
          ? { ...block, volume } 
          : block
      )
    );
  };
  
  const handleBlockPitchChange = (id: string, pitch: number) => {
    setBlocks(prevBlocks => 
      prevBlocks.map(block => 
        block.id === id 
          ? { ...block, pitch } 
          : block
      )
    );
  };
  
  const handleDeleteBlock = (id: string) => {
    setBlocks(prevBlocks => prevBlocks.filter(block => block.id !== id));
    setSelectedBlockId(null);
    
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
    
    const x = e.clientX - containerRect.left;
    const y = e.clientY - containerRect.top;
    
    const track = Math.floor(y / trackHeight);
    const startBeat = Math.floor(x / pixelsPerBeat);
    
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
      
      toast({
        title: "Clip Added",
        description: "A new audio clip has been added to your track.",
      });
    }
  };
  
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
          tracks={tracks}
          onVolumeChange={handleTrackVolumeChange}
          onMuteToggle={handleTrackMuteToggle}
          onSoloToggle={handleTrackSoloToggle}
          onRename={() => {}}
          trackHeight={trackHeight}
        />
        
        <div className="flex-grow overflow-hidden flex flex-col">
          <Timeline 
            width={containerWidth}
            pixelsPerBeat={pixelsPerBeat}
            beatsPerBar={beatsPerBar}
            totalBars={totalBars}
            currentTime={currentTime}
            totalTime={totalTime}
          />
          
          <div 
            ref={tracksContainerRef}
            className="flex-grow relative overflow-auto"
            onClick={handleContainerClick}
            onDoubleClick={handleContainerDoubleClick}
          >
            <div className="absolute inset-0 pointer-events-none">
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
              />
            ))}
            
            <div 
              className="playhead"
              style={{ left: `${currentBeat * pixelsPerBeat}px` }}
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
          onClose={() => setIsDrawerOpen(false)}
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

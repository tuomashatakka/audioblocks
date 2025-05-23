import React, { useRef, useState, useCallback } from 'react';
import TrackBlock from './TrackBlock';
import Timeline, { TimelineMarkerData } from './Timeline';
import { Track, Block } from '@/contexts/projectReducer';
import { ToolType } from './ToolsMenu';
import { toast } from '@/hooks/use-toast';
import { ui } from '@/styles/ui-classes';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger
} from '@/components/ui/context-menu';
import { Upload, Plus, Music } from 'lucide-react';

interface CompositionGridViewProps {
  // Track and block data
  tracks: Track[];
  blocks: Block[];

  // Timeline props
  currentTime: string;
  totalTime: string;
  currentBeat: number;

  // Layout props
  pixelsPerBeat: number;
  trackHeight: number;
  beatsPerBar: number;
  totalBars: number;
  containerWidth: number;

  // UI state
  selectedBlockId: string | null;
  activeTool: ToolType;
  horizontalScrollPosition: number;
  verticalScrollPosition: number;

  // Settings
  snapToGrid: boolean;
  gridSize: number;

  // User info
  localUserId: string;

  // Markers
  markers: TimelineMarkerData[];

  // Event handlers
  onSeek: (beat: number) => void;
  onScroll: (e: React.UIEvent<HTMLDivElement>) => void;
  onContainerClick: (e: React.MouseEvent) => void;
  onContainerDoubleClick: (e: React.MouseEvent) => void;

  // Block event handlers
  onSelectBlock: (id: string) => void;
  onBlockPositionChange: (id: string, track: number, startBeat: number) => void;
  onBlockLengthChange: (id: string, lengthBeats: number) => void;
  onDeleteBlock: (id: string) => void;
  onDuplicateBlock: (id: string) => void;
  onBlockNameChange: (id: string, name: string) => void;
  onToggleBlockLock: (id: string) => void;
  onOpenBlockProperties: (id: string) => void;

  // Marker event handlers
  onAddMarker: (marker: Omit<TimelineMarkerData, 'id'>) => void;
  onEditMarker: (id: string, changes: Partial<TimelineMarkerData>) => void;
  onDeleteMarker: (id: string) => void;

  // Drag and drop
  onDragEnter: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragLeave: (e: React.DragEvent<HTMLDivElement>) => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  isDragOver: boolean;
  placeholderBlock: {track: number, startBeat: number, lengthBeats: number} | null;
  
  // Context menu actions
  onAddBlock?: (blockData: Omit<Block, 'id'>) => void;
  onUploadAudio?: (file: File, track: number, startBeat: number) => void;
}

const CompositionGridView: React.FC<CompositionGridViewProps> = ({
  tracks,
  blocks,
  currentTime,
  totalTime,
  currentBeat,
  pixelsPerBeat,
  trackHeight,
  beatsPerBar,
  totalBars,
  containerWidth,
  selectedBlockId,
  activeTool,
  horizontalScrollPosition,
  verticalScrollPosition,
  snapToGrid,
  gridSize,
  localUserId,
  markers,
  onSeek,
  onScroll,
  onContainerClick,
  onContainerDoubleClick,
  onSelectBlock,
  onBlockPositionChange,
  onBlockLengthChange,
  onDeleteBlock,
  onDuplicateBlock,
  onBlockNameChange,
  onToggleBlockLock,
  onOpenBlockProperties,
  onAddMarker,
  onEditMarker,
  onDeleteMarker,
  onDragEnter,
  onDragOver,
  onDragLeave,
  onDrop,
  isDragOver,
  placeholderBlock,
  onAddBlock,
  onUploadAudio
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Context menu state
  const [contextMenuPosition, setContextMenuPosition] = useState<{x: number, y: number, track: number, beat: number} | null>(null);

  const getTrackEditingUserId = useCallback((trackIndex: number) => {
    return blocks.find(
      block => block.track === trackIndex &&
               block.editingUserId &&
               block.editingUserId !== localUserId
    )?.editingUserId || null;
  }, [blocks, localUserId]);

  const getUserColor = useCallback((userId: string | null | undefined): string => {
    if (!userId) return '';
    // This would typically come from the remoteUsers array, but for now return a default
    const colors = ['#F472B6', '#60A5FA', '#34D399', '#FBBF24'];
    const hash = userId?.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) || 0;
    return colors[hash % colors.length];
  }, []);

  const isTrackLocked = useCallback((trackIndex: number): boolean => {
    return blocks.some(block =>
      block.track === trackIndex &&
      block.editingUserId &&
      block.editingUserId !== localUserId
    );
  }, [blocks, localUserId]);

  // Context menu handlers
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    
    if (!scrollContainerRef.current) return;
    
    const rect = scrollContainerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left + scrollContainerRef.current.scrollLeft;
    const y = e.clientY - rect.top + scrollContainerRef.current.scrollTop;
    
    const trackIndex = Math.floor(y / trackHeight);
    let beatPosition = x / pixelsPerBeat;
    
    // Apply snapping if enabled
    if (snapToGrid && gridSize > 0) {
      beatPosition = Math.round(beatPosition / gridSize) * gridSize;
    }
    
    setContextMenuPosition({
      x: e.clientX,
      y: e.clientY,
      track: Math.max(0, Math.min(trackIndex, tracks.length - 1)),
      beat: Math.max(0, beatPosition)
    });
  }, [trackHeight, pixelsPerBeat, snapToGrid, gridSize, tracks.length]);

  const handleFileUpload = useCallback((files: FileList | null) => {
    if (!files || !contextMenuPosition || !onUploadAudio) return;
    
    const audioFiles = Array.from(files).filter(file => {
      const audioExtensions = ['.mp3', '.wav', '.ogg', '.m4a', '.aac', '.flac', '.wma'];
      const fileName = file.name?.toLowerCase();
      return file.type.startsWith('audio/') || (fileName ? audioExtensions.some(ext => fileName.endsWith(ext)) : false);
    });
    
    if (audioFiles.length === 0) {
      toast({
        title: "No audio files",
        description: "Please select audio files (.mp3, .wav, .ogg, .m4a, .aac, .flac, .wma)",
        variant: "destructive",
      });
      return;
    }
    
    // Upload each audio file
    audioFiles.forEach((file, index) => {
      const startBeat = contextMenuPosition.beat + (index * beatsPerBar); // Offset each file by 1 bar
      onUploadAudio(file, contextMenuPosition.track, startBeat);
    });
    
    setContextMenuPosition(null);
  }, [contextMenuPosition, onUploadAudio, beatsPerBar]);

  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleAddEmptyBlock = useCallback(() => {
    if (!contextMenuPosition || !onAddBlock) return;
    
    const blockData = {
      name: `Block ${Date.now()}`,
      track: contextMenuPosition.track,
      startBeat: contextMenuPosition.beat,
      lengthBeats: beatsPerBar,
      volume: 80,
      pitch: 0
    };
    
    onAddBlock(blockData);
    setContextMenuPosition(null);
  }, [contextMenuPosition, onAddBlock, beatsPerBar]);

  return (
    <>
      {/* Hidden file input for audio uploads */}
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        multiple
        style={{ display: 'none' }}
        onChange={(e) => handleFileUpload(e.target.files)}
      />
      
      <div className="flex-grow overflow-hidden flex flex-col">
        {/* Timeline */}
        <Timeline
          ref={timelineRef}
          width={containerWidth}
          pixelsPerBeat={pixelsPerBeat}
          beatsPerBar={beatsPerBar}
          totalBars={totalBars}
          currentTime={currentTime}
          totalTime={totalTime}
          markers={markers}
          onAddMarker={onAddMarker}
          onEditMarker={onEditMarker}
          onDeleteMarker={onDeleteMarker}
          onSeek={onSeek}
          scrollLeft={horizontalScrollPosition}
        />

        {/* Composition Grid with Context Menu */}
        <ContextMenu>
          <ContextMenuTrigger asChild>
            <div
              ref={scrollContainerRef}
              className={`${ui.layout.growContainer} project-area ${isDragOver ? 'bg-primary/5' : ''}`}
              onClick={onContainerClick}
              onDoubleClick={onContainerDoubleClick}
              onScroll={onScroll}
              onDragEnter={onDragEnter}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              onContextMenu={handleContextMenu}
            >
        <div
          className="absolute inset-0"
          style={{
            width: `${totalBars * beatsPerBar * pixelsPerBeat}px`,
            minHeight: `${tracks.length * trackHeight}px`
          }}
        >
          {/* Track Grid Lines */}
          {tracks.map((_, index) => {
            const editingUserId = getTrackEditingUserId(index);
            const userColor = getUserColor(editingUserId);

            return (
              <div key={index} className="track-edited-by-user absolute left-0 right-0">
                {/* Track separator line */}
                <div
                  className="absolute left-0 right-0 border-b border-border"
                  style={{
                    top: `${(index + 1) * trackHeight}px`,
                  }}
                />
                {/* Track editing indicator */}
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

          {/* Beat Grid Lines */}
          {Array.from({ length: totalBars * beatsPerBar + 1 }, (_, beatIndex) => {
            const isMajorBeat = beatIndex % beatsPerBar === 0;
            return (
              <div
                key={`beat-${beatIndex}`}
                className={`absolute top-0 bottom-0 ${
                  isMajorBeat ? 'border-r border-border/50' : 'border-r border-border/20'
                } pointer-events-none`}
                style={{
                  left: `${beatIndex * pixelsPerBeat}px`,
                  width: '1px'
                }}
              />
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

          {/* Audio Blocks */}
          {blocks.map(block => (
            <TrackBlock
              key={block.id}
              id={block.id}
              track={block.track}
              startBeat={block.startBeat}
              lengthBeats={block.lengthBeats}
              name={block.name}
              selected={block.id === selectedBlockId}
              onSelect={onSelectBlock}
              onPositionChange={onBlockPositionChange}
              onLengthChange={onBlockLengthChange}
              pixelsPerBeat={pixelsPerBeat}
              trackHeight={trackHeight}
              editingUserId={block.editingUserId}
              isTrackLocked={isTrackLocked(block.track)}
              activeTool={activeTool}
              localUserId={localUserId}
              currentBeat={currentBeat}
              onDeleteBlock={onDeleteBlock}
              onDuplicateBlock={onDuplicateBlock}
              onBlockNameChange={onBlockNameChange}
              onBlockLockToggle={onToggleBlockLock}
              onOpenBlockProperties={onOpenBlockProperties}
              snapToGridSize={snapToGrid ? gridSize : 0}
              gridSize={gridSize}
              color={tracks[block.track]?.color}
            />
          ))}

          {/* Playhead */}
          <div
            className={ui.timeline.playhead}
            style={{
              left: `${currentBeat * pixelsPerBeat}px`,
              height: '100%',
              position: 'absolute',
              top: 0
            }}
          />
        </div>
            </div>
          </ContextMenuTrigger>
          
          <ContextMenuContent className="w-48">
            <ContextMenuItem onClick={handleUploadClick}>
              <Upload className="mr-2 h-4 w-4" />
              Upload Audio
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem onClick={handleAddEmptyBlock}>
              <Plus className="mr-2 h-4 w-4" />
              Add Empty Block
            </ContextMenuItem>
            <ContextMenuItem disabled>
              <Music className="mr-2 h-4 w-4" />
              Add MIDI Block
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      </div>
    </>
  );
};

export default CompositionGridView;
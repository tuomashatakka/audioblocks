
import React, { useState, useRef, useEffect } from 'react';
import { Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { ui } from '@/styles/ui-classes';
import BlockContextMenu from './BlockContextMenu';

export interface TrackBlockProps {
  id: string;
  track: number;
  startBeat: number;
  lengthBeats: number;
  color?: string;
  name: string;
  selected: boolean;
  onSelect: (id: string) => void;
  onPositionChange: (id: string, track: number, startBeat: number) => void;
  onLengthChange: (id: string, lengthBeats: number) => void;
  pixelsPerBeat: number;
  trackHeight: number;
  editingUserId?: string | null;
  isTrackLocked?: boolean;
  lockedByUser?: string;
  lockedByUserName?: string;
  activeTool?: 'select' | 'pan' | 'boxSelect';
  localUserId?: string;
  currentBeat?: number;
  onDeleteBlock?: (id: string) => void;
  onDuplicateBlock?: (id: string) => void;
  onBlockNameChange?: (id: string, name: string) => void;
  onBlockLockToggle?: (id: string) => void;
  onOpenBlockProperties?: (id: string) => void;
  snapToGridSize?: number;
  gridSize?: number;
}

const generateRandomWaveform = (length: number, complexity: number = 3): number[] => {
  // Generate a more realistic waveform pattern
  const waveform: number[] = [];
  const segments = Math.floor(Math.random() * 3) + 2; // 2-4 segments

  for (let s = 0; s < segments; s++) {
    const segmentLength = Math.floor(length / segments);
    const offset = s * segmentLength;

    // Base amplitude for this segment (louder in the middle segments)
    const baseAmplitude = s === 0 || s === segments - 1 ?
      0.3 + Math.random() * 0.3 : // quieter at start/end
      0.6 + Math.random() * 0.4;  // louder in middle

    // Generate the segment with varying frequency components
    for (let i = 0; i < segmentLength; i++) {
      let value = baseAmplitude;

      // Add harmonic components
      for (let h = 1; h <= complexity; h++) {
        const phase = Math.random() * Math.PI * 2;
        const freq = (h * Math.PI * 2) / segmentLength;
        value += Math.sin(i * freq + phase) * (0.2 / h) * baseAmplitude;
      }

      // Add some randomness for realism
      value += (Math.random() * 0.15 - 0.075) * baseAmplitude;

      // Ensure value is within 0-1 range
      waveform[offset + i] = Math.max(0.05, Math.min(0.95, value));
    }
  }

  return waveform;
};

const TrackBlock: React.FC<TrackBlockProps> = ({
  id,
  track,
  startBeat,
  lengthBeats,
  name,
  color = '#60A5FA', // provide default color
  selected,
  onSelect,
  onPositionChange,
  onLengthChange,
  pixelsPerBeat,
  trackHeight,
  editingUserId,
  isTrackLocked,
  lockedByUser,
  lockedByUserName,
  activeTool = 'select',
  localUserId,
  currentBeat = 0,
  onDeleteBlock,
  onDuplicateBlock,
  onBlockNameChange,
  onBlockLockToggle,
  onOpenBlockProperties,
  snapToGridSize = 1,
  gridSize = 1
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [initialPos, setInitialPos] = useState({ track, startBeat });
  const [initialLength, setInitialLength] = useState(lengthBeats);
  const blockRef = useRef<HTMLDivElement>(null);

  const [waveformPattern, setWaveformPattern] = useState<number[]>([]);
  const [isBlockLocked, setIsBlockLocked] = useState(isTrackLocked);

  const isTrackLockedByOtherUser = isTrackLocked && lockedByUser !== localUserId;

  useEffect(() => {
    // Generate a waveform pattern based on the block length
    const numPoints = Math.max(30, Math.floor(lengthBeats * 4));
    const pattern = generateRandomWaveform(numPoints, 4);
    setWaveformPattern(pattern);
  }, [id, lengthBeats]);

  useEffect(() => {
    setIsBlockLocked(isTrackLocked);
  }, [isTrackLocked]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (isTrackLockedByOtherUser || activeTool !== 'select') {
      return;
    }

    onSelect(id);

    if ((e.target as HTMLElement).classList.contains('resize-handle')) {
      return;
    }

    setIsDragging(true);
    setInitialPos({ track, startBeat });

    if (blockRef.current) {
      const rect = blockRef.current.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleResizeMouseDown = (e: React.MouseEvent) => {
    if (isTrackLockedByOtherUser || activeTool !== 'select') {
      if (isTrackLockedByOtherUser) {
        toast({
          title: "Cannot resize block",
          description: `This track is locked by ${lockedByUserName || 'another user'}.`,
          variant: "destructive",
        });
      }
      return;
    }

    e.stopPropagation();
    e.preventDefault();
    setIsResizing(true);
    setInitialLength(lengthBeats);

    document.addEventListener('mousemove', handleResizeMouseMove);
    document.addEventListener('mouseup', handleResizeMouseUp);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !blockRef.current || isTrackLockedByOtherUser) return;

    const container = blockRef.current.parentElement;
    if (!container) return;

    const containerRect = container.getBoundingClientRect();
    const x = e.clientX - containerRect.left - dragOffset.x + container.scrollLeft;
    const y = e.clientY - containerRect.top - dragOffset.y + container.scrollTop;

    const newTrack = Math.max(0, Math.floor(y / trackHeight));
    let newBeat = Math.max(0, x / pixelsPerBeat);

    // Apply snap to grid if enabled
    if (snapToGridSize && snapToGridSize > 0) {
      newBeat = Math.round(newBeat / snapToGridSize) * snapToGridSize;
    }

    // Round to nearest grid position
    const roundedBeat = Math.round(newBeat);

    if (newTrack !== track || roundedBeat !== startBeat) {
      onPositionChange(id, newTrack, roundedBeat);
    }
  };

  const handleResizeMouseMove = (e: MouseEvent) => {
    if (!isResizing || !blockRef.current || isTrackLockedByOtherUser) return;

    const container = blockRef.current.parentElement;
    if (!container) return;

    const containerRect = container.getBoundingClientRect();

    const rightEdge = e.clientX - containerRect.left + container.scrollLeft;
    const blockLeft = startBeat * pixelsPerBeat;
    const newWidthPixels = Math.max(pixelsPerBeat, rightEdge - blockLeft);
    let newLengthBeats = newWidthPixels / pixelsPerBeat;

    // Apply snap to grid if enabled
    if (snapToGridSize && snapToGridSize > 0) {
      newLengthBeats = Math.round(newLengthBeats / snapToGridSize) * snapToGridSize;
    }

    // Ensure minimum length of 1 beat or gridSize
    const minLength = Math.max(snapToGridSize || 1, 1);
    const roundedLength = Math.max(minLength, Math.round(newLengthBeats));

    if (roundedLength !== lengthBeats) {
      onLengthChange(id, roundedLength);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  const handleResizeMouseUp = () => {
    setIsResizing(false);
    document.removeEventListener('mousemove', handleResizeMouseMove);
    document.removeEventListener('mouseup', handleResizeMouseUp);
  };

  const handleNudgeLeft = () => {
    if (isTrackLockedByOtherUser) return;
    const newStartBeat = Math.max(0, startBeat - snapToGridSize);
    onPositionChange(id, track, newStartBeat);
    toast({
      title: "Block nudged left",
      description: `Moved "${name}" to beat ${newStartBeat + 1}`,
    });
  };

  const handleNudgeRight = () => {
    if (isTrackLockedByOtherUser) return;
    const newStartBeat = startBeat + snapToGridSize;
    onPositionChange(id, track, newStartBeat);
    toast({
      title: "Block nudged right",
      description: `Moved "${name}" to beat ${newStartBeat + 1}`,
    });
  };

  const handleSplitAtPlayhead = () => {
    if (isTrackLockedByOtherUser) return;

    // Check if playhead is within this block
    const canSplit = currentBeat > startBeat && currentBeat < startBeat + lengthBeats;

    if (!canSplit) {
      toast({
        title: "Cannot split block",
        description: "Playhead must be positioned within the block to split it",
        variant: "destructive",
      });
      return;
    }

    // This is just a placeholder - actual implementation would need to be in the parent component
    toast({
      title: "Split block",
      description: `Split "${name}" at beat ${Math.round(currentBeat)}`,
    });
  };

  const handleDuplicate = () => {
    if (isTrackLockedByOtherUser) return;

    if (onDuplicateBlock) {
      onDuplicateBlock(id);
    }

    toast({
      title: "Block duplicated",
      description: `Created a copy of "${name}"`,
    });
  };

  const handleDelete = () => {
    if (isTrackLockedByOtherUser) return;

    if (onDeleteBlock) {
      onDeleteBlock(id);
    }
  };

  const handleToggleLock = () => {
    if (onBlockLockToggle) {
      onBlockLockToggle(id);
      setIsBlockLocked(!isBlockLocked);

      toast({
        title: isBlockLocked ? "Block unlocked" : "Block locked",
        description: isBlockLocked
          ? `"${name}" can now be edited`
          : `"${name}" is now protected from changes`,
      });
    }
  };

  const handleRename = () => {
    if (isTrackLockedByOtherUser) return;

    const newName = prompt("Enter new name for this block:", name);
    if (newName && newName !== name && onBlockNameChange) {
      onBlockNameChange(id, newName);

      toast({
        title: "Block renamed",
        description: `Renamed to "${newName}"`,
      });
    }
  };

  const handleOpenProperties = () => {
    if (isTrackLockedByOtherUser) return;

    if (onOpenBlockProperties) {
      onOpenBlockProperties(id);
    }
  };

  const blockStyle = {
    left: `${startBeat * pixelsPerBeat}px`,
    top: `${track * trackHeight}px`,
    width: `${lengthBeats * pixelsPerBeat}px`,
    height: `${trackHeight - 4}px`
  };

  const getEditorColor = () => {
    const colors = ['#F472B6', '#60A5FA', '#34D399', '#FBBF24'];
    const hash = editingUserId?.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) || 0;
    return colors[hash % colors.length];
  };

  const canInteract = activeTool === 'select' && !isTrackLockedByOtherUser;
  const canSplit = currentBeat > startBeat && currentBeat < startBeat + lengthBeats;

  const blockContent = (
    <div
      ref={blockRef}
      className={cn(
        ui.trackBlock.base,
        selected ? ui.trackBlock.selected : ui.trackBlock.notSelected,
        isDragging ? ui.trackBlock.dragging : "",
        editingUserId && !selected ? `ring-2 ring-offset-1` : "",
        isTrackLockedByOtherUser ? ui.trackBlock.locked : canInteract ? ui.trackBlock.movable : "cursor-default"
      )}
      style={blockStyle}
      onMouseDown={handleMouseDown}
      onClick={(e) => {
        if (!isTrackLockedByOtherUser && activeTool === 'select' && !isResizing) {
          onSelect(id);
          e.stopPropagation();
        }
      }}
    >
      {/* Gradient background */}
      <div
        className="absolute inset-0 rounded-sm opacity-50"
        style={{
          background: `linear-gradient(to bottom, ${color}80, ${color}40)`,
        }}
      />

      {/* Waveform visualization */}
      <div className="absolute inset-0 opacity-80 z-10">
        <div className="h-full flex items-end justify-between overflow-hidden">
          {waveformPattern.map((height, i) => (
            <div
              key={i}
              className={ui.trackBlock.waveform}
              style={{
                height: `${height * 100}%`,
                width: `${100 / waveformPattern.length}%`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Block info overlay */}
      <div className="absolute inset-0 flex flex-col justify-between p-2 z-20">
        <div className="text-xs font-medium truncate text-foreground drop-shadow-md">
          {name}
        </div>

        <div className="text-[10px] text-foreground/70">
          {startBeat + 1}-{startBeat + lengthBeats} ({lengthBeats} beat{lengthBeats !== 1 ? 's' : ''})
        </div>
      </div>

      {/* Lock indicator */}
      {isTrackLockedByOtherUser && (
        <div
          className="absolute top-1 right-1 flex items-center text-red-500 z-20"
          title={`Locked by ${lockedByUserName || 'another user'}`}
        >
          <Lock className="h-3 w-3" />
        </div>
      )}

      {/* Editor indicator */}
      {editingUserId && (
        <div
          className="absolute -top-2 -right-2 w-4 h-4 rounded-full z-30"
          style={{ backgroundColor: getEditorColor() }}
        />
      )}

      {/* Editor highlight */}
      {editingUserId && !selected && (
        <div
          className="absolute inset-0 ring-2 pointer-events-none z-20"
          style={{
            borderColor: getEditorColor(),
            borderWidth: 2
          }}
        />
      )}

      {/* Resize handle */}
      {canInteract && (
        <div
          className={ui.trackBlock.resizeHandle}
          onMouseDown={handleResizeMouseDown}
        />
      )}
    </div>
  );

  return (
    <BlockContextMenu
      onNudgeLeft={handleNudgeLeft}
      onNudgeRight={handleNudgeRight}
      onSplit={handleSplitAtPlayhead}
      onDelete={handleDelete}
      onDuplicate={handleDuplicate}
      onToggleLock={handleToggleLock}
      isLocked={!!isTrackLockedByOtherUser}
      canSplit={canSplit}
      onRename={handleRename}
      onEdit={handleOpenProperties}
      currentPlayheadPosition={currentBeat}
    >
      {blockContent}
    </BlockContextMenu>
  );
};

export default TrackBlock;


import React, { useState, useRef, useEffect } from 'react';
import { Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { ui } from '@/styles/ui-classes';

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
}

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
  localUserId
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [initialPos, setInitialPos] = useState({ track, startBeat });
  const [initialLength, setInitialLength] = useState(lengthBeats);
  const blockRef = useRef<HTMLDivElement>(null);
  
  const [waveformPattern, setWaveformPattern] = useState<number[]>([]);
  
  const isTrackLockedByOtherUser = isTrackLocked && lockedByUser !== localUserId;
  
  useEffect(() => {
    const pattern = Array.from({ length: 30 }, () => 
      Math.random() * 0.8 + 0.2
    );
    setWaveformPattern(pattern);
  }, [id]);

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
    const newBeat = Math.max(0, Math.round(x / pixelsPerBeat));
    
    if (newTrack !== track || newBeat !== startBeat) {
      onPositionChange(id, newTrack, newBeat);
      toast({
        title: "Block Moved",
        description: `Moved "${name}" to track ${newTrack + 1}, beat ${newBeat + 1}`,
      });
    }
  };
  
  const handleResizeMouseMove = (e: MouseEvent) => {
    if (!isResizing || !blockRef.current || isTrackLockedByOtherUser) return;
    
    const container = blockRef.current.parentElement;
    if (!container) return;
    
    const containerRect = container.getBoundingClientRect();
    const blockRect = blockRef.current.getBoundingClientRect();
    
    const rightEdge = e.clientX - containerRect.left + container.scrollLeft;
    const blockLeft = startBeat * pixelsPerBeat;
    const newWidthPixels = Math.max(pixelsPerBeat, rightEdge - blockLeft);
    const newLengthBeats = Math.max(1, Math.round(newWidthPixels / pixelsPerBeat));
    
    if (newLengthBeats !== lengthBeats) {
      onLengthChange(id, newLengthBeats);
      toast({
        title: "Block Resized",
        description: `Changed "${name}" length to ${newLengthBeats} beats`,
      });
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
  
  return (
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
        e.stopPropagation();
        if (!isTrackLockedByOtherUser && activeTool === 'select' && !isResizing) {
          onSelect(id);
        }
      }}
    >
      <div className="absolute inset-0 opacity-80">
        <div className="h-full flex items-end justify-between overflow-hidden">
          {waveformPattern.map((height, i) => (
            <div 
              key={i}
              className={ui.trackBlock.waveform}
              style={{ height: `${height * 100}%` }}
            />
          ))}
        </div>
      </div>
      
      <div className="absolute inset-0 flex flex-col justify-between p-2">
        <div className="text-xs font-medium truncate text-foreground">
          {name}
        </div>
      </div>
      
      {isTrackLockedByOtherUser && (
        <div 
          className="absolute top-1 right-1 flex items-center text-red-500"
          title={`Locked by ${lockedByUserName || 'another user'}`}
        >
          <Lock className="h-3 w-3" />
        </div>
      )}
      
      {editingUserId && (
        <div 
          className="absolute -top-2 -right-2 w-4 h-4 rounded-full z-30"
          style={{ backgroundColor: getEditorColor() }}
        />
      )}
      
      {editingUserId && !selected && (
        <div 
          className="absolute inset-0 ring-2 pointer-events-none"
          style={{ 
            borderColor: getEditorColor(),
            borderWidth: 2
          }}
        />
      )}
      
      {canInteract && (
        <div 
          className={ui.trackBlock.resizeHandle}
          onMouseDown={handleResizeMouseDown}
        />
      )}
    </div>
  );
};

export default TrackBlock;

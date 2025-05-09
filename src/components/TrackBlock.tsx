
import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

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
  activeTool?: 'select' | 'pan' | 'boxSelect';
}

const TrackBlock: React.FC<TrackBlockProps> = ({
  id,
  track,
  startBeat,
  lengthBeats,
  name,
  selected,
  onSelect,
  onPositionChange,
  onLengthChange,
  pixelsPerBeat,
  trackHeight,
  editingUserId,
  isTrackLocked,
  activeTool = 'select'
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [initialPos, setInitialPos] = useState({ track, startBeat });
  const [initialLength, setInitialLength] = useState(lengthBeats);
  const blockRef = useRef<HTMLDivElement>(null);
  
  const [waveformPattern, setWaveformPattern] = useState<number[]>([]);
  
  useEffect(() => {
    const pattern = Array.from({ length: 30 }, () => 
      Math.random() * 0.8 + 0.2
    );
    setWaveformPattern(pattern);
  }, [id]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (isTrackLocked || activeTool !== 'select') {
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
    if (isTrackLocked || activeTool !== 'select') {
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
    if (!isDragging || !blockRef.current || isTrackLocked) return;
    
    const container = blockRef.current.parentElement;
    if (!container) return;
    
    const containerRect = container.getBoundingClientRect();
    const x = e.clientX - containerRect.left - dragOffset.x + container.scrollLeft;
    const y = e.clientY - containerRect.top - dragOffset.y + container.scrollTop;
    
    const newTrack = Math.max(0, Math.floor(y / trackHeight));
    const newBeat = Math.max(0, Math.round(x / pixelsPerBeat));
    
    if (newTrack !== track || newBeat !== startBeat) {
      onPositionChange(id, newTrack, newBeat);
    }
  };
  
  const handleResizeMouseMove = (e: MouseEvent) => {
    if (!isResizing || !blockRef.current || isTrackLocked) return;
    
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

  const canInteract = activeTool === 'select' && !isTrackLocked;
  
  return (
    <div
      ref={blockRef}
      className={cn(
        "track-block absolute rounded-sm border-2 overflow-hidden",
        "backdrop-blur-sm bg-black/30",
        selected ? "border-primary shadow-lg" : "border-transparent",
        isDragging ? "dragging" : "",
        editingUserId && !selected ? `ring-2 ring-offset-1` : "",
        isTrackLocked ? "opacity-70 cursor-not-allowed" : canInteract ? "cursor-move" : "cursor-default"
      )}
      style={blockStyle}
      onMouseDown={handleMouseDown}
      onClick={(e) => {
        e.stopPropagation();
        if (!isTrackLocked && activeTool === 'select') {
          onSelect(id);
        }
      }}
    >
      <div className="absolute inset-0 opacity-80">
        <div className="h-full flex items-end justify-between overflow-hidden">
          {waveformPattern.map((height, i) => (
            <div 
              key={i}
              className="waveform w-1"
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
      
      <div 
        className={cn(
          "resize-handle absolute right-0 top-0 bottom-0 w-2",
          canInteract ? "cursor-col-resize" : "cursor-not-allowed"
        )}
        onMouseDown={handleResizeMouseDown}
      />
    </div>
  );
};

export default TrackBlock;

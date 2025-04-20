
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
}

const TrackBlock: React.FC<TrackBlockProps> = ({
  id,
  track,
  startBeat,
  lengthBeats,
  color,
  name,
  selected,
  onSelect,
  onPositionChange,
  onLengthChange,
  pixelsPerBeat,
  trackHeight,
  editingUserId
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const blockRef = useRef<HTMLDivElement>(null);
  
  // Generate a random waveform pattern for visual effect
  const [waveformPattern, setWaveformPattern] = useState<number[]>([]);
  
  useEffect(() => {
    // Create a simple randomized waveform pattern
    const pattern = Array.from({ length: 30 }, () => 
      Math.random() * 0.8 + 0.2
    );
    setWaveformPattern(pattern);
  }, [id]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(id);
    
    // Don't start dragging on resize handle
    if ((e.target as HTMLElement).classList.contains('resize-handle')) {
      return;
    }
    
    setIsDragging(true);
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
    e.stopPropagation();
    e.preventDefault();
    setIsResizing(true);
    
    document.addEventListener('mousemove', handleResizeMouseMove);
    document.addEventListener('mouseup', handleResizeMouseUp);
  };
  
  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !blockRef.current) return;
    
    const container = blockRef.current.parentElement;
    if (!container) return;
    
    const containerRect = container.getBoundingClientRect();
    const x = e.clientX - containerRect.left - dragOffset.x;
    const y = e.clientY - containerRect.top - dragOffset.y;
    
    // Calculate new track and beat position
    const newTrack = Math.max(0, Math.floor(y / trackHeight));
    const newBeat = Math.max(0, Math.round(x / pixelsPerBeat));
    
    if (newTrack !== track || newBeat !== startBeat) {
      onPositionChange(id, newTrack, newBeat);
    }
  };
  
  const handleResizeMouseMove = (e: MouseEvent) => {
    if (!isResizing || !blockRef.current) return;
    
    const container = blockRef.current.parentElement;
    if (!container) return;
    
    const containerRect = container.getBoundingClientRect();
    const blockRect = blockRef.current.getBoundingClientRect();
    
    // Calculate new length
    const rightEdge = e.clientX - containerRect.left;
    const blockLeft = blockRect.left - containerRect.left;
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
    height: `${trackHeight - 4}px`,
    backgroundColor: color || `var(--track-${(track % 4) + 1}-color)`,
    borderColor: selected ? 'rgb(var(--primary))' : 'transparent',
  };
  
  // Get color for editor avatar
  const getEditorColor = () => {
    // This would normally come from a user dictionary, mocking for now
    const colors = ['#F472B6', '#60A5FA', '#34D399', '#FBBF24'];
    const hash = editingUserId?.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) || 0;
    return colors[hash % colors.length];
  };

  return (
    <div
      ref={blockRef}
      className={cn(
        "track-block absolute rounded-md border-2 p-1 cursor-move",
        selected ? "selected shadow-lg" : "",
        isDragging ? "dragging" : "",
        editingUserId && !selected ? "ring-2 ring-offset-1" : ""
      )}
      style={blockStyle}
      onMouseDown={handleMouseDown}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(id);
      }}
    >
      {/* Waveform visualization */}
      <div className="absolute left-0 right-0 bottom-0 top-0 opacity-70 pointer-events-none">
        <div className="h-full flex items-end justify-between overflow-hidden">
          {waveformPattern.map((height, i) => (
            <div 
              key={i}
              className="bg-black bg-opacity-20 w-1"
              style={{ height: `${height * 100}%` }}
            />
          ))}
        </div>
      </div>
      
      <div className="absolute inset-0 flex flex-col justify-between p-1 pointer-events-none">
        <div className="text-xs font-medium truncate text-foreground opacity-90">
          {name}
        </div>
        
        {editingUserId && !selected && (
          <div 
            className="absolute -top-2 -right-2 w-4 h-4 rounded-full z-30"
            style={{ backgroundColor: getEditorColor() }}
          />
        )}
      </div>
      
      {/* Resize handle */}
      <div 
        className="resize-handle absolute right-0 top-0 bottom-0 w-2 cursor-col-resize"
        onMouseDown={handleResizeMouseDown}
      />
    </div>
  );
};

export default TrackBlock;

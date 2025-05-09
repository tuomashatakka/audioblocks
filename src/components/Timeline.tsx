
import React, { forwardRef } from 'react';

interface TimelineProps {
  width: number;
  pixelsPerBeat: number;
  beatsPerBar: number;
  totalBars: number;
  currentTime: string;
  totalTime: string;
  onTimelineScroll?: (scrollLeft: number) => void;
  scrollLeft?: number;
}

const Timeline = forwardRef<HTMLDivElement, TimelineProps>(({
  width,
  pixelsPerBeat,
  beatsPerBar,
  totalBars,
  currentTime,
  totalTime,
  onTimelineScroll,
  scrollLeft
}, ref) => {
  const totalBeats = totalBars * beatsPerBar;
  const markers = [];
  
  // Create timeline markers
  for (let beat = 0; beat <= totalBeats; beat++) {
    const isMajor = beat % beatsPerBar === 0;
    const position = beat * pixelsPerBeat;
    
    if (position > width) break;
    
    markers.push(
      <div 
        key={beat}
        className={`timeline-marker ${isMajor ? 'major' : ''}`}
        style={{ left: `${position}px` }}
      >
        {isMajor && (
          <div className="absolute top-full text-xs font-mono text-muted-foreground mt-0.5">
            {Math.floor(beat / beatsPerBar) + 1}
          </div>
        )}
      </div>
    );
  }
  
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (onTimelineScroll) {
      onTimelineScroll(e.currentTarget.scrollLeft);
    }
  };
  
  return (
    <div className="relative h-16 border-b border-border bg-secondary/50">
      <div className="absolute top-0 left-4 flex items-center h-full">
        <div className="font-mono text-2xl text-white">
          {currentTime}
          <span className="text-sm text-muted-foreground ml-2">/ {totalTime}</span>
        </div>
      </div>
      <div 
        ref={ref}
        className="h-full relative mt-8 overflow-x-auto"
        style={{ scrollLeft: scrollLeft ?? 0 }}
        onScroll={handleScroll}
      >
        <div className="h-full relative" style={{ width: `${totalBeats * pixelsPerBeat}px` }}>
          {markers}
        </div>
      </div>
    </div>
  );
});

Timeline.displayName = 'Timeline';

export default Timeline;

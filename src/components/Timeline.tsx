
import React from 'react';

interface TimelineProps {
  width: number;
  pixelsPerBeat: number;
  beatsPerBar: number;
  totalBars: number;
}

const Timeline: React.FC<TimelineProps> = ({
  width,
  pixelsPerBeat,
  beatsPerBar,
  totalBars
}) => {
  const totalBeats = totalBars * beatsPerBar;
  const markers = [];
  
  // Create timeline markers
  for (let beat = 0; beat <= totalBeats; beat++) {
    const isMajor = beat % beatsPerBar === 0;
    const position = beat * pixelsPerBeat;
    
    // Don't render markers that are outside the visible area
    if (position > width) break;
    
    markers.push(
      <div 
        key={beat}
        className={`timeline-marker ${isMajor ? 'major' : ''}`}
        style={{ left: `${position}px` }}
      >
        {isMajor && (
          <div className="absolute top-full text-xs text-muted-foreground font-mono mt-0.5">
            {Math.floor(beat / beatsPerBar) + 1}
          </div>
        )}
      </div>
    );
  }
  
  return (
    <div className="relative h-8 border-b border-border bg-secondary overflow-hidden">
      <div className="h-full relative">
        {markers}
      </div>
    </div>
  );
};

export default Timeline;


import React, { forwardRef } from 'react';
import { Mic, Volume2, Lock } from 'lucide-react';
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Record } from './Record';

export interface TrackInfo {
  id: string;
  name: string;
  color: string;
  volume: number;
  muted: boolean;
  solo: boolean;
  armed?: boolean;
  locked?: boolean;
  lockedByUser?: string;
}

interface TrackListProps {
  tracks: TrackInfo[];
  onVolumeChange: (trackId: string, volume: number) => void;
  onMuteToggle: (trackId: string) => void;
  onSoloToggle: (trackId: string) => void;
  onArmToggle?: (trackId: string) => void;
  onRename: (trackId: string, name: string) => void;
  trackHeight: number;
  scrollTop?: number;
  onTrackListScroll?: (scrollTop: number) => void;
}

const TrackList = forwardRef<HTMLDivElement, TrackListProps>(({
  tracks,
  onVolumeChange,
  onMuteToggle,
  onSoloToggle,
  onArmToggle,
  onRename,
  trackHeight,
  scrollTop,
  onTrackListScroll
}, ref) => {
  
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (onTrackListScroll) {
      onTrackListScroll(e.currentTarget.scrollTop);
    }
  };
  
  return (
    <div className="w-48 min-w-48 border-r border-border bg-muted flex flex-col">
      <div className="p-2 border-b border-border bg-secondary">
        <h3 className="text-sm font-medium">Tracks</h3>
      </div>
      
      <div 
        ref={ref}
        className="tracks-list flex-grow overflow-y-auto"
        style={{ scrollTop: scrollTop || 0 } as React.CSSProperties}
        onScroll={handleScroll}
      >
        {tracks.map((track, index) => (
          <div 
            key={track.id}
            className={`track-item border-b border-border flex flex-col p-2 ${track.locked ? 'bg-muted/50' : ''}`}
            style={{ height: `${trackHeight}px` }}
          >
            <div className="flex items-center justify-between mb-1">
              <div 
                className="w-3 h-3 rounded-full mr-1 flex-shrink-0"
                style={{ backgroundColor: track.color }}
              />
              <span className="text-xs font-medium truncate flex-grow">{track.name}</span>
              <div className="flex items-center space-x-1">
                {track.locked && (
                  <div className="text-red-500 mr-1" title={`Locked by ${track.lockedByUser || 'another user'}`}>
                    <Lock className="h-3 w-3" />
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-center justify-between mb-2">
              <ToggleGroup type="multiple" className="gap-0">
                <ToggleGroupItem 
                  value="mute" 
                  size="sm"
                  className="h-6 w-6 p-0" 
                  aria-label="Mute"
                  disabled={track.locked}
                  data-state={track.muted ? "on" : "off"}
                  onClick={() => onMuteToggle(track.id)}
                >
                  <Volume2 className="h-3 w-3" />
                </ToggleGroupItem>
                
                <ToggleGroupItem 
                  value="solo" 
                  size="sm"
                  className="h-6 w-6 p-0" 
                  aria-label="Solo"
                  disabled={track.locked}
                  data-state={track.solo ? "on" : "off"}
                  onClick={() => onSoloToggle(track.id)}
                >
                  <Mic className="h-3 w-3" />
                </ToggleGroupItem>
                
                {onArmToggle && (
                  <ToggleGroupItem 
                    value="arm" 
                    size="sm"
                    className="h-6 w-6 p-0" 
                    aria-label="Record Arm"
                    variant="default"
                    disabled={track.locked}
                    data-state={track.armed ? "on" : "off"}
                    onClick={() => onArmToggle(track.id)}
                  >
                    <Record className="h-3 w-3" />
                  </ToggleGroupItem>
                )}
              </ToggleGroup>
            </div>
            
            <div className="flex items-center">
              <Slider
                className="w-full h-2"
                value={[track.volume]}
                min={0}
                max={100}
                step={1}
                onValueChange={([value]) => onVolumeChange(track.id, value)}
                disabled={track.locked}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

TrackList.displayName = 'TrackList';

export default TrackList;

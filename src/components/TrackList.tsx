
import React from 'react';
import { Mic, Volume2 } from 'lucide-react';
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";

export interface TrackInfo {
  id: string;
  name: string;
  color: string;
  volume: number;
  muted: boolean;
  solo: boolean;
}

interface TrackListProps {
  tracks: TrackInfo[];
  onVolumeChange: (trackId: string, volume: number) => void;
  onMuteToggle: (trackId: string) => void;
  onSoloToggle: (trackId: string) => void;
  onRename: (trackId: string, name: string) => void;
  trackHeight: number;
}

const TrackList: React.FC<TrackListProps> = ({
  tracks,
  onVolumeChange,
  onMuteToggle,
  onSoloToggle,
  onRename,
  trackHeight
}) => {
  return (
    <div className="w-48 min-w-48 border-r border-border bg-muted">
      <div className="p-2 border-b border-border bg-secondary">
        <h3 className="text-sm font-medium">Tracks</h3>
      </div>
      
      <div className="tracks-list">
        {tracks.map((track, index) => (
          <div 
            key={track.id}
            className="track-item border-b border-border flex flex-col p-2"
            style={{ height: `${trackHeight}px` }}
          >
            <div className="flex items-center justify-between mb-1">
              <div 
                className="w-3 h-3 rounded-full mr-1 flex-shrink-0"
                style={{ backgroundColor: track.color }}
              />
              <span className="text-xs font-medium truncate flex-grow">{track.name}</span>
              <div className="flex space-x-1">
                <Button
                  variant={track.muted ? "secondary" : "ghost"}
                  size="icon"
                  className="h-5 w-5"
                  onClick={() => onMuteToggle(track.id)}
                >
                  <Volume2 className="h-3 w-3" />
                </Button>
                <Button
                  variant={track.solo ? "secondary" : "ghost"}
                  size="icon"
                  className="h-5 w-5"
                  onClick={() => onSoloToggle(track.id)}
                >
                  <Mic className="h-3 w-3" />
                </Button>
              </div>
            </div>
            
            <div className="flex items-center">
              <Slider
                className="w-full h-2"
                value={[track.volume]}
                min={0}
                max={100}
                step={1}
                onValueChange={([value]) => onVolumeChange(track.id, value)}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TrackList;

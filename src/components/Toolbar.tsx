
import React from 'react';
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { 
  Play, Pause, SkipBack, Save, 
  Plus, Users, Volume2, Settings
} from 'lucide-react';

interface ToolbarProps {
  isPlaying: boolean;
  bpm: number;
  volume: number;
  onPlay: () => void;
  onPause: () => void;
  onRestart: () => void;
  onBpmChange: (value: number) => void;
  onVolumeChange: (value: number) => void;
  onAddTrack: () => void;
  usersCount: number;
}

const Toolbar: React.FC<ToolbarProps> = ({
  isPlaying,
  bpm,
  volume,
  onPlay,
  onPause,
  onRestart,
  onBpmChange,
  onVolumeChange,
  onAddTrack,
  usersCount
}) => {
  return (
    <div className="flex items-center justify-between px-4 py-2 bg-secondary border-b border-border">
      <div className="flex items-center space-x-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={onRestart}
          title="Restart"
        >
          <SkipBack className="h-5 w-5" />
        </Button>
        
        {isPlaying ? (
          <Button
            variant="secondary"
            size="icon"
            onClick={onPause}
            title="Pause"
          >
            <Pause className="h-5 w-5" />
          </Button>
        ) : (
          <Button
            variant="secondary"
            size="icon"
            onClick={onPlay}
            title="Play"
          >
            <Play className="h-5 w-5" />
          </Button>
        )}
        
        <div className="flex items-center ml-4 space-x-2">
          <span className="text-xs text-muted-foreground">BPM</span>
          <Slider 
            className="w-24" 
            value={[bpm]} 
            min={60} 
            max={200} 
            step={1}
            onValueChange={(val) => onBpmChange(val[0])}
          />
          <span className="text-xs font-mono w-8">{bpm}</span>
        </div>
      </div>
      
      <div className="flex items-center space-x-4">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={onAddTrack}
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Track
        </Button>
        
        <Button variant="ghost" size="icon" title="Save Project">
          <Save className="h-5 w-5" />
        </Button>
        
        <div className="flex items-center space-x-2">
          <Volume2 className="h-4 w-4 text-muted-foreground" />
          <Slider 
            className="w-24" 
            value={[volume]} 
            min={0} 
            max={100} 
            step={1}
            onValueChange={(val) => onVolumeChange(val[0])}
          />
        </div>
        
        <Button variant="ghost" size="icon" title="Settings">
          <Settings className="h-5 w-5" />
        </Button>
        
        <div className="flex items-center px-2 py-1 bg-muted rounded-full">
          <Users className="h-4 w-4 mr-1 text-primary" />
          <span className="text-xs font-medium">{usersCount}</span>
        </div>
      </div>
    </div>
  );
};

export default Toolbar;

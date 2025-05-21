
import React from 'react';
import Toolbar from './Toolbar';
import ConnectionStatus from './ConnectionStatus';
import { ToolType } from './ToolsMenu';

interface ToolbarWithStatusProps {
  isPlaying: boolean;
  bpm: number;
  volume: number;
  onPlay: () => void;
  onPause: () => void;
  onRestart: () => void;
  onBpmChange: (bpm: number) => void;
  onVolumeChange: (volume: number) => void;
  onAddTrack: () => void;
  usersCount: number;
  activeTool: ToolType;
  onChangeTool: (tool: ToolType) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onOpenSettings: () => void;
  historyVisible: boolean;
  onToggleHistory: () => void;
}

export const ToolbarWithStatus: React.FC<ToolbarWithStatusProps> = (props) => {
  return (
    <div className="relative">
      <Toolbar {...props} />
      <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
        <ConnectionStatus />
      </div>
    </div>
  );
};

export default ToolbarWithStatus;

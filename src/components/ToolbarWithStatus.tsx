import React from 'react'
import Toolbar from './Toolbar'
import ConnectionStatus from './ConnectionStatus'
import { ToolType } from './ToolsMenu'
import AudioController from './AudioController'
import { Button } from './ui/button'
import { Music } from 'lucide-react'
import { useState } from 'react'


interface ToolbarWithStatusProps {
  isPlaying:       boolean;
  bpm:             number;
  volume:          number;
  onPlay:          () => void;
  onPause:         () => void;
  onRestart:       () => void;
  onBpmChange:     (bpm: number) => void;
  onVolumeChange:  (volume: number) => void;
  onAddTrack:      (trackType?: 'audio' | 'bus') => void;
  usersCount:      number;
  activeTool:      ToolType;
  onChangeTool:    (tool: ToolType) => void;
  onZoomIn:        () => void;
  onZoomOut:       () => void;
  onOpenSettings:  () => void;
  historyVisible:  boolean;
  onToggleHistory: () => void;
}

export const ToolbarWithStatus: React.FC<ToolbarWithStatusProps> = props => {
  const [ showAudioController, setShowAudioController ] = useState(false)

  return <div className='relative'>
    <Toolbar { ...props } />

    <div className='absolute right-4 top-1/2 transform -translate-y-1/2 flex items-center gap-4'>
      <Button
        variant='outline'
        size='sm'
        className='flex items-center gap-2'
        onClick={ () => setShowAudioController(!showAudioController) }>
        <Music size={ 16 } />
        Audio Player
      </Button>

      <ConnectionStatus />
    </div>

    {/* Audio Controller Panel */}
    {showAudioController &&
        <div className='fixed top-20 right-4 z-50'>
          <AudioController />
        </div>
    }
  </div>
}

export default ToolbarWithStatus

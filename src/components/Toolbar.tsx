import React from 'react'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import { Circle, Mic, Move3D, Pause, Play, Redo, SquarePen, Volume2, ZoomIn, ZoomOut } from 'lucide-react'
import { ToolType } from './ToolsMenu'
import ToolsMenu from './ToolsMenu'
import { Input } from '@/components/ui/input'
import { ui } from '@/styles/ui-classes'


interface ToolbarProps {
  isPlaying:       boolean;
  bpm:             number;
  volume:          number;
  onPlay:          () => void;
  onPause:         () => void;
  onRestart:       () => void;
  onBpmChange:     (bpm: number) => void;
  onVolumeChange:  (volume: number) => void;
  onAddTrack:      () => void;
  usersCount:      number;
  activeTool:      ToolType;
  onChangeTool:    (tool: ToolType) => void;
  onZoomIn:        () => void;
  onZoomOut:       () => void;
  onOpenSettings:  () => void;
  historyVisible:  boolean;
  onToggleHistory: () => void;
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
  usersCount,
  activeTool,
  onChangeTool,
  onZoomIn,
  onZoomOut,
  onOpenSettings,
  historyVisible,
  onToggleHistory
}) =>
  <div className={ ui.toolbar }>
    <div className={ ui.toolbarSection }>
      <Button variant='secondary' className={ ui.button.secondary } onClick={ onAddTrack }>
        Add Track
      </Button>

      <Button variant='secondary' className={ ui.button.secondary } onClick={ onOpenSettings }>
        Settings
      </Button>

      <Button variant='secondary' className={ ui.button.secondary } onClick={ onToggleHistory }>
        {historyVisible ? 'Hide History' : 'Show History'}
      </Button>
    </div>

    <div className={ ui.toolbarSection }>
      <Button variant='outline' className={ ui.button.secondary } onClick={ onRestart }>
        <Redo className='h-5 w-5' />
      </Button>

      <Button variant='outline' className={ ui.button.secondary } onClick={ isPlaying ? onPause : onPlay }>
        {isPlaying ? <Pause className='h-6 w-6' /> : <Play className='h-6 w-6' />}
      </Button>
    </div>

    <div className={ ui.toolbarSection }>
      <div className='flex items-center space-x-2'>
        <Volume2 className='h-4 w-4' />

        <Slider
          defaultValue={ [ volume ] }
          max={ 100 }
          step={ 1 }
          onValueChange={ value => onVolumeChange(value[0]) }
          className='w-[100px]' />

        <Input
          type='number'
          value={ bpm }
          onChange={ e => onBpmChange(parseInt(e.target.value)) }
          className='w-[60px] text-center' />

        <span className='text-sm'>BPM</span>
      </div>
    </div>

    <div className={ ui.toolbarSection }>
      <ToolsMenu
        activeTool={ activeTool }
        onChangeTool={ onChangeTool }
        onZoomIn={ onZoomIn }
        onZoomOut={ onZoomOut } />

      <Button variant='ghost' size='icon' onClick={ onZoomIn }>
        <ZoomIn className='h-5 w-5' />
      </Button>

      <Button variant='ghost' size='icon' onClick={ onZoomOut }>
        <ZoomOut className='h-5 w-5' />
      </Button>
    </div>

    <div className={ ui.toolbarSection }>
      <span className='text-sm'>Users: {usersCount}</span>
    </div>
  </div>


export default Toolbar

import React from 'react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import {
  Play, Pause, SkipBack, Save,
  Plus, Users, Volume2, Settings,
  History, PanelLeft, Move, Maximize
} from 'lucide-react'
import { ui } from '@/styles/ui-classes'
import { ToolType } from '@/components/ToolsMenu'


interface ToolbarProps {
  isPlaying:       boolean;
  bpm:             number;
  volume:          number;
  onPlay:          () => void;
  onPause:         () => void;
  onRestart:       () => void;
  onBpmChange:     (value: number) => void;
  onVolumeChange:  (value: number) => void;
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
  <div className='border-b border-border'>
    {/* Main toolbar (was top bar) */}
    <div className={ ui.toolbar }>
      <div className={ ui.toolbarSection }>
        <Button
          variant='ghost'
          size='icon'
          onClick={ onRestart }
          title='Restart'>
          <SkipBack className='h-5 w-5' />
        </Button>

        {isPlaying
          ? <Button
            variant='secondary'
            size='icon'
            onClick={ onPause }
            title='Pause'>
            <Pause className='h-5 w-5' />
          </Button>
          : <Button
            variant='secondary'
            size='icon'
            onClick={ onPlay }
            title='Play'>
            <Play className='h-5 w-5' />
          </Button>
        }

        <div className='flex items-center ml-4 space-x-2'>
          <span className='text-xs text-muted-foreground'>BPM</span>

          <Slider
            className='w-24'
            value={ [ bpm ] }
            min={ 60 }
            max={ 200 }
            step={ 1 }
            onValueChange={ val => onBpmChange(val[0]) } />

          <span className='text-xs font-mono w-8'>{bpm}</span>
        </div>
      </div>

      <div className={ ui.toolbarSection }>
        <Button
          variant='ghost'
          size='sm'
          onClick={ onAddTrack }>
          <Plus className='h-4 w-4 mr-1' />
          Add Track
        </Button>

        <Button variant='ghost' size='icon' title='Save Project'>
          <Save className='h-5 w-5' />
        </Button>

        <div className='flex items-center space-x-2'>
          <Volume2 className='h-4 w-4 text-muted-foreground' />

          <Slider
            className='w-24'
            value={ [ volume ] }
            min={ 0 }
            max={ 100 }
            step={ 1 }
            onValueChange={ val => onVolumeChange(val[0]) } />
        </div>

        <Button
          variant='ghost'
          size='icon'
          title='Settings'
          onClick={ onOpenSettings }>
          <Settings className='h-5 w-5' />
        </Button>

        <div className='flex items-center px-2 py-1 bg-muted rounded-full'>
          <Users className='h-4 w-4 mr-1 text-primary' />
          <span className='text-xs font-medium'>{usersCount}</span>
        </div>
      </div>
    </div>

    {/* Tools toolbar (was second bar) - now combined with top bar */}
    <div className={ ui.toolbar }>
      <div className='flex items-center space-x-1'>
        <Button
          variant={ activeTool === 'select' ? 'secondary' : 'ghost' }
          size='sm'
          className='flex items-center gap-1'
          onClick={ () => onChangeTool('select') }>
          <PanelLeft size={ 16 } />
          <span>Select</span>
        </Button>

        <Button
          variant={ activeTool === 'pan' ? 'secondary' : 'ghost' }
          size='sm'
          className='flex items-center gap-1'
          onClick={ () => onChangeTool('pan') }>
          <Move size={ 16 } />
          <span>Pan</span>
        </Button>

        <Button
          variant={ activeTool === 'boxSelect' ? 'secondary' : 'ghost' }
          size='sm'
          className='flex items-center gap-1'
          onClick={ () => onChangeTool('boxSelect') }>
          <Maximize size={ 16 } />
          <span>Box</span>
        </Button>

        <div className='h-5 w-px bg-border mx-2' />

        <Button variant='ghost' size='icon' className='h-8 w-8' onClick={ onZoomIn } title='Zoom In'>
          <Plus size={ 16 } />
        </Button>

        <Button variant='ghost' size='icon' className='h-8 w-8' onClick={ onZoomOut } title='Zoom Out'>
          <span className='text-lg font-bold'>-</span>
        </Button>
      </div>

      <Button
        variant='ghost'
        size='sm'
        onClick={ onToggleHistory }
        className={ historyVisible ? 'bg-primary/20' : 'hover:bg-primary/20' }>
        <History size={ 16 } className='mr-1' />
        History
      </Button>
    </div>
  </div>


export default Toolbar

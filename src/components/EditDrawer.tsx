import React, { useState } from 'react'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import {
  X, Music, Volume2, ArrowRight,
  Upload, CornerUpRight, Save, Trash
} from 'lucide-react'


interface EditDrawerProps {
  isOpen:        boolean;
  onClose:       () => void;
  selectedBlock: {
    id:          string;
    name:        string;
    track:       number;
    startBeat:   number;
    lengthBeats: number;
  } | null;
  onNameChange:   (id: string, name: string) => void;
  onVolumeChange: (id: string, volume: number) => void;
  onPitchChange:  (id: string, pitch: number) => void;
  onDelete:       (id: string) => void;
  volume:         number;
  pitch:          number;
}

const EditDrawer: React.FC<EditDrawerProps> = ({
  isOpen,
  onClose,
  selectedBlock,
  onNameChange,
  onVolumeChange,
  onPitchChange,
  onDelete,
  volume,
  pitch
}) => {
  const [ blockName, setBlockName ] = useState('')

  // Update local state when selected block changes
  React.useEffect(() => {
    if (selectedBlock)
      setBlockName(selectedBlock.name)
  }, [ selectedBlock ])

  // Handle name change and submit
  const handleNameSubmit = () => {
    if (selectedBlock && blockName.trim())
      onNameChange(selectedBlock.id, blockName)
  }

  // Generate a random waveform for visualization
  const generateWaveform = () => {
    const points = []
    const segments = 100

    for (let i = 0; i < segments; i++) {
      // Create a semi-random waveform with some repeating patterns
      const value = 0.5 +
        Math.sin(i * 0.1) * 0.3 +
        Math.sin(i * 0.2) * 0.1 +
        Math.random() * 0.1

      points.push({
        x: i / segments * 100,
        y: Math.max(0, Math.min(1, value)) * 100
      })
    }

    // Convert points to SVG path
    return points.map((point, i) =>
      `${i === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
    ).join(' ')
  }

  const waveformPath = React.useMemo(generateWaveform, [ selectedBlock?.id ])

  // Handle delete confirmation
  const [ showDeleteConfirm, setShowDeleteConfirm ] = useState(false)

  const handleDelete = () => {
    if (selectedBlock) {
      onDelete(selectedBlock.id)
      onClose()
    }
  }

  return <div
    className={ cn(
      'fixed right-0 top-0 bottom-0 w-80 bg-card border-l border-border z-50 drawer-transition',
      isOpen ? 'transform-none' : 'translate-x-full'
    ) }>
    <div className='flex flex-col h-full'>
      <div className='p-4 border-b border-border flex items-center justify-between'>
        <h2 className='text-lg font-medium flex items-center'>
          <Music className='mr-2 h-5 w-5' />
          Edit Clip
        </h2>

        <Button
          variant='ghost'
          size='icon'
          onClick={ onClose }>
          <X className='h-5 w-5' />
        </Button>
      </div>

      {selectedBlock &&
          <div className='flex-grow overflow-y-auto p-4'>
            <div className='space-y-6'>
              {/* Clip name */}
              <div className='space-y-2'>
                <label className='text-sm font-medium'>Clip Name</label>

                <div className='flex space-x-2'>
                  <Input
                    value={ blockName }
                    onChange={ e => setBlockName(e.target.value) }
                    className='flex-grow' />

                  <Button
                    size='icon'
                    variant='outline'
                    onClick={ handleNameSubmit }
                    title='Update Name'>
                    <CornerUpRight className='h-4 w-4' />
                  </Button>
                </div>
              </div>

              {/* Waveform visualization */}
              <div className='space-y-2'>
                <label className='text-sm font-medium'>Waveform</label>

                <div className='waveform-container h-28 border border-border rounded-md p-2 relative'>
                  <svg
                    width='100%'
                    height='100%'
                    preserveAspectRatio='none'
                    className='text-primary'>
                    <path
                      d={ waveformPath }
                      fill='none'
                      stroke='currentColor'
                      strokeWidth='2' />
                  </svg>

                  {/* Playback position indicator */}
                  <div
                    className='absolute top-0 bottom-0 w-0.5 bg-white'
                    style={{ left: '30%' }} />
                </div>

                <Button variant='outline' className='w-full flex items-center justify-center'>
                  <Upload className='mr-2 h-4 w-4' />
                  Replace Audio
                </Button>
              </div>

              {/* Volume control */}
              <div className='space-y-2'>
                <div className='flex items-center justify-between'>
                  <label className='text-sm font-medium flex items-center'>
                    <Volume2 className='mr-1 h-4 w-4' />
                    Volume
                  </label>

                  <span className='text-xs font-mono'>{volume}%</span>
                </div>

                <Slider
                  className='w-full'
                  value={ [ volume ] }
                  min={ 0 }
                  max={ 100 }
                  step={ 1 }
                  onValueChange={ ([ value ]) => onVolumeChange(selectedBlock.id, value) } />
              </div>

              {/* Pitch control */}
              <div className='space-y-2'>
                <div className='flex items-center justify-between'>
                  <label className='text-sm font-medium flex items-center'>
                    <ArrowRight className='mr-1 h-4 w-4' />
                    Pitch
                  </label>

                  <span className='text-xs font-mono'>{pitch > 0 ? `+${pitch}` : pitch}</span>
                </div>

                <Slider
                  className='w-full'
                  value={ [ pitch ] }
                  min={ -12 }
                  max={ 12 }
                  step={ 1 }
                  onValueChange={ ([ value ]) => onPitchChange(selectedBlock.id, value) } />
              </div>

              {/* Delete button */}
              <div className='pt-4'>
                {!showDeleteConfirm
                  ? <Button
                    variant='destructive'
                    className='w-full'
                    onClick={ () => setShowDeleteConfirm(true) }>
                    <Trash className='mr-2 h-4 w-4' />
                    Delete Clip
                  </Button>
                  : <div className='flex space-x-2'>
                    <Button
                      variant='outline'
                      className='flex-grow'
                      onClick={ () => setShowDeleteConfirm(false) }>
                      Cancel
                    </Button>

                    <Button
                      variant='destructive'
                      className='flex-grow'
                      onClick={ handleDelete }>
                      Confirm Delete
                    </Button>
                  </div>
                }
              </div>
            </div>
          </div>
      }

      <div className='p-4 border-t border-border'>
        <Button variant='default' className='w-full'>
          <Save className='mr-2 h-4 w-4' />
          Apply Changes
        </Button>
      </div>
    </div>
  </div>
}

export default EditDrawer

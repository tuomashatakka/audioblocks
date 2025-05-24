import React, { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { MousePointer, ZoomIn, ZoomOut, BoxSelect } from 'lucide-react'


export type ToolType = 'select' | 'pan' | 'boxSelect'

interface ToolsMenuProps {
  activeTool:   ToolType;
  onChangeTool: (tool: ToolType) => void;
  onZoomIn?:    () => void;
  onZoomOut?:   () => void;
}

const ToolsMenu: React.FC<ToolsMenuProps> = ({
  activeTool,
  onChangeTool,
  onZoomIn,
  onZoomOut,
}) => {
  const tools = [
    {
      id:       'select' as const,
      icon:     <MousePointer size={ 16 } />,
      name:     'Select & Resize',
      tooltip:  'Select, move and resize clips',
      shortcut: 'V',
    },
    {
      id:       'pan' as const,
      icon:     <ZoomIn size={ 16 } />,
      name:     'Pan & Zoom',
      tooltip:  'Pan and zoom the timeline view',
      shortcut: 'H',
    },
    {
      id:       'boxSelect' as const,
      icon:     <BoxSelect size={ 16 } />,
      name:     'Box Select',
      tooltip:  'Select multiple clips at once',
      shortcut: 'M',
    },
  ]

  const handleKeyDown = (e: KeyboardEvent) => {
    switch (e.key.toLowerCase()) {
      case 'v':
        onChangeTool('select')
        break
      case 'h':
        onChangeTool('pan')
        break
      case 'm':
        onChangeTool('boxSelect')
        break
      case '+':
        if (onZoomIn)
          onZoomIn()
        break
      case '-':
        if (onZoomOut)
          onZoomOut()
        break
    }
  }

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return <div className='flex items-center space-x-1 bg-secondary/50 p-1 rounded-md'>
    {tools.map(tool =>
      <Tooltip key={ tool.id }>
        <TooltipTrigger asChild>
          <Button
            variant='ghost'
            size='sm'
            className={ cn(
              'h-8 w-8 p-0',
              activeTool === tool.id && 'tool-active'
            ) }
            onClick={ () => onChangeTool(tool.id) }>
            {tool.icon}
            <span className='sr-only'>{tool.name}</span>
          </Button>
        </TooltipTrigger>

        <TooltipContent side='bottom'>
          <div className='flex flex-col'>
            <div className='font-medium'>{tool.name}</div>

            <div className='text-xs text-muted-foreground'>
              {tool.tooltip} ({tool.shortcut})
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    )}

    {(onZoomIn || onZoomOut) && <div className='w-px h-6 bg-border mx-1' />}

    {onZoomIn &&
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant='ghost' size='sm' className='h-8 w-8 p-0' onClick={ onZoomIn }>
              <ZoomIn size={ 16 } />
              <span className='sr-only'>Zoom In</span>
            </Button>
          </TooltipTrigger>

          <TooltipContent side='bottom'>Zoom In (+)</TooltipContent>
        </Tooltip>
    }

    {onZoomOut &&
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant='ghost' size='sm' className='h-8 w-8 p-0' onClick={ onZoomOut }>
              <ZoomOut size={ 16 } />
              <span className='sr-only'>Zoom Out</span>
            </Button>
          </TooltipTrigger>

          <TooltipContent side='bottom'>Zoom Out (-)</TooltipContent>
        </Tooltip>
    }
  </div>
}

export default ToolsMenu

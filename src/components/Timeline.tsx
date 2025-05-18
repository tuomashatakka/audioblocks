import React, { forwardRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import TimelineMarker, { MarkerIcon } from './TimelineMarker'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'


export interface TimelineMarkerData {
  id:       string;
  position: number;
  color:    string;
  icon:     MarkerIcon;
  label?:   string;
}

interface TimelineProps {
  width:             number;
  pixelsPerBeat:     number;
  beatsPerBar:       number;
  totalBars:         number;
  currentTime:       string;
  totalTime:         string;
  markers?:          TimelineMarkerData[];
  onAddMarker?:      (marker: Omit<TimelineMarkerData, 'id'>) => void;
  onEditMarker?:     (id: string, changes: Partial<TimelineMarkerData>) => void;
  onDeleteMarker?:   (id: string) => void;
  onTimelineScroll?: (scrollLeft: number) => void;
  onSeek?:           (beat: number) => void;
  scrollLeft?:       number;
}

const Timeline = forwardRef<HTMLDivElement, TimelineProps>(({
  width,
  pixelsPerBeat,
  beatsPerBar,
  totalBars,
  currentTime,
  totalTime,
  markers = [],
  onAddMarker,
  onEditMarker,
  onDeleteMarker,
  onTimelineScroll,
  onSeek,
  scrollLeft
}, ref) => {
  const totalBeats = totalBars * beatsPerBar
  const timelineMarkers = []
  const [ addMarkerPosition, setAddMarkerPosition ] = useState<number | null>(null)
  const [ newMarkerData, setNewMarkerData ] = useState({
    label: '',
    icon:  'bookmark' as MarkerIcon,
    color: '#F472B6'
  })
  const [ popoverOpen, setPopoverOpen ] = useState(false)

  // Create timeline markers
  for (let beat = 0; beat <= totalBeats; beat++) {
    const isMajor = beat % beatsPerBar === 0
    const position = beat * pixelsPerBeat

    if (position > width)
      break

    timelineMarkers.push(
      <div
        key={ beat }
        className='timeline-marker'
        onClick={ () => onSeek && onSeek(beat) }
        style={{ left: `${position}px` }}>
        {isMajor &&
          <div className='absolute top-full text-xs font-mono text-muted-foreground mt-0.5'>
            {Math.floor(beat / beatsPerBar) + 1}
          </div>
        }
      </div>
    )
  }

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (onTimelineScroll)
      onTimelineScroll(e.currentTarget.scrollLeft)
  }

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const timeline = e.currentTarget
    const rect = timeline.getBoundingClientRect()
    const x = e.clientX - rect.left + timeline.scrollLeft
    const clickedBeat = Math.floor(x / pixelsPerBeat)

    if (onSeek)
      onSeek(clickedBeat)
  }

  const handleTimelineContextMenu = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault()

    if (!onAddMarker)
      return

    const timeline = e.currentTarget
    const rect = timeline.getBoundingClientRect()
    const x = e.clientX - rect.left + timeline.scrollLeft
    const clickedBeat = Math.floor(x / pixelsPerBeat)

    setAddMarkerPosition(clickedBeat)
    setPopoverOpen(true)
  }

  const handleAddMarker = () => {
    if (addMarkerPosition !== null && onAddMarker) {
      onAddMarker({
        position: addMarkerPosition,
        color:    newMarkerData.color,
        icon:     newMarkerData.icon,
        label:    newMarkerData.label,
      })

      setPopoverOpen(false)
      setNewMarkerData({
        label: '',
        icon:  'bookmark',
        color: '#F472B6'
      })
    }
  }

  const iconOptions: MarkerIcon[] = [
    'bookmark', 'flag', 'star', 'record', 'mic', 'music', 'zap', 'comment'
  ]

  const colorOptions = [
    '#F472B6', '#60A5FA', '#34D399', '#FBBF24', '#A78BFA', '#F87171'
  ]

  return <div className='relative h-16 border-b border-border bg-secondary/50'>
    <div className='absolute top-0 left-4 flex items-center h-full'>
      <div className='font-mono text-2xl text-white'>
        {currentTime}
        <span className='text-sm text-muted-foreground ml-2'>/ {totalTime}</span>
      </div>
    </div>

    <Popover open={ popoverOpen } onOpenChange={ setPopoverOpen }>
      <PopoverTrigger className='sr-only'>Add Marker</PopoverTrigger>

      <PopoverContent className='w-64'>
        <div className='space-y-3'>
          <h4 className='font-medium'>Add Timeline Marker</h4>

          <div className='space-y-1'>
            <Label htmlFor='marker-label'>Label</Label>

            <Input
              id='marker-label'
              value={ newMarkerData.label }
              onChange={ e => setNewMarkerData({ ...newMarkerData, label: e.target.value }) }
              placeholder='Marker label' />
          </div>

          <div className='space-y-1'>
            <Label>Icon</Label>

            <div className='flex flex-wrap gap-1'>
              {iconOptions.map(icon =>
                <Button
                  key={ icon }
                  size='sm'
                  variant={ newMarkerData.icon === icon ? 'default' : 'outline' }
                  className='h-8 w-8 p-0'
                  onClick={ () => setNewMarkerData({ ...newMarkerData, icon }) }>
                  {/* The icons would be components here but we're using string for simplicity */}
                  <span className='capitalize text-xs'>{icon.slice(0, 1)}</span>
                </Button>
              )}
            </div>
          </div>

          <div className='space-y-1'>
            <Label>Color</Label>

            <div className='flex flex-wrap gap-1'>
              {colorOptions.map(color =>
                <Button
                  key={ color }
                  size='sm'
                  variant='outline'
                  className='h-8 w-8 p-0 border-2'
                  style={{
                    backgroundColor: color,
                    borderColor:     newMarkerData.color === color ? 'white' : color
                  }}
                  onClick={ () => setNewMarkerData({ ...newMarkerData, color }) } />
              )}
            </div>
          </div>

          <div className='flex justify-end space-x-2 pt-2'>
            <Button variant='outline' size='sm' onClick={ () => setPopoverOpen(false) }>
              Cancel
            </Button>

            <Button size='sm' onClick={ handleAddMarker }>
              Add Marker
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>

    <div
      ref={ ref }
      className='h-full relative mt-8 overflow-x-auto'
      style={{ scrollLeft: scrollLeft || 0 } as React.CSSProperties}
      onScroll={ handleScroll }
      onClick={ handleTimelineClick }
      onContextMenu={ handleTimelineContextMenu }>
      <div className='h-full relative' style={{ width: `${totalBeats * pixelsPerBeat}px` }}>
        {timelineMarkers}

        <div className='timeline-marker-container'>
          {markers.map(marker =>
            <TimelineMarker
              key={ marker.id }
              id={ marker.id }
              position={ marker.position }
              color={ marker.color }
              icon={ marker.icon }
              label={ marker.label }
              pixelsPerBeat={ pixelsPerBeat }
              onClick={ id => onEditMarker && onEditMarker(id, {}) }
              onDelete={ onDeleteMarker } />
          )}
        </div>
      </div>
    </div>
  </div>
})

Timeline.displayName = 'Timeline'

export default Timeline

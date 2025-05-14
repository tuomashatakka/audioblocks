import React, { useState, useRef, useEffect } from 'react'
import { Rnd } from 'react-rnd'
import { cn } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'

export interface TrackBlockProps {
  id: string
  track: number
  startBeat: number
  lengthBeats: number
  color?: string
  name: string
  selected: boolean
  onSelect: (id: string) => void
  onPositionChange: (id: string, track: number, startBeat: number) => void
  onLengthChange: (id: string, lengthBeats: number) => void
  pixelsPerBeat: number
  trackHeight: number
  editingUserId?: string | null
  isTrackLocked?: boolean
  activeTool?: 'select' | 'pan' | 'boxSelect'
}

const TrackBlock: React.FC<TrackBlockProps> = ({
  id,
  track,
  startBeat,
  lengthBeats,
  name,
  selected,
  onSelect,
  onPositionChange,
  onLengthChange,
  pixelsPerBeat,
  trackHeight,
  editingUserId,
  isTrackLocked,
  activeTool = 'select'
}) => {
  const [waveformPattern, setWaveformPattern] = useState<number[]>([])
  const blockRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    const pattern = Array.from({ length: 30 }, () => 
      Math.random() * 0.8 + 0.2
    )
    setWaveformPattern(pattern)
  }, [id])

  const getEditorColor = () => {
    const colors = ['#F472B6', '#60A5FA', '#34D399', '#FBBF24']
    const hash = editingUserId?.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) || 0
    return colors[hash % colors.length]
  }

  const canInteract = activeTool === 'select' && !isTrackLocked

  const handleDragStop = (_e: any, d: { x: number; y: number }) => {
    if (isTrackLocked) return

    const container = blockRef.current?.parentElement
    if (!container) return

    const newTrack = Math.max(0, Math.floor(d.y / trackHeight))
    const newBeat = Math.max(0, Math.round(d.x / pixelsPerBeat))

    if (newTrack !== track || newBeat !== startBeat) {
      onPositionChange(id, newTrack, newBeat)
      toast({
        title: "Block Moved",
        description: `Moved "${name}" to track ${newTrack + 1}, beat ${newBeat + 1}`,
      })
    }
  }

  const handleResizeStop = (_e: any, _direction: any, ref: HTMLElement) => {
    if (isTrackLocked) return

    const newWidth = parseInt(ref.style.width)
    const newLengthBeats = Math.max(1, Math.round(newWidth / pixelsPerBeat))

    if (newLengthBeats !== lengthBeats) {
      onLengthChange(id, newLengthBeats)
      toast({
        title: "Block Resized",
        description: `Changed "${name}" length to ${newLengthBeats} beats`,
      })
    }
  }

  return (
    <Rnd
      ref={blockRef}
      size={{
        width: lengthBeats * pixelsPerBeat,
        height: trackHeight - 4
      }}
      position={{
        x: startBeat * pixelsPerBeat,
        y: track * trackHeight
      }}
      onDragStop={handleDragStop}
      onResizeStop={handleResizeStop}
      enableResizing={{ right: true }}
      disableDragging={!canInteract}
      dragAxis="both"
      bounds="parent"
      className={cn(
        "track-block rounded-sm border-2 overflow-hidden",
        "backdrop-blur-sm bg-black/30",
        selected ? "border-primary shadow-lg" : "border-transparent",
        editingUserId && !selected ? `ring-2 ring-offset-1` : "",
        isTrackLocked ? "opacity-70 cursor-not-allowed" : canInteract ? "cursor-move" : "cursor-default"
      )}
      onClick={(e) => {
        e.stopPropagation()
        if (!isTrackLocked && activeTool === 'select') {
          onSelect(id)
        }
      }}
    >
      <div className="absolute inset-0 opacity-80">
        <div className="h-full flex items-end justify-between overflow-hidden">
          {waveformPattern.map((height, i) => (
            <div 
              key={i}
              className="waveform w-1"
              style={{ height: `${height * 100}%` }}
            />
          ))}
        </div>
      </div>
      
      <div className="absolute inset-0 flex flex-col justify-between p-2">
        <div className="text-xs font-medium truncate text-foreground">
          {name}
        </div>
      </div>
      
      {editingUserId && (
        <div 
          className="absolute -top-2 -right-2 w-4 h-4 rounded-full z-30"
          style={{ backgroundColor: getEditorColor() }}
        />
      )}
      
      {editingUserId && !selected && (
        <div 
          className="absolute inset-0 ring-2 pointer-events-none"
          style={{ 
            borderColor: getEditorColor(),
            borderWidth: 2
          }}
        />
      )}
    </Rnd>
  )
}

export default TrackBlock
import React, { useEffect, useRef, useState } from 'react'
import { Sliders, Volume2, Activity, VolumeOffIcon } from 'lucide-react'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { Track, Block } from '@/contexts/projectReducer'
import { ui } from '@/styles/ui-classes'


interface MasterTrackProps {
  // Master track data
  masterTrack: Track

  // All tracks for summing
  allTracks: Track[]
  allBlocks: Block[]

  // Layout props
  pixelsPerBeat: number
  trackHeight:   number
  totalBars:     number
  beatsPerBar:   number
  currentBeat:   number

  // Audio data for visualization
  isPlaying: boolean

  // Event handlers
  onVolumeChange: (volume: number) => void
  onMuteToggle:   () => void

  // User info
  localUserId: string
}

// Generate a master waveform that represents the sum of all tracks
const generateMasterWaveform = (
  tracks: Track[],
  blocks: Block[],
  totalBeats: number,
  pixelsPerBeat: number
): number[] => {
  const points = Math.max(200, Math.floor(totalBeats * pixelsPerBeat / 4))
  const waveform: number[] = new Array(points).fill(0)

  // For each block, add its contribution to the master waveform
  blocks.forEach(block => {
    const track = tracks[block.track]
    if (!track || track.muted)
      return

    const startPoint = Math.floor(block.startBeat / totalBeats * points)
    const endPoint = Math.floor((block.startBeat + block.lengthBeats) / totalBeats * points)

    // Generate a pattern for this block based on its properties
    const blockIntensity = track.volume / 100 * (block.volume / 100)

    for (let i = startPoint; i < Math.min(endPoint, points); i++) {
      // Add harmonics and variations
      const position = (i - startPoint) / (endPoint - startPoint)
      let amplitude = blockIntensity * (0.6 + 0.4 * Math.sin(position * Math.PI * 8))

      // Add some randomness for realism
      amplitude += (Math.random() * 0.1 - 0.05) * blockIntensity

      // Combine with existing waveform (additive)
      waveform[i] = Math.min(1, waveform[i] + amplitude * 0.3)
    }
  })

  // Apply master volume
  return waveform.map(value => value * 0.8) // Leave some headroom
}

const MasterTrack: React.FC<MasterTrackProps> = ({
  masterTrack,
  allTracks,
  allBlocks,
  pixelsPerBeat,
  trackHeight,
  totalBars,
  beatsPerBar,
  currentBeat,
  isPlaying,
  onVolumeChange,
  onMuteToggle,
  localUserId
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [ isLevelMeterActive, setIsLevelMeterActive ] = useState(false)
  const [ peakLevel, setPeakLevel ] = useState(0)

  const totalBeats = totalBars * beatsPerBar
  const masterWaveform = generateMasterWaveform(allTracks, allBlocks, totalBeats, pixelsPerBeat)

  // Draw the master waveform visualization
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas)
      return

    const ctx = canvas.getContext('2d')
    if (!ctx)
      return

    const { width, height } = canvas
    const centerY = height / 2

    // Clear canvas
    ctx.clearRect(0, 0, width, height)

    // Set up gradient for the waveform
    const gradient = ctx.createLinearGradient(0, 0, 0, height)
    gradient.addColorStop(0, masterTrack.muted ? '#666666' : '#22c55e')
    gradient.addColorStop(0.5, masterTrack.muted ? '#444444' : '#16a34a')
    gradient.addColorStop(1, masterTrack.muted ? '#333333' : '#15803d')

    ctx.fillStyle = gradient
    ctx.strokeStyle = masterTrack.muted ? '#888888' : '#22c55e'
    ctx.lineWidth = 1

    // Draw waveform
    ctx.beginPath()
    ctx.moveTo(0, centerY)

    masterWaveform.forEach((amplitude, i) => {
      const x = i / masterWaveform.length * width
      const y = centerY - amplitude * centerY * 0.8

      if (i === 0)
        ctx.moveTo(x, y)
      else
        ctx.lineTo(x, y)
    })

    // Mirror for bottom half
    for (let i = masterWaveform.length - 1; i >= 0; i--) {
      const amplitude = masterWaveform[i]
      const x = i / masterWaveform.length * width
      const y = centerY + amplitude * centerY * 0.8
      ctx.lineTo(x, y)
    }

    ctx.closePath()
    ctx.fill()

    // Add center line
    ctx.beginPath()
    ctx.moveTo(0, centerY)
    ctx.lineTo(width, centerY)
    ctx.strokeStyle = masterTrack.muted ? '#555555' : '#22c55e'
    ctx.lineWidth = 0.5
    ctx.stroke()

    // Draw playhead position indicator
    if (isPlaying) {
      const playheadX = currentBeat / totalBeats * width
      ctx.beginPath()
      ctx.moveTo(playheadX, 0)
      ctx.lineTo(playheadX, height)
      ctx.strokeStyle = '#ef4444'
      ctx.lineWidth = 2
      ctx.stroke()
    }
  }, [ masterWaveform, masterTrack.muted, isPlaying, currentBeat, totalBeats ])

  // Simulate level meter activity when playing
  useEffect(() => {
    if (!isPlaying) {
      setIsLevelMeterActive(false)
      setPeakLevel(0)
      return
    }

    setIsLevelMeterActive(true)

    const interval = setInterval(() => {
      // Simulate audio levels based on current playback position and blocks
      let level = 0

      allBlocks.forEach(block => {
        const track = allTracks[block.track]
        if (!track || track.muted)
          return

        if (currentBeat >= block.startBeat && currentBeat <= block.startBeat + block.lengthBeats) {
          const trackLevel = track.volume / 100 * (block.volume / 100)
          level += trackLevel * 0.3 // Combine levels
        }
      })

      // Add some variation and apply master volume
      level = level * (masterTrack.volume / 100) * (0.8 + Math.random() * 0.4)
      setPeakLevel(Math.min(1, level))
    }, 50)

    return () => clearInterval(interval)
  }, [ isPlaying, currentBeat, allBlocks, allTracks, masterTrack.volume ])

  return <div
    className={ cn(
      ui.masterTrack.container,
      masterTrack.muted && 'opacity-70'
    ) }
    style={{ height: `${trackHeight}px` }}>
    {/* Master Track Controls */}
    <div className={ ui.masterTrack.controls }>
      {/* Track Label */}
      <div className='flex items-center space-x-2'>
        <Activity className='h-4 w-4 text-green-500' />
        <span className={ ui.masterTrack.label }>MASTER</span>

        <Badge variant='outline' className={ ui.masterTrack.badge }>
          SUM
        </Badge>
      </div>

      {/* Level Meter */}
      <div className={ ui.masterTrack.levelMeter }>
        { Array.from({ length: 10 }, (_, i) =>
          <div
            key={ i }
            className={ cn(
              ui.masterTrack.levelBar,
              isLevelMeterActive && peakLevel > i / 10
                ? i < 7
                  ? 'bg-green-500'
                  : i < 9
                    ? 'bg-yellow-500'
                    : 'bg-red-500'
                : 'bg-slate-700'
            ) } />
        ) }
      </div>

      {/* Mute Button */}
      <Button
        size='sm'
        variant={ masterTrack.muted ? 'default' : 'outline' }
        className='h-6 w-6 p-0'
        onClick={ onMuteToggle }>
        { masterTrack.muted ? <VolumeOffIcon className='h-3 w-3' /> : <Volume2 className='h-3 w-3' /> }
      </Button>

      {/* Volume Slider */}
      <div className='flex items-center space-x-2 min-w-[100px]'>
        <Sliders className='h-3 w-3 text-muted-foreground' />

        <Slider
          value={ [ masterTrack.volume ] }
          min={ 0 }
          max={ 100 }
          step={ 1 }
          onValueChange={ ([ value ]) => onVolumeChange(value) }
          className='flex-1'
          disabled={ masterTrack.muted } />

        <span className='text-xs text-muted-foreground w-8 text-right'>
          { masterTrack.volume }
        </span>
      </div>
    </div>

    {/* Master Waveform Visualization */}
    <div className={ ui.masterTrack.waveform }>
      <canvas
        ref={ canvasRef }
        className='w-full h-full'
        width={ totalBeats * pixelsPerBeat }
        height={ trackHeight - 8 }
        style={{
          maxWidth: '100%',
          height:   `${trackHeight - 8}px`
        }} />

      {/* Master Track Info Overlay */}
      <div className='absolute top-2 right-4 flex items-center space-x-2 text-xs text-green-400/80'>
        <span>Output Channels: L/R</span>

        { isPlaying &&
            <div className='flex items-center space-x-1'>
              <div className={ ui.masterTrack.liveIndicator } />
              <span>LIVE</span>
            </div>
        }
      </div>
    </div>
  </div>
}

export default MasterTrack
